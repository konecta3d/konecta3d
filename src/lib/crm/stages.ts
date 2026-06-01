// ─── Etapas del pipeline comercial de Konecta3D ───────────────────────────────
// Fuente única de verdad para las 11 etapas, sus umbrales de tiempo y colores.
// Usado por el pipeline, las fichas de lead y las APIs.

export type StageKey =
  | "prospecto"
  | "lead_frio"
  | "cualificado"
  | "contacto_iniciado"
  | "demo_hecha"
  | "propuesta_enviada"
  | "negociacion"
  | "ganado"
  | "perdido"
  | "cliente_activo"
  | "cliente_recurrente";

export interface StageDef {
  key: StageKey;
  index: number;        // orden 1-11
  label: string;        // nombre visible
  description: string;  // qué significa estar aquí
  // Umbrales de permanencia en HORAS. Si el lead supera amarillo → amarillo,
  // si supera rojo → rojo. null = sin alerta de tiempo (etapas terminales).
  warnHours: number | null;
  alertHours: number | null;
  // Color de la columna en el kanban
  color: string;
  // Categoría para agrupar visualmente
  group: "captacion" | "venta" | "cierre" | "cliente";
}

export const STAGES: StageDef[] = [
  {
    key: "prospecto",
    index: 1,
    label: "Prospecto",
    description: "No nos conoce. Solo existe en nuestra lista de targets.",
    warnHours: 24 * 14,
    alertHours: 24 * 30,
    color: "#94a3b8",
    group: "captacion",
  },
  {
    key: "lead_frio",
    index: 2,
    label: "Lead frío",
    description: "Tenemos su contacto pero no sabemos si es nuestro cliente.",
    warnHours: 24 * 3,
    alertHours: 24 * 7,
    color: "#60a5fa",
    group: "captacion",
  },
  {
    key: "cualificado",
    index: 3,
    label: "Cualificado",
    description: "Sabemos su score. Perfil A/B/C/D asignado.",
    warnHours: 24 * 2,
    alertHours: 24 * 4,
    color: "#38bdf8",
    group: "captacion",
  },
  {
    key: "contacto_iniciado",
    index: 4,
    label: "Contacto iniciado",
    description: "Primera conversación real. En diagnóstico.",
    warnHours: 24 * 1,
    alertHours: 24 * 3,
    color: "#2dd4bf",
    group: "venta",
  },
  {
    key: "demo_hecha",
    index: 5,
    label: "Demo hecha",
    description: "Vio el producto. Entiende qué es Konecta.",
    warnHours: 24 * 2,
    alertHours: 24 * 5,
    color: "#34d399",
    group: "venta",
  },
  {
    key: "propuesta_enviada",
    index: 6,
    label: "Propuesta enviada",
    description: "Tiene precio, lote y fecha límite en mano.",
    warnHours: 24 * 3,
    alertHours: 24 * 6,
    color: "#a3e635",
    group: "venta",
  },
  {
    key: "negociacion",
    index: 7,
    label: "Negociación",
    description: "Respondió. Hay objeciones o preguntas activas.",
    warnHours: 24 * 5,
    alertHours: 24 * 10,
    color: "#facc15",
    group: "venta",
  },
  {
    key: "ganado",
    index: 8,
    label: "Ganado",
    description: "Venta cerrada. Listo para convertir en negocio.",
    warnHours: null,
    alertHours: null,
    color: "#22c55e",
    group: "cierre",
  },
  {
    key: "perdido",
    index: 9,
    label: "Perdido",
    description: "No avanzó. Motivo registrado.",
    warnHours: null,
    alertHours: null,
    color: "#ef4444",
    group: "cierre",
  },
  {
    key: "cliente_activo",
    index: 10,
    label: "Cliente activo",
    description: "Pagó. En onboarding o usando la plataforma.",
    warnHours: null,
    alertHours: null,
    color: "#0ea5e9",
    group: "cliente",
  },
  {
    key: "cliente_recurrente",
    index: 11,
    label: "Cliente recurrente",
    description: "Vuelve a comprar. Referidor activo.",
    warnHours: null,
    alertHours: null,
    color: "#8b5cf6",
    group: "cliente",
  },
];

// Etapas que se muestran como columnas del kanban principal (excluye terminales
// que se ven en vistas filtradas: perdido, cliente_recurrente)
export const PIPELINE_COLUMNS: StageKey[] = [
  "prospecto",
  "lead_frio",
  "cualificado",
  "contacto_iniciado",
  "demo_hecha",
  "propuesta_enviada",
  "negociacion",
  "ganado",
  "cliente_activo",
];

export const STAGE_BY_KEY: Record<StageKey, StageDef> = STAGES.reduce(
  (acc, s) => { acc[s.key] = s; return acc; },
  {} as Record<StageKey, StageDef>
);

export function getStage(key: string): StageDef | undefined {
  return STAGE_BY_KEY[key as StageKey];
}

// ─── Cálculo del estado de tiempo (semáforo) ──────────────────────────────────

export type TimeStatus = "green" | "yellow" | "red" | "none";

/**
 * Dado la fecha de entrada en la etapa actual y la etapa, devuelve el estado
 * del semáforo según los umbrales configurados.
 */
export function getTimeStatus(stageKey: string, enteredAt: string | Date | null): {
  status: TimeStatus;
  hours: number;
  days: number;
} {
  const stage = getStage(stageKey);
  if (!enteredAt || !stage || stage.warnHours === null || stage.alertHours === null) {
    return { status: "none", hours: 0, days: 0 };
  }
  const entered = typeof enteredAt === "string" ? new Date(enteredAt) : enteredAt;
  const hours = (Date.now() - entered.getTime()) / (1000 * 60 * 60);
  const days = Math.floor(hours / 24);

  let status: TimeStatus = "green";
  if (hours >= stage.alertHours) status = "red";
  else if (hours >= stage.warnHours) status = "yellow";

  return { status, hours, days };
}

export const TIME_STATUS_COLOR: Record<TimeStatus, string> = {
  green:  "#22c55e",
  yellow: "#facc15",
  red:    "#ef4444",
  none:   "transparent",
};

// ─── Perfiles, fuentes, sectores (catálogos compartidos) ──────────────────────

export const PERFILES = ["A", "B", "C", "D"] as const;
export type Perfil = typeof PERFILES[number];

export const PERFIL_INFO: Record<Perfil, { label: string; color: string; desc: string }> = {
  A: { label: "Ideal",      color: "#22c55e", desc: "3+ ferias/año, capta poco, tiene equipo" },
  B: { label: "Interesante", color: "#facc15", desc: "1-2 ferias/año o autónomo solo" },
  C: { label: "Futuro",     color: "#60a5fa", desc: "Negocio físico pero no va a ferias" },
  D: { label: "No ideal",   color: "#94a3b8", desc: "Solo online, sin touchpoints físicos" },
};

export const FUENTES = ["Instagram", "LinkedIn", "Referido", "Directo", "Feria", "Otro"] as const;

export const SECTORES = [
  "Inmobiliaria",
  "Dental / Salud",
  "Seguros / Financiero",
  "Energía / Reformas",
  "Formación",
  "Automoción",
  "Franquicia",
  "Alimentación",
  "Otro",
] as const;

export const ASIGNADOS = ["Miguel", "Miriam"] as const;
export type Asignado = typeof ASIGNADOS[number];
