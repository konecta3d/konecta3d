// ============================================================
// TIPOS — Formularios de Fidelización
// ============================================================

import type { FormDesign } from "@/types/captacion";

export type FidBlockType =
  | 'fid_welcome'
  | 'fid_rating'
  | 'fid_nps'
  | 'fid_questions'
  | 'fid_open_text'
  | 'fid_capture'
  | 'fid_thank_you';

// ── Config por tipo de bloque ────────────────────────────────

export interface FidWelcomeConfig {
  title: string;
  subtitle: string;
  bg_color: string;
  text_color: string;
}

export interface RatingCategory {
  id: string;
  label: string;
}

export interface FidRatingConfig {
  title: string;
  categories: RatingCategory[];
  min_label: string;
  max_label: string;
}

export interface FidNpsConfig {
  question: string;
  low_label: string;
  high_label: string;
}

export type FidQuestionType = 'yes_no' | 'multiple_choice' | 'text';

export interface FidQuestion {
  id: string;
  text: string;
  type: FidQuestionType;
  options?: string[];
  required?: boolean;
}

export interface FidQuestionsConfig {
  questions: FidQuestion[];
}

export interface FidOpenTextConfig {
  title: string;
  placeholder: string;
  required: boolean;
  max_chars: number;
}

export interface FidCaptureField {
  key: 'name' | 'email';
  label: string;
  required: boolean;
  enabled: boolean;
}

export interface FidCaptureConfig {
  allow_anonymous: boolean;
  fields: FidCaptureField[];
}

export interface FidThankYouConfig {
  title: string;
  message: string;
  whatsapp_phone?: string;
  whatsapp_text?: string;
  cta_text?: string;
  cta_url?: string;
}

export type FidBlockConfig =
  | FidWelcomeConfig
  | FidRatingConfig
  | FidNpsConfig
  | FidQuestionsConfig
  | FidOpenTextConfig
  | FidCaptureConfig
  | FidThankYouConfig;

export interface FidFormBlock {
  id: string;
  type: FidBlockType;
  order: number;
  config: FidBlockConfig;
}

// Re-export FormDesign for use in this module
export type { FormDesign };

export type FidelizacionObjective = 'general' | 'nps' | 'product' | 'service';
export type FidelizacionStatus    = 'draft' | 'published' | 'archived';

export interface FidelizacionForm {
  id: string;
  business_id: string;
  name: string;
  slug: string;
  objective: FidelizacionObjective;
  status: FidelizacionStatus;
  blocks: FidFormBlock[];
  design?: FormDesign | null;
  response_count: number;
  created_at: string;
  updated_at: string;
}

// ── Defaults ─────────────────────────────────────────────────

export const DEFAULT_FID_DESIGN: FormDesign = {
  bg_color: "#1a1a2e",
  text_color: "#ffffff",
  accent_color: "#C5A059",
  border_color: "rgba(255,255,255,0.2)",
  font_family: "Inter",
  logo_url: "",
  logo_shape: "round",
  logo_size: 72,
};

function defaultCapture(): FidCaptureConfig {
  return {
    allow_anonymous: true,
    fields: [
      { key: "name",  label: "Nombre",  required: false, enabled: true  },
      { key: "email", label: "Email",   required: false, enabled: false },
    ],
  };
}

export const DEFAULT_FID_BLOCKS: Record<FidelizacionObjective, FidFormBlock[]> = {
  general: [
    {
      id: "b1", type: "fid_welcome", order: 1,
      config: {
        title: "¿Cómo fue tu experiencia?",
        subtitle: "Solo te llevará 2 minutos. Tu opinión nos ayuda a mejorar.",
        bg_color: "#1a1a2e",
        text_color: "#ffffff",
      } as FidWelcomeConfig,
    },
    {
      id: "b2", type: "fid_rating", order: 2,
      config: {
        title: "Valora nuestra atención",
        categories: [
          { id: "c1", label: "Calidad del servicio" },
          { id: "c2", label: "Atención al cliente" },
          { id: "c3", label: "Relación calidad-precio" },
        ],
        min_label: "Muy malo",
        max_label: "Excelente",
      } as FidRatingConfig,
    },
    {
      id: "b3", type: "fid_open_text", order: 3,
      config: {
        title: "¿Qué podemos mejorar?",
        placeholder: "Cuéntanos tu experiencia...",
        required: false,
        max_chars: 500,
      } as FidOpenTextConfig,
    },
    {
      id: "b4", type: "fid_capture", order: 4,
      config: defaultCapture(),
    },
    {
      id: "b5", type: "fid_thank_you", order: 5,
      config: {
        title: "¡Gracias por tu opinión!",
        message: "Tu feedback nos ayuda a ofrecerte una experiencia cada vez mejor.",
      } as FidThankYouConfig,
    },
  ],
  nps: [
    {
      id: "b1", type: "fid_welcome", order: 1,
      config: {
        title: "¿Nos recomendarías?",
        subtitle: "Cuéntanos qué probabilidad hay de que nos recomiendes a alguien.",
        bg_color: "#1a1a2e",
        text_color: "#ffffff",
      } as FidWelcomeConfig,
    },
    {
      id: "b2", type: "fid_nps", order: 2,
      config: {
        question: "En una escala del 0 al 10, ¿qué probabilidad hay de que nos recomiendes?",
        low_label: "Muy improbable",
        high_label: "Muy probable",
      } as FidNpsConfig,
    },
    {
      id: "b3", type: "fid_open_text", order: 3,
      config: {
        title: "¿Por qué esa puntuación?",
        placeholder: "Tu respuesta nos ayuda a mejorar...",
        required: false,
        max_chars: 500,
      } as FidOpenTextConfig,
    },
    {
      id: "b4", type: "fid_capture", order: 4,
      config: defaultCapture(),
    },
    {
      id: "b5", type: "fid_thank_you", order: 5,
      config: {
        title: "¡Gracias por tu puntuación!",
        message: "Valoramos enormemente tu tiempo y opinión.",
      } as FidThankYouConfig,
    },
  ],
  product: [
    {
      id: "b1", type: "fid_welcome", order: 1,
      config: {
        title: "¿Qué te pareció nuestro servicio?",
        subtitle: "Ayúdanos a mejorar respondiendo estas preguntas.",
        bg_color: "#1a1a2e",
        text_color: "#ffffff",
      } as FidWelcomeConfig,
    },
    {
      id: "b2", type: "fid_questions", order: 2,
      config: {
        questions: [
          { id: "q1", text: "¿El servicio cumplió tus expectativas?", type: "yes_no" },
          { id: "q2", text: "¿Volverías a contratar con nosotros?", type: "yes_no" },
        ],
      } as FidQuestionsConfig,
    },
    {
      id: "b3", type: "fid_open_text", order: 3,
      config: {
        title: "¿Algún comentario adicional?",
        placeholder: "Cuéntanos qué mejorarías...",
        required: false,
        max_chars: 400,
      } as FidOpenTextConfig,
    },
    {
      id: "b4", type: "fid_capture", order: 4,
      config: defaultCapture(),
    },
    {
      id: "b5", type: "fid_thank_you", order: 5,
      config: {
        title: "¡Muchas gracias!",
        message: "Tu opinión nos ayuda a ofrecer un servicio de mayor calidad.",
      } as FidThankYouConfig,
    },
  ],
  service: [
    {
      id: "b1", type: "fid_welcome", order: 1,
      config: {
        title: "¿Cómo fue la atención?",
        subtitle: "Valora la atención recibida por nuestro equipo.",
        bg_color: "#1a1a2e",
        text_color: "#ffffff",
      } as FidWelcomeConfig,
    },
    {
      id: "b2", type: "fid_rating", order: 2,
      config: {
        title: "Valora a nuestro equipo",
        categories: [
          { id: "c1", label: "Amabilidad" },
          { id: "c2", label: "Profesionalidad" },
          { id: "c3", label: "Rapidez" },
          { id: "c4", label: "Conocimiento" },
        ],
        min_label: "Muy malo",
        max_label: "Excelente",
      } as FidRatingConfig,
    },
    {
      id: "b3", type: "fid_open_text", order: 3,
      config: {
        title: "¿Qué destacarías de la atención?",
        placeholder: "Comparte tu experiencia...",
        required: false,
        max_chars: 400,
      } as FidOpenTextConfig,
    },
    {
      id: "b4", type: "fid_capture", order: 4,
      config: defaultCapture(),
    },
    {
      id: "b5", type: "fid_thank_you", order: 5,
      config: {
        title: "¡Gracias por valorar a nuestro equipo!",
        message: "Compartiremos tu feedback con todo el equipo.",
      } as FidThankYouConfig,
    },
  ],
};

export const FID_BLOCK_LABELS: Record<FidBlockType, string> = {
  fid_welcome:    "Bienvenida",
  fid_rating:     "Valoración por categorías",
  fid_nps:        "NPS",
  fid_questions:  "Preguntas",
  fid_open_text:  "Texto libre",
  fid_capture:    "Datos del cliente",
  fid_thank_you:  "Página de Gracias",
};

export const FID_BLOCK_OBJECTIVES: Record<FidBlockType, string> = {
  fid_welcome:    "Primera pantalla del formulario. Define el contexto y genera confianza.",
  fid_rating:     "Pide al cliente que valore diferentes aspectos con estrellas.",
  fid_nps:        "Escala 0-10 para medir la probabilidad de recomendación.",
  fid_questions:  "Preguntas cerradas (sí/no, opción múltiple o texto corto).",
  fid_open_text:  "Campo abierto para que el cliente escriba su opinión libremente.",
  fid_capture:    "Solicita nombre y/o email (ambos opcionales). El cliente puede responder anónimamente.",
  fid_thank_you:  "Pantalla final de agradecimiento. Incluye botón de WhatsApp o CTA opcional.",
};
