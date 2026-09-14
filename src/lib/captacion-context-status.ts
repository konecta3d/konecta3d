// ─── Completitud del Contexto de Captación (fuente de verdad compartida) ────────
// Misma definición que usa la página /captacion/contexto: un bloque está
// "completo" solo si tiene TODOS sus campos obligatorios. Se usa también en el
// layout para que el punto/contador de la ruta guiada coincida con lo que ve el
// negocio (X/6), en vez de marcar el contexto como hecho con cualquier dato suelto.

export type SectionStatus = "empty" | "partial" | "complete";

interface SectionConfig {
  key: string;
  requiredFields: string[];
}

// Los 6 bloques del contexto de captación (mismos requiredFields que la página).
export const CAPTACION_SECTIONS: SectionConfig[] = [
  { key: "identidad", requiredFields: ["what_you_do", "what_you_sell", "client_result", "differentiator"] },
  { key: "clientes", requiredFields: [] },
  { key: "tono", requiredFields: ["style", "tuteo", "ten_second_phrase"] },
  { key: "sector", requiredFields: ["sector"] },
  { key: "expectativas", requiredFields: ["visitors", "contacts_target"] },
  { key: "seguimiento", requiredFields: ["channels", "timing"] },
];

export function getCaptacionSectionStatus(
  section: SectionConfig,
  context: Record<string, unknown>
): SectionStatus {
  const raw = context[section.key];

  if (section.key === "clientes") {
    const c = raw as { profiles?: Array<{ name?: string; motivators?: unknown[] }> } | undefined;
    if (!c?.profiles || c.profiles.length === 0) return "empty";
    const first = c.profiles[0];
    if (!first?.name) return "empty";
    if (first.motivators && first.motivators.length > 0) return "complete";
    return "partial";
  }

  if (!raw || typeof raw !== "object") return "empty";
  const data = raw as Record<string, unknown>;

  const filled = section.requiredFields.filter((f) => {
    const val = data[f];
    if (Array.isArray(val)) return val.length > 0;
    return typeof val === "string" && val.trim().length > 0;
  });

  if (filled.length === 0) return "empty";
  if (filled.length === section.requiredFields.length) return "complete";
  return "partial";
}

/** Nº de bloques COMPLETOS del contexto de captación (0-6). */
export function captacionContextCompleteCount(context: Record<string, unknown> | null | undefined): number {
  const ctx = context || {};
  return CAPTACION_SECTIONS.filter((s) => getCaptacionSectionStatus(s, ctx) === "complete").length;
}

/**
 * Progreso a nivel de CAMPO (para el umbral del 90%, que por bloques no tendría
 * sentido con solo 6). El bloque "clientes" cuenta como 1 campo (completo o no).
 */
export function captacionContextFieldProgress(
  context: Record<string, unknown> | null | undefined
): { filled: number; total: number } {
  const ctx = context || {};
  let filled = 0;
  let total = 0;
  for (const s of CAPTACION_SECTIONS) {
    if (s.key === "clientes") {
      total += 1;
      if (getCaptacionSectionStatus(s, ctx) === "complete") filled += 1;
      continue;
    }
    total += s.requiredFields.length;
    const raw = ctx[s.key];
    const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    for (const f of s.requiredFields) {
      const val = data[f];
      const ok = Array.isArray(val) ? val.length > 0 : typeof val === "string" && val.trim().length > 0;
      if (ok) filled += 1;
    }
  }
  return { filled, total };
}

export const CAPTACION_SECTIONS_TOTAL = CAPTACION_SECTIONS.length;
