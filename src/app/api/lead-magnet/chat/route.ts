import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyBusinessOwnership, verifyAdminSession } from "@/lib/auth-helpers";

export type WizardChanges = {
  objective?: "volvieron" | "conversion" | "referidos";
  type?: "guia" | "checklist" | "recomendacion";
  title?: string;
  intro?: string;
  content?: string;
  cta1Text?: string;
  cta1Link?: string;
  cta2Text?: string;
  cta2Link?: string;
  colorBrand?: string;
  colorButton?: string;
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  changes: WizardChanges | null;
  timestamp: string;
}

interface ChatRequest {
  businessId: string;
  currentState: Record<string, unknown>;
  messages: ChatMessage[];
  userMessage: string;
  currentStep: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequest;
    const { businessId, currentState, messages, userMessage, currentStep } = body;

    if (!businessId || !userMessage) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    const [hasOwnership, { isAdmin }] = await Promise.all([
      verifyBusinessOwnership(req, businessId),
      verifyAdminSession(req),
    ]);
    if (!hasOwnership && !isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Load business profile (Q&A from gpt_context_answers)
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
      .map(
        (q) =>
          `P${q.question_order}. ${q.question_text}\nR: ${answerMap.get(q.id) || "(sin respuesta)"}`
      )
      .join("\n\n");

    const stepLabels: Record<string, string> = {
      objetivo: "Paso 2 — Selección del objetivo (volvieron / conversion / referidos)",
      tipo: "Paso 3 — Tipo de recurso (guia / checklist / recomendacion)",
      contenido: "Paso 4 — Contenido (título, intro, puntos o texto principal)",
      personalizacion: "Paso 5 — Personalización de colores y botones CTA",
    };

    const systemPrompt = `Eres el asistente de Konecta3D que ayuda al negocio a crear su Recurso de Valor (documento PDF de marketing).

PERFIL DEL NEGOCIO:
${businessProfile}

ESTADO ACTUAL DEL RECURSO:
${JSON.stringify(currentState, null, 2)}

PASO ACTUAL: ${stepLabels[currentStep] || currentStep}

CAMPOS QUE PUEDES MODIFICAR (incluye solo los relevantes en "changes"):
- objective: "volvieron" | "conversion" | "referidos"
- type: "guia" | "checklist" | "recomendacion"
- title: string (título del documento)
- intro: string (descripción inicial breve)
- content: string (contenido principal; usa saltos de línea \\n para separar puntos)
- cta1Text: string (texto botón principal)
- cta1Link: string (URL botón principal, puede estar vacío)
- cta2Text: string (texto botón secundario)
- cta2Link: string (URL botón secundario, puede estar vacío)
- colorBrand: string (color hex, ej: "#0a323c")
- colorButton: string (color hex, ej: "#ffb400")

INSTRUCCIONES:
- Adapta SIEMPRE tus sugerencias al perfil del negocio (sector, servicios, clientes objetivo).
- Responde SOLO sobre la creación del Recurso de Valor; ignora preguntas fuera de este ámbito.
- Responde en español, tono cercano y profesional.
- Si propones contenido textual (title, intro, content), que sea concreto, listo para usar y adaptado al negocio.
- Para "content" de tipo checklist o recomendacion, usa saltos de línea para separar cada punto.
- Devuelve SIEMPRE un JSON válido con esta forma exacta: { "message": "texto natural en español", "changes": { /* WizardChanges o null */ } }
- Si no propones cambios en este turno, usa "changes": null.`;

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
      console.error("[lead-magnet/chat] openai error:", openaiRes.status, errText);
      return NextResponse.json({ error: "openai_error" }, { status: 502 });
    }

    const openaiData = await openaiRes.json();
    const rawContent = openaiData?.choices?.[0]?.message?.content;
    if (!rawContent) {
      return NextResponse.json({ error: "openai_empty_response" }, { status: 502 });
    }

    let parsed: { message?: string; changes?: WizardChanges | null };
    try {
      parsed = JSON.parse(rawContent);
    } catch (parseErr) {
      console.error("[lead-magnet/chat] parse error:", parseErr, rawContent);
      return NextResponse.json({ error: "openai_invalid_json" }, { status: 502 });
    }

    return NextResponse.json({
      message: parsed.message || "(respuesta vacía)",
      changes: parsed.changes ?? null,
    });
  } catch (e) {
    console.error("[lead-magnet/chat] error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
