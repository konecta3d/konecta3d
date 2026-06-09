// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface HelpQA {
  question: string;
  answer: string; // puede contener \n para saltos de línea
}

export interface HelpSection {
  slug: string;
  title: string;
  intro?: string;
  items: HelpQA[];
}

// ─── Contenidos ───────────────────────────────────────────────────────────────

export const HELP_CONTENT: Record<string, HelpSection> = {

  "llavero-nfc": {
    slug: "llavero-nfc",
    title: "El llavero NFC",
    intro: "Cómo funciona el llavero y qué pasa cuando alguien lo toca.",
    items: [
      {
        question: "¿Qué pasa exactamente cuando alguien toca el llavero?",
        answer: "Se abre en el móvil del cliente la página de fidelización de tu negocio. Esa página la diseñas tú desde la plataforma. Tú decides qué ve: tus servicios, tu WhatsApp, un recurso gratuito, un formulario para captarte su contacto.",
      },
      {
        question: "¿El cliente necesita instalar algo?",
        answer: "No. Solo necesita tener el móvil cerca del llavero. Funciona con cualquier Android moderno y con iPhone desde el 7 en adelante. No hay app que descargar.",
      },
      {
        question: "¿En qué situaciones funciona mejor?",
        answer: "En cualquier momento en que el cliente esté cerca de ti: en la consulta, en la clínica, en la recepción, en un evento, en una feria. Se lo das, lo toca, y ya está en tu mundo digital.",
      },
      {
        question: "¿Qué pasa si cambio de teléfono o web?",
        answer: "Nada. El llavero apunta a una URL fija de Konecta3D. Lo que cambia está en la plataforma, no en el llavero. Puedes actualizar tu página cuando quieras y el llavero siempre llevará a la versión nueva.",
      },
      {
        question: "¿Cuántos llaveros puedo tener?",
        answer: "Tantos como necesites. Puedes repartirlos entre tu equipo, dejarlos en el mostrador, en la sala de espera, entregarlo al cliente con la factura o con el producto.",
      },
      {
        question: "¿Tiene fecha de caducidad?",
        answer: "No. El chip NFC es permanente. Mientras tengas activa tu suscripción a Konecta3D, la página funcionará.",
      },
      {
        question: "¿Y si el cliente no sabe cómo usarlo?",
        answer: "Le explicas que acerque la parte trasera del móvil al llavero. Con eso es suficiente. Si aún así no funciona, la URL de tu página también se puede compartir por WhatsApp o escribirla a mano.",
      },
    ],
  },

  "dashboard": {
    slug: "dashboard",
    title: "Panel de control",
    intro: "Lo que ves nada más entrar: un resumen de lo que está pasando en tu negocio digital.",
    items: [
      {
        question: "¿Para qué sirve el dashboard si ya sé lo que pasa en mi negocio?",
        answer: "Te muestra la parte que no ves: cuántas personas han escaneado el llavero, cuántas han dejado su contacto, cuántos recursos han descargado. Sin esto, no sabes si tu presencia digital está funcionando o no.",
      },
      {
        question: "¿Qué números aparecen ahí?",
        answer: "Visitas a tu página de fidelización, contactos captados, recursos descargados y actividad reciente.",
      },
      {
        question: "¿Cada cuánto se actualiza?",
        answer: "En tiempo real. Cada vez que alguien entra a tu página o rellena un formulario, ese dato aparece.",
      },
      {
        question: "¿Puedo ignorarlo?",
        answer: "Puedes, pero no tiene sentido. El dashboard es la forma más rápida de saber si lo que estás haciendo está dando resultados. Si llevas dos semanas sin un nuevo lead, algo hay que ajustar.",
      },
      {
        question: "¿Los datos son solo míos?",
        answer: "Sí. Cada negocio ve solo sus propios datos. Nadie más tiene acceso a tu información.",
      },
    ],
  },

  "perfil": {
    slug: "perfil",
    title: "Perfil del negocio",
    intro: "Los datos básicos que identifican tu negocio en toda la plataforma y en tu página pública.",
    items: [
      {
        question: "¿Por qué tengo que rellenar el perfil si ya tengo todo en mi web?",
        answer: "Porque la plataforma usa estos datos para personalizar todo lo que generas: tu página de fidelización, los PDFs que envías a clientes, los documentos de bienvenida. Si no los rellenas, todo sale con datos genéricos.",
      },
      {
        question: "¿Qué información es obligatoria?",
        answer: "El nombre del negocio y el email. El resto (logo, teléfono, sector) mejora cómo te presenta la plataforma, pero no es bloqueante.",
      },
      {
        question: "¿El logo se ve en algún sitio?",
        answer: "Sí. Aparece en tu página de fidelización y en los PDFs que generas desde Recursos de Valor y Beneficios VIP.",
      },
      {
        question: "¿Puedo cambiar los datos cuando quiera?",
        answer: "Sí. Cualquier cambio se aplica de inmediato en tu página pública y en los documentos que generes a partir de ese momento. Los PDFs ya generados no cambian.",
      },
      {
        question: "¿El logo tiene que ser de un tamaño concreto?",
        answer: "No, pero funciona mejor si es cuadrado o apaisado, con fondo transparente (PNG) y al menos 200 píxeles de ancho. Si no tienes uno así, uno rectangular normal también funciona.",
      },
      {
        question: "¿La URL de mi negocio la elijo yo?",
        answer: "Sí, desde el perfil puedes definir tu slug (el nombre en la URL). Por ejemplo: app.konecta3d.com/l/mi-negocio. Elige algo corto y sin espacios.",
      },
    ],
  },

  "landing": {
    slug: "landing",
    title: "Tu página de fidelización",
    intro: "La página que se abre cuando alguien toca tu llavero NFC. Tu escaparate digital.",
    items: [
      {
        question: "¿Es como una página web?",
        answer: "Parecida, pero más enfocada. No tiene menús ni subcategorías. Es una página directa, pensada para móvil, que lleva al cliente a hacer algo concreto: llamarte, escribirte, descargar algo o dejar su contacto.",
      },
      {
        question: "¿Qué puedo poner en mi landing?",
        answer: "Tu logo y nombre de negocio, una descripción breve de lo que haces, botones de acción (WhatsApp, reservar cita, Instagram, web, llamar), un recurso gratuito para descargar y un formulario para captar contactos.",
      },
      {
        question: "¿Cómo llega el cliente a esta página?",
        answer: "Tocando el llavero NFC. Pero también puedes compartir el enlace por WhatsApp, meterlo en tu bio de Instagram, imprimirlo en un cartel con un QR o enviarlo por email.",
      },
      {
        question: "¿Qué son los botones de acción?",
        answer: "Son los botones que aparecen en tu página. Cada uno lleva al cliente a hacer algo: abrir WhatsApp contigo, ir a tu página de reservas, seguirte en Instagram, llamarte. Tú decides cuáles pones y en qué orden.",
      },
      {
        question: "¿Puedo poner un recurso gratuito en mi landing?",
        answer: "Sí. Desde Recurso de Valor creas un PDF con contenido útil y lo enlazas en tu landing. El cliente lo descarga directamente desde ahí. Quien descarga ya está interesado en lo que ofreces.",
      },
      {
        question: "¿Puedo captar el contacto del cliente desde la landing?",
        answer: "Sí, si añades un formulario. Cuando alguien rellena su nombre y correo, ese contacto queda guardado en tu lista de clientes automáticamente.",
      },
      {
        question: "¿Tengo que saber de diseño para editarla?",
        answer: "No. El editor tiene bloques predefinidos. Cambias textos, subes tu logo, eliges colores y añades botones. No hay código ni diseño técnico.",
      },
      {
        question: "¿Los cambios se aplican al instante?",
        answer: "Sí. En cuanto guardas, la próxima persona que toque el llavero verá la versión nueva.",
      },
    ],
  },

  "recurso-de-valor": {
    slug: "recurso-de-valor",
    title: "Recurso de Valor",
    intro: "Un PDF con tu conocimiento profesional que entregas gratis a tus clientes para generar confianza y captar contactos.",
    items: [
      {
        question: "¿Para qué me sirve regalar un PDF?",
        answer: "Para tres cosas concretas: generar confianza antes de que el cliente te contrate, educar al cliente sobre lo que haces y tener un motivo para captar su contacto. Quien descarga tu guía ya está interesado en tu sector. Ese es un cliente potencial caliente.",
      },
      {
        question: "¿Qué tipo de contenido funciona mejor?",
        answer: "Lo que sabes hacer y el cliente no sabe. Por ejemplo:\n· Un dentista: «5 hábitos que están dañando tus dientes sin que lo sepas»\n· Un fisioterapeuta: «Checklist para saber si tu postura causa tu dolor de espalda»\n· Un abogado: «Lo que debes hacer antes de firmar cualquier contrato de alquiler»",
      },
      {
        question: "¿Cómo se crea el PDF?",
        answer: "Con el asistente de la sección. Elige el objetivo (educar, captar, fidelizar), el tipo de documento (guía, checklist, recomendación) y edita el contenido. La plataforma genera el PDF con tu logo y colores.",
      },
      {
        question: "¿Tengo que escribir todo el contenido yo?",
        answer: "No. El asistente te propone una plantilla de contenido según el objetivo que elijas. Tú la adaptas a tu negocio. No empiezas desde cero.",
      },
      {
        question: "¿Cómo llega el PDF al cliente?",
        answer: "Desde tu landing. El cliente toca el llavero, llega a tu página, ve el recurso y lo descarga. También puedes compartir el enlace directo por WhatsApp o email.",
      },
      {
        question: "¿El cliente tiene que dejar su correo para descargarlo?",
        answer: "Depende de cómo lo configures. Puedes ponerlo directamente accesible o vincularlo a un formulario donde el cliente deja su nombre y email antes de descargarlo. Si lo vinculas al formulario, consigues su contacto a cambio del recurso.",
      },
      {
        question: "¿Qué diferencia hay entre Recurso de Valor y Beneficios VIP?",
        answer: "El Recurso de Valor es contenido educativo para posicionarte como experto (una guía, un checklist). Los Beneficios VIP son ofertas y descuentos para que el cliente vuelva o se convierta (un 20% de descuento, un 2x1). Sirven para momentos distintos del proceso de venta.",
      },
    ],
  },

  "beneficios-vip": {
    slug: "beneficios-vip",
    title: "Beneficios VIP",
    intro: "PDFs con descuentos y ofertas exclusivas para captar, fidelizar y generar referidos.",
    items: [
      {
        question: "¿En qué se diferencia de hacer una oferta por WhatsApp?",
        answer: "Es un documento con tu imagen de marca, un código de canjeo y una fecha de validez. El cliente lo percibe como algo serio y formal, no como un mensaje informal. Tiene más valor percibido y es más fácil que lo guarde y lo use.",
      },
      {
        question: "¿Para qué tipo de ofertas funciona?",
        answer: "Para cualquier tipo:\n· Descuento en porcentaje: «20% en tu próxima visita»\n· 2x1: «Trae a un amigo y el servicio para él es gratis»\n· Regalo: «Con tu próxima reserva, te regalo una sesión de valoración»\n· Upgrade: «Te damos el servicio premium al precio del estándar»",
      },
      {
        question: "¿Cuándo debo usarlo?",
        answer: "Hay cuatro momentos clave:\n1. Para captar un cliente nuevo que todavía no se ha decidido\n2. Para que un cliente que ya vino vuelva\n3. Para que un cliente recomiende a alguien\n4. Para subir el ticket medio con un servicio adicional a precio especial",
      },
      {
        question: "¿Cómo llega el beneficio al cliente?",
        answer: "Enviándolo por WhatsApp como PDF, poniéndolo en tu landing para que lo descargue al tocar el llavero, o imprimiéndolo y entregándolo en mano.",
      },
      {
        question: "¿El cliente puede usarlo varias veces con el mismo PDF?",
        answer: "Eso lo controlas tú. El PDF tiene un código de canjeo que puedes anotar cuando el cliente lo usa. Puedes poner una fecha de caducidad visible en el documento para que quede claro.",
      },
      {
        question: "¿Puedo ponerle mi logo y mis colores?",
        answer: "Sí. El asistente te permite personalizar los colores del documento, el logo y el botón de acción (por ejemplo, un botón de «Reservar cita» que lleva a tu enlace de reservas).",
      },
    ],
  },

  "formularios": {
    slug: "formularios",
    title: "Formularios",
    intro: "La forma de captar el contacto del cliente automáticamente, sin que tengas que estar presente.",
    items: [
      {
        question: "¿Por qué necesito un formulario si ya tengo WhatsApp?",
        answer: "Porque el formulario trabaja solo. Cuando alguien toca el llavero a las 11 de la noche y rellena su contacto, ese dato está en tu plataforma al día siguiente sin que hayas hecho nada. Con WhatsApp, si no estás disponible, el cliente se va y no vuelves a saber de él.",
      },
      {
        question: "¿Qué información pide el formulario al cliente?",
        answer: "Tú decides. Lo mínimo útil es nombre y correo. Puedes añadir teléfono, preguntar qué servicio le interesa, o cómo ha llegado hasta ti. Cuantos más campos, menor conversión. Lo recomendable es pedir lo mínimo que necesitas para poder contactarle.",
      },
      {
        question: "¿Dónde ve el cliente el formulario?",
        answer: "En tu landing y/o en una campaña de captación. Puedes integrarlo directamente en tu página o usarlo como paso previo para descargar tu recurso gratuito.",
      },
      {
        question: "¿Qué pasa cuando alguien rellena el formulario?",
        answer: "Su contacto queda guardado en la sección de Clientes de la plataforma. Desde ahí puedes exportarlo, contactarle o usarlo para futuras comunicaciones.",
      },
      {
        question: "¿Puedo vincular el formulario a un recurso de valor?",
        answer: "Sí. Puedes hacer que el cliente primero rellene el formulario y, después de enviar, se descargue automáticamente el PDF. Así consigues su contacto y él consigue lo que buscaba.",
      },
      {
        question: "¿Cuántos formularios puedo tener?",
        answer: "Tantos como necesites. Puedes tener uno en tu landing habitual y otros específicos para campañas concretas (una oferta de verano, un evento, un taller).",
      },
      {
        question: "¿Los datos del formulario son solo míos?",
        answer: "Sí. Son tuyos. Konecta3D los almacena en tu cuenta y nadie más tiene acceso a ellos. Puedes exportarlos cuando quieras.",
      },
    ],
  },

  "formularios-feedback": {
    slug: "formularios-feedback",
    title: "Formularios de Feedback",
    intro: "La forma de escuchar a los clientes que ya te compraron: su opinión sobre el servicio, la atención y el producto, para mejorar y que vuelvan.",
    items: [
      {
        question: "¿En qué se diferencia de un formulario de captación?",
        answer: "En a quién preguntas. El de captación sirve para conseguir el contacto de gente nueva. El de feedback sirve para escuchar a quien YA es tu cliente y ha comprado, y saber qué mejorar.",
      },
      {
        question: "¿Qué tipos de feedback puedo recoger?",
        answer: "Cuatro: opinión general (valoraciones y preguntas abiertas), NPS (probabilidad de que te recomienden del 0 al 10), producto o servicio (satisfacción con algo concreto) y empleados (amabilidad, profesionalidad y rapidez de tu equipo).",
      },
      {
        question: "¿Qué le puedo preguntar al cliente?",
        answer: "Lo que te ayude a mejorar: cómo valoró la atención, si el producto cumplió, qué cambiaría, si te recomendaría. Pocas preguntas y claras: cuanto más corto, más respuestas.",
      },
      {
        question: "¿Cómo se lo hago llegar al cliente?",
        answer: "Compartes el enlace del formulario después de la compra o la visita: por WhatsApp, por email o donde tengas contacto con él. No necesita instalar nada ni registrarse.",
      },
      {
        question: "¿Qué hago con las respuestas?",
        answer: "Las ves recogidas en la plataforma. Te sirven para detectar qué falla y qué funciona: si la atención flojea, si un servicio gusta más que otro, qué te piden mejorar. Decides con datos, no a ciegas.",
      },
      {
        question: "¿Para qué me sirve esto de verdad?",
        answer: "Para que tus clientes vuelvan. Un cliente al que escuchas se siente valorado y repite. Y detectas un problema a tiempo, antes de que se vaya en silencio sin que sepas por qué.",
      },
      {
        question: "¿El cliente tiene que dar muchos datos?",
        answer: "No. Responde en unos segundos. El objetivo es que opine sin esfuerzo, no captar sus datos (para eso está la captación).",
      },
    ],
  },

  "campanas": {
    slug: "campanas",
    title: "Campañas de captación",
    intro: "Acciones con objetivo definido: conseguir que clientes potenciales te den su contacto a cambio de algo que ofreces.",
    items: [
      {
        question: "¿En qué se diferencia una campaña de tener el formulario en mi landing?",
        answer: "En el foco. Tu landing está siempre activa y es para todo el mundo. Una campaña tiene una duración concreta, un mensaje específico y un recurso que la justifica. Por ejemplo: «Descarga gratis nuestra guía de primavera para pacientes nuevos» es una campaña.",
      },
      {
        question: "¿Qué necesito para crear una campaña?",
        answer: "Tres cosas:\n1. Un recurso que ofrecer (un PDF, un enlace a algo útil, un descuento)\n2. Un formulario para captar el contacto\n3. Un título y descripción que expliquen qué gana el cliente al apuntarse",
      },
      {
        question: "¿Dónde ve el cliente la campaña?",
        answer: "La campaña tiene una URL propia que puedes compartir por WhatsApp, Instagram, email o cualquier canal. También puedes enlazarla desde tu landing.",
      },
      {
        question: "¿Cómo sé si la campaña está funcionando?",
        answer: "Desde el Dashboard y desde la sección de Clientes ves cuántos contactos ha conseguido cada campaña. Si llevas una semana con cero leads, algo hay que cambiar: el recurso, el mensaje o el canal donde la estás compartiendo.",
      },
      {
        question: "¿Puedo tener varias campañas activas a la vez?",
        answer: "Sí. Puedes tener una campaña permanente de captación y lanzar una nueva para una promoción de temporada. Cada una tiene sus propios resultados.",
      },
      {
        question: "¿Una campaña reemplaza a mi publicidad en redes sociales?",
        answer: "No. La campaña es el destino. La publicidad en redes es el camino que lleva hasta ahí. Funcionan juntas: la campaña es la página a la que mandas a la gente desde tus stories, posts o anuncios.",
      },
    ],
  },

  "clientes": {
    slug: "clientes",
    title: "Clientes",
    intro: "Tu base de datos de contactos: todas las personas que han dejado su información a través de tus formularios.",
    items: [
      {
        question: "¿Qué información tengo de cada cliente?",
        answer: "Nombre, correo electrónico, la fecha en que se apuntó y desde qué formulario o campaña llegó. Si en el formulario pediste más datos (teléfono, servicio de interés), esos también aparecen.",
      },
      {
        question: "¿Qué puedo hacer con estos contactos?",
        answer: "Contactarles directamente por email o teléfono, exportar la lista y usarla en una herramienta de email marketing (Mailchimp, Brevo, etc.), o usarla como referencia para saber de dónde vienen tus mejores clientes.",
      },
      {
        question: "¿La plataforma les manda emails automáticos?",
        answer: "No en este momento. La plataforma guarda los contactos. El seguimiento posterior (enviarles un email, llamarles, mandarles una oferta) lo haces tú desde tu correo habitual o con otra herramienta.",
      },
      {
        question: "¿Puedo exportar la lista?",
        answer: "Sí. Puedes descargar los contactos en formato Excel o CSV para usarlos donde necesites.",
      },
      {
        question: "¿Cuándo empieza a crecer esta lista?",
        answer: "Desde el momento en que activas un formulario y alguien lo rellena. Si llevas tiempo con el llavero sin formulario, no habrás acumulado contactos. Es uno de los primeros pasos que vale la pena configurar.",
      },
    ],
  },

  "herramientas": {
    slug: "herramientas",
    title: "Herramientas",
    intro: "Los botones de acción de tu landing: WhatsApp, reservas, redes sociales, web. Tú decides cuáles activas.",
    items: [
      {
        question: "¿Qué tipos de herramientas puedo añadir?",
        answer: "WhatsApp (abre un chat directo contigo), reservar cita (enlaza a tu sistema de reservas), llamar (marca tu número), Instagram/Facebook/TikTok (lleva a tu perfil), web (enlaza a tu web), email (abre un correo pre-dirigido).",
      },
      {
        question: "¿Cuántas herramientas puedo tener activas?",
        answer: "Tantas como quieras, pero menos es más. Con 3-4 botones bien elegidos, el cliente sabe qué hacer. Con 8 botones, no sabe por dónde empezar y no hace nada.",
      },
      {
        question: "¿Puedo personalizar el mensaje que se envía por WhatsApp?",
        answer: "Sí. Cuando creas la herramienta de WhatsApp puedes escribir el texto inicial que verá el cliente al abrir el chat. El cliente puede modificarlo antes de enviarlo.",
      },
      {
        question: "¿Las herramientas están relacionadas con los botones de mis PDFs?",
        answer: "Sí. Cuando creas un botón CTA en un Recurso de Valor o en un Beneficio VIP, seleccionas una herramienta de tu lista. Por eso es importante configurarlas bien primero: son la base de todos los botones de acción de la plataforma.",
      },
      {
        question: "¿Puedo cambiar el enlace de una herramienta?",
        answer: "Sí. Si cambias tu enlace de reservas o tu número de WhatsApp, actualizas la herramienta y automáticamente se aplica en todos los sitios donde la hayas usado.",
      },
      {
        question: "¿Puedo desactivar una herramienta sin borrarla?",
        answer: "Sí. Puedes desactivar cualquier herramienta y dejarla guardada para reactivarla más adelante.",
      },
    ],
  },

  "contexto-fidelizacion": {
    slug: "contexto-fidelizacion",
    title: "Contexto de fidelización",
    intro: "Describes tu negocio para que la plataforma genere contenido enfocado en retener y hacer volver a los clientes que ya tienes.",
    items: [
      {
        question: "¿Para qué sirve este contexto?",
        answer: "Para que la plataforma entienda tu negocio y adapte el contenido que genera (textos de la landing, recursos de valor, beneficios VIP) a tu sector, tu tono y tus clientes actuales. Sin este contexto, todo sale genérico.",
      },
      {
        question: "¿Qué diferencia tiene con el contexto de captación?",
        answer: "Este contexto es para los clientes que ya te conocen. El objetivo es que vuelvan, que confíen más en ti y que te recomienden. El tono es más cercano y orientado a la experiencia que ya tienen contigo.",
      },
      {
        question: "¿Qué información debo poner?",
        answer: "Describe a qué te dedicas, cuál es el perfil de tu cliente habitual, qué les hace volver a tu negocio y qué valoran de ti. También puedes indicar el tono con el que sueles comunicarte (cercano, profesional, informal).",
      },
      {
        question: "¿Cuánto tengo que escribir?",
        answer: "Con 2-3 líneas por apartado es suficiente. Lo importante es que sea preciso. Una descripción corta pero exacta funciona mejor que un texto largo y vago.",
      },
      {
        question: "¿Cómo afecta a mi landing y mis recursos?",
        answer: "La plataforma usa este contexto para proponer textos, plantillas de recursos de valor y beneficios VIP que encajen con tu negocio. Cuanto mejor lo describes, más útil es lo que genera.",
      },
      {
        question: "¿Puedo cambiarlo cuando quiera?",
        answer: "Sí. Si añades un servicio, cambias tu enfoque o redefines tu cliente ideal, actualiza el contexto. La próxima vez que generes contenido, la plataforma usará la versión nueva.",
      },
    ],
  },

  "contexto-captacion": {
    slug: "contexto-captacion",
    title: "Contexto de captación",
    intro: "Describes tu negocio para que la plataforma genere contenido enfocado en atraer y convertir a personas que todavía no te conocen.",
    items: [
      {
        question: "¿Para qué sirve este contexto?",
        answer: "Para que la plataforma entienda qué ofreces y a quién, y pueda generar recursos, campañas y formularios orientados a captar contactos nuevos. Sin este contexto, el contenido que genera es demasiado genérico para convertir.",
      },
      {
        question: "¿Qué diferencia tiene con el contexto de fidelización?",
        answer: "Este contexto es para personas que aún no te conocen. El objetivo es llamar su atención, generar confianza desde cero y conseguir que te dejen su contacto. El tono debe ser más directo y enfocado al problema que resuelves.",
      },
      {
        question: "¿Qué información debo poner?",
        answer: "Describe el problema concreto que resuelves, a quién va dirigido tu servicio, qué te diferencia de la competencia y qué consigue el cliente cuando te elige. Piensa en lo que le dirías a alguien que nunca ha oído hablar de ti.",
      },
      {
        question: "¿Cómo afecta a mis campañas y formularios?",
        answer: "La plataforma usa este contexto para generar los textos de tus campañas, los títulos de tus recursos de captación y las descripciones de tus formularios. Un buen contexto significa que el cliente potencial entiende en segundos qué gana al dejarte su contacto.",
      },
      {
        question: "¿Qué pasa si tengo varios tipos de clientes distintos?",
        answer: "Describe el perfil principal al que te diriges. Puedes crear campañas distintas para perfiles diferentes, pero el contexto base debe reflejar a tu cliente más habitual o al que más quieres atraer ahora mismo.",
      },
      {
        question: "¿Puedo cambiarlo cuando quiera?",
        answer: "Sí. Si cambias de nicho, lanzas un servicio nuevo o quieres atraer a un perfil de cliente diferente, actualiza el contexto. Los recursos y campañas que generes a partir de ese momento usarán la versión nueva.",
      },
    ],
  },

  "como-funciona": {
    slug: "como-funciona",
    title: "Cómo funciona todo",
    intro: "El recorrido completo: cómo encajan el llavero, la landing, los recursos y los formularios para que tu negocio capture contactos automáticamente.",
    items: [
      {
        question: "¿Qué pasa desde que el cliente toca el llavero hasta que te deja su contacto?",
        answer: "1. El llavero abre tu landing en el móvil del cliente.\n2. El cliente ve tu página y un recurso gratuito (guía, descuento, etc.).\n3. Para conseguirlo rellena un formulario con su nombre y correo.\n4. Su contacto queda guardado en tu lista automáticamente.\n5. Tú le contactas cuando quieras.",
      },
      {
        question: "¿Tengo que usar todas las secciones?",
        answer: "No. Puedes usar solo la landing con tus botones de WhatsApp y ya estás mejor posicionado que la mayoría de negocios locales. El resto lo vas añadiendo a medida que le vas cogiendo el ritmo.",
      },
      {
        question: "¿En qué orden monto todo si acabo de empezar?",
        answer: "1. Rellena el perfil (nombre, logo)\n2. Configura tus herramientas (WhatsApp, reservas)\n3. Diseña tu landing\n4. Crea un recurso de valor\n5. Crea un formulario\n6. Vincula el recurso al formulario\n7. Comparte el llavero con tus clientes",
      },
      {
        question: "¿Qué combinación da mejores resultados para captar contactos?",
        answer: "Landing + Recurso de Valor + Formulario. El llavero lleva al cliente a la landing, la landing muestra el recurso gratuito, el recurso exige rellenar el formulario, el formulario captura el contacto. Resultado: cada persona que toca el llavero puede convertirse en lead.",
      },
      {
        question: "¿Cuánto tiempo tengo que dedicarle?",
        answer: "La configuración inicial lleva entre 1 y 3 horas. El mantenimiento posterior es mínimo: actualizar datos si cambian, crear un recurso nuevo de vez en cuando, revisar los leads que llegan.",
      },
      {
        question: "¿Necesito conocimientos técnicos?",
        answer: "No. Todo está pensado para que lo maneje alguien sin conocimientos informáticos. Si puedes usar WhatsApp e Instagram, puedes usar esta plataforma.",
      },
      {
        question: "¿Los Beneficios VIP se pueden poner en la landing?",
        answer: "Sí. Puedes añadir un botón en tu landing que lleve directamente al PDF del beneficio. El cliente lo ve, lo descarga y ya tiene tu oferta en el móvil. Si quieres captar su contacto antes de dárselo, añades el formulario como paso previo.",
      },
    ],
  },

};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getHelpSlug(pathname: string): string {
  // Más específico primero
  if (pathname.startsWith("/captacion/campanas"))      return "campanas";
  if (pathname.startsWith("/captacion/formularios"))   return "formularios";
  if (pathname.startsWith("/captacion/lead-magnets"))  return "recurso-de-valor";
  if (pathname.startsWith("/captacion/clientes"))      return "clientes";
  if (pathname.startsWith("/captacion/contexto"))      return "contexto-captacion";
  if (pathname.startsWith("/captacion/recorrido"))     return "como-funciona";
  if (pathname.startsWith("/captacion"))               return "como-funciona";
  if (pathname.startsWith("/negocio/perfil"))          return "perfil";
  if (pathname.startsWith("/negocio/herramientas"))    return "herramientas";
  if (pathname.startsWith("/negocio/clientes"))        return "clientes";
  if (pathname.startsWith("/mi-contexto"))             return "contexto-fidelizacion";
  if (pathname.startsWith("/gpt-fidelizacion"))        return "contexto-fidelizacion";
  if (pathname.startsWith("/landing"))                 return "landing";
  if (pathname.startsWith("/lead-magnet"))             return "recurso-de-valor";
  if (pathname.startsWith("/vip-benefits"))            return "beneficios-vip";
  if (pathname.startsWith("/formularios"))             return "formularios-feedback";
  if (pathname.startsWith("/acciones"))                return "herramientas";
  if (pathname.startsWith("/mi-negocio/perfil"))       return "perfil";
  if (pathname.startsWith("/mi-negocio"))              return "dashboard";
  if (pathname.startsWith("/admin"))                   return "como-funciona";
  if (pathname.startsWith("/dashboard"))               return "dashboard";
  return "como-funciona";
}

export function getHelpSection(pathname: string): HelpSection {
  const slug = getHelpSlug(pathname);
  return HELP_CONTENT[slug] ?? HELP_CONTENT["como-funciona"];
}
