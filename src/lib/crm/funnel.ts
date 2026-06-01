// ─── Embudo / Funnel comercial de Konecta3D ───────────────────────────────────
// El flujo completo por fases, editable desde /admin/crm/embudo
// (guardado en settings → crm_funnel). Cada fase tiene DOS carriles:
// lo que hace Konecta (Miguel/Miriam) y lo que vive el cliente.
// Más los documentos asociados a cada fase con su estado.

export type DocEstado = "pendiente" | "proceso" | "listo";
export type DocDonde = "plataforma" | "chat" | "externo";

export interface FunnelDoc {
  nombre: string;
  tipo: string;        // PDF, Landing, Formulario, Email, Guión, Carta, Copy
  donde: DocDonde;     // dónde se crea
  estado: DocEstado;
}

export interface KonectaAction {
  texto: string;
  quien: string;       // Miguel / Miriam / Ambos / Automático
}

export interface FunnelPhase {
  id: string;
  nombre: string;
  objetivo: string;
  color: string;
  accionesKonecta: KonectaAction[];
  recorridoCliente: string[];   // qué hace / ve / siente el cliente
  documentos: FunnelDoc[];
}

export interface Funnel {
  fases: FunnelPhase[];
}

export const ESTADO_INFO: Record<DocEstado, { label: string; color: string }> = {
  pendiente: { label: "Pendiente", color: "#94a3b8" },
  proceso:   { label: "En proceso", color: "#facc15" },
  listo:     { label: "Listo",      color: "#22c55e" },
};

export const DONDE_LABEL: Record<DocDonde, string> = {
  plataforma: "Con la plataforma",
  chat:       "Desde el chat IA",
  externo:    "Externo",
};

export const DEFAULT_FUNNEL: Funnel = {
  fases: [
    {
      id: "P1",
      nombre: "Atracción",
      objetivo: "Que el cliente ideal nos descubra y se sienta identificado, sin venderle nada.",
      color: "#94a3b8",
      accionesKonecta: [
        { texto: "Publicar 3 posts/semana en Instagram (dolor, contraste, prueba social).", quien: "Miriam" },
        { texto: "Publicar 2 posts/semana en LinkedIn (análisis, caso de uso).", quien: "Miriam" },
        { texto: "Enviar 5 DMs/día a expositores cualificados en LinkedIn.", quien: "Miriam" },
        { texto: "Responder comentarios e interactuar en comunidades feriantes.", quien: "Ambos" },
      ],
      recorridoCliente: [
        "Ve un contenido que describe exactamente su problema en una feria.",
        "Se siente identificado: «esto me pasa a mí».",
        "Empieza a seguir la cuenta o guarda el post.",
      ],
      documentos: [
        { nombre: "Calendario de contenido (4 semanas)", tipo: "Copy", donde: "chat", estado: "pendiente" },
        { nombre: "Guión DM outreach LinkedIn", tipo: "Guión", donde: "chat", estado: "pendiente" },
      ],
    },
    {
      id: "P2",
      nombre: "Captación",
      objetivo: "Que el prospecto entre en el sistema dejando su contacto a cambio del lead magnet.",
      color: "#60a5fa",
      accionesKonecta: [
        { texto: "Publicar la landing del lead magnet y el enlace en bio.", quien: "Miguel" },
        { texto: "Dar de alta el lead en el Pipeline (Lead frío) al recibir el contacto.", quien: "Miriam" },
        { texto: "Activar la secuencia de 3 emails post-descarga.", quien: "Automático" },
      ],
      recorridoCliente: [
        "Hace clic en el enlace del lead magnet.",
        "Llega a una landing clara con un solo objetivo.",
        "Deja nombre, email y su próxima feria para descargar la guía.",
        "Recibe el PDF al instante y empieza a leerlo.",
      ],
      documentos: [
        { nombre: "Lead magnet — De 30 a 200 leads en ferias", tipo: "PDF", donde: "plataforma", estado: "pendiente" },
        { nombre: "Landing del lead magnet", tipo: "Landing", donde: "plataforma", estado: "pendiente" },
        { nombre: "Secuencia 3 emails post-descarga", tipo: "Email", donde: "chat", estado: "pendiente" },
      ],
    },
    {
      id: "P3",
      nombre: "Cualificación",
      objetivo: "Saber si el lead es nuestro cliente ideal y derivarlo al canal correcto.",
      color: "#38bdf8",
      accionesKonecta: [
        { texto: "Aplicar el formulario de cualificación (5 preguntas, score 0-25).", quien: "Ambos" },
        { texto: "Asignar perfil A/B/C/D según el score en la ficha del lead.", quien: "Ambos" },
        { texto: "Derivar: A → llamada, B → WhatsApp, C/D → nurture con los 10 consejos.", quien: "Ambos" },
      ],
      recorridoCliente: [
        "Responde 5 preguntas rápidas sobre su situación.",
        "Recibe una respuesta acorde a su perfil (llamada, WhatsApp o consejos).",
        "Siente que le hablan a su caso concreto, no de forma genérica.",
      ],
      documentos: [
        { nombre: "Formulario de cualificación (5 preguntas + scoring)", tipo: "Formulario", donde: "plataforma", estado: "pendiente" },
        { nombre: "10 consejos para Perfil C/D", tipo: "Guión", donde: "chat", estado: "pendiente" },
      ],
    },
    {
      id: "P4",
      nombre: "Venta",
      objetivo: "Diagnosticar, demostrar el valor y cerrar con una propuesta concreta.",
      color: "#a3e635",
      accionesKonecta: [
        { texto: "Llamada de diagnóstico de 20-30 min con preguntas estratégicas.", quien: "Miguel" },
        { texto: "Enviar la propuesta personalizada el mismo día de la llamada.", quien: "Miguel" },
        { texto: "Gestionar objeciones con el guión.", quien: "Miguel" },
        { texto: "Follow-up a 48h y cierre con la urgencia de su feria.", quien: "Ambos" },
      ],
      recorridoCliente: [
        "Habla con Miguel y siente que entienden su problema.",
        "Ve una demo aplicada a su caso concreto.",
        "Recibe una propuesta con precio, lote y fecha límite.",
        "Decide con la urgencia natural de su próxima feria.",
      ],
      documentos: [
        { nombre: "Carta de venta", tipo: "Carta", donde: "chat", estado: "pendiente" },
        { nombre: "Guión diagnóstico — llamada 20 min", tipo: "Guión", donde: "chat", estado: "pendiente" },
        { nombre: "Plantillas de propuesta por lote", tipo: "PDF", donde: "chat", estado: "pendiente" },
        { nombre: "Guión gestión de objeciones", tipo: "Guión", donde: "chat", estado: "pendiente" },
      ],
    },
    {
      id: "P5",
      nombre: "Post-venta y referido",
      objetivo: "Cliente activo, primera feria con resultados y referido activado.",
      color: "#22c55e",
      accionesKonecta: [
        { texto: "Convertir el lead en negocio y configurar la plataforma antes de la feria.", quien: "Miguel" },
        { texto: "Check-in 48h antes del evento.", quien: "Miriam" },
        { texto: "Revisión de resultados el lunes post-feria (el momento clave).", quien: "Miguel" },
        { texto: "Pedir referido tras la primera feria exitosa.", quien: "Ambos" },
      ],
      recorridoCliente: [
        "Recibe su acceso y sus llaveros configurados.",
        "Usa el sistema en su feria y capta contactos automáticamente.",
        "Ve sus resultados en el dashboard el lunes siguiente.",
        "Recomienda Konecta a otro expositor de su sector.",
      ],
      documentos: [
        { nombre: "Documento de bienvenida / onboarding", tipo: "PDF", donde: "plataforma", estado: "listo" },
        { nombre: "Checklist de onboarding", tipo: "Guión", donde: "chat", estado: "pendiente" },
        { nombre: "Mensaje check-in pre-feria", tipo: "Email", donde: "chat", estado: "pendiente" },
      ],
    },
    {
      id: "P6",
      nombre: "Reactivación",
      objetivo: "Recuperar leads que no cerraron, o descartarlos limpiamente con feedback.",
      color: "#f97316",
      accionesKonecta: [
        { texto: "Toque de valor (día 0): enviar un caso de uso sin mencionar la venta.", quien: "Miriam" },
        { texto: "Toque de contexto (día 7): conectar con su próxima feria.", quien: "Miriam" },
        { texto: "Toque de cierre (día 14): pedir feedback de por qué no avanzó.", quien: "Miriam" },
      ],
      recorridoCliente: [
        "Recibe algo de valor que reabre la conversación.",
        "Reconsidera si tiene una feria próxima.",
        "Decide retomar o explica por qué no, dejando feedback útil.",
      ],
      documentos: [
        { nombre: "Guión reactivación — 3 toques", tipo: "Guión", donde: "chat", estado: "pendiente" },
      ],
    },
  ],
};

export const QUIEN_COLOR: Record<string, string> = {
  Miguel:     "#0ea5e9",
  Miriam:     "#a78bfa",
  Ambos:      "#22c55e",
  Automático: "#94a3b8",
};

export const QUIEN_OPCIONES = ["Miguel", "Miriam", "Ambos", "Automático"];
export const DOC_TIPOS = ["PDF", "Landing", "Formulario", "Email", "Guión", "Carta", "Copy"];
