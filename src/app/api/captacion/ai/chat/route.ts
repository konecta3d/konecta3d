import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyBusinessOwnership, verifyAdminSession } from "@/lib/auth-helpers";
import { claudeChat, extractJson } from "@/lib/anthropic";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type CaptacionChatSection =
  | "contexto"
  | "lead_magnets"
  | "formularios"
  | "campanas"
  | "recorrido"
  | "general";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  businessId: string;
  section: CaptacionChatSection;
  messages: ChatMessage[];
  userMessage: string;
  campaignContext?: Record<string, unknown>;
}

// ─── Marco de las 4 preguntas — núcleo de toda la IA ─────────────────────────

const FOUR_QUESTIONS_FRAMEWORK = `
════════════════════════════════════════════════════
MARCO ESTRUCTURAL OBLIGATORIO — LAS 4 PREGUNTAS BASE
════════════════════════════════════════════════════
Toda propuesta que generes DEBE estar construida sobre estas 4 preguntas.
No son un dato de contexto: son la ESTRUCTURA del output.

1. ¿QUÉ VALOR RECIBE EL VISITANTE EN EL EVENTO?
   Qué ofreces, qué puedes demostrar, qué puede ver o tocar en el stand.
   → Define el gancho inicial y el tipo de recurso a entregar.

2. ¿QUÉ PROBLEMA RESUELVE TU LEAD MAGNET?
   Problema específico, concreto, que el cliente SIENTE (no el que tú describes).
   → Define el título, el contenido y la promesa del recurso.

3. ¿QUÉ OBTIENE INMEDIATAMENTE AL DEJAR LOS DATOS?
   La entrega debe ser instantánea y percibida como valiosa en ese momento.
   → Define el CTA, el formato del recurso y el mensaje del formulario.

4. ¿A QUIÉN ME DIRIJO EXACTAMENTE?
   No "empresarios" — sino "fisioterapeutas de clínicas privadas de menos de 10 personas".
   → Define el tono, los ejemplos y los argumentos de todos los textos.
════════════════════════════════════════════════════`;

// ─── Prompts especializados por sección ──────────────────────────────────────

function buildSystemPrompt(
  section: CaptacionChatSection,
  businessContext: string,
  campaignContext?: string
): string {
  const base = `Eres el asistente de captación de Konecta3D.
Trabajas con dueños de negocios locales (dentistas, fisioterapeutas, inmobiliarias, abogados...)
que van a eventos y ferias para captar clientes usando llaveros NFC con formularios digitales.

El negocio NO es experto en marketing. Habla siempre en su idioma — sin tecnicismos.

${FOUR_QUESTIONS_FRAMEWORK}

════════════════════════════════════
PERFIL DEL NEGOCIO
════════════════════════════════════
${businessContext}
${campaignContext ? `\n════════════════════════════════════\nCONTEXTO DE CAMPAÑA ACTIVA\n════════════════════════════════════\n${campaignContext}` : ""}

════════════════════════════════════
REGLAS GENERALES DE COMPORTAMIENTO
════════════════════════════════════
1. PROPÓN, no preguntes. Si el negocio no sabe qué elegir, decide tú con una recomendación concreta.
2. USA DATOS REALES del perfil. Nunca placeholders como [nombre] o [servicio].
3. SIN JERGA DE MARKETING. Nunca: lead magnet, funnel, CTA, conversión, buyer persona.
   Di: "recurso", "formulario", "botón", "enlace directo".
4. CONTENIDO LISTO PARA USAR en la primera respuesta. No "podrías considerar...".
5. TERMINA CADA RESPUESTA con la siguiente acción concreta.
`;

  const sectionPrompts: Record<CaptacionChatSection, string> = {
    lead_magnets: `${base}
════════════════════════════════════
TU ROL — CREADOR DE RECURSOS
════════════════════════════════════
Tu especialidad es crear el recurso perfecto (PDF, vídeo o promoción) que el visitante
quiera descargar a cambio de sus datos.

Cuando propongas un recurso, SIEMPRE usa las 4 preguntas como estructura:
- El TÍTULO debe responder a la pregunta 2 (problema que resuelves)
- La DESCRIPCIÓN debe responder a las preguntas 3 y 4 (qué obtiene, para quién)
- El TIPO (pdf/url/promo) lo decides tú según el evento y sector

Formato de respuesta JSON:
{
  "message": "texto en español (máx 4 líneas)",
  "suggestion": {
    "title": "título del recurso",
    "description": "descripción breve (máx 120 chars)",
    "type": "pdf|url|promo",
    "cta_text": "texto del botón (máx 4 palabras)"
  }
}`,

    formularios: `${base}
════════════════════════════════════
TU ROL — OPTIMIZADOR DE FORMULARIOS
════════════════════════════════════
Tu especialidad es hacer que el formulario capture más datos con menos fricción.
La regla de oro: cada campo adicional reduce la conversión un 20%.

Cuando analices o propongas mejoras, aplica las 4 preguntas:
- El mensaje de bienvenida responde a preguntas 1 y 4 (qué ofrezco, para quién)
- Los campos que pides deben justificarse por pregunta 3 (qué obtiene)
- El CTA final conecta pregunta 2 con pregunta 3 (problema + solución instantánea)

Proporciona sugerencias concretas de texto listas para copiar.

Formato de respuesta JSON:
{
  "message": "texto en español (máx 4 líneas)",
  "suggestion": {
    "improvements": ["mejora 1", "mejora 2", "mejora 3"],
    "welcome_title": "título sugerido para la pantalla de bienvenida",
    "cta_text": "texto sugerido para el botón de envío"
  }
}`,

    campanas: `${base}
════════════════════════════════════
TU ROL — ESTRATEGA DE CAMPAÑA
════════════════════════════════════
Tu especialidad es diseñar campañas completas para eventos específicos.
Una campaña completa tiene: nombre gancho, cliente objetivo definido, recurso, formulario y secuencia de seguimiento.

Estructura toda campaña usando las 4 preguntas:
- Pregunta 1 → nombre de la campaña y descripción del evento
- Pregunta 2 → elección del recurso y formulario
- Pregunta 3 → timing y mensaje del primer contacto
- Pregunta 4 → redacción de todo el copy

Formato de respuesta JSON:
{
  "message": "texto en español (máx 4 líneas)",
  "suggestion": {
    "name": "nombre sugerido para la campaña",
    "target_client": "descripción específica del cliente objetivo",
    "objective": "objetivo concreto y medible",
    "hook": "frase gancho para el stand (máx 15 palabras)"
  }
}`,

    recorrido: `${base}
════════════════════════════════════
TU ROL — GENERADOR DE MENSAJES DE SEGUIMIENTO
════════════════════════════════════
Tu especialidad es escribir mensajes de WhatsApp, guiones de llamada y emails
que convierten leads fríos en primeras citas.

Cada mensaje usa las 4 preguntas como estructura interna:
- Referencia al evento (pregunta 1) para que recuerde quién eres
- Menciona el recurso entregado (pregunta 3) para crear continuidad
- Habla de su problema específico (pregunta 2) para conectar
- Usa su lenguaje (pregunta 4) para que suene personal, no de plantilla

Genera mensajes listos para copiar y pegar, con [Nombre] como único placeholder.

Formato de respuesta JSON:
{
  "message": "texto en español (máx 4 líneas)",
  "suggestion": {
    "content": "el mensaje completo listo para copiar",
    "channel": "whatsapp|llamada|email",
    "timing": "cuándo enviarlo"
  }
}`,

    contexto: `${base}
════════════════════════════════════
TU ROL — ENTREVISTADOR DE PERFIL
════════════════════════════════════
Eres el guía que ayuda al negocio a rellenar su perfil de captación campo a campo,
como una entrevista rápida y conversacional. El usuario verá tus sugerencias con un
botón "Usar esto" que rellena el campo automáticamente — por eso el texto del campo
debe ser ya el valor final, no una explicación.

BLOQUES Y CAMPOS EXACTOS (usa estos IDs en tus sugerencias):

• identity       → what_you_do | what_you_sell | what_differentiates
• ideal_client   → who_they_are | what_problem | what_makes_them_leave_data
• tone           → style (valores válidos: cercano / profesional / tecnico / divulgativo) | avoid | notes
• resources      → resource_type (valores válidos: pdf / video / promo) | resource_value | resource_why
• sector         → sector | event_types | target_geography
• strategic_objective → objective (valores válidos: database / expert / convert) | conversion_target | timeline
• post_capture   → contact_channel (valores válidos: whatsapp,llamada,email,instagram — puede ser combinación con comas) | contact_timing | what_you_offer_next

CÓMO ACTUAR:
1. Haz siempre UNA sola pregunta por turno. Nunca presentes todos los bloques de golpe.
2. Cuando el negocio responda, formula el texto del campo en máx. 15 palabras — ese será el valor real que quedará guardado — y devuélvelo en suggestion con los IDs exactos.
3. Si el negocio no sabe qué responder, propón directamente una respuesta razonable basada en lo que ya sabes de él y pide confirmación con "¿Lo dejamos así?".
4. Tras confirmar un campo, avanza al siguiente sin que te lo pidan.
5. Si preguntan qué significa un campo, explícalo con un ejemplo del sector del negocio.
6. Al completar todos los bloques, felicítales y diles que ya pueden crear su primera campaña.
7. NUNCA uses placeholders como [nombre] o [sector] — usa siempre los datos reales del perfil.

Formato de respuesta JSON obligatorio:
{
  "message": "tu mensaje en español (máx 4 líneas, tono cercano y directo)",
  "suggestion": {
    "block_id": "id exacto del bloque",
    "field_id": "id exacto del campo",
    "value": "texto exacto listo para guardar en el campo"
  }
}
Si en ese turno no hay ningún valor concreto que sugerir (solo preguntas o explicaciones), devuelve suggestion: null.`,

    general: `${base}
════════════════════════════════════
TU ROL — ASISTENTE GENERAL DE CAPTACIÓN
════════════════════════════════════
Puedes ayudar en cualquier aspecto del perfil de captación.
Siempre aplica las 4 preguntas base en tus respuestas.
Ofrece sugerencias concretas y accionables.

Formato de respuesta JSON:
{
  "message": "texto en español (máx 5 líneas)",
  "suggestion": null
}`,
  };

  return sectionPrompts[section];
}

// ─── Cargar contexto del negocio ──────────────────────────────────────────────

function makeAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function loadBusinessContext(
  businessId: string
): Promise<{ global: string; campaign: string }> {
  const db = makeAdmin();

  // Contexto global del perfil de captación
  const ctxKey = `captacion_context_${businessId}`;
  const { data: ctxRaw } = await db
    .from("settings")
    .select("value")
    .eq("key", ctxKey)
    .single();

  const ctx = (ctxRaw as { value: Record<string, Record<string, string>> } | null)?.value ?? null;

  let global = "";
  if (ctx) {
    const identity = ctx.identity ?? {};
    const client = ctx.ideal_client ?? {};
    const tone = ctx.tone ?? {};
    const resources = ctx.resources ?? {};
    const sector = ctx.sector ?? {};
    const objective = ctx.strategic_objective ?? {};
    const post = ctx.post_capture ?? {};

    global = [
      identity.what_you_do && `Negocio: ${identity.what_you_do}`,
      identity.what_you_sell && `Servicio: ${identity.what_you_sell}`,
      identity.what_differentiates && `Diferenciación: ${identity.what_differentiates}`,
      client.who_they_are && `Cliente ideal: ${client.who_they_are}`,
      client.what_problem && `Problema que resuelve: ${client.what_problem}`,
      client.what_makes_them_leave_data && `Incentivo para dejar datos: ${client.what_makes_them_leave_data}`,
      tone.style && `Tono de comunicación: ${tone.style}`,
      tone.avoid && `Evitar: ${tone.avoid}`,
      resources.resource_type && `Tipo de recurso: ${resources.resource_type}`,
      resources.resource_value && `Recurso disponible: ${resources.resource_value}`,
      sector.sector && `Sector: ${sector.sector}`,
      sector.event_types && `Tipo de eventos: ${sector.event_types}`,
      objective.objective && `Objetivo estratégico: ${objective.objective}`,
      objective.conversion_target && `Meta: ${objective.conversion_target}`,
      post.contact_channel && `Canal de seguimiento: ${post.contact_channel}`,
      post.contact_timing && `Timing de contacto: ${post.contact_timing}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (!global) {
    // Fallback: cargar datos básicos del negocio
    const { data: bizRaw } = await db
      .from("businesses")
      .select("name, description")
      .eq("id", businessId)
      .single();
    const biz = bizRaw as { name: string; description?: string } | null;
    global = biz ? `Negocio: ${biz.name}${biz.description ? `\nDescripción: ${biz.description}` : ""}` : "(sin perfil completado)";
  }

  // Campaña activa
  const { data: campRaw } = await db
    .from("captacion_campaigns")
    .select("name, type, target_client, objective, starts_at, ends_at")
    .eq("business_id", businessId)
    .eq("status", "active")
    .single();

  const activeCampaign = campRaw as {
    name: string; type: string; target_client?: string;
    objective?: string; starts_at?: string; ends_at?: string;
  } | null;

  const campaign = activeCampaign
    ? [
        `Campaña activa: ${activeCampaign.name}`,
        activeCampaign.target_client && `Cliente objetivo: ${activeCampaign.target_client}`,
        activeCampaign.objective && `Objetivo de campaña: ${activeCampaign.objective}`,
        activeCampaign.starts_at && `Fecha: ${new Date(activeCampaign.starts_at).toLocaleDateString("es-ES")}`,
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  return { global, campaign };
}

// ─── Handler principal ────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "openai_key_missing" }, { status: 503 });
    }

    const body = (await req.json()) as ChatRequest;
    const { businessId, section = "general", messages, userMessage } = body;

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

    const { global: globalCtx, campaign: campaignCtx } = await loadBusinessContext(businessId);
    const systemPrompt = buildSystemPrompt(section, globalCtx, campaignCtx || undefined);

    let rawContent: string;
    try {
      rawContent = await claudeChat({
        system: systemPrompt,
        messages: [
          ...(messages ?? []).slice(-8).map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: userMessage },
        ],
        maxTokens: 1500,
      });
    } catch (err) {
      console.error("[captacion/ai/chat] anthropic error:", err);
      return NextResponse.json({ error: "openai_error" }, { status: 502 });
    }
    if (!rawContent) {
      return NextResponse.json({ error: "empty_response" }, { status: 502 });
    }

    let parsed: { message?: string; suggestion?: Record<string, unknown> | null };
    try {
      parsed = extractJson(rawContent) as { message?: string; suggestion?: Record<string, unknown> | null };
    } catch {
      // Si no es JSON válido, devolver como mensaje plano
      return NextResponse.json({ message: rawContent, suggestion: null });
    }

    return NextResponse.json({
      message: parsed.message ?? "(sin respuesta)",
      suggestion: parsed.suggestion ?? null,
    });
  } catch (e) {
    console.error("[captacion/ai/chat] error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
