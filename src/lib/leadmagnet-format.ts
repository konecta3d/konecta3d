// ─── Formato de contenido de lead magnets ─────────────────────────────────────
// Soporta texto enriquecido sencillo dentro de cada punto:
//   **texto**  → negrita
//   salto de línea dentro de un punto (Enter) → renglón debajo
//
// Los puntos se separan internamente con un carácter de control invisible
// (Record Separator, código 30) que el usuario nunca teclea. Esto elimina toda
// ambigüedad: un salto de línea dentro de un punto jamás se confunde con el
// separador entre puntos. Compatibilidad hacia atrás con el formato antiguo
// (un punto por línea) y con el intermedio (línea en blanco entre puntos).

const SEP = String.fromCharCode(30); // Record Separator — separador de puntos

export function splitPoints(content: string): string[] {
  if (!content) return [];
  // Formato nuevo: separador reservado
  if (content.includes(SEP)) {
    return content.split(SEP).map(p => p.trim()).filter(Boolean);
  }
  // Formato intermedio: línea en blanco entre puntos
  if (/\n\s*\n/.test(content)) {
    return content.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  }
  // Formato antiguo: un punto por línea
  return content.split("\n").map(p => p.trim()).filter(Boolean);
}

export function joinPoints(points: string[]): string {
  return points.map(p => p.trim()).join(SEP);
}

// Quita numeración o viñeta manual al inicio ("1. ", "- ", "• ")
export function stripBullet(point: string): string {
  return point.replace(/^(\d+[.)])\s*/, "").replace(/^[-•]\s*/, "");
}

// Convierte un punto a HTML seguro con **negrita** y saltos de línea.
export function pointToHtml(point: string): string {
  const escaped = point
    .split(SEP).join("")           // por seguridad, nunca debe llegar
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}
