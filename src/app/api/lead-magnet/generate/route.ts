import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyBusinessOwnership, verifyAdminSession } from "@/lib/auth-helpers";
import { claudeChat, extractJson } from "@/lib/anthropic";
import { METODO_KONECTA } from "@/lib/ai/metodo-konecta";
import { getPlatformState } from "@/lib/ai/platform-state";
import type { WizardChanges } from "../chat/route";

// Genera de UNA sola pasada un recurso de valor (PDF) completo (Nivel 3).
// Devuelve un `changes` con todos los campos del wizard, que el componente
// aplica con el mismo botón "Aplicar Sugerencias".

interface GenerateRequest {
  businessId: string;
  currentState?: Record<string, unknown>;
}

const OBJECTIVES = new Set([
  "volvieron", "conversion", "referidos", "captar",
  "reactivar", "educar", "temporada", "lanzamiento",
]);
const TYPES = new Set(["guia", "checklist", "recomendacion"]);

// Descarta valores de enum inválidos (objective/type). El resto de campos los
// aplica el wizard con mapeo explícito, así que una clave extraña se ignora sola.
function sanitizeWizardChanges(changes: WizardChanges | null): WizardChanges | null {
  if (!changes || typeof changes !== "object") return null;
  const c = { ...changes };
  if (c.objective && !OBJECTIVES.has(c.objective)) delete c.objective;
  if (c.type && !TYPES.has(c.type)) delete c.type;
  return Object.keys(c).length > 0 ? c : null;
}

export async function POST(req: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "openai_key_missing" }, { status: 503 });
    }

    const body = (await req.json()) as GenerateRequest;
    const { businessId, currentState } = body;
    if (!businessId) {
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

    const [bizRes, questionsRes, answersRes, platformState, linksRes] = await Promise.all([
      supabaseAdmin.from("businesses").select("name, sector").eq("id", businessId).single(),
      supabaseAdmin
        .from("gpt_context_questions")
        .select("id, question_text, question_order")
        .order("question_order", { ascending: true }),
      supabaseAdmin
        .from("gpt_context_answers")
        .select("question_id, answer_text")
        .eq("business_id", businessId),
      getPlatformState(supabaseAdmin, businessId),
      supabaseAdmin.from("action_links").select("type, name, url").eq("business_id", businessId),
    ]);

    const biz = bizRes.data as { name?: string; sector?: string } | null;
    const questions = questionsRes.data || [];
    const answers = answersRes.data || [];
    const answerMap = new Map(answers.map((a) => [a.question_id, a.answer_text]));
    const businessProfile = questions
      .map((q) => `P${q.question_order}. ${q.question_text}\nR: ${answerMap.get(q.id) || "(sin respuesta)"}`)
      .join("\n\n");

    const links = (linksRes.data as { type: string; name: string; url: string }[] | null) ?? [];
    const toolsBlock = links.length
      ? links.map((l) => `- ${l.type} · "${l.name}" → ${l.url}`).join("\n")
      : "(el negocio aún no tiene herramientas configuradas — deja los enlaces de botón vacíos)";

    const businessName = biz?.name || "el negocio";
    const sectorLine = biz?.sector ? `Sector: ${biz.sector}` : "";

    const systemPrompt = `Eres el asistente de Recursos de Valor de Konecta3D para "${businessName}".
Tu tarea AHORA es crear de UNA sola vez un recurso de valor (PDF de una página)
COMPLETO y listo para revisar. El recurso AYUDA al cliente final del negocio, no le vende.

${METODO_KONECTA}

════════════════════════════════════
PERFIL DEL NEGOCIO
════════════════════════════════════
${sectorLine}
${businessProfile}

${platformState}

HERRAMIENTAS CONFIGURADAS (usa estas URLs EXACTAS para los botones):
${toolsBlock}

════════════════════════════════════
CÓMO PERSONALIZAR DE VERDAD
════════════════════════════════════
- Parte del sector y de lo que hace/vende el negocio: el tema debe reflejar SU expertise.
- El contenido resuelve un problema REAL del cliente ideal de este negocio (mira su perfil), no uno genérico.
- Adapta el tono al del negocio (cercano / profesional / técnico según su perfil).
- El botón es el paso siguiente lógico para ese cliente tras leer el recurso; si hay
  una herramienta que encaje (WhatsApp, reservas, web), enlázala con su URL exacta.
- Nada de placeholders, cifras inventadas, testimonios ni precio. Español de España.

════════════════════════════════════
ELIGE OBJETIVO Y TIPO
════════════════════════════════════
- objective: el que mejor conecte el conocimiento del negocio con la necesidad del cliente
  (volvieron | conversion | referidos | captar | reactivar | educar | temporada | lanzamiento).
- type: el formato que mejor encaje con el contenido
  (guia = explicación paso a paso · checklist = lista accionable · recomendacion = consejos del experto).

════════════════════════════════════
LÍMITES DEL PDF (OBLIGATORIO — si te pasas, el texto se solapa)
════════════════════════════════════
- title: máx 80 caracteres, expresa el BENEFICIO para el cliente (no "Guía de X").
- intro: máx 120 caracteres, 1-2 frases que enganchen ("esto es para mí").
- content:
   · guia:          máx 900 caracteres, 3-4 párrafos muy breves.
   · checklist:     máx 6 puntos, cada uno máx 70 caracteres.
   · recomendacion: máx 5 puntos, cada uno máx 80 caracteres.
   Separa los puntos con \\n.
- cta1Text / cta2Text: verbo + acción, máx 3 palabras ("Reservar cita").

════════════════════════════════════
FORMATO DE RESPUESTA — OBLIGATORIO
════════════════════════════════════
Devuelve un JSON con esta forma exacta:
{ "message": "texto en español (2-3 líneas)", "changes": {
  "objective": "...", "type": "...", "title": "...", "intro": "...", "content": "...",
  "cta1Text": "...", "cta1Link": "...", "cta2Text": "...", "cta2Link": "...",
  "colorBrand": "#...", "colorButton": "#..."
} }
El "message" resume qué montaste y pide que revise. Si no hay herramienta para un botón, deja su Link "".`;

    let rawContent: string;
    try {
      rawContent = await claudeChat({
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Monta un recurso de valor completo para mi negocio.${
              currentState ? `\n\nEstado actual del recurso (puedes mejorarlo): ${JSON.stringify(currentState)}` : ""
            }`,
          },
        ],
        maxTokens: 1500,
      });
    } catch (err) {
      console.error("[lead-magnet/generate] anthropic error:", err);
      return NextResponse.json({ error: "openai_error" }, { status: 502 });
    }
    if (!rawContent) {
      return NextResponse.json({ error: "openai_empty_response" }, { status: 502 });
    }

    let parsed: { message?: string; changes?: WizardChanges | null };
    try {
      parsed = extractJson(rawContent) as { message?: string; changes?: WizardChanges | null };
    } catch (parseErr) {
      console.error("[lead-magnet/generate] parse error:", parseErr, rawContent);
      return NextResponse.json({ error: "openai_invalid_json" }, { status: 502 });
    }

    return NextResponse.json({
      message: parsed.message || "Te he montado un primer recurso. Revísalo y dime qué cambiar.",
      changes: sanitizeWizardChanges(parsed.changes ?? null),
    });
  } catch (e) {
    console.error("[lead-magnet/generate] error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
