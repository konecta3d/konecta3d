// ─── Embudo de lanzamiento — Recorrido del cliente (7 etapas) ─────────────────
// Datos del recorrido completo del negocio cliente, de primer contacto a
// fidelización. Por ahora es el contenido del PROTOTIPO de visualización.
// Cuando se valide el aspecto, se hará editable y se añadirá el tracker por cliente.

export interface FunnelObjective {
  texto: string;     // el objetivo
  mensaje: string;   // el mensaje que se envía para cumplirlo
  check: string;     // qué confirma que está cumplido
}

export interface FunnelPhase {
  nombre: string;
  seccion: string;   // sección de la plataforma donde se configura
  objetivo: string;
  check: string;
  documento: string;
}

export interface FunnelDoc {
  nombre: string;
  estado: "existe" | "por_crear";
}

export interface LaunchStage {
  id: number;
  nombre: string;
  proposito: string;
  color: string;
  objetivos: FunnelObjective[];
  fases?: FunnelPhase[];   // solo el onboarding
  documentos: FunnelDoc[];
}

export const LAUNCH_FUNNEL: LaunchStage[] = [
  {
    id: 1,
    nombre: "Presentación",
    proposito: "Primer contacto: reconectar, despertar interés y recoger datos.",
    color: "#0ea5e9",
    objetivos: [
      {
        texto: "Abrir la conversación y reconectar",
        mensaje: "Hola [nombre], llevo [X meses] sin escribirte. He estado desarrollando algo que potencia el llavero que ya tienes. ¿Te apetece probarlo? Sin compromiso, gratis mientras está en pruebas.",
        check: "El negocio responde mostrando interés",
      },
      {
        texto: "Que entienda qué es y sus beneficios",
        mensaje: "Te lo resumo: una plataforma que convierte tu llavero en un sistema para captar clientes. Aquí lo tienes con más detalle: [landing de información].",
        check: "Ha visto la información o agendó una llamada",
      },
      {
        texto: "Recoger los datos para el alta",
        mensaje: "Para dejarte el acceso listo solo necesito 3 cosas: nombre de tu negocio, tu email y tu teléfono.",
        check: "Tengo nombre de negocio, email y teléfono",
      },
    ],
    documentos: [
      { nombre: "Mensaje de apertura (cliente actual / grupo)", estado: "existe" },
      { nombre: "Landing de información", estado: "por_crear" },
    ],
  },
  {
    id: 2,
    nombre: "Onboarding",
    proposito: "Dejar la plataforma operativa, paso a paso (5 fases). Landing que capta, lista para activar.",
    color: "#38bdf8",
    objetivos: [
      {
        texto: "Completar las 5 fases del onboarding",
        mensaje: "Te guío fase por fase para que dejes tu plataforma lista sin agobios.",
        check: "Las 5 fases completadas y verificadas",
      },
    ],
    fases: [
      { nombre: "Tu identidad", seccion: "Mi Negocio → Perfil", objetivo: "Identidad de marca lista (nombre, logo, slug)", check: "Perfil completo con logo y URL", documento: "PDF de entrada de cliente (existe)" },
      { nombre: "Tus botones de acción", seccion: "Mi Negocio → Herramientas", objetivo: "Integrar sus enlaces (WhatsApp, web, redes, reservas)", check: "Herramientas principales configuradas", documento: "Guía: integrar herramientas (por crear)" },
      { nombre: "Tu página", seccion: "Fidelización → Landing", objetivo: "Página del llavero personalizada y publicada", check: "Landing con su imagen, publicada", documento: "Guía de landing (por crear)" },
      { nombre: "Tu captación", seccion: "Recurso de Valor + Formulario", objetivo: "Que la landing capte contactos, no solo informe", check: "Recurso + formulario activos", documento: "Guía de captación (por crear)" },
      { nombre: "Prueba y validación", seccion: "Revisar todo", objetivo: "Confirmar que funciona antes de activar el llavero", check: "El negocio confirma que su URL funciona entera", documento: "Checklist de validación (por crear)" },
    ],
    documentos: [
      { nombre: "PDF de entrada de cliente", estado: "existe" },
      { nombre: "Guía: integrar herramientas", estado: "por_crear" },
      { nombre: "Guía de landing", estado: "por_crear" },
      { nombre: "Guía de captación", estado: "por_crear" },
      { nombre: "Checklist de validación", estado: "por_crear" },
    ],
  },
  {
    id: 3,
    nombre: "Activación",
    proposito: "Cambiar el link del llavero actual por la URL de la nueva landing.",
    color: "#2dd4bf",
    objetivos: [
      { texto: "Cambiar el link del llavero", mensaje: "Tu plataforma está lista. Ahora hacemos que tu llavero apunte a tu nueva página. Te explico en 2 min, o lo hago yo y te confirmo.", check: "El link del llavero apunta a la nueva landing" },
      { texto: "Verificar el llavero físico", mensaje: "Escanea tu llavero y comprueba que abre tu nueva página. ¿Todo bien?", check: "El llavero abre la landing correcta" },
    ],
    documentos: [
      { nombre: "Guía: cómo cambiar el link de tu llavero", estado: "por_crear" },
    ],
  },
  {
    id: 4,
    nombre: "Uso y resultados",
    proposito: "Que use la plataforma en real y vea sus KPIs. Aquí ocurre el autoconvencimiento.",
    color: "#34d399",
    objetivos: [
      { texto: "Que la use en una situación real", mensaje: "Ya está todo activo. Úsalo en tu local o tu próximo evento. Cada persona que toque el llavero te puede dejar su contacto.", check: "Hay actividad / contactos captados reales" },
      { texto: "Que vea y entienda sus resultados", mensaje: "Entra en tu panel y mira cuántos contactos has captado. ¿Te ayudo a interpretarlo?", check: "Ha revisado su dashboard" },
      { texto: "Que reconozca el valor", mensaje: "¿Qué tal la experiencia? ¿Cuántos contactos conseguiste?", check: "El cliente confirma que le funciona" },
    ],
    documentos: [
      { nombre: "Guía: cómo leer tus resultados", estado: "por_crear" },
      { nombre: "Ideas para sacar más partido", estado: "por_crear" },
    ],
  },
  {
    id: 5,
    nombre: "Expansión",
    proposito: "Que compre un lote de llaveros para su próxima feria. Ingreso principal.",
    color: "#a3e635",
    objetivos: [
      { texto: "Detectar la necesidad", mensaje: "Ya has visto cómo funciona. Para tu próxima feria, ¿cuántos llaveros necesitarías para entregar a los visitantes?", check: "Sé su próxima feria y cuántos llaveros necesita" },
      { texto: "Enviar presupuesto del lote", mensaje: "Te preparo el lote con un extra de unidades de regalo. Aquí tienes el presupuesto.", check: "Presupuesto enviado" },
      { texto: "Cerrar el pedido", mensaje: "¿Lo confirmamos para empezar la fabricación a tiempo para tu feria?", check: "Pedido confirmado y pagado" },
    ],
    documentos: [
      { nombre: "Casos de uso en ferias", estado: "por_crear" },
      { nombre: "Info de llaveros y lotes", estado: "por_crear" },
    ],
  },
  {
    id: 6,
    nombre: "Conversión a pago",
    proposito: "Pasar del MVP gratis a la suscripción de la plataforma.",
    color: "#facc15",
    objetivos: [
      { texto: "Presentar la oferta", mensaje: "Has estado usando la plataforma en prueba. Ya está lista su versión completa. Te explico cómo queda y el precio.", check: "Oferta enviada" },
      { texto: "Resolver dudas y objeciones", mensaje: "¿Qué te frena? Lo vemos juntos.", check: "Dudas resueltas" },
      { texto: "Cerrar la suscripción", mensaje: "¿Lo activamos en su versión completa?", check: "Cliente con suscripción activa" },
    ],
    documentos: [
      { nombre: "Oferta de la plataforma", estado: "por_crear" },
      { nombre: "Comparativa de valor (antes/después)", estado: "por_crear" },
    ],
  },
  {
    id: 7,
    nombre: "Fidelización",
    proposito: "Retener, dar soporte, conseguir referidos y recurrencia.",
    color: "#8b5cf6",
    objetivos: [
      { texto: "Mantener contacto y soporte", mensaje: "¿Cómo va todo? ¿Necesitas algo?", check: "Contacto periódico activo" },
      { texto: "Conseguir referidos", mensaje: "¿Conoces a alguien más que vaya a ferias con quien merezca la pena hablar? Con tu nombre le contacto.", check: "Al menos un referido pedido" },
      { texto: "Recurrencia", mensaje: "¿Tienes feria próxima? ¿Necesitas más llaveros?", check: "Segundo pedido o renovación" },
    ],
    documentos: [
      { nombre: "Novedades / mejoras", estado: "por_crear" },
      { nombre: "Programa de referidos", estado: "por_crear" },
    ],
  },
];
