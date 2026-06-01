// ─── Perfil del Cliente Ideal de Konecta3D ────────────────────────────────────
// Centraliza el "quién" para enfocar comunicación, prospección y venta.
// Editable desde /admin/crm/cliente-ideal (guardado en settings → crm_client_profile).
// Estos son los valores por defecto que se cargan si no hay nada guardado.

export interface Objecion {
  objecion: string;
  respuesta: string;
}

export interface Solucion {
  problema: string;   // el problema del cliente
  beneficio: string;  // el beneficio de Konecta que lo resuelve
  tipo: string;       // Directo / Indirecto / Directo + Indirecto
  mensaje: string;    // cómo se comunica como solución
}

export interface ClientProfile {
  nombre: string;
  descripcion: string;
  demografia: string;
  dolores: string[];
  problemas: string[];
  necesidades: string[];
  deseos: string[];
  miedos: string[];
  motivaciones: string[];
  objeciones: Objecion[];
  soluciones: Solucion[];
  senales: string[];
}

export const DEFAULT_CLIENT_PROFILE: ClientProfile = {
  nombre: "El Expositor",
  descripcion:
    "Negocio que usa ferias y eventos como canal principal de captación de clientes nuevos. Tiene presupuesto para el stand, el equipo y el material, pero no tiene un sistema digital para convertir las conversaciones del evento en leads reales. Reparte tarjetas, pone QRs y espera que el cliente vuelva. Compra lotes grandes de llaveros.",
  demografia:
    "2-20 empleados · Facturación 150k-2M € · 3-10 ferias al año · Gasto por feria 2.000-15.000 € · Compra 200-1.000 llaveros por pedido · Sectores: inmobiliaria, dental, seguros, energía, formación, automoción, franquicias, alimentación.",

  dolores: [
    "La feria cuesta miles y saben que el 80% se pierde, pero lo han normalizado como inevitable.",
    "Vergüenza tecnológica silenciosa cuando un visitante pregunta si tienen algo digital y responden con una tarjeta de papel.",
    "El agotamiento de 3 días de feria no compensa: vuelven con 30 tarjetas que no saben si servirán.",
    "Dependencia del comercial estrella: si el mejor no va, los resultados caen.",
    "Incertidumbre de no saber qué feria funcionó hasta semanas después, cuando ya da igual.",
    "El seguimiento en frío genera rechazo interno en el equipo, así que muchas veces no se hace.",
    "Miedo a parecer anticuados frente a competidores más modernos en el mismo evento.",
    "Trabajan mucho pero no sienten que crezcan en proporción al esfuerzo.",
    "Invierten en presencia (stand, folletos) pero no en permanencia: todo muere el domingo.",
    "No pueden justificar el ROI de la feria ni ante ellos mismos ni ante su equipo.",
  ],

  problemas: [
    "No capturan a quien pasa sin detenerse (60-70% de los interesados desaparece).",
    "No pueden activar al lead en las primeras 24-48h, cuando el interés está en su punto más alto.",
    "Tienen el contacto pero no el contexto: no saben qué le interesó al visitante.",
    "No tienen un proceso replicable feria a feria; depende del humor y energía del equipo.",
    "No miden qué ferias son rentables: invierten igual en todas sin datos.",
    "No tienen activo digital post-evento: el folleto y la tarjeta se pierden.",
    "No pueden escalar la captación cuando el stand está saturado (cuello de botella humano).",
    "No tienen visibilidad del recorrido del cliente desde la feria hasta el cierre.",
    "No pueden segmentar su base de leads por interés: todo está en el mismo montón.",
    "Si el comercial que llevó el sistema se va, el conocimiento se va con él.",
  ],

  necesidades: [
    "Un sistema que capture leads automáticamente mientras el equipo está ocupado.",
    "Un activo físico de marca que el cliente use a diario y no se tire.",
    "Datos reales por evento para decidir en qué ferias repetir.",
    "Un flujo de seguimiento que se active solo en las primeras 24-48h.",
    "Diferenciarse en el evento sin aumentar el presupuesto del stand.",
    "Consistencia entre eventos independientemente de quién esté ese día.",
    "Un argumento tangible y memorable que justifique el intercambio de datos.",
    "Reducir el ciclo de venta: que el lead llegue ya informado y cualificado.",
    "Justificar la inversión en ferias con números reales.",
    "Un sistema que escale igual para 2 ferias que para 15.",
  ],

  deseos: [
    "Llegar el lunes post-feria con 200 leads nuevos sin haber hecho nada diferente.",
    "Que los clientes lleguen pidiendo información porque algo del evento activó su interés.",
    "Ser los más avanzados tecnológicamente del evento; que otros pregunten por el llavero.",
    "Que su equipo cierre más y haga menos llamadas en frío.",
    "Tener un activo que trabaje por ellos después de la feria.",
    "Ser reconocidos en su sector como los que saben captar en eventos.",
    "Justificar cada euro con un número concreto.",
    "Reducir la ansiedad del seguimiento con un sistema que caliente al lead.",
    "Que cada feria mejore automáticamente la siguiente.",
    "Sentir que la feria es el inicio de una relación, no un evento puntual.",
  ],

  miedos: [
    "Que sea otra herramienta más que compran y no usan.",
    "Que el equipo no lo adopte y se quede en el cajón.",
    "Que sea complicado de configurar y necesiten a alguien técnico.",
    "Que el cliente no sepa usar el llavero y quede mal en la feria.",
    "Gastar en algo que no demuestre resultados claros.",
    "Que la próxima feria llegue antes de tenerlo listo y funcionando.",
  ],

  motivaciones: [
    "ROI calculable: más leads por feria = más clientes que no habría conseguido.",
    "Coste marginal bajo: 3€ por llavero frente a miles de euros de stand.",
    "Ventaja de primer movimiento: la competencia del sector aún no lo tiene.",
    "Orgullo: ser el stand más avanzado del evento.",
    "Alivio: dejar de depender de que el cliente se acuerde de llamar.",
    "Seguridad: un proceso que funciona aunque falte el mejor comercial.",
    "Reconocimiento: que la dirección vea resultados medibles por primera vez.",
    "Urgencia natural: su próxima feria es una fecha límite real.",
  ],

  objeciones: [
    {
      objecion: "Es caro",
      respuesta: "¿Cuánto estáis invirtiendo en el stand de la feria? El llavero es el 0,07% de ese coste y es lo único que se queda con vuestros clientes después.",
    },
    {
      objecion: "No sé si va a funcionar",
      respuesta: "Te lo demuestro ahora mismo: toca este llavero. Acabas de ver exactamente lo que vivirá tu cliente. Eso es todo lo que hace, y funciona siempre.",
    },
    {
      objecion: "Lo tengo que consultar",
      respuesta: "Claro. ¿Con quién lo consultas? ¿Puedo estar en esa conversación 10 minutos para resolver las dudas que surjan? Así no decides con información a medias.",
    },
    {
      objecion: "Ahora no es el momento",
      respuesta: "¿Cuándo es tu próxima feria? Planifiquemos para esa. Si empezamos con tiempo, llegas con el sistema montado y probado.",
    },
    {
      objecion: "Ya tenemos un CRM / sistema",
      respuesta: "Perfecto, esto no lo reemplaza: lo alimenta. El llavero captura el contacto en la feria y tú lo vuelcas a tu sistema. Resolvemos justo el punto donde hoy perdéis a la gente.",
    },
  ],

  soluciones: [
    { problema: "Pierde a quien pasa sin detenerse a hablar", beneficio: "Captura con un toque del llavero", tipo: "Directo", mensaje: "Cada persona que toca el llavero queda capturada, hables con ella o no." },
    { problema: "No activa al lead en las primeras 48h", beneficio: "El contacto entra en el sistema al instante", tipo: "Directo", mensaje: "El lunes tienes los contactos listos para escribir, no buscándolos." },
    { problema: "Tiene el contacto pero no el contexto", beneficio: "Formulario configurable", tipo: "Directo", mensaje: "Sabes qué le interesó, no solo su nombre." },
    { problema: "No tiene activo digital post-feria", beneficio: "El llavero se queda con el cliente", tipo: "Directo + Indirecto", mensaje: "Tu marca sigue en su llavero cuando ya olvidó los demás stands." },
    { problema: "No mide el ROI de cada feria", beneficio: "Dashboard con datos reales", tipo: "Directo", mensaje: "Ves exactamente cuántos leads dio cada feria." },
    { problema: "Cuello de botella humano en el stand", beneficio: "Captura automática", tipo: "Directo", mensaje: "Capta aunque todo tu equipo esté ocupado con otra persona." },
    { problema: "Depende del comercial estrella", beneficio: "Es un sistema, no una persona", tipo: "Indirecto", mensaje: "El sistema no se va cuando se va el comercial." },
    { problema: "Miedo a parecer anticuado", beneficio: "Imagen tecnológica", tipo: "Indirecto", mensaje: "Eres el stand del que todos preguntan." },
    { problema: "No tiene un proceso replicable", beneficio: "Mismo sistema cada feria", tipo: "Indirecto", mensaje: "Lo que funciona en una feria funciona en todas." },
    { problema: "No puede justificar la inversión en ferias", beneficio: "Datos por evento", tipo: "Indirecto", mensaje: "Justificas cada euro de la feria con números." },
  ],

  senales: [
    "Va a ferias o eventos más de 2 veces al año.",
    "Capta el contacto en papel, QR básico o nada estructurado.",
    "Tiene equipo o varios comerciales.",
    "Tiene una feria próxima en mente.",
    "Trabaja con clientes presencialmente en eventos.",
    "Compra o estaría dispuesto a comprar lotes grandes.",
  ],
};

// Etiquetas y orden de las listas para el editor
export const PROFILE_LISTS: { key: keyof ClientProfile; label: string; desc: string }[] = [
  { key: "dolores",      label: "Dolores latentes",      desc: "Lo que siente pero no ha sabido nombrar" },
  { key: "problemas",    label: "Problemas sin resolver", desc: "Lo que falla en su sistema actual" },
  { key: "necesidades",  label: "Necesidades",           desc: "Lo que necesita para funcionar mejor" },
  { key: "deseos",       label: "Deseos",                desc: "Lo que quiere aunque no lo pida" },
  { key: "miedos",       label: "Miedos",                desc: "Lo que le frena a decidir" },
  { key: "motivaciones", label: "Motivaciones de compra", desc: "Lo que dispara la decisión" },
  { key: "senales",      label: "Señales de cualificación", desc: "Cómo reconocer que es tu cliente" },
];
