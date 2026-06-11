// ─── Embudo de lanzamiento — Recorrido del cliente (7 etapas) ─────────────────
// Estructura editable: cada etapa tiene Objetivos, Mensajes (varios por objetivo)
// y Documentos, todos editables. Los mensajes se vinculan opcionalmente a un
// objetivo (objetivoId). Datos por defecto; el contenido real se guarda en
// settings (crm_launch_funnel) y es editable desde la UI.

export interface FunnelObjective {
  id: string;
  titulo: string;
  check: string;
}

export interface FunnelMessage {
  id: string;
  titulo: string;
  contenido: string;
  objetivoId?: string; // a qué objetivo pertenece (opcional)
}

export interface FunnelDoc {
  id: string;
  nombre: string;
  estado: "existe" | "por_crear";
}

export interface FunnelPhase {
  id: string;
  nombre: string;
  seccion: string;
  objetivo: string;
  check: string;
  documento: string;
}

export interface LaunchStage {
  id: number;
  nombre: string;
  proposito: string;
  color: string;
  objetivos: FunnelObjective[];
  mensajes: FunnelMessage[];
  documentos: FunnelDoc[];
  tiposInsight: string[];   // categorías de info a recoger relevantes en esta etapa
  fases?: FunnelPhase[];
}

export interface LaunchFunnel {
  stages: LaunchStage[];
}

// Catálogo completo de tipos de información a recoger del cliente
export const TIPOS_INSIGHT = [
  "Objeción", "Motivación de compra", "Señal de compra", "Sensibilidad al precio",
  "Competencia/alternativa", "Necesidad detectada", "Deseo", "Problema/dolor",
  "Contexto del negocio", "Urgencia/plazos", "Feedback de producto",
  "Petición de función", "Punto de fricción", "Bug/problema técnico",
  "Pregunta frecuente", "Caso de uso", "Resultado/logro", "Referido potencial",
  "Riesgo de abandono", "Elogio/satisfacción",
];

export const DEFAULT_LAUNCH_FUNNEL: LaunchFunnel = {
  stages: [
    {
      id: 1, nombre: "Presentación",
      proposito: "Primer contacto: reconectar, despertar interés y recoger datos.",
      color: "#0ea5e9",
      tiposInsight: ["Objeción", "Contexto del negocio", "Urgencia/plazos", "Necesidad detectada", "Motivación de compra"],
      objetivos: [
        { id: "e1o1", titulo: "Abrir la conversación y reconectar", check: "El negocio responde mostrando interés" },
        { id: "e1o2", titulo: "Que entienda qué es y sus beneficios", check: "Ha visto la información o agendó una llamada" },
        { id: "e1o3", titulo: "Recoger los datos para el alta", check: "Tengo nombre de negocio, email y teléfono" },
      ],
      mensajes: [
        { id: "e1m1", titulo: "Apertura — cliente actual", objetivoId: "e1o1", contenido: "Buenos días [nombre], llevo [X meses] sin escribirte. He lanzado una plataforma que potencia el llavero que tienes: personalizas lo que aparece al escanearlo y captas contactos de forma automática. El primer mes es gratis, sin permanencia, y luego son 99 €/mes. ¿Lo vemos el martes a las 10 o el miércoles a las 12, 15 minutos? — Equipo Konecta3D" },
        { id: "e1m2", titulo: "Apertura — grupo de WhatsApp", objetivoId: "e1o1", contenido: "Buenos días. Algunos me conocéis de los llaveros NFC de Konecta3D. He lanzado una plataforma que convierte el llavero en un sistema para captar clientes en ferias y eventos. He preparado una guía gratuita: «Los 10 fallos que te hacen perder clientes en las ferias». Escribidme por privado y os la paso. — Miguel, Konecta3D" },
        { id: "e1m3", titulo: "Explicación + info", objetivoId: "e1o2", contenido: "Te lo resumo: una plataforma que convierte tu llavero en un sistema para captar clientes. Cada persona que lo toca te puede dejar su contacto. Aquí tienes más detalle: [landing de información]. ¿Lo vemos el martes a las 10 o el miércoles a las 12, 15 minutos? Si prefieres explorar primero solo, te dejo el acceso y luego hablamos. — Equipo Konecta3D" },
        { id: "e1m4", titulo: "Petición de datos", objetivoId: "e1o3", contenido: "Para dejarte el acceso listo solo necesito 3 cosas:\n· Nombre de tu negocio\n· Tu email (será tu usuario)\n· Tu teléfono\nCon eso te lo preparo y te paso las claves." },
      ],
      documentos: [
        { id: "e1d1", nombre: "Mensaje de apertura (cliente actual / grupo)", estado: "existe" },
        { id: "e1d2", nombre: "Landing de información", estado: "por_crear" },
      ],
    },
    {
      id: 2, nombre: "Onboarding",
      proposito: "Dejar la plataforma operativa, paso a paso (5 fases). Landing que capta, lista para activar.",
      color: "#38bdf8",
      tiposInsight: ["Punto de fricción", "Pregunta frecuente", "Petición de función", "Bug/problema técnico", "Feedback de producto"],
      objetivos: [
        { id: "e2o1", titulo: "Completar las 5 fases del onboarding", check: "Las 5 fases completadas y verificadas" },
      ],
      mensajes: [
        { id: "e2m1", titulo: "Fase 1 — Identidad", objetivoId: "e2o1", contenido: "Primer paso, el más rápido: entra en Mi Negocio → Perfil, pon el nombre, sube el logo y elige tu dirección web. Son 5 minutos. ¿Tienes ya el logo en JPG o PNG? Si no lo tienes a mano, dímelo y te explico cómo sacarlo. — Miriam, Equipo Konecta3D" },
        { id: "e2m2", titulo: "Fase 2 — Botones de acción", objetivoId: "e2o1", contenido: "Ahora tus botones. En Mi Negocio → Herramientas añade lo que ya usas: WhatsApp, web, Instagram, reservas… Te paso una guía rápida. Estos serán los botones de tu página." },
        { id: "e2m3", titulo: "Fase 3 — Tu página", objetivoId: "e2o1", contenido: "Vamos con tu página, la que verán al escanear el llavero. En Fidelización → Landing personaliza textos, colores y secciones para que tenga tu imagen. Si te atasca algún bloque, el martes a las 10 o el miércoles a las 12 lo vemos juntos en 15 minutos. — Miriam, Equipo Konecta3D" },
        { id: "e2m4", titulo: "Fase 4 — Tu captación", objetivoId: "e2o1", contenido: "El paso que marca la diferencia: que tu página capte contactos. Crea un recurso de valor (una guía, un descuento) y un formulario. Así cada visitante te puede dejar sus datos automáticamente." },
        { id: "e2m5", titulo: "Fase 5 — Prueba y validación", objetivoId: "e2o1", contenido: "Último paso antes de activar: escanea tu propia URL desde el móvil y comprueba que todo va bien —los botones, el formulario, el recurso. Cuando lo confirmes, activamos tu llavero." },
      ],
      documentos: [
        { id: "e2d1", nombre: "PDF de entrada de cliente", estado: "existe" },
        { id: "e2d2", nombre: "Guía: integrar herramientas", estado: "por_crear" },
        { id: "e2d3", nombre: "Guía de landing", estado: "por_crear" },
        { id: "e2d4", nombre: "Guía de captación", estado: "por_crear" },
        { id: "e2d5", nombre: "Checklist de validación", estado: "por_crear" },
      ],
      fases: [
        { id: "e2f1", nombre: "Tu identidad", seccion: "Mi Negocio → Perfil", objetivo: "Identidad de marca lista (nombre, logo, slug)", check: "Perfil completo con logo y URL", documento: "PDF de entrada (existe)" },
        { id: "e2f2", nombre: "Tus botones de acción", seccion: "Mi Negocio → Herramientas", objetivo: "Integrar sus enlaces (WhatsApp, web, redes, reservas)", check: "Herramientas principales configuradas", documento: "Guía: integrar herramientas" },
        { id: "e2f3", nombre: "Tu página", seccion: "Fidelización → Landing", objetivo: "Página del llavero personalizada y publicada", check: "Landing con su imagen, publicada", documento: "Guía de landing" },
        { id: "e2f4", nombre: "Tu captación", seccion: "Recurso de Valor + Formulario", objetivo: "Que la landing capte contactos", check: "Recurso + formulario activos", documento: "Guía de captación" },
        { id: "e2f5", nombre: "Prueba y validación", seccion: "Revisar todo", objetivo: "Confirmar que funciona antes de activar", check: "El negocio confirma que su URL funciona entera", documento: "Checklist de validación" },
      ],
    },
    {
      id: 3, nombre: "Activación",
      proposito: "Cambiar el link del llavero actual por la URL de la nueva landing.",
      color: "#2dd4bf",
      tiposInsight: ["Bug/problema técnico", "Punto de fricción", "Feedback de producto"],
      objetivos: [
        { id: "e3o1", titulo: "Cambiar el link del llavero", check: "El link del llavero apunta a la nueva landing" },
        { id: "e3o2", titulo: "Verificar el llavero físico", check: "El llavero abre la landing correcta" },
      ],
      mensajes: [
        { id: "e3m1", titulo: "Cambio de link", objetivoId: "e3o1", contenido: "Tu plataforma está lista. Hay que hacer que el llavero apunte a tu nueva página, 2 minutos. ¿Te explico los pasos y lo haces tú, o prefieres que lo gestionemos nosotros y te confirmamos cuando esté? — Miriam, Equipo Konecta3D" },
        { id: "e3m2", titulo: "Verificación", objetivoId: "e3o2", contenido: "[Nombre], escanea el llavero con el móvil y confirma que abre tu nueva página correctamente. Si algo no carga bien, mándame una captura y lo revisamos. — Miriam, Equipo Konecta3D" },
      ],
      documentos: [
        { id: "e3d1", nombre: "Guía: cómo cambiar el link de tu llavero", estado: "por_crear" },
      ],
    },
    {
      id: 4, nombre: "Uso y resultados",
      proposito: "Que use la plataforma en real y vea sus KPIs. Aquí ocurre el autoconvencimiento.",
      color: "#34d399",
      tiposInsight: ["Resultado/logro", "Feedback de producto", "Caso de uso", "Elogio/satisfacción", "Punto de fricción"],
      objetivos: [
        { id: "e4o1", titulo: "Que la use en una situación real", check: "Hay actividad / contactos captados reales" },
        { id: "e4o2", titulo: "Que vea y entienda sus resultados", check: "Ha revisado su dashboard" },
        { id: "e4o3", titulo: "Que reconozca el valor", check: "El cliente confirma que le funciona" },
      ],
      mensajes: [
        { id: "e4m1", titulo: "Invitación a usarlo", objetivoId: "e4o1", contenido: "Ya está todo activo. Úsalo en tu local o tu próximo evento. Cada persona que toque el llavero te puede dejar su contacto." },
        { id: "e4m2", titulo: "Mirar resultados", objetivoId: "e4o2", contenido: "[Nombre], entra en tu panel y mira la sección de estadísticas: ahí ves visitas, contactos captados y cuándo entraron. ¿Cuántos tienes hasta ahora? — Miriam, Equipo Konecta3D" },
        { id: "e4m3", titulo: "Reconocer el valor", objetivoId: "e4o3", contenido: "[Nombre], llevas [X días] usando el sistema. ¿Cuántos contactos tienes en el panel y en qué contextos has usado el llavero hasta ahora? — Miguel, Equipo Konecta3D" },
      ],
      documentos: [
        { id: "e4d1", nombre: "Guía: cómo leer tus resultados", estado: "por_crear" },
        { id: "e4d2", nombre: "Ideas para sacar más partido", estado: "por_crear" },
      ],
    },
    {
      id: 5, nombre: "Expansión",
      proposito: "Que compre un lote de llaveros para su próxima feria. Ingreso principal.",
      color: "#a3e635",
      tiposInsight: ["Señal de compra", "Sensibilidad al precio", "Objeción", "Urgencia/plazos"],
      objetivos: [
        { id: "e5o1", titulo: "Detectar la necesidad", check: "Sé su próxima feria y cuántos llaveros necesita" },
        { id: "e5o2", titulo: "Enviar presupuesto del lote", check: "Presupuesto enviado" },
        { id: "e5o3", titulo: "Cerrar el pedido", check: "Pedido confirmado y pagado" },
      ],
      mensajes: [
        { id: "e5m1", titulo: "Detectar necesidad", objetivoId: "e5o1", contenido: "Ya has visto cómo funciona. Para tu próxima feria, ¿cuántos llaveros necesitarías para entregar a los visitantes?" },
        { id: "e5m2", titulo: "Presupuesto", objetivoId: "e5o2", contenido: "Te preparo el lote con un extra de unidades de regalo. Aquí tienes el presupuesto: [enlace]." },
        { id: "e5m3", titulo: "Cierre del pedido", objetivoId: "e5o3", contenido: "¿Lo confirmamos para empezar la fabricación a tiempo para tu feria?" },
      ],
      documentos: [
        { id: "e5d1", nombre: "Casos de uso en ferias", estado: "por_crear" },
        { id: "e5d2", nombre: "Info de llaveros y lotes", estado: "por_crear" },
      ],
    },
    {
      id: 6, nombre: "Conversión a pago",
      proposito: "Pasar del MVP gratis a la suscripción de la plataforma.",
      color: "#facc15",
      tiposInsight: ["Objeción", "Sensibilidad al precio", "Señal de compra", "Competencia/alternativa", "Riesgo de abandono"],
      objetivos: [
        { id: "e6o1", titulo: "Presentar la oferta", check: "Oferta enviada" },
        { id: "e6o2", titulo: "Resolver dudas y objeciones", check: "Dudas resueltas" },
        { id: "e6o3", titulo: "Cerrar la suscripción", check: "Cliente con suscripción activa" },
      ],
      mensajes: [
        { id: "e6m1", titulo: "Conversión — mensaje de cierre", objetivoId: "e6o1", contenido: "[Nombre], en este mes has captado [X contactos] con el llavero y tienes tu landing activa. Eso son [X] personas en tu lista que no tenías antes. El [fecha] termina el acceso gratuito. A partir de ahí son 99 €/mes, sin permanencia. — Miguel, Equipo Konecta3D" },
        { id: "e6m2", titulo: "Conversión — seguimiento si no responde", objetivoId: "e6o3", contenido: "[Nombre], si tienes alguna duda antes de que acabe el período, el [día] a las [hora] o el [día] a las [hora] lo vemos en 10 minutos. — Miguel, Equipo Konecta3D" },
      ],
      documentos: [
        { id: "e6d1", nombre: "Oferta de la plataforma", estado: "por_crear" },
        { id: "e6d2", nombre: "Comparativa de valor (antes/después)", estado: "por_crear" },
      ],
    },
    {
      id: 7, nombre: "Fidelización",
      proposito: "Retener, dar soporte, conseguir referidos y recurrencia.",
      color: "#8b5cf6",
      tiposInsight: ["Referido potencial", "Riesgo de abandono", "Resultado/logro", "Elogio/satisfacción", "Petición de función"],
      objetivos: [
        { id: "e7o1", titulo: "Mantener contacto y soporte", check: "Contacto periódico activo" },
        { id: "e7o2", titulo: "Conseguir referidos", check: "Al menos un referido pedido" },
        { id: "e7o3", titulo: "Recurrencia", check: "Segundo pedido o renovación" },
      ],
      mensajes: [
        { id: "e7m1", titulo: "Seguimiento mensual", objetivoId: "e7o1", contenido: "Buenos días [nombre], llevas [X semanas] como cliente. ¿Cuántos leads captaste este mes y en qué contextos usaste el llavero? Si algo no está funcionando como esperabas, dímelo antes de que se convierta en un problema. — Miguel, Equipo Konecta3D" },
        { id: "e7m2", titulo: "Pedir referido", objetivoId: "e7o2", contenido: "[Nombre], ¿conoces a alguien que vaya a ferias y tenga el mismo problema que tenías tú de perder contactos? Con tu nombre le contacto. Si le encaja, te mando [X llaveros extra] de regalo. — Miguel, Equipo Konecta3D" },
        { id: "e7m3", titulo: "Próxima feria", objetivoId: "e7o3", contenido: "[Nombre], ¿tienes alguna feria en los próximos 60 días? Los llaveros tardan entre 1 y 3 semanas en fabricación según la cantidad. Si hay fecha, mejor planificarlo ahora. — Miriam, Equipo Konecta3D" },
      ],
      documentos: [
        { id: "e7d1", nombre: "Novedades / mejoras", estado: "por_crear" },
        { id: "e7d2", nombre: "Programa de referidos", estado: "por_crear" },
      ],
    },
  ],
};
