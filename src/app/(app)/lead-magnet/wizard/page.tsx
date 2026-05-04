"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import ActionLinkPicker from "@/components/ActionLinkPicker";
import { LeadMagnetPreview } from "@/components/LeadMagnetPreview";
import OnboardingDrawer from "@/components/onboarding/OnboardingDrawer";
import LeadMagnetAiChat, { type WizardChatMessage, type WizardChanges } from "@/components/lead-magnet/LeadMagnetAiChat";

type LeadMagnetType = "guia" | "checklist" | "recomendacion";
type Objective =
  | "volvieron"   // Retención — que los clientes actuales vuelvan
  | "conversion"  // Upsell — aumentar ticket medio
  | "referidos"   // Boca a boca — recomendaciones
  | "captar"      // Captación — atraer clientes nuevos
  | "reactivar"   // Reactivación — recuperar inactivos
  | "educar"      // Educación — onboarding / confianza
  | "temporada"   // Estacional — aprovechar fechas clave
  | "lanzamiento";// Lanzamiento — presentar algo nuevo
type WizardStep = "bienvenida" | "objetivo" | "tipo" | "contenido" | "personalizacion";

const OBJECTIVE_INFO: Record<Objective, {
  title: string;
  description: string;
  example: string;
  color: string;
  icon: string;      // emoji representativo
  sectors: string[]; // sectores donde encaja mejor
}> = {
  volvieron: {
    title: "Que vuelvan",
    description: "Motiva que los clientes actuales regresen con continuidad y seguimiento.",
    example: "Plan de seguimiento post-tratamiento en 3 pasos.",
    color: "#ffb400",
    icon: "🔁",
    sectors: ["Salud", "Estética", "Fitness"]
  },
  conversion: {
    title: "Aumentar ventas",
    description: "Sube el ticket medio mostrando el valor de un servicio o producto adicional.",
    example: "Por qué añadir el pack de mantenimiento tiene sentido.",
    color: "#22c55e",
    icon: "📈",
    sectors: ["Todos los sectores"]
  },
  referidos: {
    title: "Conseguir referidos",
    description: "Facilita que clientes satisfechos te recomienden en un solo paso.",
    example: "Cómo recomendar mi clínica en 3 pasos y qué ganas tú.",
    color: "#a78bfa",
    icon: "🤝",
    sectors: ["Servicios", "Inmobiliaria", "Legal"]
  },
  captar: {
    title: "Captar clientes nuevos",
    description: "Atrae a personas que aún no te conocen con un recurso que demuestra tu valor.",
    example: "5 señales de que necesitas un fisioterapeuta ahora mismo.",
    color: "#06b6d4",
    icon: "🎯",
    sectors: ["Comercio", "Restauración", "Retail"]
  },
  reactivar: {
    title: "Recuperar inactivos",
    description: "Recupera clientes que dejaron de venir con un mensaje de valor y sin presión.",
    example: "Lo que cambia cuando retomas tu tratamiento después de un tiempo.",
    color: "#f97316",
    icon: "💡",
    sectors: ["Salud", "Estética", "Fitness"]
  },
  educar: {
    title: "Educar al cliente",
    description: "Explica cómo funciona tu servicio para que el cliente lo entienda y confíe más.",
    example: "Qué esperar en tu primera consulta legal: guía paso a paso.",
    color: "#3b82f6",
    icon: "📚",
    sectors: ["Legal", "Financiero", "Tecnología"]
  },
  temporada: {
    title: "Campaña de temporada",
    description: "Aprovecha una fecha clave o época del año para activar a tus clientes.",
    example: "Tu plan de puesta a punto para este verano.",
    color: "#ec4899",
    icon: "📅",
    sectors: ["Comercio", "Restauración", "Fitness"]
  },
  lanzamiento: {
    title: "Lanzar un servicio",
    description: "Presenta un servicio o producto nuevo y explica por qué es relevante para tu cliente.",
    example: "Nuevo servicio de nutrición: qué es y por qué lo hemos creado para ti.",
    color: "#10b981",
    icon: "🚀",
    sectors: ["Todos los sectores"]
  }
};

const OBJECTIVE_GUIDE: Record<Objective, {
  whatIs: string;
  subObjectives: string[];
  create: string;
  format: string;
  example: string;
}> = {
  volvieron: {
    whatIs: "Aumentar la recurrencia de clientes actuales.",
    subObjectives: ["Recordar beneficios de volver", "Reforzar continuidad del servicio", "Proponer el siguiente paso concreto"],
    create: "Recurso de seguimiento y continuidad.",
    format: "Recomendación o checklist.",
    example: "Plan de seguimiento en 3 pasos."
  },
  conversion: {
    whatIs: "Mostrar el valor de un servicio o producto adicional antes de que el precio sea el foco.",
    subObjectives: ["Explicar beneficios del extra", "Comparar resultados con/sin el servicio", "Resolver objeciones frecuentes"],
    create: "Recurso que justifique la compra adicional.",
    format: "Guía comparativa o recomendación.",
    example: "Cómo potenciar tus resultados con el pack premium."
  },
  referidos: {
    whatIs: "Conseguir recomendaciones de clientes satisfechos.",
    subObjectives: ["Recordar el valor recibido", "Hacer que recomendar sea fácil", "Dar un incentivo claro"],
    create: "Recurso breve y accionable para recomendar.",
    format: "Recomendación directa o checklist.",
    example: "Cómo recomendar en 3 pasos."
  },
  captar: {
    whatIs: "Atraer clientes que aún no te conocen demostrando tu expertise.",
    subObjectives: ["Resolver una duda frecuente de clientes nuevos", "Mostrar resultados reales", "Generar urgencia de actuar"],
    create: "Recurso de valor gratuito que posiciona al negocio como experto.",
    format: "Guía o recomendación introductoria.",
    example: "5 señales de que necesitas este servicio ahora."
  },
  reactivar: {
    whatIs: "Recuperar clientes que han dejado de venir sin presión.",
    subObjectives: ["Recordar el valor del servicio", "Normalizar el retorno", "Ofrecer un primer paso fácil"],
    create: "Recurso que reduce la barrera de volver.",
    format: "Recomendación empática o guía breve.",
    example: "Lo que cambia cuando retomas tu tratamiento."
  },
  educar: {
    whatIs: "Ayudar al cliente a entender el servicio para que confíe y decida con información.",
    subObjectives: ["Explicar el proceso del servicio", "Desmitificar dudas o miedos comunes", "Posicionar al profesional como referente"],
    create: "Recurso educativo que genera confianza.",
    format: "Guía paso a paso.",
    example: "Qué esperar en tu primera consulta."
  },
  temporada: {
    whatIs: "Activar a los clientes aprovechando un momento del año relevante para ellos.",
    subObjectives: ["Conectar el servicio con la época/fecha", "Crear sensación de momento ideal", "Proponer una acción concreta y urgente"],
    create: "Recurso estacional que crea urgencia natural.",
    format: "Checklist o recomendación.",
    example: "Tu plan de puesta a punto para este verano."
  },
  lanzamiento: {
    whatIs: "Presentar algo nuevo (servicio, producto, oferta) de forma que genere deseo e interés.",
    subObjectives: ["Explicar qué es y para quién", "Mostrar el beneficio principal", "Crear un momento para actuar ya"],
    create: "Recurso de presentación y propuesta de valor.",
    format: "Guía o recomendación.",
    example: "Nuevo servicio: qué es y por qué te va a cambiar."
  }
};

const TYPE_INFO = {
  guia: { title: "Guía estratégica", description: "Explica un tema en profundidad con texto continuo", example: "Cómo estructurar una guía que aporte valor real" },
  checklist: { title: "Checklist", description: "Lista de verificación paso a paso", example: "Cosas que debes verificar..." },
  recomendacion: { title: "Recomendación técnica", description: "Lista numerada de recomendaciones", example: "Top 5 recomendaciones..." }
};

const CTA_PRESETS = [
  "Descargar ahora",
  "Reservar cita",
  "Contactar",
  "Mas informacion",
  "Comenzar ahora"
];

// Plantillas base (el asistente IA las personaliza al sector/negocio)
const TEMPLATES: Record<Objective, Record<LeadMagnetType, { title: string; intro: string; content: string; cta1: string; cta2: string }>> = {
  volvieron: {
    guia: { title: "GUÍA: Saca el máximo partido a tu experiencia", intro: "Aprende a mantener y potenciar los resultados obtenidos.", content: "En esta guía vas a ayudar al cliente a sacar el máximo provecho de lo que ya ha recibido.\n\nEmpieza recordándole qué hábitos debe mantener en el día a día para no perder los resultados. Después, añade recomendaciones prácticas para consolidar el progreso.\n\nCierra invitando al lector a dar el siguiente paso contigo.", cta1: "Reservar cita", cta2: "Ver más" },
    checklist: { title: "CHECKLIST: Mantén tus resultados", intro: "Comprueba que sigues los pasos correctos.", content: "Aplica lo aprendido en el día a día\nSigue las indicaciones recibidas\nContacta si tienes dudas\nPlanifica tu próxima revisión", cta1: "Reservar revisión", cta2: "Contactar" },
    recomendacion: { title: "Recomendaciones para seguir avanzando", intro: "Los próximos pasos para no perder lo conseguido.", content: "Mantén la constancia en los hábitos acordados\nEvita los errores más comunes tras el tratamiento\nPrograma una revisión de seguimiento\nContáctanos ante cualquier cambio", cta1: "Reservar cita", cta2: "Ver beneficios" }
  },
  conversion: {
    guia: { title: "GUÍA: Por qué dar el siguiente paso tiene sentido", intro: "Te explicamos el valor real de este servicio adicional.", content: "En esta guía el objetivo es que tu cliente entienda por qué el servicio adicional vale su inversión.\n\nExplica qué resultados concretos consigue quien lo añade, cómo se diferencia de no tenerlo y qué casos reales lo respaldan.\n\nTermina con una propuesta clara y sin presión para que dé el paso.", cta1: "Conocer más", cta2: "Solicitar info" },
    checklist: { title: "CHECKLIST: ¿Es el momento de ampliar tu servicio?", intro: "Comprueba si estás listo para dar el siguiente paso.", content: "Ya has experimentado los resultados básicos\nQuieres ir más lejos en menos tiempo\nBuscas una solución más completa\nValoras la atención personalizada", cta1: "Ampliar mi plan", cta2: "Hablar con nosotros" },
    recomendacion: { title: "Razones para elegir el servicio completo", intro: "Lo que marca la diferencia.", content: "Resultados más rápidos y duraderos\nAtención personalizada en cada paso\nAcceso a recursos exclusivos\nSeguimiento directo con nuestro equipo", cta1: "Solicitar info", cta2: "Pedir cita" }
  },
  referidos: {
    guia: { title: "GUÍA: Cómo recomendar y qué ganas tú", intro: "Invitar es fácil y tiene recompensa.", content: "En esta guía quieres que tu cliente vea lo fácil que es invitar y qué gana por hacerlo.\n\nExplica en una frase cómo funciona. Luego describe los pasos concretos que debe seguir para hacer la recomendación.\n\nCierra recordando qué gana quien recomienda y qué gana quien llega.", cta1: "Invitar ahora", cta2: "Ver programa" },
    checklist: { title: "CHECKLIST: Recomienda en 3 pasos", intro: "Solo te lleva un minuto.", content: "Piensa en alguien que se beneficiaría de este servicio\nComparte este documento o nuestro contacto\nAvísanos que viene de tu parte\nDisfruta de tu recompensa", cta1: "Empezar a recomendar", cta2: "Ver mi recompensa" },
    recomendacion: { title: "Por qué vale la pena recomendar", intro: "Tu recomendación tiene valor para ambos.", content: "Tu amigo recibe una atención de primera\nTú acumulas beneficios por cada recomendación\nEs el gesto más sencillo y más valorado\nNos ayudas a crecer de forma honesta", cta1: "Recomendar ahora", cta2: "Contactar" }
  },
  captar: {
    guia: { title: "GUÍA: Lo que necesitas saber antes de empezar", intro: "Toda la información para tomar la mejor decisión.", content: "Esta guía está pensada para quien aún no nos conoce pero tiene curiosidad.\n\nExplica qué problema resuelve tu servicio, a quién va dirigido y qué puede esperar en el primer contacto.\n\nTermina con una invitación sin compromiso para dar el primer paso.", cta1: "Reservar primera cita", cta2: "Conocer más" },
    checklist: { title: "CHECKLIST: ¿Eres candidato ideal?", intro: "Comprueba si este servicio es para ti.", content: "Tienes esta necesidad o problema concreto\nBuscas una solución profesional y de confianza\nValoras el trato personalizado\nQuieres resultados reales y medibles", cta1: "Solicitar información", cta2: "Hablar con nosotros" },
    recomendacion: { title: "Razones para elegirnos desde el principio", intro: "Lo que nos hace diferentes desde el día uno.", content: "Diagnóstico inicial sin compromiso\nPlan personalizado desde la primera sesión\nResultados visibles en poco tiempo\nEquipo con amplia experiencia en tu caso", cta1: "Empezar ahora", cta2: "Ver testimonios" }
  },
  reactivar: {
    guia: { title: "GUÍA: Volver es más fácil de lo que crees", intro: "Todo lo que necesitas saber para retomar donde lo dejaste.", content: "A veces la vida nos aleja de los hábitos que más nos benefician. Esta guía es para que volver sea sencillo.\n\nExplica qué ha mejorado desde la última vez, cómo se adapta el plan al punto en el que está el cliente ahora y qué resultado puede esperar en poco tiempo.\n\nTermina con una invitación directa y sin presión.", cta1: "Volver a empezar", cta2: "Hablar con nosotros" },
    checklist: { title: "CHECKLIST: Señales de que es momento de volver", intro: "Si marcas alguna de estas, te estamos esperando.", content: "Echas de menos los resultados que tenías\nNotes que algo ha empeorado sin el servicio\nTienes tiempo y motivación de nuevo\nQuieres retomar con un plan adaptado a hoy", cta1: "Reservar cita", cta2: "Contactar" },
    recomendacion: { title: "Por qué retomar ahora tiene sentido", intro: "Lo que ganas cuando vuelves.", content: "Recuperas resultados más rápido de lo que crees\nAdaptamos el plan a tu situación actual\nNo empezamos desde cero — seguimos desde donde estabas\nTe acompañamos sin juzgar el tiempo que ha pasado", cta1: "Reservar mi vuelta", cta2: "Ver opciones" }
  },
  educar: {
    guia: { title: "GUÍA: Cómo funciona nuestro servicio paso a paso", intro: "Todo lo que necesitas saber antes, durante y después.", content: "Muchos clientes llegan con dudas sobre cómo funciona el proceso. Esta guía lo explica de forma sencilla.\n\nDescribe las fases del servicio, qué hace el profesional en cada etapa y qué se espera del cliente.\n\nTermina con las preguntas más frecuentes y una invitación a resolver cualquier duda.", cta1: "Reservar primera cita", cta2: "Preguntar ahora" },
    checklist: { title: "CHECKLIST: Prepárate para tu primera cita", intro: "Lo que debes saber y traer el primer día.", content: "Lee este documento completo antes de venir\nPrepara las preguntas que tienes en mente\nTrae toda la documentación relevante\nLlega con tiempo para el proceso inicial", cta1: "Reservar cita", cta2: "Ver más info" },
    recomendacion: { title: "Lo que debes saber sobre este servicio", intro: "Información clave para tomar la mejor decisión.", content: "En qué consiste el servicio exactamente\nCuánto tiempo dura el proceso típico\nQué resultados son realistas esperar\nCómo se trabaja de forma personalizada contigo", cta1: "Pedir más info", cta2: "Reservar consulta" }
  },
  temporada: {
    guia: { title: "GUÍA: Tu plan para esta temporada", intro: "Aprovecha este momento para cuidarte como mereces.", content: "Esta época del año es perfecta para ponerte al día con tu bienestar y objetivos.\n\nExplica por qué ahora es el momento ideal para tu servicio, qué resultados puede conseguir el cliente antes de que termine la temporada y cómo aprovechar al máximo este periodo.\n\nTermina con una oferta o invitación de tiempo limitado.", cta1: "Reservar ahora", cta2: "Ver la oferta" },
    checklist: { title: "CHECKLIST: Objetivos de temporada", intro: "Lo que puedes conseguir antes de que acabe.", content: "Define tu objetivo principal para esta temporada\nReserva tus citas con antelación\nSigue el plan personalizado al completo\nComparte los resultados con nosotros", cta1: "Empezar ya", cta2: "Contactar" },
    recomendacion: { title: "Razones para actuar esta temporada", intro: "Hay momentos mejores que otros. Este es uno.", content: "Los resultados llegan más rápido si empiezas ahora\nLa disponibilidad es limitada en esta época\nTienes un plan adaptado a la temporada\nEl momento de mayor motivación es ahora", cta1: "Reservar mi plaza", cta2: "Ver disponibilidad" }
  },
  lanzamiento: {
    guia: { title: "GUÍA: Te presentamos algo nuevo", intro: "Creado específicamente para ti y tus necesidades.", content: "Hemos trabajado para crear algo que no existía antes en nuestra oferta.\n\nExplica qué es el nuevo servicio, para quién es ideal y qué problema resuelve que antes no tenías cubierto.\n\nTermina con una invitación para ser de los primeros en probarlo.", cta1: "Quiero ser el primero", cta2: "Saber más" },
    checklist: { title: "CHECKLIST: ¿Es este servicio para ti?", intro: "Comprueba si encaja con lo que buscas.", content: "Tienes la necesidad que este servicio resuelve\nBuscas una solución profesional y actualizada\nQuieres resultados desde el primer momento\nValoras ser de los primeros en acceder", cta1: "Apuntarme", cta2: "Contactar" },
    recomendacion: { title: "Por qué este lanzamiento es diferente", intro: "Lo que lo hace especial.", content: "Diseñado a partir de las necesidades reales de nuestros clientes\nMejora lo que ya existía con resultados probados\nAcceso exclusivo para clientes actuales en la primera fase\nEquipo especializado desde el primer día", cta1: "Acceder ahora", cta2: "Más información" }
  }
};

import { Suspense } from "react";

export default function LeadMagnetWizard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-white">Cargando...</div>}>
      <LeadMagnetWizardInner />
    </Suspense>
  );
}

function LeadMagnetWizardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [businessId, setBusinessId] = useState("");
  const [moduleGpt, setModuleGpt] = useState(false);
  const [gptUrl, setGptUrl] = useState("https://chatgpt.com/");
  const [advancedEnabled, setAdvancedEnabled] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  // Tracks whether content fields have been customized (either by user edit or loaded from DB).
  // When true, changing objective/type in step 3 does NOT overwrite title/intro/content.
  const contentCustomized = useRef(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [step, setStep] = useState<WizardStep>("bienvenida");
  const [objective, setObjective] = useState<Objective>("volvieron");
  const [openGuide, setOpenGuide] = useState<Objective | null>(null);
  const [type, setType] = useState<LeadMagnetType>("guia");
  const [businessName, setBusinessName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoSize, setLogoSize] = useState(32);
  const [showLogo, setShowLogo] = useState(true);
  const [customTitle, setCustomTitle] = useState("");
  const [customIntro, setCustomIntro] = useState("");
  const [customContent, setCustomContent] = useState("");
  const MAX_CONTENT_CHARS = 1200;
  const [cta1Enabled, setCta1Enabled] = useState(true);
  const [cta2Enabled, setCta2Enabled] = useState(true);
  const [cta1Text, setCta1Text] = useState("");
  const [cta1Link, setCta1Link] = useState("");
  const [cta2Text, setCta2Text] = useState("");
  const [cta2Link, setCta2Link] = useState("");
  const [newPoint, setNewPoint] = useState("");
  const [colorBrand, setColorBrand] = useState("#0a323c");
  const [colorTag, setColorTag] = useState("#0a323c");
  const [colorTitle, setColorTitle] = useState("#0a323c");
  const [colorButton, setColorButton] = useState("#ffb400");
  const [titleSize, setTitleSize] = useState(1.5);
  const [sn1, setSn1] = useState("");
  const [sn1En, setSn1En] = useState(true);
  const [sn2, setSn2] = useState("");
  const [sn2En, setSn2En] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);
  const [chatMessages, setChatMessages] = useState<WizardChatMessage[]>([]);

  useEffect(() => {
    const editId = searchParams.get("edit");
    const stepParam = searchParams.get("step") as WizardStep | null;
    const bidParam = searchParams.get("businessId");

    const load = async () => {
      let bid = bidParam || "";

      if (!bid) {
        const { data: sessionData } = await supabase.auth.getSession();
        const userEmail = sessionData?.session?.user?.email || "";
        if (!userEmail) return;
        const { data: biz } = await supabase
          .from("businesses")
          .select("id")
          .eq("contact_email", userEmail)
          .single();
        bid = biz?.id || "";
      }

      if (!bid) return;
      setBusinessId(bid);

      const [bizData, settingsData, featuresData] = await Promise.all([
        supabase.from("businesses").select("name, logo_url, module_gpt").eq("id", bid).single(),
        supabase.from("settings").select("value").eq("key", "gpt_url").single(),
        supabase.from("settings").select("value").eq("key", "features").single(),
      ]);
      const data = bizData.data;
      if (data?.name) setBusinessName(data.name);
      if (data?.logo_url) setLogoUrl(data.logo_url);
      setModuleGpt(data?.module_gpt ?? false);
      if (settingsData.data?.value) {
        try {
          const url = typeof settingsData.data.value === "string"
            ? JSON.parse(settingsData.data.value)
            : settingsData.data.value;
          if (url) setGptUrl(url);
        } catch { /* keep default */ }
      }
      if (featuresData.data?.value) {
        try {
          const f = typeof featuresData.data.value === "string"
            ? JSON.parse(featuresData.data.value)
            : featuresData.data.value;
          if (typeof f.module_lead_magnet_advanced === "boolean") {
            setAdvancedEnabled(f.module_lead_magnet_advanced);
          }
        } catch { /* keep default true */ }
      }

      // If editing an existing resource, load its data
      if (editId) {
        setEditingId(editId);
        const { data: lm } = await supabase
          .from("lead_magnets")
          .select("*")
          .eq("id", editId)
          .single();
        if (lm) {
          // Mark content as already customized before setting state, so the
          // template useEffect (which may fire after these setStates) doesn't overwrite.
          contentCustomized.current = true;
          if (lm.objective) setObjective(lm.objective as Objective);
          if (lm.type) setType(lm.type as LeadMagnetType);
          if (lm.title) setCustomTitle(lm.title);
          if (lm.intro) setCustomIntro(lm.intro);
          if (lm.content) setCustomContent(lm.content);
          if (lm.cta1_text !== undefined) setCta1Text(lm.cta1_text ?? "");
          if (lm.cta1_link !== undefined) setCta1Link(lm.cta1_link ?? "");
          if (lm.cta2_text !== undefined) setCta2Text(lm.cta2_text ?? "");
          if (lm.cta2_link !== undefined) setCta2Link(lm.cta2_link ?? "");
          if (lm.cta1_enabled !== undefined) setCta1Enabled(lm.cta1_enabled ?? true);
          if (lm.cta2_enabled !== undefined) setCta2Enabled(lm.cta2_enabled ?? true);
          if (lm.color_brand) setColorBrand(lm.color_brand);
          if (lm.color_tag) setColorTag(lm.color_tag);
          if (lm.color_title) setColorTitle(lm.color_title);
          if (lm.color_button) setColorButton(lm.color_button);
          if (lm.sn1) setSn1(lm.sn1);
          if (lm.sn2) setSn2(lm.sn2);
          if (lm.sn1_en !== undefined) setSn1En(lm.sn1_en ?? true);
          if (lm.sn2_en !== undefined) setSn2En(lm.sn2_en ?? true);
        }
        // Navigate to the requested step (default "tipo" for edit mode)
        setStep(stepParam || "tipo");
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Only apply templates when content hasn't been customized (new resource, not yet edited)
    if (contentCustomized.current) return;
    const template = TEMPLATES[objective]?.[type];
    if (template) {
      setCustomTitle(template.title);
      setCustomIntro(template.intro);
      setCustomContent(template.content);
      setCta1Text(template.cta1);
      setCta2Text(template.cta2);
    }
  }, [objective, type]);

  const getTypeLabel = () => {
    const labels: Record<LeadMagnetType, string> = {
      guia: "GUIA ESTRATEGICA",
      checklist: "CHECKLIST DE IMPLEMENTACION",
      recomendacion: "RECOMENDACION TECNICA"
    };
    return labels[type];
  };

  const renderPreview = () => {
    return (
      <LeadMagnetPreview
        businessName={businessName}
        type={type}
        customTitle={customTitle}
        customIntro={customIntro}
        customContent={customContent}
        logoUrl={logoUrl}
        logoSize={logoSize}
        showLogo={showLogo}
        cta1Enabled={cta1Enabled}
        cta2Enabled={cta2Enabled}
        cta1Text={cta1Text}
        cta1Link={cta1Link}
        cta2Text={cta2Text}
        cta2Link={cta2Link}
        colorBrand={colorBrand}
        colorTag={colorTag}
        colorTitle={colorTitle}
        colorButton={colorButton}
        titleSize={titleSize}
        sn1={sn1}
        sn1En={sn1En}
        sn2={sn2}
        sn2En={sn2En}
        sn3=""
        sn3En={false}
        sn4=""
        sn4En={false}
      />
    );
  };

  const saveLeadMagnet = async (): Promise<string | null> => {
    if (!businessId) {
      alert("Falta businessId; no se puede guardar el Recurso de Valor.");
      return null;
    }

    setSaving(true);

    const payload: Record<string, unknown> = {
      business_id: businessId,
      title: customTitle,
      subtitle: null,
      type,
      objective,
      intro: customIntro,
      content: customContent,
      sn1,
      sn2,
      sn1_en: sn1En,
      sn2_en: sn2En,
      cta1_enabled: cta1Enabled,
      cta1_text: cta1Text,
      cta1_link: cta1Link,
      cta2_enabled: cta2Enabled,
      cta2_text: cta2Text,
      cta2_link: cta2Link,
      color_brand: colorBrand,
      color_tag: colorTag,
      color_title: colorTitle,
      color_button: colorButton,
      active: true,
    };

    try {
      let result;
      if (editingId) {
        result = await supabase
          .from("lead_magnets")
          .update(payload)
          .eq("id", editingId)
          .select("id")
          .maybeSingle();
      } else {
        result = await supabase
          .from("lead_magnets")
          .insert(payload)
          .select("id")
          .single();
      }

      const { data, error } = result as { data: { id: string } | null; error: { message: string } | null };
      if (error) {
        console.error("Error al guardar lead_magnet (wizard):", error);
        alert("Error al guardar el Recurso de Valor: " + error.message);
        return null;
      }

      const id = editingId || data?.id || null;
      if (!editingId && id) {
        setEditingId(id);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return id;
    } finally {
      setSaving(false);
    }
  };

  const handleChatApply = (changes: WizardChanges) => {
    if (changes.objective) setObjective(changes.objective);
    if (changes.type) setType(changes.type as LeadMagnetType);
    if (changes.title !== undefined) setCustomTitle(changes.title);
    if (changes.intro !== undefined) setCustomIntro(changes.intro);
    if (changes.content !== undefined) setCustomContent(changes.content);
    if (changes.cta1Text !== undefined) setCta1Text(changes.cta1Text);
    if (changes.cta1Link !== undefined) setCta1Link(changes.cta1Link);
    if (changes.cta2Text !== undefined) setCta2Text(changes.cta2Text);
    if (changes.cta2Link !== undefined) setCta2Link(changes.cta2Link);
    if (changes.colorBrand !== undefined) setColorBrand(changes.colorBrand);
    if (changes.colorButton !== undefined) setColorButton(changes.colorButton);
  };

  const savePdf = async () => {
    if (!businessId) return;
    setPdfGenerating(true);

    let lmId = editingId;
    if (!lmId) {
      lmId = await saveLeadMagnet();
      if (!lmId) {
        setPdfGenerating(false);
        return;
      }
    }

    let contentHtml = customContent;
    if (type === "checklist") {
      contentHtml = customContent
        .split("\n")
        .filter((l) => l.trim())
        .map(
          (l) =>
            `<li style="display:flex;align-items:flex-start;gap:10px;margin-bottom:0.8rem"><span style="min-width:18px;height:18px;border:2px solid ${colorButton};border-radius:4px;display:inline-block;margin-top:3px"></span><span>${l}</span></li>`
        )
        .join("");
      contentHtml = `<ul style="list-style:none;padding:0">${contentHtml}</ul>`;
    } else if (type === "recomendacion") {
      contentHtml = customContent
        .split("\n")
        .filter((l) => l.trim())
        .map(
          (l) =>
            `<li style="margin-bottom:1rem;padding-left:10px;list-style:decimal;color:#000000;list-style-position:inside">${l}</li>`
        )
        .join("");
      contentHtml = `<ol style="padding-left:1.5rem;color:#000000;list-style:decimal;">${contentHtml}</ol>`;
    }

    const titleSizeSmall = titleSize * 0.6;
    let snSection = "";
    if ((sn1En && sn1) || (sn2En && sn2)) {
      snSection = `<div class="sn-section" style="position:absolute;bottom:150px;left:20mm;right:20mm;padding:1rem;border-top:1px dashed rgba(0,0,0,0.1);border-bottom:1px dashed rgba(0,0,0,0.1);border-radius:8px;font-size:0.85rem;line-height:1.4;background:#f9fafb">${
        sn1En && sn1
          ? `<div style="margin-bottom:12px;color:#000000;font-weight:bold">${sn1}</div>`
          : ""
      }${
        sn2En && sn2
          ? `<div style="margin-bottom:12px;color:#000000;font-weight:bold">${sn2}</div>`
          : ""
      }</div>`;
    }

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',sans-serif}.container{width:210mm;min-height:297mm;padding:20mm;padding-bottom:15mm;background:#fff;position:relative}.header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid ${colorBrand};padding-bottom:20px;margin-bottom:30px}.brand-wrapper{display:flex;align-items:center;gap:12px}.brand-logo{height:${logoSize}px;width:${logoSize}px;object-fit:contain;border-radius:${
      logoSize >= 40 ? "9999px" : "6px"
    }}.brand{font-size:1.2rem;font-weight:900;color:${colorBrand};text-transform:uppercase}.tag{background:${colorTag};color:#fff;padding:5px 15px;border-radius:4px;font-size:0.7rem;font-weight:700;text-transform:uppercase}.title{font-size:${titleSizeSmall}rem;font-weight:900;color:${colorTitle};line-height:1.1;margin-bottom:20px;text-transform:uppercase}.subtitle{font-size:1.1rem;color:#4B5563;margin-bottom:30px}.section{margin-bottom:20px}.section h4{color:${colorBrand};font-size:0.9rem;text-transform:uppercase;border-left:4px solid ${colorBrand};padding-left:10px;margin-bottom:15px}.content{font-size:0.9rem;color:#374151;line-height:1.8;white-space:pre-line}.cta-box{position:absolute;bottom:60px;left:20mm;right:20mm;display:flex;justify-content:center;gap:15px;flex-wrap:wrap}.cta-btn{padding:12px 25px;border-radius:8px;background:${colorButton};color:#fff;font-weight:800;text-transform:uppercase;font-size:0.85rem;text-decoration:none}.cta-btn-outline{padding:12px 25px;border-radius:8px;border:2px solid ${colorButton};color:${colorButton};font-weight:800;text-transform:uppercase;font-size:0.85rem;text-decoration:none}</style></head><body><div class="container"><div class="header"><div class="brand-wrapper">${
      showLogo && logoUrl
        ? `<img src="${logoUrl}" alt="logo" class="brand-logo" />`
        : ""
    }<div class="brand">${(businessName || "MI NEGOCIO").toUpperCase()}</div></div><div class="tag">${getTypeLabel()}</div></div><div class="title">${customTitle || "TITULO"}</div><div class="subtitle">${customIntro || ""}</div><div class="section"><h4>${getTypeLabel()}</h4><div class="content">${contentHtml}</div></div>${snSection}<div class="cta-box">${
      cta1Enabled && cta1Text
        ? `<a href="${cta1Link || "#"}" class="cta-btn" target="_blank">${cta1Text}</a>`
        : ""
    }${
      cta2Enabled && cta2Text
        ? `<a href="${cta2Link || "#"}" class="cta-btn-outline" target="_blank">${cta2Text}</a>`
        : ""
    }</div></div></body></html>`;

    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/lead-magnet/generate-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token || ""}`,
      },
      body: JSON.stringify({ html, businessId, title: customTitle, leadMagnetId: lmId }),
    });

    const data = await res.json();
    if (data.error) {
      alert("Error al guardar el PDF: " + data.error);
      setPdfGenerating(false);
    } else {
      setPdfGenerating(false);
      router.push("/lead-magnet");
    }
  };

  const renderStep = () => {
    switch (step) {
      case "bienvenida":
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-xl md:text-3xl font-bold mb-4" style={{ color: "#ffffff" }}>
                Convierte tu conocimiento en un activo para tu negocio
              </h2>
              <p className="text-sm md:text-lg text-white max-w-2xl mx-auto">
                Este asistente te ayuda a transformar tu experiencia profesional y conocimiento de negocio en un recurso valioso que tus clientes pueden descargar.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="w-12 h-12 rounded-full bg-[#39a1a9] flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-center mb-2" style={{ color: "#ffffff" }}>Construye confianza</h3>
                <p className="text-sm text-white text-center">
                  Comparte tu expertise profesional para que tus clientes vean que eres un experto en tu sector.
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="w-12 h-12 rounded-full bg-[#ffb400] flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-center mb-2" style={{ color: "#ffffff" }}>Educa a tus clientes</h3>
                <p className="text-sm text-white text-center">
                  Explica cómo funciona tu servicio, qué beneficios reales ofrecen tus productos y por qué elegirte a ti.
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-center mb-2" style={{ color: "#ffffff" }}>Genera accion</h3>
                <p className="text-sm text-white text-center">
                  Convierte tu conocimiento en una herramienta que impulsa a tus clientes a tomar una decision.
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#0a323c] to-[#001e3c] rounded-xl p-6 border border-[#39a1a9]/30">
              <h3 className="text-lg font-bold mb-3" style={{ color: "#ffffff" }}>¿Qué vas a crear?</h3>
              <p className="text-white text-sm mb-4">
                Un documento PDF profesional que puedes regalar a tus clientes potenciales o actuales. Incluye tu conocimiento, consejos profesionales y una llamada a la accion directa.
              </p>
              <ul className="text-sm text-white space-y-2">
                <li className="flex items-center gap-2"><span className="text-[#ffb400]">+</span> Guia con pasos clave de tu servicio</li>
                <li className="flex items-center gap-2"><span className="text-[#ffb400]">+</span> Checklist de verificacion para tus clientes</li>
                <li className="flex items-center gap-2"><span className="text-[#ffb400]">+</span> Recomendaciones profesionales exclusivas</li>
              </ul>
            </div>

            <div className="flex justify-center mt-8">
              <button
                onClick={() => setStep("objetivo")}
                className="px-6 md:px-10 py-3 md:py-4 rounded-full bg-[#ffb400] text-black font-bold text-base md:text-lg w-full sm:w-auto"
              >
                Comenzar a crear mi recurso
              </button>
            </div>
          </div>
        );

      case "objetivo":
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: "#ffffff" }}>¿Qué quieres conseguir con este recurso?</h2>
              <p className="text-white/70 text-sm">Elige el objetivo y el asistente adaptará el contenido a tu negocio</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(Object.entries(OBJECTIVE_INFO) as [Objective, typeof OBJECTIVE_INFO[Objective]][]).map(([key, info]) => {
                const guide = OBJECTIVE_GUIDE[key];
                const isOpen = openGuide === key;
                const isSelected = objective === key;

                return (
                  <div
                    key={key}
                    className="rounded-xl transition-all border-2 overflow-hidden"
                    style={{
                      borderColor: isSelected ? info.color : "rgba(255,255,255,0.1)",
                      backgroundColor: isSelected ? `${info.color}18` : "rgba(255,255,255,0.04)"
                    }}
                  >
                    {/* Card principal — clickable */}
                    <button
                      type="button"
                      onClick={() => { setObjective(key); setOpenGuide(null); }}
                      className="w-full text-left p-3 md:p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                            style={{ backgroundColor: info.color, color: "#000" }}>✓</span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold leading-tight mb-1" style={{ color: "#ffffff" }}>{info.title}</h3>
                      <p className="text-[11px] text-white/60 leading-snug">{info.description}</p>
                      {/* Sector tags */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {info.sectors.map((s) => (
                          <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-full border border-white/15 text-white/50">
                            {s}
                          </span>
                        ))}
                      </div>
                    </button>

                    {/* Toggle detalle */}
                    <div className="px-3 pb-3">
                      <button
                        type="button"
                        onClick={() => setOpenGuide(isOpen ? null : key)}
                        className="text-[10px] text-white/40 hover:text-white/70 flex items-center gap-1"
                      >
                        {isOpen ? "▲ ocultar" : "▼ más info"}
                      </button>
                      {isOpen && guide && (
                        <div className="mt-2 text-[11px] text-white/70 space-y-1 border-t border-white/10 pt-2">
                          <div><strong className="text-white/90">Qué consigues:</strong> {guide.whatIs}</div>
                          <div><strong className="text-white/90">Formato:</strong> {guide.format}</div>
                          <div><strong className="text-white/90">Ejemplo:</strong> <span className="italic">{guide.example}</span></div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Resumen del objetivo seleccionado */}
            {objective && (
              <div className="rounded-xl p-4 border border-white/10 bg-white/5">
                <div className="text-sm font-bold text-white">{OBJECTIVE_INFO[objective].title}</div>
                <div className="text-xs text-white/60 mt-0.5">{OBJECTIVE_INFO[objective].description}</div>
                <div className="text-xs text-white/40 mt-1 italic">Ej: {OBJECTIVE_INFO[objective].example}</div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
              <button
                onClick={() => setStep("bienvenida")}
                className="px-6 py-3 rounded-full border border-white/20 text-white"
              >
                Atrás
              </button>
              <button
                onClick={() => setStep("tipo")}
                className="px-8 py-3 rounded-full bg-[#ffb400] text-black font-bold"
              >
                Continuar con &quot;{OBJECTIVE_INFO[objective].title}&quot;
              </button>
            </div>
          </div>
        );

      case "tipo":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: "#ffffff" }}>¿Qué tipo de recurso es?</h2>
              <p className="text-white">Elige el formato</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
              {Object.entries(TYPE_INFO).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => setType(key as LeadMagnetType)}
                  className="p-4 md:p-6 rounded-xl text-center transition-all border-2"
                  style={{
                    borderColor: type === key ? "#ffb400" : "rgba(255,255,255,0.1)",
                    backgroundColor: type === key ? "rgba(255,180,0,0.1)" : "rgba(255,255,255,0.05)"
                  }}
                >
                  <h3 className="text-lg font-bold mb-2" style={{ color: "#ffffff" }}>{info.title}</h3>
                  <p className="text-sm text-white mb-3">{info.description}</p>
                  <div className="text-xs text-white italic">Ej: {info.example}</div>
                </button>
              ))}
            </div>
            <div className="mb-6">
              <div className="text-xs uppercase tracking-widest text-[#39a1a9] mb-3">VISTA PREVIA</div>
              {renderPreview()}
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8">
              <button
                onClick={() => setStep("objetivo")}
                className="px-6 py-3 rounded-full border border-white/20"
                style={{ color: "#ffffff" }}
              >
                Atras
              </button>
              <button
                onClick={() => setStep("contenido")}
                className="px-8 py-3 rounded-full bg-[#ffb400] text-black font-bold"
              >
                Continuar
              </button>
            </div>
          </div>
        );

      case "contenido": {
        const contentPoints = customContent.split("\n").filter(l => l.trim());
        const parsedPoints = contentPoints.map((point) =>
          point.replace(/^(\d+[.)]) */, "").replace(/^[-•] */, "")
        );

        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: "#ffffff" }}>Personaliza tu contenido</h2>
              <p className="text-white">Edita los datos generados</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs uppercase tracking-widest text-[#39a1a9] mb-2">Titulo del documento</label>
                <textarea
                  value={customTitle}
                  onChange={(e) => { contentCustomized.current = true; setCustomTitle(e.target.value); }}
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white"
                  style={{ color: "#ffffff" }}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-[#39a1a9] mb-2">Descripcion inicial</label>
                <textarea
                  value={customIntro}
                  onChange={(e) => { contentCustomized.current = true; setCustomIntro(e.target.value); }}
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white"
                  style={{ color: "#ffffff" }}
                />
              </div>

              {type === "guia" ? (
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#39a1a9] mb-2">
                    Contenido principal (texto continuo)
                  </label>
                  <textarea
                    value={customContent}
                    onChange={(e) => {
                      if (e.target.value.length <= MAX_CONTENT_CHARS) {
                        contentCustomized.current = true;
                        setCustomContent(e.target.value);
                      }
                    }}
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white text-sm resize-none"
                    placeholder="Escribe aquí el contenido de tu guía en formato texto seguido..."
                    style={{ color: "#ffffff" }}
                  />
                  <div className={`text-xs mt-2 ${customContent.length > MAX_CONTENT_CHARS * 0.9 ? "text-red-400" : "text-white"}`}>
                    {customContent.length} / {MAX_CONTENT_CHARS} caracteres (maximo para 1 pagina)
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#39a1a9] mb-2">
                    Contenido - Puntos (seleccionables)
                  </label>

                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newPoint}
                      onChange={(e) => setNewPoint(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm"
                      style={{ color: "#f9fafb" }}
                      placeholder="Escribe un nuevo punto y pulsa Añadir"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newPoint.trim()) return;
                        contentCustomized.current = true;
                        const updated = [...parsedPoints, newPoint.trim()];
                        setCustomContent(updated.join("\n"));
                        setNewPoint("");
                      }}
                      className="text-xs px-3 py-2 rounded-lg bg-[#39a1a9]/80 text-black font-bold hover:bg-[#39a1a9]"
                    >
                      Añadir
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto bg-white/5 rounded-lg p-3 border border-white/10">
                    {parsedPoints.length === 0 ? (
                      <p className="text-white text-sm">No hay puntos disponibles</p>
                    ) : (
                      parsedPoints.map((point, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-2 rounded hover:bg-white/5">
                          <div className="w-6 h-6 mt-1 flex items-center justify-center rounded-full bg-[#39a1a9]/20 border border-[#39a1a9]/60 text-[10px] font-bold text-[#39a1a9]">
                            {idx + 1}
                          </div>
                          <textarea
                            value={point}
                            onChange={(e) => {
                              const newPoints = [...parsedPoints];
                              newPoints[idx] = e.target.value;
                              setCustomContent(newPoints.join("\n"));
                            }}
                            rows={1}
                            className="flex-1 px-2 py-1 rounded bg-transparent border border-transparent hover:border-white/20 text-white text-sm resize-none"
                            placeholder={`Punto ${idx + 1}...`}
                            style={{ color: "#ffffff" }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newPoints = parsedPoints.filter((_, i) => i !== idx);
                              setCustomContent(newPoints.join("\n"));
                            }}
                            className="ml-2 text-xs text-red-300 hover:text-red-400"
                            title="Eliminar punto"
                          >
                            Eliminar
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setCustomContent(prev => (prev ? prev + "\nNuevo punto" : "Nuevo punto"))}
                      className="text-xs px-3 py-1 rounded bg-[#39a1a9]/20 text-[#39a1a9] hover:bg-[#39a1a9]/30"
                    >
                      + Añadir punto
                    </button>
                  </div>
                  <div className={`text-xs mt-2 ${customContent.length > MAX_CONTENT_CHARS * 0.9 ? "text-red-400" : "text-white"}`}>
                    {customContent.length} / {MAX_CONTENT_CHARS} caracteres (maximo para 1 pagina)
                  </div>
                </div>
              )}

              <div className="border-t border-white/10 pt-4">
                <label className="block text-xs uppercase tracking-widest text-[#39a1a9] mb-2">Cierre / Llamada a la accion</label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={sn1En}
                      onChange={(e) => setSn1En(e.target.checked)}
                      className="w-4 h-4 accent-[#39a1a9]"
                    />
                    <input
                      type="text"
                      value={sn1}
                      onChange={(e) => setSn1(e.target.value)}
                      placeholder="Texto de cierre linea 1..."
                      className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm"
                      style={{ color: "#ffffff" }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={sn2En}
                      onChange={(e) => setSn2En(e.target.checked)}
                      className="w-4 h-4 accent-[#39a1a9]"
                    />
                    <input
                      type="text"
                      value={sn2}
                      onChange={(e) => setSn2(e.target.value)}
                      placeholder="Texto de cierre linea 2..."
                      className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm"
                      style={{ color: "#ffffff" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="text-xs uppercase tracking-widest text-[#39a1a9] mb-3">VISTA PREVIA</div>
              {renderPreview()}
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8">
              <button
                onClick={() => setStep("tipo")}
                className="w-full sm:w-auto px-6 py-3 rounded-full border border-white/20"
                style={{ color: "#ffffff" }}
              >
                Atras
              </button>
              <button
                onClick={() => setStep("personalizacion")}
                className="w-full sm:w-auto px-8 py-3 rounded-full bg-[#ffb400] text-black font-bold"
              >
                Continuar
              </button>
            </div>
          </div>
        );
      }

      case "personalizacion":
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: "#ffffff" }}>Personalizacion de botones y colores</h2>
              <p className="text-white">Configura los botones CTA y los colores del documento</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 mb-6">
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold">Boton Principal (CTA 1)</h3>
                  <label className="flex items-center gap-2 text-sm text-white">
                    <input type="checkbox" checked={cta1Enabled} onChange={(e) => setCta1Enabled(e.target.checked)} className="w-4 h-4 accent-[#ffb400]" />
                    Activar
                  </label>
                </div>
                {cta1Enabled && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-white mb-1">Texto del boton</label>
                      <select
                        value={cta1Text}
                        onChange={(e) => setCta1Text(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm"
                        style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "white" }}
                      >
                        <option value="" style={{ color: "#999" }}>Seleccionar opcion...</option>
                        {CTA_PRESETS.map(opt => (
                          <option key={opt} value={opt} style={{ color: "white", backgroundColor: "#1e293b" }}>{opt}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={cta1Text}
                        onChange={(e) => setCta1Text(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm mt-2"
                        style={{ color: "#f9fafb" }}
                        placeholder="O escribe tu propio texto..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white mb-1">Enlace (URL)</label>
                      <div className="space-y-2">
                        <ActionLinkPicker value={cta1Link} onChange={setCta1Link} label="" />
                        <input
                          type="text"
                          value={cta1Link}
                          onChange={(e) => setCta1Link(e.target.value)}
                          placeholder="O escribe una URL manualmente..."
                          className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold">Boton Secundario (CTA 2)</h3>
                  <label className="flex items-center gap-2 text-sm text-white">
                    <input type="checkbox" checked={cta2Enabled} onChange={(e) => setCta2Enabled(e.target.checked)} className="w-4 h-4 accent-[#ffb400]" />
                    Activar
                  </label>
                </div>
                {cta2Enabled && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-white mb-1">Texto del boton</label>
                      <select
                        value={cta2Text}
                        onChange={(e) => setCta2Text(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm"
                        style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "white" }}
                      >
                        <option value="" style={{ color: "#999" }}>Seleccionar opcion...</option>
                        {CTA_PRESETS.map(opt => (
                          <option key={opt} value={opt} style={{ color: "white", backgroundColor: "#1e293b" }}>{opt}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={cta2Text}
                        onChange={(e) => setCta2Text(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm mt-2"
                        style={{ color: "#f9fafb" }}
                        placeholder="O escribe tu propio texto..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white mb-1">Enlace (URL)</label>
                      <div className="space-y-2">
                        <ActionLinkPicker value={cta2Link} onChange={setCta2Link} label="" />
                        <input
                          type="text"
                          value={cta2Link}
                          onChange={(e) => setCta2Link(e.target.value)}
                          placeholder="O escribe una URL manualmente..."
                          className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4 md:p-6 mb-6">
              <h3 className="text-white font-bold mb-4">Colores del documento</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <label className="block text-xs text-white mb-2">Color marca (texto nombre negocio, borde)</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={colorBrand} onChange={(e) => setColorBrand(e.target.value)} className="w-12 h-12 rounded cursor-pointer" />
                    <input type="text" value={colorBrand} onChange={(e) => setColorBrand(e.target.value)} className="flex-1 px-2 py-1 rounded bg-white/10 border border-white/10 text-white text-sm uppercase" />
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <label className="block text-xs text-white mb-2">Color etiqueta (fondo badge)</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={colorTag} onChange={(e) => setColorTag(e.target.value)} className="w-12 h-12 rounded cursor-pointer" />
                    <input type="text" value={colorTag} onChange={(e) => setColorTag(e.target.value)} className="flex-1 px-2 py-1 rounded bg-white/10 border border-white/10 text-white text-sm uppercase" />
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <label className="block text-xs text-white mb-2">Color titulo</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={colorTitle} onChange={(e) => setColorTitle(e.target.value)} className="w-12 h-12 rounded cursor-pointer" />
                    <input type="text" value={colorTitle} onChange={(e) => setColorTitle(e.target.value)} className="flex-1 px-2 py-1 rounded bg-white/10 border border-white/10 text-white text-sm uppercase" />
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <label className="block text-xs text-white mb-2">Color boton (CTA principal)</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={colorButton} onChange={(e) => setColorButton(e.target.value)} className="w-12 h-12 rounded cursor-pointer" />
                    <input type="text" value={colorButton} onChange={(e) => setColorButton(e.target.value)} className="flex-1 px-2 py-1 rounded bg-white/10 border border-white/10 text-white text-sm uppercase" />
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10 md:col-span-2">
                  <label className="block text-xs text-white mb-2">Tamano del titulo</label>
                  <div className="flex items-center gap-4 mb-3">
                    <input type="range" min="1" max="3" step="0.1" value={titleSize} onChange={(e) => setTitleSize(Number(e.target.value))} className="flex-1" />
                    <div className="text-sm text-white font-bold w-16 text-center">{titleSize}rem</div>
                  </div>
                  <label className="block text-xs text-white mb-2">Tamano del logo</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={16}
                      max={80}
                      step={2}
                      value={logoSize}
                      onChange={(e) => setLogoSize(Number(e.target.value))}
                      className="flex-1"
                    />
                    <div className="text-sm text-white font-bold w-16 text-center">{logoSize}px</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="text-xs uppercase tracking-widest text-[#39a1a9] mb-3">VISTA PREVIA</div>
              {renderPreview()}
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8">
              <button
                onClick={() => setStep("contenido")}
                className="w-full sm:w-auto px-6 py-3 rounded-full border border-white/20"
                style={{ color: "#ffffff" }}
              >
                Atras
              </button>
              <button
                onClick={savePdf}
                disabled={pdfGenerating}
                className="w-full sm:w-auto px-8 py-3 rounded-full bg-[#ffb400] text-black font-bold disabled:opacity-50"
              >
                {pdfGenerating ? "Guardando..." : "Guardar PDF"}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Suppress unused variable warnings for saving/saved states used implicitly
  void saving;
  void saved;

  const steps: WizardStep[] = ["bienvenida", "objetivo", "tipo", "contenido", "personalizacion"];

  const showChat = step !== "bienvenida" && !!businessId;

  const currentState: Record<string, unknown> = {
    objective,
    type,
    title: customTitle,
    intro: customIntro,
    content: customContent,
    cta1Text,
    cta1Link,
    cta2Text,
    cta2Link,
    colorBrand,
    colorButton,
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Onboarding drawer — guía paso a paso */}
      {businessId && (
        <OnboardingDrawer
          context="resources"
          businessId={businessId}
          moduleGpt={moduleGpt}
          gptUrl={gptUrl}
        />
      )}
      <div className={`${showChat ? "max-w-7xl" : "max-w-5xl"} mx-auto md:px-6 md:py-4 lg:px-8 lg:py-6`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-8">
          <div>
            <h1 className="text-[#ffb400] text-base md:text-lg font-extrabold tracking-widest uppercase">Recurso de Valor</h1>
            <p className="text-white text-xs md:text-sm">Convierte tu conocimiento en un recurso valioso para tus clientes</p>
          </div>
          {advancedEnabled && (
            <Link href="/lead-magnet/new" className="text-white hover:text-white text-xs md:text-sm">
              Volver al editor avanzado
            </Link>
          )}
        </div>

        <div className="flex items-center justify-center gap-1 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <button
                type="button"
                onClick={() => setStep(s)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors flex-shrink-0 ${
                  step === s
                    ? "bg-[#ffb400] text-black"
                    : steps.indexOf(step) > i
                    ? "bg-green-500 text-white"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {i + 1}
              </button>
              {i < steps.length - 1 && (
                <div
                  className={`w-4 md:w-8 h-0.5 mx-0.5 flex-shrink-0 ${steps.indexOf(step) > i ? "bg-green-500" : "bg-white/10"}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className={showChat ? "flex gap-6 items-start" : ""}>
          {/* Main wizard card */}
          <div className={showChat ? "flex-1 min-w-0" : ""}>
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-4 md:p-8">
              {renderStep()}
            </div>
          </div>

          {/* AI Chat sidebar — steps 2-5 only, lg screens */}
          {showChat && (
            <div className="w-80 flex-shrink-0 hidden lg:block">
              <LeadMagnetAiChat
                businessId={businessId}
                businessName={businessName}
                currentStep={step}
                currentState={currentState}
                messages={chatMessages}
                onMessages={setChatMessages}
                onApply={handleChatApply}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
