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

export type LandingBlock =
  | HeadingBlock | ParagraphBlock | BulletsBlock
  | ButtonBlock | ImageBlock | SpacerBlock
  | LogosBlock | StepsBlock | CardsBlock | FaqBlock
  | CountdownBlock | VideoBlock | SocialsBlock | RowBlock;

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

/** Bloques de arranque para una landing nueva (se ve bien al instante). */
export function starterBlocks(): LandingBlock[] {
  return [
    { id: uid(), type: "heading", level: 1, align: "center", padY: "xl", bg: "none",
      text: "Cada feria te cuesta miles.\n¿Cuántos clientes se van sin dejar rastro?", accent: true },
    { id: uid(), type: "paragraph", align: "center", padY: "none", size: "lg",
      text: "Konecta3D captura los contactos que hoy pierdes en cada evento: un llavero con tu marca que tus visitantes tocan con el móvil y quedan guardados en tu plataforma." },
    { id: uid(), type: "button", align: "center", padY: "md",
      label: "Quiero verlo para mi negocio", linkType: "whatsapp", value: "34623759451",
      waMessage: "Hola, quiero info de Konecta3D", style: "gold", size: "lg" },
    { id: uid(), type: "heading", level: 2, align: "center", padY: "lg", bg: "card",
      text: "Un sistema, no una herramienta más" },
    { id: uid(), type: "bullets", align: "left", padY: "md",
      items: [
        "El lunes, con los leads ya listos",
        "El stand más avanzado del evento",
        "Justificas cada euro con números",
        "Tu equipo cierra más y llama menos en frío",
      ] },
    { id: uid(), type: "button", align: "center", padY: "lg",
      label: "Hablar con Konecta3D", linkType: "whatsapp", value: "34623759451",
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
  }
}

/** Tipos de bloque que se pueden meter dentro de una columna (sin filas anidadas). */
export const CHILD_BLOCK_TYPES: LandingBlock["type"][] =
  (["heading", "paragraph", "bullets", "button", "image", "spacer", "logos", "steps", "cards", "faq", "countdown", "video", "socials"] as LandingBlock["type"][]);

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
};
