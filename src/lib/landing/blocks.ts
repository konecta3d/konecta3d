// ─── Modelo de datos del editor visual de landings ───────────────────────────
// Una landing en modo "visual" = un tema (theme) + una lista de bloques.
// El mismo render (render.ts) genera el HTML para la vista previa y para la
// página pública /p/[slug] → lo que ves es lo que se publica.

export type LandingFont = "Inter" | "Outfit" | "Poppins" | "Montserrat";

export interface LandingTheme {
  bgType: "gradient" | "solid";
  bg1: string;        // color de fondo (o inicio del degradado)
  bg2: string;        // fin del degradado
  bgAngle: number;    // ángulo del degradado
  brand: string;      // color de marca / botones (dorado)
  brandText: string;  // color del texto sobre botones de marca
  text: string;       // color de texto principal
  muted: string;      // color de texto secundario
  font: LandingFont;
  noChrome?: boolean; // si true, esta página NO muestra la cabecera/pie del sitio
}

export type BlockAlign = "left" | "center" | "right";
export type BlockPad = "none" | "sm" | "md" | "lg" | "xl";
export type BlockBg = "none" | "card" | "brandSoft";

/** Estilo avanzado opcional por bloque. Sobrescribe el tema global. */
export interface BlockStyle {
  fontFamily?: LandingFont;
  fontSize?: number;     // px (texto principal del bloque)
  fontWeight?: number;   // 400–900
  color?: string;        // color de texto
  bgColor?: string;      // fondo de la banda
  bgImage?: string;      // imagen de fondo de la banda (url)
  padT?: number;         // padding superior px (sobrescribe padY)
  padB?: number;         // padding inferior px
  padX?: number;         // padding lateral px
  maxWidth?: number;     // ancho máx. del contenido px
  radius?: number;       // redondeo del contenido px
  borderColor?: string;
  borderWidth?: number;  // px
  shadow?: boolean;
  hideMobile?: boolean;  // ocultar en móvil
  hideDesktop?: boolean; // ocultar en escritorio
}

export interface BaseBlock {
  id: string;
  type: string;
  align?: BlockAlign;
  padY?: BlockPad;
  bg?: BlockBg;
  s?: BlockStyle;        // estilo avanzado (opcional)
}

export interface HeadingBlock extends BaseBlock {
  type: "heading";
  text: string;
  level: 1 | 2 | 3;
  color?: string;
  accent?: boolean; // pinta la 2ª línea con el color de marca
}
export interface ParagraphBlock extends BaseBlock {
  type: "paragraph";
  text: string;
  size?: "sm" | "md" | "lg";
  color?: string;
}
export interface BulletsBlock extends BaseBlock {
  type: "bullets";
  items: string[];
  color?: string;
}
export interface ButtonBlock extends BaseBlock {
  type: "button";
  label: string;
  linkType: "url" | "whatsapp" | "tel" | "email" | "anchor";
  value: string;       // URL, número, email o id de ancla
  waMessage?: string;  // mensaje predefinido (solo whatsapp)
  style: "gold" | "ghost";
  size?: "md" | "lg";
  newTab?: boolean;
}
export interface ImageBlock extends BaseBlock {
  type: "image";
  src: string;
  alt?: string;
  width?: number;      // px (0/undefined = auto)
  rounded?: boolean;
  href?: string;
}
export interface SpacerBlock extends BaseBlock {
  type: "spacer";
  height: number;      // px
}
export interface LogosBlock extends BaseBlock {
  type: "logos";
  title?: string;
  items: { src: string; alt?: string }[];
}
export interface StepsBlock extends BaseBlock {
  type: "steps";
  items: { title: string; text: string }[];
}
export interface CardsBlock extends BaseBlock {
  type: "cards";
  columns: 2 | 3;
  items: { icon?: string; title: string; text: string }[];
}
export interface FaqBlock extends BaseBlock {
  type: "faq";
  items: { q: string; a: string }[];
}
export interface CountdownBlock extends BaseBlock {
  type: "countdown";
  target: string;   // fecha/hora ISO (datetime-local)
  label?: string;
}
export interface VideoBlock extends BaseBlock {
  type: "video";
  url: string;      // YouTube, Vimeo o MP4
}
export interface SocialsBlock extends BaseBlock {
  type: "socials";
  items: { network: string; url: string }[];
}
export interface RowBlock extends BaseBlock {
  type: "row";
  ratio: string;          // proporción de columnas: "1-1", "1-2", "2-1", "1-1-1", "1-1-1-1"
  gap?: number;           // separación entre columnas (px)
  vAlign?: "top" | "center" | "bottom";
  stackMobile?: boolean;  // apilar en móvil (por defecto true)
  columns: LandingBlock[][];
}
export interface HtmlBlock extends BaseBlock {
  type: "html";
  html: string;           // código HTML a medida, se renderiza tal cual
}

export type LandingBlock =
  | HeadingBlock | ParagraphBlock | BulletsBlock
  | ButtonBlock | ImageBlock | SpacerBlock
  | LogosBlock | StepsBlock | CardsBlock | FaqBlock
  | CountdownBlock | VideoBlock | SocialsBlock | RowBlock | HtmlBlock;

// ─── Valores por defecto ──────────────────────────────────────────────────────

export const DEFAULT_THEME: LandingTheme = {
  bgType: "gradient",
  bg1: "#07201e",
  bg2: "#0a3a36",
  bgAngle: 160,
  brand: "#C5A059",
  brandText: "#0a2422",
  text: "#F4F1EA",
  muted: "#9fb0ac",
  font: "Inter",
};

const uid = () => Math.random().toString(36).slice(2, 10);

/** Landing completa de arranque (modo visual) — estructura 3 P. Editable bloque a bloque. */
export function starterBlocks(): LandingBlock[] {
  const wa = "34623759451";
  return [
    // ── Hero ──
    { id: uid(), type: "heading", level: 1, align: "center", padY: "xl",
      text: "Cada feria te cuesta miles.\n¿Cuántos clientes se van sin dejar rastro?", accent: true },
    { id: uid(), type: "paragraph", align: "center", padY: "none", size: "lg",
      text: "Konecta3D captura los contactos que hoy pierdes en cada evento: un llavero con tu marca que tus visitantes tocan con el móvil y quedan guardados en tu plataforma. Tú llegas el lunes con los leads listos." },
    { id: uid(), type: "button", align: "center", padY: "md",
      label: "Quiero verlo para mi negocio", linkType: "whatsapp", value: wa,
      waMessage: "Hola, quiero info de Konecta3D", style: "gold", size: "lg" },

    // ── Problema ──
    { id: uid(), type: "heading", level: 2, align: "center", padY: "lg",
      text: "Inviertes en presencia, pero no en permanencia" },
    { id: uid(), type: "cards", align: "center", padY: "md", columns: 3, items: [
      { icon: "📇", title: "Vuelves con tarjetas", text: "Un puñado de papeles que no sabes si servirán. La mayoría de interesados pasó y se fue sin rastro." },
      { icon: "⏳", title: "El interés se enfría", text: "Cuando por fin haces el seguimiento, ya pasaron días y el momento se perdió." },
      { icon: "❓", title: "No sabes qué funcionó", text: "Sin números por feria, inviertes igual en todas sin saber cuál te trajo clientes." },
    ] },

    // ── Posibilidad ──
    { id: uid(), type: "heading", level: 2, align: "center", padY: "lg", bg: "brandSoft",
      text: "Llegas el lunes con la lista ya hecha" },
    { id: uid(), type: "paragraph", align: "center", padY: "none", size: "lg",
      text: "Sabes quién pasó por tu stand y qué le interesó. Tu equipo escribe a gente que ya mostró interés, no llama en frío. Y al cerrar la feria, ves en números cuántos leads te dio." },

    // ── Puente / Cómo funciona ──
    { id: uid(), type: "heading", level: 3, align: "center", padY: "lg", text: "Cómo funciona" },
    { id: uid(), type: "steps", align: "center", padY: "none", items: [
      { title: "Tu visitante toca el llavero", text: "Acerca el móvil y se abre tu página. Sin apps, sin fricción." },
      { title: "Queda capturado al instante", text: "Su contacto y lo que le interesó entran en tu plataforma, aunque tu equipo esté ocupado." },
      { title: "Tu marca se queda con él", text: "El llavero se lo lleva a casa y lo usa a diario. Sigues presente cuando ya olvidó los demás stands." },
    ] },

    // ── Beneficios ──
    { id: uid(), type: "heading", level: 2, align: "center", padY: "lg", text: "Un sistema, no una herramienta más" },
    { id: uid(), type: "cards", align: "center", padY: "none", columns: 2, items: [
      { icon: "🌅", title: "El lunes, con los leads listos", text: "Sin haber hecho nada diferente en la feria." },
      { icon: "✨", title: "El stand más avanzado del evento", text: "Dejas de dar tarjetas. Eres del que todos preguntan." },
      { icon: "📊", title: "Justificas cada euro", text: "Sabes qué feria fue rentable y dónde repetir." },
      { icon: "🤝", title: "Tu equipo cierra más", text: "Menos llamadas en frío; hablan con gente interesada." },
    ] },

    // ── Logos ──
    { id: uid(), type: "logos", align: "center", padY: "lg", title: "Negocios que ya tienen su llavero Konecta3D",
      items: [{ src: "", alt: "Cliente 1" }, { src: "", alt: "Cliente 2" }, { src: "", alt: "Cliente 3" }] },

    // ── Urgencia ──
    { id: uid(), type: "heading", level: 2, align: "center", padY: "lg", bg: "card", text: "Tu próxima feria es una fecha límite real" },
    { id: uid(), type: "paragraph", align: "center", padY: "none",
      text: "Fabricar tus llaveros y dejar tu plataforma lista lleva tiempo. Si empiezas hoy, llegas con el sistema montado y probado." },
    { id: uid(), type: "countdown", align: "center", padY: "md", target: "", label: "Cuenta atrás para tu evento" },

    // ── FAQ ──
    { id: uid(), type: "heading", level: 2, align: "center", padY: "lg", text: "Antes de que preguntes" },
    { id: uid(), type: "faq", align: "center", padY: "none", items: [
      { q: "¿Es caro?", a: "Es una fracción de lo que ya inviertes en el stand. Lo recuperas con un solo cliente nuevo." },
      { q: "¿Necesito saber de tecnología?", a: "No. Te lo dejamos configurado y tú lo gestionas desde un panel sencillo." },
      { q: "Ya tengo un CRM, ¿esto lo reemplaza?", a: "No lo reemplaza: lo alimenta. Captura el contacto justo donde hoy lo pierdes." },
      { q: "¿Y si no funciona?", a: "Lo pruebas gratis un mes y lo ves con tus datos antes de pagar nada." },
    ] },

    // ── CTA final ──
    { id: uid(), type: "heading", level: 2, align: "center", padY: "lg", bg: "brandSoft", text: "Que esta feria no sea otra que se te escapa" },
    { id: uid(), type: "button", align: "center", padY: "md",
      label: "Hablar con Konecta3D", linkType: "whatsapp", value: wa,
      waMessage: "Hola, quiero info de Konecta3D para mi negocio", style: "gold", size: "lg" },
  ];
}

/** Crea un bloque nuevo del tipo dado con valores sensatos. */
export function newBlock(type: LandingBlock["type"]): LandingBlock {
  const base = { id: uid(), align: "center" as BlockAlign, padY: "md" as BlockPad, bg: "none" as BlockBg };
  switch (type) {
    case "heading":   return { ...base, type, text: "Nuevo titular", level: 2 };
    case "paragraph": return { ...base, type, text: "Escribe aquí tu texto.", size: "md" };
    case "bullets":   return { ...base, type, align: "left", items: ["Primer punto", "Segundo punto"] };
    case "button":    return { ...base, type, label: "Botón", linkType: "whatsapp", value: "34623759451", waMessage: "Hola", style: "gold", size: "md" };
    case "image":     return { ...base, type, src: "", alt: "", rounded: true };
    case "spacer":    return { ...base, type, height: 40, padY: "none" };
    case "logos":     return { ...base, type, padY: "lg", title: "Negocios que ya tienen su llavero", items: [{ src: "", alt: "Cliente 1" }, { src: "", alt: "Cliente 2" }, { src: "", alt: "Cliente 3" }] };
    case "steps":     return { ...base, type, padY: "lg", items: [{ title: "Toca el llavero", text: "Acerca el móvil y se abre tu página." }, { title: "Queda capturado", text: "Su contacto entra en tu plataforma." }, { title: "Tu marca se queda", text: "Sigues presente cada día." }] };
    case "cards":     return { ...base, type, padY: "lg", columns: 2, items: [{ icon: "🌅", title: "El lunes, con los leads listos", text: "Sin haber hecho nada diferente." }, { icon: "📊", title: "Justificas cada euro", text: "Sabes qué feria fue rentable." }] };
    case "faq":       return { ...base, type, padY: "lg", items: [{ q: "¿Es caro?", a: "Es una fracción de lo que ya inviertes en el stand." }, { q: "¿Necesito saber de tecnología?", a: "No. Te lo dejamos configurado." }] };
    case "countdown": return { ...base, type, padY: "lg", target: "", label: "Tu próxima feria se acerca" };
    case "video":     return { ...base, type, padY: "lg", url: "" };
    case "socials":   return { ...base, type, padY: "md", items: [{ network: "instagram", url: "" }, { network: "whatsapp", url: "" }] };
    case "row":       return { ...base, type, align: "left", padY: "md", ratio: "1-1", gap: 24, vAlign: "center", stackMobile: true, columns: [[], []] };
    case "html":      return { ...base, type, padY: "md", html: "<!-- Pega aquí tu código HTML -->" };
  }
}

/** Tipos de bloque que se pueden meter dentro de una columna (sin filas anidadas). */
export const CHILD_BLOCK_TYPES: LandingBlock["type"][] =
  (["heading", "paragraph", "bullets", "button", "image", "spacer", "logos", "steps", "cards", "faq", "countdown", "video", "socials", "html"] as LandingBlock["type"][]);

// ─── Plantillas de sección (grupos de bloques listos) ─────────────────────────
export const SECTION_TEMPLATES: { key: string; label: string }[] = [
  { key: "hero", label: "Hero (promesa + CTA)" },
  { key: "problema", label: "Problema" },
  { key: "posibilidad", label: "Posibilidad" },
  { key: "como", label: "Cómo funciona" },
  { key: "beneficios", label: "Beneficios" },
  { key: "prueba", label: "Prueba social (logos)" },
  { key: "urgencia", label: "Urgencia (cuenta atrás)" },
  { key: "faq", label: "Preguntas (FAQ)" },
  { key: "cta", label: "CTA final" },
];

/** Devuelve los bloques de una sección prearmada. */
export function sectionTemplate(key: string): LandingBlock[] {
  const wa = "34623759451";
  switch (key) {
    case "hero": return [
      { id: uid(), type: "heading", level: 1, align: "center", padY: "xl", accent: true, text: "Titular con la promesa principal.\nO el coste de no actuar." },
      { id: uid(), type: "paragraph", align: "center", padY: "none", size: "lg", text: "Una o dos frases que amplíen el titular y dejen claro el beneficio concreto." },
      { id: uid(), type: "button", align: "center", padY: "md", label: "Quiero verlo para mi negocio", linkType: "whatsapp", value: wa, waMessage: "Hola, quiero info de Konecta3D", style: "gold", size: "lg" },
    ];
    case "problema": return [
      { id: uid(), type: "heading", level: 2, align: "center", padY: "lg", text: "El problema que vive tu cliente" },
      { id: uid(), type: "cards", align: "center", padY: "md", columns: 3, items: [
        { icon: "📇", title: "Dolor 1", text: "Describe el primer problema con el que se identifica." },
        { icon: "⏳", title: "Dolor 2", text: "El segundo problema y su coste real." },
        { icon: "❓", title: "Dolor 3", text: "El tercero, lo que pierde si no lo resuelve." },
      ] },
    ];
    case "posibilidad": return [
      { id: uid(), type: "heading", level: 2, align: "center", padY: "lg", bg: "brandSoft", text: "Cómo se ve cuando está resuelto" },
      { id: uid(), type: "paragraph", align: "center", padY: "none", size: "lg", text: "Pinta la situación ideal: qué consigue, cómo se siente, qué cambia en su día a día." },
    ];
    case "como": return [
      { id: uid(), type: "heading", level: 3, align: "center", padY: "lg", text: "Cómo funciona" },
      { id: uid(), type: "steps", align: "center", padY: "none", items: [
        { title: "Paso 1", text: "Lo primero que ocurre, simple y claro." },
        { title: "Paso 2", text: "El segundo paso." },
        { title: "Paso 3", text: "El resultado final." },
      ] },
    ];
    case "beneficios": return [
      { id: uid(), type: "heading", level: 2, align: "center", padY: "lg", text: "Lo que cambia para ti" },
      { id: uid(), type: "cards", align: "center", padY: "none", columns: 2, items: [
        { icon: "🌅", title: "Beneficio 1", text: "Un ángulo por deseo del cliente." },
        { icon: "📊", title: "Beneficio 2", text: "Otro beneficio concreto." },
        { icon: "✨", title: "Beneficio 3", text: "Otro más." },
        { icon: "🤝", title: "Beneficio 4", text: "Y el cuarto." },
      ] },
    ];
    case "prueba": return [
      { id: uid(), type: "logos", align: "center", padY: "lg", title: "Negocios que ya confían en nosotros", items: [{ src: "", alt: "Cliente 1" }, { src: "", alt: "Cliente 2" }, { src: "", alt: "Cliente 3" }] },
    ];
    case "urgencia": return [
      { id: uid(), type: "heading", level: 2, align: "center", padY: "lg", bg: "card", text: "Por qué actuar ahora" },
      { id: uid(), type: "paragraph", align: "center", padY: "none", text: "Explica la fecha límite real (su próxima feria) y el coste de esperar." },
      { id: uid(), type: "countdown", align: "center", padY: "md", target: "", label: "Cuenta atrás" },
    ];
    case "faq": return [
      { id: uid(), type: "heading", level: 2, align: "center", padY: "lg", text: "Antes de que preguntes" },
      { id: uid(), type: "faq", align: "center", padY: "none", items: [
        { q: "¿Es caro?", a: "Responde a la objeción de precio." },
        { q: "¿Necesito saber de tecnología?", a: "Responde a la objeción de dificultad." },
        { q: "¿Y si no funciona?", a: "Responde con la prueba gratis / riesgo cero." },
      ] },
    ];
    case "cta": return [
      { id: uid(), type: "heading", level: 2, align: "center", padY: "lg", bg: "brandSoft", text: "Cierre que invita a actuar" },
      { id: uid(), type: "button", align: "center", padY: "md", label: "Hablar con Konecta3D", linkType: "whatsapp", value: wa, waMessage: "Hola, quiero info de Konecta3D para mi negocio", style: "gold", size: "lg" },
    ];
    default: return [];
  }
}

export const BLOCK_LABELS: Record<LandingBlock["type"], string> = {
  heading: "Titular",
  paragraph: "Párrafo",
  bullets: "Lista con viñetas",
  button: "Botón / CTA",
  image: "Imagen",
  spacer: "Espacio",
  logos: "Carrusel de logos",
  steps: "Pasos",
  cards: "Tarjetas",
  faq: "Preguntas (FAQ)",
  countdown: "Cuenta atrás",
  video: "Vídeo",
  socials: "Redes sociales",
  row: "Fila / Columnas",
  html: "HTML / Código",
};
