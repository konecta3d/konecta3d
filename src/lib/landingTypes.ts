// Tipo compartido para la configuración de la landing page
export interface LandingConfig {
    // Fondo
    bgUrl: string;
    bgColor: string;
    bgMode: "image" | "color";
    bgOpacity: number;
    bgSize: number;
    bgPosition?: string; // posicion del fondo (CSS background-position)
    showBg: boolean;

    // Logo
    logoUrl: string;
    logoShape: "round" | "square" | "rect";
    showLogo: boolean;
    logoSize: number;

    // Título y subtítulo
    businessName: string;
    showBusinessName: boolean;
    titleSize: number;
    subtitle: string;
    showSubtitle: boolean;
    subtitleSize: number;

    // CTAs principales
    cta1Text: string;
    cta1Link: string;
    cta1Icon: string;
    cta1BenefitId: string;
    cta1LeadMagnetId: string;
    showCta1: boolean;
    cta2Text: string;
    cta2Link: string;
    cta2Icon: string;
    cta2BenefitId: string;
    cta2LeadMagnetId: string;
    showCta2: boolean;
    cta3Text: string;
    cta3Link: string;
    cta3Icon: string;
    cta3BenefitId: string;
    cta3LeadMagnetId: string;
    showCta3: boolean;

    // CTAs adicionales
    showMoreButtons: boolean;
    cta4Text: string;
    cta4Link: string;
    cta4Icon: string;
    showCta4: boolean;
    cta5Text: string;
    cta5Link: string;
    cta5Icon: string;
    showCta5: boolean;

    // Herramienta integrada en la landing
    showSelectedTool: boolean;
    selectedToolKind: "none" | "web" | "instagram" | "facebook" | "map" | "catalog" | "invite";
    selectedToolLinkUrl: string;
    selectedToolTitle: string;
    selectedToolSubtitle: string;

    // Bloque invitación
    inviteTitle: string;
    inviteText: string;
    inviteBtnText: string;
    inviteBtnLink: string;
    showInvite: boolean;

    // Bloque imagen de reseña
    reviewImage: string;
    reviewLink: string;
    showReview: boolean;

    // Personalización de la imagen final
    finalImageSize: "small" | "medium" | "large";
    finalImageFramed: boolean;
    finalImageShadow: boolean;
    finalImageHeight: number; // altura en px (opcional, override de finalImageSize)


    // Bloque final (debajo de los CTAs)
    finalBlockMode: "none" | "tools" | "invite" | "image";

    // Bloque herramientas
    toolsTitle: string;
    toolsSubtitle: string;
    tools: Array<{
    id: string;       // identificador único
    label: string;   // texto del botón CTA
    url: string;      // enlace
    }>;

    // Campo legado — sólo para migración de datos antiguos
    toolsIds?: string[];

    // ID del negocio (para analytics, no se persiste en la config)
    businessId?: string;

    // Estilos de botones
    ctaBg: string;
    ctaTextColor: string;
    ctaBorderColor: string;
    ctaBorderWidth: number;
    ctaRadius: number;
    ctaOpacity: number;
    ctaFontSize: number;
    textColor: string;

    // Espaciado y layout
    heroPaddingTop: number;
    heroPaddingBottom: number;
    dividerMarginTop: number;
    dividerMarginBottom: number;
    buttonsGap: number;
    finalBlockMarginTop: number;
    contentPaddingX: number;
    finalOrder: "invite-first" | "image-first";
    landingPaddingY: number;
    heroContainer: boolean;
    bodyContainer: boolean;
}

export const defaultLandingConfig: LandingConfig = {
    bgUrl: "",
    bgColor: "#0f2b33",
    bgMode: "color",
    bgOpacity: 100,
    bgSize: 120,
    bgPosition: "center center",
    showBg: true,
    logoUrl: "",
    logoShape: "round",
    showLogo: true,
    logoSize: 80,
    businessName: "",
    showBusinessName: true,
    titleSize: 26,
    subtitle: "",
    showSubtitle: true,
    subtitleSize: 16,
    cta1Text: "WhatsApp",
    cta1Link: "",
    cta1Icon: "none",
    cta1BenefitId: "",
    cta1LeadMagnetId: "",
    showCta1: true,
    cta2Text: "Instagram",
    cta2Link: "",
    cta2Icon: "none",
    cta2BenefitId: "",
    cta2LeadMagnetId: "",
    showCta2: true,
    cta3Text: "Página Web",
    cta3Link: "",
    cta3Icon: "none",
    cta3BenefitId: "",
    cta3LeadMagnetId: "",
    showCta3: true,
    showMoreButtons: false,
    cta4Text: "",
    cta4Link: "",
    cta4Icon: "none",
    showCta4: true,
    cta5Text: "",
    cta5Link: "",
    cta5Icon: "none",
    showCta5: true,

    // Herramienta integrada en la landing
    showSelectedTool: false,
    selectedToolKind: "none",
    selectedToolLinkUrl: "",
    selectedToolTitle: "",
    selectedToolSubtitle: "",

    inviteTitle: "Invitar a un amigo",
    inviteText: "Comparte este link y ganan los 2",
    inviteBtnText: "COMPARTIR",
    inviteBtnLink: "",
    showInvite: true,
    reviewImage: "",
    reviewLink: "",
    showReview: false,

    finalImageSize: "medium",
    finalImageFramed: true,
    finalImageShadow: true,
    finalImageHeight: 0,

    // Bloque final
    finalBlockMode: "none",
    toolsTitle: "",
    toolsSubtitle: "",
    tools: [],

    ctaBg: "#ffffff",

    ctaTextColor: "#0c1a24",
    ctaBorderColor: "#ffffff",
    ctaBorderWidth: 0,
    ctaRadius: 16,
    ctaOpacity: 100,
    ctaFontSize: 15,
    textColor: "#ffffff",
    heroPaddingTop: 48,
    heroPaddingBottom: 20,
    dividerMarginTop: 16,
    dividerMarginBottom: 16,
    buttonsGap: 16,
    finalBlockMarginTop: 28,
    contentPaddingX: 24,
    finalOrder: "invite-first",
    landingPaddingY: 0,
    heroContainer: false,
    bodyContainer: false,
};