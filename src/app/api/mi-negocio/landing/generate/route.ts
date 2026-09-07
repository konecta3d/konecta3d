import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyBusinessOwnership } from "@/lib/auth-helpers";
import type { LandingConfig } from "@/lib/landingTypes";
import { claudeChat, extractJson } from "@/lib/anthropic";
import { METODO_KONECTA } from "@/lib/ai/metodo-konecta";
import { getPlatformState } from "@/lib/ai/platform-state";
import { sanitizeLandingChanges, toGptPayload } from "@/lib/ai/landing-changes";

// Genera de UNA sola pasada una primera versión completa de la landing
// (Nivel 3 — "agente por objetivo"). Devuelve un único `changes` con todos los
// campos, que el componente aplica con el mismo botón "Aplicar Sugerencias".

interface GenerateRequest {
  businessId: string;
  currentConfig: LandingConfig;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GenerateRequest;
    const { businessId, currentConfig } = body;

    if (!businessId || !currentConfig) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    const hasOwnership = await verifyBusinessOwnership(req, businessId);
    if (!hasOwnership) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "openai_key_missing" }, { status: 503 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Perfil + estado real + herramientas (con URL, para enlazar los botones).
    const [questionsRes, answersRes, platformState, linksRes] = await Promise.all([
      supabaseAdmin
        .from("gpt_context_questions")
        .select("id, question_text, question_order")
        .order("question_order", { ascending: true }),
      supabaseAdmin
        .from("gpt_context_answers")
        .select("question_id, answer_text")
        .eq("business_id", businessId),
      getPlatformState(supabaseAdmin, businessId),
      supabaseAdmin
        .from("action_links")
        .select("type, name, url")
        .eq("business_id", businessId),
    ]);

    const questions = questionsRes.data || [];
    const answers = answersRes.data || [];
    const answerMap = new Map(answers.map((a) => [a.question_id, a.answer_text]));
    const businessProfile = questions
      .map((q) => `P${q.question_order}. ${q.question_text}\nR: ${answerMap.get(q.id) || "(sin respuesta)"}`)
      .join("\n\n");

    const links = (linksRes.data as { type: string; name: string; url: string }[] | null) ?? [];
    const toolsBlock = links.length
      ? links.map((l) => `- ${l.type} · "${l.name}" → ${l.url}`).join("\n")
      : "(el negocio aún no tiene herramientas configuradas — deja los enlaces de botón vacíos y menciona en el mensaje que las configure en 'Herramientas del negocio')";

    const businessName = (currentConfig.businessName as string) || "el negocio";
    const configPayload = toGptPayload(currentConfig);

    const systemPrompt = `Eres el asistente de landing de Konecta3D para "${businessName}".
Tu tarea AHORA es montar de UNA sola vez una PRIMERA VERSIÓN COMPLETA de la landing,
lista para que el negocio la revise y la afine.

${METODO_KONECTA}

PERFIL DEL NEGOCIO:
${businessProfile}

${platformState}

HERRAMIENTAS CONFIGURADAS (usa estas URLs EXACTAS para los botones):
${toolsBlock}

ESTADO ACTUAL DEL EDITOR (LandingConfig):
${configPayload}

════════════════════════════════════
TU TAREA — UNA LANDING COMPLETA EN UNA PASADA
════════════════════════════════════
Devuelve un único "changes" con TODOS estos campos, coherentes entre sí y
personalizados con el perfil del negocio (nada de placeholders):

1. FONDO Y TEXTO: "showBg": true, "bgMode": "color", "bgColor": "#..." acorde al
   sector, y "textColor": "#..." con buen contraste sobre ese fondo.
2. IDENTIDAD: "showBusinessName": true y "subtitle" escrito para este negocio
   (máx ~60 caracteres, su promesa en una frase) con "showSubtitle": true.
3. BOTONES (2 o 3): para cada uno "showCtaN": true, "ctaNText": texto concreto
   (verbo + acción, no "CTA 1") y "ctaNLink": la URL EXACTA de la herramienta que
   corresponda de la lista de arriba. Si no hay herramienta para ese botón, deja
   "ctaNLink": "" y NO inventes URL. Si existe WhatsApp, que sea el botón 1.
4. CIERRE: elige "finalBlockMode" ("invite" es una buena opción por defecto).

REGLAS:
- Usa SOLO nombres de campo reales de LandingConfig (los que ves en el estado actual).
- No toques el logo (logoUrl, logoShape, showLogo, logoSize).
- No inventes cifras ni testimonios. Español de España.

FORMATO DE RESPUESTA — OBLIGATORIO:
Devuelve un JSON con esta forma exacta:
{ "message": "texto en español (2-3 líneas)", "changes": { /* Partial<LandingConfig> completo */ } }
El "message" resume qué montaste y pide que revise. Ejemplo:
"Te he montado una primera versión: fondo verde por tu sector, tu WhatsApp y tu web en los botones y un cierre para invitar a un amigo. Revisa y dime qué cambiar."`;

    let rawContent: string;
    try {
      rawContent = await claudeChat({
        system: systemPrompt,
        messages: [{ role: "user", content: "Monta una primera versión completa de mi landing." }],
        maxTokens: 1500,
      });
    } catch (err) {
      console.error("[landing/generate] anthropic error:", err);
      return NextResponse.json({ error: "openai_error" }, { status: 502 });
    }
    if (!rawContent) {
      return NextResponse.json({ error: "openai_empty_response" }, { status: 502 });
    }

    let parsed: { message?: string; changes?: Partial<LandingConfig> | null };
    try {
      parsed = extractJson(rawContent) as { message?: string; changes?: Partial<LandingConfig> | null };
    } catch (parseErr) {
      console.error("[landing/generate] parse error:", parseErr, rawContent);
      return NextResponse.json({ error: "openai_invalid_json" }, { status: 502 });
    }

    return NextResponse.json({
      message: parsed.message || "Te he montado una primera versión. Revísala y dime qué cambiar.",
      changes: sanitizeLandingChanges(parsed.changes ?? null),
    });
  } catch (e) {
    console.error("[landing/generate] error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
