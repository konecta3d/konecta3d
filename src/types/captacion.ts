// ============================================================
// TIPOS — Perfil de Captación
// ============================================================

export type BlockType =
  | 'welcome'
  | 'segmentation'
  | 'questions'
  | 'capture'
  | 'final_message'
  | 'thank_you';

// ── Config por tipo de bloque ────────────────────────────────

export interface WelcomeConfig {
  logo_type: 'business' | 'custom';
  logo_url?: string;
  title: string;
  subtitle: string;
  bg_color: string;
  text_color: string;
}

export interface SegmentOption {
  id: string;
  title: string;
  description: string;
}

export interface SegmentationConfig {
  options: SegmentOption[];
}

export type QuestionType = 'yes_no' | 'multiple_choice' | 'scale';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[]; // para multiple_choice
  segment_ids?: string[]; // vacío = aplica a todos los segmentos
}

export interface QuestionsConfig {
  questions: Question[];
}

export interface CaptureField {
  name: string;
  label: string;
  required: boolean;
  enabled: boolean;
  type?: 'text' | 'tel' | 'email';
}

export interface CaptureConfig {
  fields: CaptureField[];
  cta_text?: string;
}

export interface FinalMessageConfig {
  title: string;
  text: string;
  cta_text: string;
  lead_magnet_by_segment: Record<string, string>; // { default: id, seg_id: id }
}

export interface ThankYouConfig {
  title: string;
  message: string;
  next_steps: string[];
  // Botón CTA opcional (web, Instagram, etc.)
  cta_text?: string;
  cta_url?: string;
  // Botón WhatsApp opcional
  whatsapp_phone?: string;
  whatsapp_text?: string;
}

export type BlockConfig =
  | WelcomeConfig
  | SegmentationConfig
  | QuestionsConfig
  | CaptureConfig
  | FinalMessageConfig
  | ThankYouConfig;

export interface FormBlock {
  id: string;
  type: BlockType;
  order: number;
  config: BlockConfig;
}

// ── Diseño global del formulario ─────────────────────────────

export interface FormDesign {
  bg_color: string;      // Fondo de todos los pasos
  text_color: string;    // Texto principal
  accent_color: string;  // Botones, selecciones activas
  border_color: string;  // Bordes de inputs y tarjetas
  font_family: string;   // 'Inter' | 'Poppins' | 'Lora' | 'Montserrat'
  // Logo
  logo_url: string;                      // vacío = sin logo
  logo_shape: 'round' | 'square' | 'rect';
  logo_size: number;                     // px
}

export const DEFAULT_DESIGN: FormDesign = {
  bg_color: "#0a323c",
  text_color: "#ffffff",
  accent_color: "#ffb400",
  border_color: "rgba(255,255,255,0.2)",
  font_family: "Inter",
  logo_url: "",
  logo_shape: "round",
  logo_size: 72,
};

// ── Entidades principales ────────────────────────────────────

export interface CaptacionForm {
  id: string;
  business_id: string;
  name: string;
  objective: 'quick' | 'diagnostic' | 'full';
  status: 'draft' | 'published';
  blocks: FormBlock[];
  design?: FormDesign | null;
  created_at: string;
  updated_at: string;
}

export interface CaptacionLeadMagnet {
  id: string;
  business_id: string;
  name: string;
  type: 'pdf' | 'url';
  file_url?: string;
  external_url?: string;
  code_value?: string;
  title?: string;
  description?: string;
  cta_text: string;
  status: 'active' | 'draft' | 'archived';
  content?: Record<string, unknown> | null;
  delivered_count: number;
  created_at: string;
  updated_at: string;
}

export interface CaptacionCampaign {
  id: string;
  business_id: string;
  name: string;
  type: 'event' | 'permanent';
  status: 'draft' | 'active' | 'finished';
  starts_at?: string;
  ends_at?: string;
  target_client?: string;
  objective?: string;
  form_id?: string;
  lead_magnet_id?: string;
  keychains_distributed: number;
  slug: string;
  created_at: string;
  updated_at: string;
  // joins opcionales
  captacion_forms?: Pick<CaptacionForm, 'id' | 'name'>;
  captacion_lead_magnets?: Pick<CaptacionLeadMagnet, 'id' | 'name'>;
}

export type LeadFunnelStep = 'submitted' | 'lm_downloaded';
export type LeadLmStatus  = 'pending'   | 'downloaded';

export interface CaptacionLead {
  id: string;
  business_id: string;
  campaign_id: string | null;
  name?: string;
  phone?: string;
  email?: string;
  company?: string;
  position?: string;
  segment?: string;
  quiz_answers: Record<string, string>;
  lead_magnet_id?: string;
  lead_magnet_delivered: boolean;
  lead_magnet_delivered_at?: string;
  /** Estado del lead magnet: pending = formulario enviado pero sin descargar */
  lm_status: LeadLmStatus;
  /** Paso del embudo alcanzado */
  funnel_step: LeadFunnelStep;
  status: 'new' | 'contacted' | 'active' | 'discarded';
  notes?: string;
  migrated_to_fidelizacion: boolean;
  migrated_at?: string;
  created_at: string;
  // joins
  captacion_campaigns?: Pick<CaptacionCampaign, 'id' | 'name'>;
}

// ── Defaults ─────────────────────────────────────────────────

export const DEFAULT_WELCOME_CONFIG: WelcomeConfig = {
  logo_type: 'business',
  title: 'Descubre tu ruta de crecimiento',
  subtitle: 'En 4 preguntas sabrás qué necesita tu negocio',
  bg_color: '#0a323c',
  text_color: '#ffffff',
};

export const DEFAULT_BLOCKS: Record<string, FormBlock[]> = {
  quick: [
    { id: 'b1', type: 'welcome', order: 1, config: DEFAULT_WELCOME_CONFIG },
    { id: 'b2', type: 'capture', order: 2, config: { fields: DEFAULT_CAPTURE_FIELDS() } },
    { id: 'b3', type: 'thank_you', order: 3, config: { title: '¡Gracias!', message: 'En breve nos ponemos en contacto contigo.', next_steps: [] } },
  ],
  diagnostic: [
    { id: 'b1', type: 'welcome', order: 1, config: DEFAULT_WELCOME_CONFIG },
    { id: 'b2', type: 'segmentation', order: 2, config: { options: [{ id: 's1', title: 'Captación', description: 'Quiero conseguir más clientes nuevos' }, { id: 's2', title: 'Fidelización', description: 'Quiero que mis clientes vuelvan más' }] } },
    { id: 'b3', type: 'questions', order: 3, config: { questions: [] } },
    { id: 'b4', type: 'capture', order: 4, config: { fields: DEFAULT_CAPTURE_FIELDS() } },
    { id: 'b5', type: 'final_message', order: 5, config: { title: '¡Tu recurso está listo!', text: 'Descárgalo ahora y empieza a aplicarlo hoy mismo.', cta_text: 'Descargar gratis', lead_magnet_by_segment: {} } },
    { id: 'b6', type: 'thank_you', order: 6, config: { title: '¡Ya estás dentro!', message: 'Bienvenido. A partir de ahora esto es el comienzo de algo mejor.', next_steps: ['Guarda nuestro contacto en tu móvil', 'Aplica lo que hay en la guía esta semana'] } },
  ],
  full: [
    { id: 'b1', type: 'welcome', order: 1, config: DEFAULT_WELCOME_CONFIG },
    { id: 'b2', type: 'segmentation', order: 2, config: { options: [{ id: 's1', title: 'Captación', description: 'Quiero conseguir más clientes nuevos' }, { id: 's2', title: 'Fidelización', description: 'Quiero que mis clientes vuelvan más' }] } },
    { id: 'b3', type: 'questions', order: 3, config: { questions: [] } },
    { id: 'b4', type: 'capture', order: 4, config: { fields: DEFAULT_CAPTURE_FIELDS() } },
    { id: 'b5', type: 'final_message', order: 5, config: { title: '¡Tu recurso está listo!', text: 'Descárgalo ahora y empieza a aplicarlo hoy mismo.', cta_text: 'Descargar gratis', lead_magnet_by_segment: {} } },
    { id: 'b6', type: 'thank_you', order: 6, config: { title: '¡Ya estás dentro!', message: 'Bienvenido. A partir de ahora esto es el comienzo de algo mejor.', next_steps: ['Guarda nuestro contacto en tu móvil', 'Aplica lo que hay en la guía esta semana'] } },
  ],
};

export function DEFAULT_CAPTURE_FIELDS(): CaptureField[] {
  return [
    { name: 'name', label: 'Nombre completo', required: false, enabled: true, type: 'text' },
    { name: 'phone', label: 'WhatsApp', required: true, enabled: true, type: 'tel' },
    { name: 'email', label: 'Email', required: false, enabled: false, type: 'email' },
    { name: 'company', label: 'Empresa', required: false, enabled: false, type: 'text' },
    { name: 'position', label: 'Puesto', required: false, enabled: false, type: 'text' },
  ];
}

export const BLOCK_LABELS: Record<BlockType, string> = {
  welcome: 'Bienvenida',
  segmentation: 'Segmentación',
  questions: 'Preguntas',
  capture: 'Captura de datos',
  final_message: 'Mensaje final',
  thank_you: 'Página de Gracias',
};

export const BLOCK_OBJECTIVES: Record<BlockType, string> = {
  welcome: 'Es lo primero que ve tu cliente. Define el contexto y genera confianza en 3 segundos.',
  segmentation: 'Segmentar te permite entregar el recurso correcto a cada perfil y calificar mejor al lead.',
  questions: 'Las preguntas califican al lead y personalizan la entrega del recurso.',
  capture: 'Pide solo lo que vas a usar. Más campos = menos conversión.',
  final_message: 'Este bloque convierte al lead. El CTA debe centrarse en lo que el cliente gana.',
  thank_you: 'Esta pantalla define si el cliente entiende que empieza algo, o que terminó algo.',
};
