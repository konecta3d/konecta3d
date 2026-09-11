// ─── Utilidades compartidas para los cambios de landing que devuelve la IA ────
// Las usan tanto el chat conversacional (mi-negocio/landing/chat) como el
// generador de versión completa (mi-negocio/landing/generate). Centralizarlas
// evita que los dos endpoints deriven en la validación y vuelva el fallo de
// "aplicar no aplica nada".

import { defaultLandingConfig, type LandingConfig } from "@/lib/landingTypes";

// Campos que la IA NO puede modificar (defensa en profundidad — el system
// prompt también lo dice, pero filtramos aquí por si el modelo desobedece).
const FORBIDDEN_FIELDS: (keyof LandingConfig)[] = [
  "logoUrl",
  "logoShape",
  "showLogo",
  "logoSize",
];

// Claves válidas = todos los campos reales de LandingConfig menos los prohibidos.
const ALLOWED_FIELDS: ReadonlySet<string> = new Set(
  Object.keys(defaultLandingConfig).filter(
    (k) => !(FORBIDDEN_FIELDS as string[]).includes(k)
  )
);

/**
 * Limpia el objeto de cambios que devuelve la IA. Descarta campos prohibidos y
 * cualquier clave que NO exista en LandingConfig (si la IA alucina un nombre de
 * campo, el merge en el editor sería un no-op silencioso y el botón "Aplicar"
 * no haría nada). Además garantiza que un color de fondo se vea, forzando
 * bgMode:"color" y showBg:true cuando faltan. Deja traza de las claves inválidas.
 */
export function sanitizeLandingChanges(
  changes: Partial<LandingConfig> | null
): Partial<LandingConfig> | null {
  if (!changes || typeof changes !== "object") return null;
  const cleaned: Record<string, unknown> = {};
  const dropped: string[] = [];
  for (const [key, value] of Object.entries(changes)) {
    if (ALLOWED_FIELDS.has(key)) cleaned[key] = value;
    else dropped.push(key);
  }
  // Garantía de visibilidad del fondo: el renderer solo pinta el color cuando
  // showBg está activo y bgMode === "color". Rellenamos solo si faltan, sin
  // pisar una decisión explícita de la IA en el mismo turno.
  if ("bgColor" in cleaned) {
    if (cleaned.bgMode === undefined) cleaned.bgMode = "color";
    if (cleaned.showBg === undefined) cleaned.showBg = true;
  }
  if (dropped.length > 0) {
    console.warn(
      "[landing-ai] la IA devolvió claves inválidas (descartadas):",
      dropped,
      "| aplicadas:",
      Object.keys(cleaned)
    );
  }
  return Object.keys(cleaned).length > 0 ? (cleaned as Partial<LandingConfig>) : null;
}

// Campos que NO se envían al modelo (URLs/binarios de imagen, irrelevantes para
// la personalización). El replacer recursivo elimina además cualquier base64 o
// string excesivamente largo que se cuele en sub-objetos o arrays; sin esto las
// imágenes en base64 inflan el payload por encima del límite de tokens.
const OMITTED_FIELDS_FOR_GPT: ReadonlySet<string> = new Set([
  "bgUrl",
  "logoUrl",
  "reviewImage",
  "toolsIds",
  "__savedVersion",
]);

/** Serializa la config para enviarla al modelo, sin imágenes ni valores enormes. */
export function toGptPayload(config: LandingConfig): string {
  return JSON.stringify(
    config,
    (key, value) => {
      if (OMITTED_FIELDS_FOR_GPT.has(key)) return undefined;
      if (typeof value === "string") {
        if (value.startsWith("data:")) return "[imagen omitida]";
        if (value.length > 300) return `[valor largo (${value.length} chars)]`;
      }
      return value;
    },
    2
  );
}
