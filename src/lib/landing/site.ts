// ─── Configuración compartida del sitio (cabecera, pie y menú) ────────────────
// Una sola config para todas las páginas /p/[slug], guardada en settings.
// Convierte páginas sueltas en una web con navegación común.

export interface NavLink {
  label: string;
  type: "page" | "url" | "anchor";
  value: string;   // slug de página, URL externa o id de ancla
}

export interface SiteHeader {
  enabled: boolean;
  logoType: "text" | "image";
  logoText: string;
  logoImg: string;
  logoHeight: number;
  links: NavLink[];
  ctaLabel: string;
  ctaType: "whatsapp" | "url" | "page" | "anchor" | "none";
  ctaValue: string;
  ctaMessage?: string;
  sticky: boolean;
}

export interface SiteFooter {
  enabled: boolean;
  text: string;
  links: NavLink[];
  socials: { network: string; url: string }[];
}

export interface SiteConfig {
  header: SiteHeader;
  footer: SiteFooter;
}

export const DEFAULT_SITE: SiteConfig = {
  header: {
    enabled: true,
    logoType: "text",
    logoText: "Konecta3D",
    logoImg: "",
    logoHeight: 32,
    links: [
      { label: "Inicio", type: "anchor", value: "top" },
      { label: "Contacto", type: "anchor", value: "contacto" },
    ],
    ctaLabel: "Hablar por WhatsApp",
    ctaType: "whatsapp",
    ctaValue: "34623759451",
    ctaMessage: "Hola, quiero info de Konecta3D",
    sticky: true,
  },
  footer: {
    enabled: true,
    text: "© Konecta3D — Presencia digital y captación para negocios locales.",
    links: [],
    socials: [],
  },
};
