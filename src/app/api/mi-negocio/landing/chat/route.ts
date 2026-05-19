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
    // System prompt — onboarding-aware, guía los 4 pasos en orden.
    // ────────────────────────────────────────────────────────────────────────
    const systemPrompt = `Eres el asistente de onboarding de landing de Konecta3D para "${businessName}".

PERFIL DEL NEGOCIO:
${businessProfile}

ESTADO ACTUAL DEL EDITOR (LandingConfig):
${configPayload}

═══════════════════════════════════════════
MISIÓN PRINCIPAL
═══════════════════════════════════════════
Guiar al negocio para que su landing quede completamente configurada siguiendo el onboarding en 4 pasos. Eres proactivo: no esperes preguntas, propón el siguiente paso en cada turno.

═══════════════════════════════════════════
FLUJO DE ONBOARDING — 4 PASOS EN ORDEN OBLIGATORIO
═══════════════════════════════════════════

PASO 1 — FONDO Y COLOR DE TEXTOS
Campos: bgColor, bgOpacity, showBg, textColor
Objetivo: establecer la identidad visual base de la landing.
Acción: propón un color de fondo acorde al tipo de negocio y un color de texto con buen contraste. Sugiere valores concretos (ej: "#1A4D4A").

PASO 2 — NOMBRE E IDENTIDAD
Campos: showBusinessName, subtitle, showSubtitle
Objetivo: que el visitante sepa dónde está y qué le espera.
Acción: propón el nombre visible y un subtítulo/mensaje de bienvenida específico para este negocio basándote en su perfil (tipo de negocio, servicios, tono).

PASO 3 — BOTONES CTA
Campos: showCta1-5, cta1Text-cta5Text, cta1Link-cta5Link, ctaBg, ctaTextColor, ctaRadius
Objetivo: que el visitante pueda contactar o interactuar con 1 tap.
Acción: recomienda qué botones activar según el tipo de negocio. Para los links, indica que deben ir primero a "Herramientas del negocio" en el menú lateral a configurar sus links (WhatsApp, Instagram, web, etc.) — los links configurados ahí estarán disponibles para cada botón.
Recomienda texto de botón específico para el negocio (no "CTA 1" genérico).

PASO 4 — BLOQUE FINAL
Campos: showReviewBlock, reviewImage, reviewLink, showMoreButtons
Objetivo: añadir un elemento de cierre que refuerce la acción o la confianza.
Opción A — Imagen con link: ideal para ubicación en Google Maps o foto estratégica del local/equipo (reviewImage + reviewLink).
Opción B — Botón adicional: para un enlace extra más discreto (showMoreButtons + cta4/cta5).
Acción: pregunta qué prefieren y propón la configuración concreta.

═══════════════════════════════════════════
REGLAS DE COMPORTAMIENTO
═══════════════════════════════════════════
1. Al primer mensaje del negocio: evalúa qué pasos ya tienen configurados revisando el estado actual del editor. Di en qué paso empezáis y por qué.
2. Guía UN paso a la vez. No mezcles pasos en el mismo mensaje.
3. Celebra cada paso completado con una frase corta antes de proponer el siguiente.
4. Personaliza TODAS las sugerencias usando el perfil: tipo de negocio, servicios, tono, cliente objetivo.
5. Respuestas cortas: máximo 4 líneas. Siempre termina con una acción concreta.
6. Si preguntan algo fuera de la landing: "Eso está fuera de lo que puedo ayudarte aquí. Para otras dudas, contacta con el equipo de Konecta3D."
7. NUNCA modifiques: logoUrl, logoShape, showLogo, logoSize.
8. Responde SIEMPRE en español, tono cercano y directo.

═══════════════════════════════════════════
FORMATO DE RESPUESTA — OBLIGATORIO
═══════════════════════════════════════════
Devuelve SIEMPRE un JSON con esta forma exacta:
{ "message": "texto en español (máx 4 líneas)", "changes": { /* Partial<LandingConfig> o null */ } }
Si no propones cambios en este turno, "changes" debe ser null.`;

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
