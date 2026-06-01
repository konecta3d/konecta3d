// ─── Playbook operativo de Konecta3D ──────────────────────────────────────────
// El manual de operaciones comercial. Define el flujo completo paso a paso
// para que cualquier persona del equipo (Miguel o Miriam) ejecute los procesos
// sin tener que inventar nada. Estable por diseño — el flujo no cambia a diario.
// Los textos concretos (guiones, emails) viven en el módulo Recursos.

export type Quien = "Miguel" | "Miriam" | "Ambos" | "Automático";

export interface PlaybookStep {
  n: number;
  titulo: string;
  quien: Quien;
  que: string;          // qué hacer, en una frase
  como?: string;        // detalle / cómo hacerlo
  recurso?: string;     // recurso/guión relacionado (nombre, buscar en Recursos)
  resultado: string;    // qué se consigue
}

export interface PlaybookProcess {
  id: string;           // P1 … P6
  nombre: string;
  objetivo: string;
  trigger: string;      // qué dispara este proceso
  output: string;       // qué produce
  color: string;
  pasos: PlaybookStep[];
  kpis: { label: string; objetivo: string }[];
}

// ─── El cliente ideal (recordatorio en cabecera) ──────────────────────────────

export const CLIENTE_IDEAL = {
  nombre: "El Expositor",
  resumen: "Negocio que va a ferias y eventos a captar clientes pero no tiene sistema: reparte tarjetas, pone QRs y espera que el cliente vuelva. Compra lotes grandes de llaveros.",
  dolorClave: "Habla con cientos de personas en una feria y vuelve a casa con 30 tarjetas. El 80% de los contactos se pierde.",
  señales: [
    "Va a ferias o eventos más de 2 veces al año",
    "Capta el contacto en papel / QR básico / nada estructurado",
    "Tiene equipo o varios comerciales",
    "Tiene una feria próxima en mente",
  ],
};

// ─── Guía de uso (para Miriam) ────────────────────────────────────────────────

export const COMO_USAR = [
  "Cada lead pasa por estas 6 fases en orden. No todos llegan al final — algunos se quedan o se pierden, y está bien.",
  "Mira en qué fase está el lead en el Pipeline. Esa fase te dice qué proceso de este Playbook aplicar.",
  "Cada paso indica QUIÉN lo hace, QUÉ hacer y QUÉ guión usar. El guión completo está en la sección Recursos.",
  "Después de cada contacto con un lead: registra la actividad y pon la próxima acción con fecha. Esa es la regla de oro.",
  "Si tienes dudas sobre un lead concreto, mira su ficha: ahí está todo su historial y lo que se acordó.",
];

// ─── Los 6 procesos ───────────────────────────────────────────────────────────

export const PROCESSES: PlaybookProcess[] = [
  {
    id: "P1",
    nombre: "Atracción",
    objetivo: "Que el cliente ideal empiece a vernos y se sienta identificado, sin venderle nada todavía.",
    trigger: "Publicación de contenido / búsqueda activa de prospectos",
    output: "Prospectos que nos conocen y empiezan a interactuar",
    color: "#94a3b8",
    pasos: [
      {
        n: 1, titulo: "Publicar contenido de dolor", quien: "Miriam",
        que: "Publicar en Instagram y LinkedIn contenido que nombra el dolor exacto del Expositor.",
        como: "3 posts/semana en IG (dolor, contraste, prueba social), 2 en LinkedIn (análisis, caso de uso).",
        recurso: "Copy redes — calendario semanal",
        resultado: "El cliente ideal nos descubre y se siente visto.",
      },
      {
        n: 2, titulo: "Outreach directo en LinkedIn", quien: "Miriam",
        que: "Enviar 5 DMs al día a perfiles de expositores cualificados.",
        como: "Mensaje en 3 partes: contexto → pregunta de diagnóstico → ofrenda del lead magnet. Sin vender.",
        recurso: "Guión DM outreach LinkedIn",
        resultado: "Conversaciones iniciadas con leads cualificados.",
      },
      {
        n: 3, titulo: "Responder e interactuar", quien: "Ambos",
        que: "Responder comentarios y DMs, interactuar en posts de comunidades feriantes.",
        resultado: "Visibilidad y confianza en el sector.",
      },
    ],
    kpis: [
      { label: "Nuevos seguidores ICP/semana", objetivo: "20-30" },
      { label: "Clicks al lead magnet/semana", objetivo: "15-25" },
      { label: "Tasa de respuesta a DMs", objetivo: ">30%" },
    ],
  },
  {
    id: "P2",
    nombre: "Captación",
    objetivo: "Que el prospecto entre en nuestro sistema dejándonos su contacto a cambio del lead magnet.",
    trigger: "Click en el enlace del lead magnet",
    output: "Lead con datos de contacto en el CRM",
    color: "#60a5fa",
    pasos: [
      {
        n: 1, titulo: "Entregar el lead magnet", quien: "Automático",
        que: "El prospecto llega a la landing del lead magnet y deja nombre, email, empresa y próxima feria.",
        como: "Landing con un solo objetivo: descargar la guía. Sin distracciones.",
        recurso: "Lead magnet — La guía de captación en ferias",
        resultado: "Lead capturado automáticamente.",
      },
      {
        n: 2, titulo: "Crear el lead en el CRM", quien: "Miriam",
        que: "Dar de alta el lead en el Pipeline (etapa Lead frío) con sus datos.",
        como: "Si llega por formulario, revisar y completar. Asignar a Miguel o Miriam.",
        resultado: "Lead visible en el pipeline, listo para cualificar.",
      },
      {
        n: 3, titulo: "Secuencia de emails automática", quien: "Automático",
        que: "El lead recibe 3 emails: entrega del PDF (0min), recordatorio (48h), CTA a llamada (5 días).",
        recurso: "Emails — Secuencia post lead magnet",
        resultado: "El lead se calienta solo mientras tanto.",
      },
    ],
    kpis: [
      { label: "Conversión de la landing", objetivo: ">25%" },
      { label: "Leads capturados/semana", objetivo: "5-10" },
      { label: "Apertura email #1", objetivo: ">70%" },
    ],
  },
  {
    id: "P3",
    nombre: "Cualificación",
    objetivo: "Saber si el lead es nuestro cliente ideal y derivarlo al canal correcto.",
    trigger: "Lead capturado / formulario de cualificación completado",
    output: "Lead clasificado (Perfil A/B/C/D) y derivado",
    color: "#38bdf8",
    pasos: [
      {
        n: 1, titulo: "Aplicar el formulario de cualificación", quien: "Ambos",
        que: "5 preguntas que dan un score de 0 a 25 puntos.",
        como: "Ferias/año, gente en el stand, cómo captan ahora, próxima feria, unidades estimadas.",
        recurso: "Formulario de cualificación (5 preguntas + scoring)",
        resultado: "Score numérico del lead.",
      },
      {
        n: 2, titulo: "Asignar perfil según score", quien: "Ambos",
        que: "Clasificar el lead y poner el perfil en su ficha.",
        como: "18-25 → Perfil A (ideal). 10-17 → Perfil B. 0-9 → Perfil C/D.",
        resultado: "Lead con perfil asignado en el pipeline.",
      },
      {
        n: 3, titulo: "Derivar al canal correcto", quien: "Ambos",
        que: "Según el perfil, derivar a llamada (A), WhatsApp (B) o nurture (C/D).",
        como: "Perfil A → agendar llamada de diagnóstico. Perfil B → WhatsApp. Perfil C/D → enviar los 10 consejos y secuencia a 30 días.",
        recurso: "Guión WhatsApp Perfil B · 10 consejos Perfil C/D",
        resultado: "Lead en el canal adecuado, sin perder tiempo en quien no encaja.",
      },
    ],
    kpis: [
      { label: "% Perfil A del total", objetivo: ">30%" },
      { label: "% Perfil A que agenda llamada", objetivo: ">40%" },
    ],
  },
  {
    id: "P4",
    nombre: "Venta",
    objetivo: "Diagnosticar, demostrar el valor y cerrar con una propuesta concreta.",
    trigger: "Llamada agendada o WhatsApp iniciado",
    output: "Propuesta enviada y decisión activada",
    color: "#a3e635",
    pasos: [
      {
        n: 1, titulo: "Llamada de diagnóstico (20-30 min)", quien: "Miguel",
        que: "Diagnosticar la situación del lead con preguntas estratégicas antes de proponer nada.",
        como: "Contexto (3min) → diagnóstico con las preguntas (9min) → demo personalizada (6min) → propuesta conceptual + fecha límite (7min) → siguiente paso concreto.",
        recurso: "Guión diagnóstico — llamada 20 min",
        resultado: "El lead siente que entendemos su problema. Sabemos qué proponerle.",
      },
      {
        n: 2, titulo: "Enviar la propuesta", quien: "Miguel",
        que: "Propuesta personalizada el mismo día de la llamada.",
        como: "PDF con su nombre, sector, próxima feria y el lote recomendado (con extra de unidades, sin descuento monetario).",
        recurso: "Plantillas de propuesta por lote",
        resultado: "El lead tiene precio, lote y fecha límite en mano.",
      },
      {
        n: 3, titulo: "Gestionar objeciones", quien: "Miguel",
        que: "Resolver las dudas que frenan la decisión.",
        como: "\"Es caro\" → ¿cuánto invertís en el stand? · \"Lo consulto\" → ¿puedo estar en esa conversación? · \"No es el momento\" → ¿cuándo es tu próxima feria?",
        recurso: "Guión gestión de objeciones",
        resultado: "Objeción resuelta o lead aparcado con motivo registrado.",
      },
      {
        n: 4, titulo: "Seguimiento y cierre", quien: "Ambos",
        que: "Follow-up a 48h y cierre con la urgencia natural de su feria.",
        como: "\"Para tener los llaveros antes de [fecha de feria] necesito confirmación antes de [fecha límite]\".",
        resultado: "Venta cerrada (Ganado) o lead a reactivación.",
      },
    ],
    kpis: [
      { label: "Llamadas que terminan con propuesta", objetivo: ">80%" },
      { label: "Tasa de cierre propuesta → venta", objetivo: ">35%" },
      { label: "Tiempo desde llamada hasta cierre", objetivo: "<7 días" },
    ],
  },
  {
    id: "P5",
    nombre: "Post-venta y referido",
    objetivo: "Cliente activo, primera feria con resultados y referido activado.",
    trigger: "Pago confirmado",
    output: "Cliente usando la plataforma + resultado medible + referido",
    color: "#22c55e",
    pasos: [
      {
        n: 1, titulo: "Convertir en negocio y onboarding", quien: "Miguel",
        que: "Crear el negocio en la plataforma y configurarlo antes de la feria.",
        como: "Botón \"Convertir en negocio\" en la ficha del lead. Luego setup de landing, formulario y campaña. Enviar llaveros.",
        recurso: "Checklist de onboarding",
        resultado: "Cliente listo para captar en su feria.",
      },
      {
        n: 2, titulo: "Check-in pre-feria", quien: "Miriam",
        que: "48h antes del evento, confirmar que todo funciona.",
        recurso: "Mensaje check-in pre-feria",
        resultado: "Cliente seguro y sin dudas de última hora.",
      },
      {
        n: 3, titulo: "Revisión post-feria (el momento clave)", quien: "Miguel",
        que: "El lunes después de la feria, revisar resultados juntos.",
        como: "\"¿Cuántos leads captasteis?\" Revisar el dashboard. Si los datos son buenos → pedir caso de uso.",
        resultado: "Cliente con datos que demuestran el valor. Máxima satisfacción.",
      },
      {
        n: 4, titulo: "Pedir referido", quien: "Ambos",
        que: "Tras la primera feria exitosa, pedir que nos presente a otro expositor.",
        como: "\"¿Conoces a alguien más que vaya a ferias con quien merezca la pena hablar? Con tu nombre le contactaré.\"",
        resultado: "Nuevo prospecto cualificado que entra por P1.",
      },
    ],
    kpis: [
      { label: "NPS post-primera feria", objetivo: ">8" },
      { label: "% clientes que generan referido", objetivo: ">40%" },
      { label: "Churn a 90 días", objetivo: "<5%" },
    ],
  },
  {
    id: "P6",
    nombre: "Reactivación",
    objetivo: "Recuperar leads que no cerraron, o descartarlos limpiamente.",
    trigger: "Lead sin actividad 30-60 días",
    output: "Lead reactivado o archivado con feedback",
    color: "#f97316",
    pasos: [
      {
        n: 1, titulo: "Toque de valor (día 0)", quien: "Miriam",
        que: "Reactivar con algo útil, sin mencionar la venta.",
        como: "\"He creado un caso de uso de [sector] que creo que te puede interesar. ¿Te lo mando?\"",
        recurso: "Guión reactivación — 3 toques",
        resultado: "Conversación reabierta.",
      },
      {
        n: 2, titulo: "Toque de contexto (día 7)", quien: "Miriam",
        que: "Conectar con su próxima feria.",
        como: "\"¿Tienes alguna feria próximamente? Si es en los próximos 3 meses, merece la pena que hablemos 15 minutos.\"",
        resultado: "Lead recualificado o confirmado como no-ahora.",
      },
      {
        n: 3, titulo: "Toque de cierre (día 14)", quien: "Miriam",
        que: "Cerrar con elegancia y pedir feedback.",
        como: "\"Voy a dejarte tranquilo. ¿Puedo preguntarte por qué no avanzó? Me ayuda a mejorar.\"",
        resultado: "Feedback valioso. Lead archivado o reactivado.",
      },
    ],
    kpis: [
      { label: "% leads reactivados", objetivo: ">15%" },
      { label: "% que dan feedback", objetivo: ">40%" },
    ],
  },
];

export const QUIEN_COLOR: Record<Quien, string> = {
  Miguel:     "#0ea5e9",
  Miriam:     "#a78bfa",
  Ambos:      "#22c55e",
  Automático: "#94a3b8",
};
