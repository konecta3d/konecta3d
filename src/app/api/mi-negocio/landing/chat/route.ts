import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyBusinessOwnership } from "@/lib/auth-helpers";
import type { LandingConfig } from "@/lib/landingTypes";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  changes: Partial<LandingConfig> | null;
  timestamp: string;
}

interface ChatRequest {
  businessId: string;
  currentConfig: LandingConfig;
  messages: ChatMessage[];
  userMessage: string;
}

// Campos que el chat NO puede modificar (defensa en profundidad — el system
// prompt también lo dice, pero filtramos aquí por si el GPT desobedece).
const FORBIDDEN_FIELDS: (keyof LandingConfig)[] = [
  "logoUrl",
  "logoShape",
  "showLogo",
  "logoSize",
];

function stripForbidden(changes: Partial<LandingConfig> | null): Partial<LandingConfig> | null {
  if (!changes) return null;
  const cleaned: Record<string, unknown> = { ...changes };
  for (const field of FORBIDDEN_FIELDS) {
    delete cleaned[field as string];
  }
  return Object.keys(cleaned).length > 0 ? (cleaned as Partial<LandingConfig>) : null;
}

// Campos que NO se envían al GPT (son URLs/binarios de imagen, irrelevantes
// para la personalización conversacional). Además, el replacer recursivo
// más abajo elimina cualquier base64 o string excesivamente largo que se
// cuele en sub-objetos o arrays. Sin esto, las imágenes en base64 inflan
// fácilmente el payload por encima de los 128k tokens del modelo.
const OMITTED_FIELDS_FOR_GPT: ReadonlySet<string> = new Set([
  "bgUrl",
  "logoUrl",
  "reviewImage",
  "toolsIds",
]);

function toGptPayload(config: LandingConfig): string {
  return JSON.stringify(
    config,
    (key, value) => {
      if (OMITTED_FIELDS_FOR_GPT.has(key)) return undefined;
      if (typeof value === "string") {
        if (value.startsWith("data:")) return "[imagen omitida]";
        if (value.length > 300) return `[valor largo (${value.length} chars)]`;
      }
      return value;
    },
    2
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequest;
    const { businessId, currentConfig, messages, userMessage } = body;

    if (!businessId || !userMessage || !currentConfig) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    const hasOwnership = await verifyBusinessOwnership(req, businessId);
    if (!hasOwnership) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Cargar perfil del negocio (preguntas + respuestas) para el system prompt.
    const [questionsRes, answersRes] = await Promise.all([
      supabaseAdmin
        .from("gpt_context_questions")
        .select("id, question_text, question_order")
        .order("question_order", { ascending: true }),
      supabaseAdmin
        .from("gpt_context_answers")
        .select("question_id, answer_text")
        .eq("business_id", businessId),
    ]);

    const questions = questionsRes.data || [];
    const answers = answersRes.data || [];
    const answerMap = new Map(answers.map((a) => [a.question_id, a.answer_text]));

    const businessProfile = questions
      .map((q) => `P${q.question_order}. ${q.question_text}\nR: ${answerMap.get(q.id) || "(sin respuesta)"}`)
      .join("\n\n");

    const configPayload = toGptPayload(currentConfig);
    const messagesChars = messages.reduce((acc, m) => acc + (m.content?.length || 0), 0);
    console.log("[chat] payload sizes (chars):", {
      configPayload: configPayload.length,
      businessProfile: businessProfile.length,
      messagesHistory: messagesChars,
      userMessage: userMessage.length,
    });

    // ────────────────────────────────────────────────────────────────────────
    // System prompt — listo para cuando llegue la API key de OpenAI.
    // ────────────────────────────────────────────────────────────────────────
    const systemPrompt = `Eres el asistente de Konecta3D que ayuda al negocio a personalizar su landing pública.

PERFIL DEL NEGOCIO:
${businessProfile}

ESTADO ACTUAL DEL EDITOR (LandingConfig — campos textuales/numéricos):
${configPayload}

INSTRUCCIONES:
- Guía la conversación SIEMPRE en este orden top-to-bottom: 1) Fondo, 2) Identidad (título y subtítulo), 3) CTAs, 4) Estilo de botones, 5) Bloque final, 6) Espaciado.
- No respondas a temas fuera de la personalización de la landing.
- NUNCA modifiques los campos: logoUrl, logoShape, showLogo, logoSize.
- Responde SIEMPRE en español, tono cercano y claro.
- Devuelve un JSON con esta forma: { "message": "texto natural en español", "changes": { /* Partial<LandingConfig> o null */ } }
- Si no propones cambios en este turno, "changes" debe ser null.`;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text().catch(() => "");
      console.error("openai error:", openaiRes.status, errText);
      return NextResponse.json({ error: "openai_error" }, { status: 502 });
    }

    const openaiData = await openaiRes.json();
    const rawContent = openaiData?.choices?.[0]?.message?.content;
    if (!rawContent) {
      return NextResponse.json({ error: "openai_empty_response" }, { status: 502 });
    }

    let parsed: { message?: string; changes?: Partial<LandingConfig> | null };
    try {
      parsed = JSON.parse(rawContent);
    } catch (parseErr) {
      console.error("openai parse error:", parseErr, rawContent);
      return NextResponse.json({ error: "openai_invalid_json" }, { status: 502 });
    }

    return NextResponse.json({
      message: parsed.message || "(respuesta vacía)",
      changes: stripForbidden(parsed.changes ?? null),
    });
  } catch (e) {
    console.error("chat route error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
