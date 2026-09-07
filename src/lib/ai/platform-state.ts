// ─── Estado real de la plataforma para los chatbots ──────────────────────────
// Genera un bloque de texto COMPACTO con lo que el negocio realmente tiene en la
// plataforma: módulos activos, herramientas (action_links) ya configuradas y
// número de piezas creadas. Se antepone al system prompt de los tres asistentes
// para que sus sugerencias sean consecuentes con el estado real y dejen de ser
// genéricas (El Método Konecta ya lo exige; esto es lo que se lo hace posible).
//
// Robusto por diseño: cualquier consulta que falle se ignora y, si todo falla,
// devuelve "" — nunca rompe el chat.

import type { SupabaseClient } from "@supabase/supabase-js";

async function safeCount(db: SupabaseClient, table: string, businessId: string): Promise<number> {
  try {
    const { count } = await db
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId);
    return count ?? 0;
  } catch {
    return 0;
  }
}

// Etiquetas legibles para cada flag de módulo de la tabla `businesses`.
const MODULE_LABELS: [string, string][] = [
  ["module_ai_landing", "landing con IA"],
  ["module_ai_recursos", "recursos de valor con IA"],
  ["module_lead_magnet", "recursos de valor"],
  ["module_vip_benefits", "beneficios VIP"],
  ["module_whatsapp", "WhatsApp"],
  ["module_tools", "herramientas del negocio"],
  ["module_captacion", "captación en ferias"],
  ["module_forms", "formularios"],
];

export async function getPlatformState(db: SupabaseClient, businessId: string): Promise<string> {
  try {
    const [bizRes, linksRes, lm, benefits, capLm, capForms, capCamp] = await Promise.all([
      db
        .from("businesses")
        .select(
          "slug, module_lead_magnet, module_vip_benefits, module_whatsapp, module_tools, module_forms, module_captacion, module_ai_landing, module_ai_recursos"
        )
        .eq("id", businessId)
        .single(),
      db.from("action_links").select("type, name").eq("business_id", businessId),
      safeCount(db, "lead_magnets", businessId),
      safeCount(db, "benefits", businessId),
      safeCount(db, "captacion_lead_magnets", businessId),
      safeCount(db, "captacion_forms", businessId),
      safeCount(db, "captacion_campaigns", businessId),
    ]);

    const biz = (bizRes.data as Record<string, unknown> | null) ?? null;
    const links = (linksRes.data as { type: string; name: string }[] | null) ?? [];

    const activos = biz
      ? MODULE_LABELS.filter(([key]) => biz[key]).map(([, label]) => label)
      : [];

    const toolTypes = Array.from(new Set(links.map((l) => l.type).filter(Boolean)));

    const lines = [
      "════════════════════════════════════",
      "ESTADO REAL DE LA PLATAFORMA (este negocio)",
      "════════════════════════════════════",
      `Módulos activos: ${activos.length ? activos.join(", ") : "ninguno"}`,
      toolTypes.length
        ? `Herramientas ya configuradas (usables en botones y enlaces): ${toolTypes.join(", ")} — ${links.length} en total.`
        : "Herramientas configuradas: ninguna todavía. Para enlazar un botón, el negocio primero debe crear la herramienta en 'Herramientas del negocio'.",
      `Landing publicada: ${biz?.slug ? "sí" : "no"}`,
      `Piezas creadas — recursos de valor: ${lm} · beneficios: ${benefits} · recursos de captación: ${capLm} · formularios: ${capForms} · campañas: ${capCamp}`,
      "Sé consecuente con esto: no propongas enlazar herramientas que no existen (si faltan, el primer paso es crearlas) y no dupliques piezas ya creadas.",
    ];

    return lines.join("\n");
  } catch {
    return "";
  }
}
