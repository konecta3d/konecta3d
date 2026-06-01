// ─── Formato de contenido de lead magnets ─────────────────────────────────────
// Soporta texto enriquecido sencillo dentro de cada punto:
//   **texto**  → negrita
//   salto de línea dentro de un punto → renglón debajo
//
// Separador de puntos: línea en blanco (\n\n). Compatibilidad hacia atrás:
// si el contenido no tiene ninguna línea en blanco, se trata cada línea como
// un punto (formato antiguo). Así las plantillas existentes siguen funcionando.

export function splitPoints(content: string): string[] {
  if (!content) return [];
  if (/\n\s*\n/.test(content)) {
    return content.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  }
  return content.split("\n").map(p => p.trim()).filter(Boolean);
}

export function joinPoints(points: string[]): string {
  // Formato nuevo: línea en blanco entre puntos (permite saltos internos)
  return points.join("\n\n");
}

// Quita numeración o viñeta manual al inicio ("1. ", "- ", "• ")
export function stripBullet(point: string): string {
  return point.replace(/^(\d+[.)])\s*/, "").replace(/^[-•]\s*/, "");
}

// Convierte un punto a HTML seguro con **negrita** y saltos de línea.
export function pointToHtml(point: string): string {
  const escaped = point
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}
