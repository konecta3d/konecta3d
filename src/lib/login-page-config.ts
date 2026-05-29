// ─── Configuración de la página de acceso de negocios ─────────────────────────

export type LoginPageConfig = {
  // Fondo
  bg_type: "gradient" | "solid" | "image";
  bg_color_1: string;       // color principal / sólido
  bg_color_2: string;       // color secundario (gradiente)
  bg_angle: number;         // ángulo del gradiente
  bg_image_url: string;     // URL de imagen de fondo
  bg_overlay: number;       // opacidad del overlay (cuando imagen)
  bg_overlay_color: string; // color del overlay

  // Marca
  brand_name: string;       // "KONECTA3D"
  brand_color: string;      // color del badge K y el botón

  // Textos
  headline: string;         // "Accede a tu panel de negocio"
  subtext: string;          // subtítulo

  // Botón
  button_text: string;      // "Entrar →"

  // Soporte
  support_phone: string;    // número WhatsApp (sin +)
  support_label: string;    // texto del enlace de soporte
};

export const DEFAULT_LOGIN_CONFIG: Required<LoginPageConfig> = {
  bg_type: "gradient",
  bg_color_1: "#0a2422",
  bg_color_2: "#0f3d3a",
  bg_angle: 145,
  bg_image_url: "",
  bg_overlay: 0.45,
  bg_overlay_color: "#000000",

  brand_name: "KONECTA3D",
  brand_color: "#C5A059",

  headline: "Accede a tu\npanel de negocio",
  subtext: "Gestiona tu presencia digital y captación de leads.",

  button_text: "Entrar →",

  support_phone: "34623759451",
  support_label: "soporte",
};
