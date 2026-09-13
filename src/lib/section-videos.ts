// ─── Secciones con vídeo tutorial (fuera de los pasos de Landing/Recursos) ──────
// Cada pantalla del panel puede tener sus vídeos. La clave (key) identifica la
// sección; el botón flotante los carga según la ruta actual (getSectionKey).

export type SectionArea = "Fidelización" | "Captación" | "General";

export interface SectionVideoDef {
  key: string;
  label: string;
  area: SectionArea;
}

// Orden = como se listan en el gestor admin.
export const SECTION_VIDEO_DEFS: SectionVideoDef[] = [
  // Fidelización
  { key: "inicio", label: "Inicio (panel del negocio)", area: "Fidelización" },
  { key: "perfil", label: "Perfil del negocio", area: "Fidelización" },
  { key: "contexto-fidelizacion", label: "Contexto (fidelización)", area: "Fidelización" },
  { key: "beneficios-vip", label: "Beneficios VIP", area: "Fidelización" },
  { key: "formularios-fidelizacion", label: "Formularios (fidelización)", area: "Fidelización" },
  { key: "herramientas", label: "Herramientas", area: "Fidelización" },
  { key: "clientes-fidelizacion", label: "Clientes (fidelización)", area: "Fidelización" },
  { key: "estadisticas", label: "Estadísticas", area: "Fidelización" },
  // Captación
  { key: "contexto-captacion", label: "Contexto (captación)", area: "Captación" },
  { key: "campanas", label: "Campañas de captación", area: "Captación" },
  { key: "formularios-captacion", label: "Formularios (captación)", area: "Captación" },
  { key: "recursos-captacion", label: "Recursos de valor (captación)", area: "Captación" },
  { key: "clientes-captacion", label: "Clientes (captación)", area: "Captación" },
  { key: "recorrido", label: "Recorrido del cliente", area: "Captación" },
];

export const SECTION_LABELS: Record<string, string> = Object.fromEntries(
  SECTION_VIDEO_DEFS.map((s) => [s.key, s.label])
);

/**
 * Devuelve la clave de sección para una ruta, o null si esa pantalla no lleva
 * vídeo por sección (p. ej. el editor de Landing y el wizard de Recursos, que ya
 * tienen sus vídeos por paso, y todo el área /admin).
 */
export function getSectionKey(pathname: string): string | null {
  if (pathname.startsWith("/admin")) return null;
  // Pantallas con vídeos por paso propios → no llevan botón de sección.
  if (pathname.startsWith("/landing")) return null;
  if (pathname.startsWith("/lead-magnet")) return null;

  // Captación (lo más específico primero)
  if (pathname.startsWith("/captacion/contexto")) return "contexto-captacion";
  if (pathname.startsWith("/captacion/campanas")) return "campanas";
  if (pathname.startsWith("/captacion/formularios")) return "formularios-captacion";
  if (pathname.startsWith("/captacion/lead-magnets")) return "recursos-captacion";
  if (pathname.startsWith("/captacion/clientes")) return "clientes-captacion";
  if (pathname.startsWith("/captacion/recorrido")) return "recorrido";

  // Fidelización
  if (pathname.startsWith("/mi-contexto")) return "contexto-fidelizacion";
  if (pathname.startsWith("/gpt-fidelizacion")) return "contexto-fidelizacion";
  if (pathname.startsWith("/vip-benefits")) return "beneficios-vip";
  if (pathname.startsWith("/formularios")) return "formularios-fidelizacion";
  if (pathname.startsWith("/negocio/herramientas")) return "herramientas";
  if (pathname.startsWith("/acciones")) return "herramientas";
  if (pathname.startsWith("/negocio/clientes")) return "clientes-fidelizacion";
  if (pathname.startsWith("/negocio/estadisticas")) return "estadisticas";
  if (pathname.startsWith("/mi-negocio/estadisticas")) return "estadisticas";
  if (pathname.startsWith("/mi-negocio/perfil")) return "perfil";
  if (pathname.startsWith("/negocio/perfil")) return "perfil";
  if (pathname.startsWith("/mi-negocio")) return "inicio";

  return null;
}
