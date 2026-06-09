"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { LeadMagnetPreview } from "@/components/LeadMagnetPreview";
import { splitPoints, joinPoints, stripBullet, pointToHtml } from "@/lib/leadmagnet-format";

// ── Tipos ─────────────────────────────────────────────────────────────────────

type ResourceType = "pdf" | "url";
type DocType = "guia" | "checklist" | "recomendacion";
type Objective =
  | "captar" | "educar" | "referidos" | "temporada" | "lanzamiento"
  | "volvieron" | "conversion" | "reactivar";

// Steps cambian según el tipo seleccionado
type WizardStep = "bienvenida" | "tipo" | "objetivo" | "contenido" | "personalizacion" | "preview";
type StepStatus = "done" | "warning" | "error" | "current" | "pending";

// ── Datos objetivos ────────────────────────────────────────────────────────────

const OBJECTIVE_INFO: Record<Objective, { title: string; description: string; color: string }> = {
  captar:     { title: "Captar clientes nuevos",    description: "Atrae a personas que aún no te conocen con un recurso que demuestra tu valor.",    color: "#06b6d4" },
  educar:     { title: "Educar al cliente",          description: "Explica cómo funciona tu servicio para que confíe y decida con información.",       color: "#3b82f6" },
  referidos:  { title: "Conseguir referidos",        description: "Facilita que clientes o visitantes te recomienden desde el primer contacto.",       color: "#a78bfa" },
  temporada:  { title: "Campaña de temporada",       description: "Aprovecha una fecha clave o época del año para atraer clientes nuevos.",           color: "#ec4899" },
  lanzamiento:{ title: "Lanzar un servicio",         description: "Presenta un servicio o producto nuevo y explica por qué es relevante.",            color: "#10b981" },
  volvieron:  { title: "Que vuelvan",                description: "Motiva que los clientes actuales regresen con continuidad y seguimiento.",          color: "#ffb400" },
  conversion: { title: "Aumentar ventas",            description: "Sube el ticket medio mostrando el valor de un servicio o producto adicional.",      color: "#22c55e" },
  reactivar:  { title: "Recuperar inactivos",        description: "Recupera clientes que dejaron de venir con un mensaje de valor y sin presión.",     color: "#f97316" },
};

const DOC_TYPE_INFO: Record<DocType, { title: string; description: string; example: string }> = {
  guia:         { title: "Guía estratégica",        description: "Texto continuo que explica un tema en profundidad",           example: "Ej: Cómo prepararte antes de tu primera visita" },
  checklist:    { title: "Checklist",               description: "Lista de verificación paso a paso accionable",               example: "Ej: 7 cosas que debes comprobar antes de contratar" },
  recomendacion:{ title: "Recomendación técnica",   description: "Lista numerada de recomendaciones del experto",              example: "Ej: Top 5 consejos que nadie te cuenta" },
};

// Plantillas de contenido por objetivo × tipo de documento
const TEMPLATES: Record<Objective, Record<DocType, { title: string; intro: string; content: string; cta1: string; cta2: string }>> = {
  captar: {
    guia:         { title: "GUÍA: Lo que necesitas saber antes de empezar", intro: "Toda la información para tomar la mejor decisión.",    content: "Esta guía está pensada para quien aún no nos conoce pero tiene curiosidad.\n\nExplica qué problema resuelve tu servicio, a quién va dirigido y qué puede esperar en el primer contacto.\n\nTermina con una invitación sin compromiso para dar el primer paso.", cta1: "Reservar primera cita", cta2: "Conocer más" },
    checklist:    { title: "CHECKLIST: ¿Eres el cliente ideal?",             intro: "Comprueba si este servicio es para ti.",               content: "Tienes esta necesidad o problema concreto\nBuscas una solución profesional y de confianza\nValoras el trato personalizado\nQuieres resultados reales y medibles", cta1: "Solicitar información", cta2: "Hablar con nosotros" },
    recomendacion:{ title: "Razones para elegirnos desde el principio",      intro: "Lo que nos hace diferentes desde el día uno.",         content: "Diagnóstico inicial sin compromiso\nPlan personalizado desde la primera sesión\nResultados visibles en poco tiempo\nEquipo con amplia experiencia en tu caso", cta1: "Empezar ahora", cta2: "Ver testimonios" },
  },
  educar: {
    guia:         { title: "GUÍA: Cómo funciona nuestro servicio paso a paso", intro: "Todo lo que necesitas saber antes, durante y después.", content: "Muchos clientes llegan con dudas sobre cómo funciona el proceso. Esta guía lo explica de forma sencilla.\n\nDescribe las fases del servicio, qué hace el profesional en cada etapa y qué se espera del cliente.\n\nTermina con las preguntas más frecuentes y una invitación a resolver cualquier duda.", cta1: "Reservar primera cita", cta2: "Preguntar ahora" },
    checklist:    { title: "CHECKLIST: Prepárate para tu primera cita",        intro: "Lo que debes saber y traer el primer día.",            content: "Lee este documento completo antes de venir\nPrepara las preguntas que tienes en mente\nTrae toda la documentación relevante\nLlega con tiempo para el proceso inicial", cta1: "Reservar cita", cta2: "Ver más info" },
    recomendacion:{ title: "Lo que debes saber sobre este servicio",           intro: "Información clave para tomar la mejor decisión.",      content: "En qué consiste el servicio exactamente\nCuánto tiempo dura el proceso típico\nQué resultados son realistas esperar\nCómo se trabaja de forma personalizada contigo", cta1: "Pedir más info", cta2: "Reservar consulta" },
  },
  referidos: {
    guia:         { title: "GUÍA: Cómo recomendar y qué ganas tú",   intro: "Invitar es fácil y tiene recompensa.",           content: "En esta guía quieres que quien ya te conoce vea lo fácil que es invitar y qué gana por hacerlo.\n\nExplica en una frase cómo funciona. Luego describe los pasos concretos que debe seguir para hacer la recomendación.\n\nCierra recordando qué gana quien recomienda y qué gana quien llega.", cta1: "Invitar ahora", cta2: "Ver programa" },
    checklist:    { title: "CHECKLIST: Recomienda en 3 pasos",        intro: "Solo te lleva un minuto.",                      content: "Piensa en alguien que se beneficiaría de este servicio\nComparte este documento o nuestro contacto\nAvísanos que viene de tu parte\nDisfruta de tu recompensa", cta1: "Empezar a recomendar", cta2: "Ver mi recompensa" },
    recomendacion:{ title: "Por qué vale la pena recomendar",         intro: "Tu recomendación tiene valor para ambos.",       content: "Tu amigo recibe una atención de primera\nTú acumulas beneficios por cada recomendación\nEs el gesto más sencillo y más valorado\nNos ayudas a crecer de forma honesta", cta1: "Recomendar ahora", cta2: "Contactar" },
  },
  temporada: {
    guia:         { title: "GUÍA: Tu plan para esta temporada",  intro: "Aprovecha este momento para cuidarte como mereces.", content: "Esta época del año es perfecta para ponerte al día con tu bienestar y objetivos.\n\nExplica por qué ahora es el momento ideal para tu servicio, qué resultados puede conseguir el cliente antes de que termine la temporada y cómo aprovechar al máximo este periodo.\n\nTermina con una oferta o invitación de tiempo limitado.", cta1: "Reservar ahora", cta2: "Ver la oferta" },
    checklist:    { title: "CHECKLIST: Objetivos de temporada",   intro: "Lo que puedes conseguir antes de que acabe.",      content: "Define tu objetivo principal para esta temporada\nReserva tus citas con antelación\nSigue el plan personalizado al completo\nComparte los resultados con nosotros", cta1: "Empezar ya", cta2: "Contactar" },
    recomendacion:{ title: "Razones para actuar esta temporada",  intro: "Hay momentos mejores que otros. Este es uno.",     content: "Los resultados llegan más rápido si empiezas ahora\nLa disponibilidad es limitada en esta época\nTienes un plan adaptado a la temporada\nEl momento de mayor motivación es ahora", cta1: "Reservar mi plaza", cta2: "Ver disponibilidad" },
  },
  lanzamiento: {
    guia:         { title: "GUÍA: Te presentamos algo nuevo",           intro: "Creado específicamente para ti y tus necesidades.",    content: "Hemos trabajado para crear algo que no existía antes en nuestra oferta.\n\nExplica qué es el nuevo servicio, para quién es ideal y qué problema resuelve que antes no tenías cubierto.\n\nTermina con una invitación para ser de los primeros en probarlo.", cta1: "Quiero ser el primero", cta2: "Saber más" },
    checklist:    { title: "CHECKLIST: ¿Es este servicio para ti?",     intro: "Comprueba si encaja con lo que buscas.",              content: "Tienes la necesidad que este servicio resuelve\nBuscas una solución profesional y actualizada\nQuieres resultados desde el primer momento\nValoras ser de los primeros en acceder", cta1: "Apuntarme", cta2: "Contactar" },
    recomendacion:{ title: "Por qué este lanzamiento es diferente",     intro: "Lo que lo hace especial.",                            content: "Diseñado a partir de las necesidades reales de nuestros clientes\nMejora lo que ya existía con resultados probados\nAcceso exclusivo para clientes actuales en la primera fase\nEquipo especializado desde el primer día", cta1: "Acceder ahora", cta2: "Más información" },
  },
  volvieron: {
    guia:         { title: "GUÍA: Saca el máximo partido a tu experiencia", intro: "Aprende a mantener y potenciar los resultados obtenidos.",  content: "En esta guía vas a ayudar al cliente a sacar el máximo provecho de lo que ya ha recibido.\n\nEmpieza recordándole qué hábitos debe mantener en el día a día para no perder los resultados. Después, añade recomendaciones prácticas para consolidar el progreso.\n\nCierra invitando al lector a dar el siguiente paso contigo.", cta1: "Reservar cita", cta2: "Ver más" },
    checklist:    { title: "CHECKLIST: Mantén tus resultados",           intro: "Comprueba que sigues los pasos correctos.",               content: "Aplica lo aprendido en el día a día\nSigue las indicaciones recibidas\nContacta si tienes dudas\nPlanifica tu próxima revisión", cta1: "Reservar revisión", cta2: "Contactar" },
    recomendacion:{ title: "Recomendaciones para seguir avanzando",      intro: "Los próximos pasos para no perder lo conseguido.",        content: "Mantén la constancia en los hábitos acordados\nEvita los errores más comunes tras el tratamiento\nPrograma una revisión de seguimiento\nContáctanos ante cualquier cambio", cta1: "Reservar cita", cta2: "Ver beneficios" },
  },
  conversion: {
    guia:         { title: "GUÍA: Por qué dar el siguiente paso tiene sentido", intro: "Te explicamos el valor real de este servicio adicional.", content: "En esta guía el objetivo es que tu cliente entienda por qué el servicio adicional vale su inversión.\n\nExplica qué resultados concretos consigue quien lo añade, cómo se diferencia de no tenerlo y qué casos reales lo respaldan.\n\nTermina con una propuesta clara y sin presión para que dé el paso.", cta1: "Conocer más", cta2: "Solicitar info" },
    checklist:    { title: "CHECKLIST: ¿Es el momento de ampliar tu servicio?", intro: "Comprueba si estás listo para dar el siguiente paso.", content: "Ya has experimentado los resultados básicos\nQuieres ir más lejos en menos tiempo\nBuscas una solución más completa\nValoras la atención personalizada", cta1: "Ampliar mi plan", cta2: "Hablar con nosotros" },
    recomendacion:{ title: "Razones para elegir el servicio completo",           intro: "Lo que marca la diferencia.",                        content: "Resultados más rápidos y duraderos\nAtención personalizada en cada paso\nAcceso a recursos exclusivos\nSeguimiento directo con nuestro equipo", cta1: "Solicitar info", cta2: "Pedir cita" },
  },
  reactivar: {
    guia:         { title: "GUÍA: Volver es más fácil de lo que crees",      intro: "Todo lo que necesitas saber para retomar donde lo dejaste.", content: "A veces la vida nos aleja de los hábitos que más nos benefician. Esta guía es para que volver sea sencillo.\n\nExplica qué ha mejorado desde la última vez, cómo se adapta el plan al punto en el que está el cliente ahora y qué resultado puede esperar en poco tiempo.\n\nTermina con una invitación directa y sin presión.", cta1: "Volver a empezar", cta2: "Hablar con nosotros" },
    checklist:    { title: "CHECKLIST: Señales de que es momento de volver",  intro: "Si marcas alguna de estas, te estamos esperando.",       content: "Echas de menos los resultados que tenías\nNotas que algo ha empeorado sin el servicio\nTienes tiempo y motivación de nuevo\nQuieres retomar con un plan adaptado a hoy", cta1: "Reservar cita", cta2: "Contactar" },
    recomendacion:{ title: "Por qué retomar ahora tiene sentido",             intro: "Lo que ganas cuando vuelves.",                           content: "Recuperas resultados más rápido de lo que crees\nAdaptamos el plan a tu situación actual\nNo empezamos desde cero — seguimos desde donde estabas\nTe acompañamos sin juzgar el tiempo que ha pasado", cta1: "Reservar mi vuelta", cta2: "Ver opciones" },
  },
};

const CTA_PRESETS = ["Reservar cita", "Descargar ahora", "Contactar", "Más información", "Comenzar ahora", "Pedir mi acceso"];

// ── Pasos según tipo ──────────────────────────────────────────────────────────

function getSteps(type: ResourceType): WizardStep[] {
  if (type === "pdf") return ["bienvenida", "tipo", "objetivo", "contenido", "personalizacion"];
  return ["bienvenida", "tipo", "contenido", "preview"];
}

// ── Validación de pasos ───────────────────────────────────────────────────────

function getStepStatus(
  s: WizardStep,
  currentStep: WizardStep,
  steps: WizardStep[],
  state: {
    name: string; type: ResourceType; docType: DocType; objective: Objective;
    customTitle: string; customContent: string; externalUrl: string;
  }
): StepStatus {
  if (s === currentStep) return "current";
  const sIdx = steps.indexOf(s);
  const cIdx = steps.indexOf(currentStep);
  if (sIdx > cIdx) return "pending";

  // Visited — check if valid
  switch (s) {
    case "bienvenida": return "done";
    case "tipo":
      if (!state.name.trim()) return "error";
      return "done";
    case "objetivo": return "done";
    case "contenido": {
      if (state.type === "pdf") {
        if (!state.customTitle.trim()) return "error";
        if (!state.customContent.trim()) return "warning";
        return "done";
      }
      if (state.type === "url" && !state.externalUrl.trim()) return "warning";
      if (!state.customTitle.trim()) return "error";
      return "done";
    }
    case "personalizacion": return "done";
    case "preview": return "done";
    default: return "done";
  }
}

const STATUS_CLASSES: Record<StepStatus, string> = {
  done:    "bg-green-500 text-white",
  warning: "bg-amber-400 text-black",
  error:   "bg-red-500 text-white",
  current: "bg-[var(--brand-4)] text-black",
  pending: "bg-[var(--border)] text-[var(--foreground)]",
};

const STEP_LABELS: Record<WizardStep, string> = {
  bienvenida:    "Inicio",
  tipo:          "Tipo",
  objetivo:      "Objetivo",
  contenido:     "Contenido",
  personalizacion:"Diseño",
  preview:       "Preview",
};

// ── Inner component ───────────────────────────────────────────────────────────

function CaptacionLeadMagnetWizardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [businessId, setBusinessId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [token, setToken] = useState("");
  const [actionLinks, setActionLinks] = useState<{ id: string; type: string; name: string; url: string }[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ── Step & type state ──────────────────────────────────────────────────────
  const [step, setStep] = useState<WizardStep>("bienvenida");
  const [type, setType] = useState<ResourceType>("pdf");

  // ── Shared fields ──────────────────────────────────────────────────────────
  const [name, setName] = useState("");           // nombre interno
  const [customTitle, setCustomTitle] = useState("");
  const [description, setDescription] = useState("");  // for url/code
  const [ctaText, setCtaText] = useState("Obtener recurso gratis");
  const [externalUrl, setExternalUrl] = useState("");

  // ── PDF-specific fields ────────────────────────────────────────────────────
  const [objective, setObjective] = useState<Objective>("captar");
  const [docType, setDocType] = useState<DocType>("guia");
  const [customIntro, setCustomIntro] = useState("");
  const [customContent, setCustomContent] = useState("");
  const [newPoint, setNewPoint] = useState("");
  const [colorBrand, setColorBrand] = useState("#0a323c");
  const [colorTag, setColorTag] = useState("#0a323c");
  const [colorTitle, setColorTitle] = useState("#0a323c");
  const [colorButton, setColorButton] = useState("#ffb400");
  const [titleSize, setTitleSize] = useState(1.5);
  const [logoSize, setLogoSize] = useState(32);
  const [showLogo, setShowLogo] = useState(true);
  const [cta1Enabled, setCta1Enabled] = useState(true);
  const [cta1Text, setCta1Text] = useState("Reservar cita");
  const [cta1Link, setCta1Link] = useState("");
  const [cta2Enabled, setCta2Enabled] = useState(true);
  const [cta2Text, setCta2Text] = useState("Más información");
  const [cta2Link, setCta2Link] = useState("");
  const [sn1, setSn1] = useState(""); const [sn1En, setSn1En] = useState(true);
  const [sn2, setSn2] = useState(""); const [sn2En, setSn2En] = useState(true);
  const MAX_CONTENT_CHARS = 1200;

  const contentCustomized = useRef(false);
  const [saving, setSaving] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const steps = getSteps(type);
  const stepIndex = steps.indexOf(step);

  // ── Load business & edit data ──────────────────────────────────────────────
  useEffect(() => {
    const editId = searchParams.get("edit");
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userEmail = sessionData?.session?.user?.email || "";
      const accessToken = sessionData?.session?.access_token || "";
      if (!userEmail) return;
      setToken(accessToken);

      const { data: biz } = await supabase
        .from("businesses")
        .select("id, name, logo_url")
        .eq("contact_email", userEmail)
        .single();
      if (!biz?.id) return;
      setBusinessId(biz.id);
      if (biz.name) setBusinessName(biz.name);
      if (biz.logo_url) setLogoUrl(biz.logo_url);

      // Cargar herramientas del negocio para usar en los CTAs
      const { data: links } = await supabase
        .from("action_links")
        .select("id, type, name, url")
        .eq("business_id", biz.id)
        .order("created_at", { ascending: false });
      if (links) setActionLinks(links);

      if (editId) {
        setEditingId(editId);
        const res = await fetch(`/api/captacion/lead-magnets?businessId=${biz.id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        const lm = (data.leadMagnets || []).find((l: { id: string }) => l.id === editId);
        if (lm) {
          contentCustomized.current = true;
          setType(lm.type || "pdf");
          setName(lm.name || "");
          setCustomTitle(lm.title || "");
          setDescription(lm.description || "");
          setCtaText(lm.cta_text || "Obtener recurso gratis");
          setExternalUrl(lm.external_url || "");
          // Restaurar el contenido editable guardado (intro, cuerpo, colores, CTAs…)
          const c = lm.content;
          if (c && typeof c === "object") {
            if (c.objective) setObjective(c.objective);
            if (c.docType) setDocType(c.docType);
            setCustomIntro(c.customIntro ?? "");
            setCustomContent(c.customContent ?? "");
            if (c.colorBrand) setColorBrand(c.colorBrand);
            if (c.colorTag) setColorTag(c.colorTag);
            if (c.colorTitle) setColorTitle(c.colorTitle);
            if (c.colorButton) setColorButton(c.colorButton);
            if (typeof c.titleSize === "number") setTitleSize(c.titleSize);
            if (typeof c.logoSize === "number") setLogoSize(c.logoSize);
            if (typeof c.showLogo === "boolean") setShowLogo(c.showLogo);
            if (typeof c.cta1Enabled === "boolean") setCta1Enabled(c.cta1Enabled);
            if (typeof c.cta1Text === "string") setCta1Text(c.cta1Text);
            if (typeof c.cta1Link === "string") setCta1Link(c.cta1Link);
            if (typeof c.cta2Enabled === "boolean") setCta2Enabled(c.cta2Enabled);
            if (typeof c.cta2Text === "string") setCta2Text(c.cta2Text);
            if (typeof c.cta2Link === "string") setCta2Link(c.cta2Link);
            if (typeof c.sn1 === "string") setSn1(c.sn1);
            if (typeof c.sn1En === "boolean") setSn1En(c.sn1En);
            if (typeof c.sn2 === "string") setSn2(c.sn2);
            if (typeof c.sn2En === "boolean") setSn2En(c.sn2En);
          }
          setStep("tipo");
        }
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply template when objective/docType changes (only for new resources)
  useEffect(() => {
    if (contentCustomized.current || type !== "pdf") return;
    const tpl = TEMPLATES[objective]?.[docType];
    if (tpl) {
      setCustomTitle(tpl.title);
      setCustomIntro(tpl.intro);
      setCustomContent(tpl.content);
      setCta1Text(tpl.cta1);
      setCta2Text(tpl.cta2);
    }
  }, [objective, docType, type]);

  // ── Step status helper ─────────────────────────────────────────────────────
  const stepState = { name, type, docType, objective, customTitle, customContent, externalUrl };
  const getStatus = (s: WizardStep) => getStepStatus(s, step, steps, stepState);

  // ── Navigation helpers ─────────────────────────────────────────────────────
  const goTo = (s: WizardStep) => setStep(s);

  const goNext = () => {
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) setStep(steps[idx + 1]);
  };
  const goPrev = () => {
    const idx = steps.indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]);
  };

  // ── Contenido editable a persistir (para poder recargarlo al editar) ───────
  const buildContent = () => ({
    objective, docType,
    customIntro, customContent,
    colorBrand, colorTag, colorTitle, colorButton,
    titleSize, logoSize, showLogo,
    cta1Enabled, cta1Text, cta1Link,
    cta2Enabled, cta2Text, cta2Link,
    sn1, sn1En, sn2, sn2En,
  });

  // ── Save for URL/code types ────────────────────────────────────────────────
  const handleSaveSimple = async () => {
    if (!businessId || !name.trim()) return;
    setSaving(true);
    const payload = {
      businessId, name, type,
      title: customTitle, description, cta_text: ctaText,
      external_url: externalUrl,
      content: buildContent(),
    };
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    try {
      const res = editingId
        ? await fetch(`/api/captacion/lead-magnets/${editingId}`, { method: "PUT", headers, body: JSON.stringify({ ...payload, status: "active" }) })
        : await fetch("/api/captacion/lead-magnets", { method: "POST", headers, body: JSON.stringify(payload) });
      if (res.ok) { router.push("/captacion/lead-magnets"); }
      else { const d = await res.json(); alert("Error: " + (d.error || "desconocido")); }
    } finally { setSaving(false); }
  };

  // ── Save PDF for pdf type ──────────────────────────────────────────────────
  const getTypeLabel = () => ({ guia: "GUIA ESTRATEGICA", checklist: "CHECKLIST DE IMPLEMENTACION", recomendacion: "RECOMENDACION TECNICA" })[docType];

  const handleSavePdf = async () => {
    if (!businessId) return;
    setPdfGenerating(true);

    try {
      // 1. Create or update the captacion lead magnet record
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
      const basePayload = {
        businessId, name: name || customTitle || "Recurso de captación",
        type: "pdf", title: customTitle, description: customIntro || description, cta_text: cta1Text || ctaText,
        content: buildContent(),
      };

      let lmId = editingId;
      if (!lmId) {
        const createRes = await fetch("/api/captacion/lead-magnets", { method: "POST", headers, body: JSON.stringify(basePayload) });
        if (!createRes.ok) { const d = await createRes.json(); alert("Error al guardar: " + d.error); return; }
        const createData = await createRes.json();
        lmId = createData.leadMagnet?.id;
        setEditingId(lmId);
      } else {
        await fetch(`/api/captacion/lead-magnets/${lmId}`, { method: "PUT", headers, body: JSON.stringify(basePayload) });
      }

      // 2. Build HTML for PDF (same logic as Recursos de Valor)
      let contentHtml = pointToHtml(customContent);
      if (docType === "checklist") {
        contentHtml = splitPoints(customContent)
          .map(l => `<li style="display:flex;align-items:flex-start;gap:10px;margin-bottom:0.8rem"><span style="min-width:18px;height:18px;border:2px solid ${colorButton};border-radius:4px;display:inline-block;margin-top:3px"></span><span>${pointToHtml(l)}</span></li>`)
          .join("");
        contentHtml = `<ul style="list-style:none;padding:0">${contentHtml}</ul>`;
      } else if (docType === "recomendacion") {
        contentHtml = splitPoints(customContent)
          .map(l => `<li style="margin-bottom:1rem;padding-left:10px;list-style:decimal;color:#000000;list-style-position:inside">${pointToHtml(l)}</li>`)
          .join("");
        contentHtml = `<ol style="padding-left:1.5rem;color:#000000;list-style:decimal;">${contentHtml}</ol>`;
      }

      const titleSizeSmall = titleSize * 0.6;
      let snSection = "";
      if ((sn1En && sn1) || (sn2En && sn2)) {
        snSection = `<div style="position:absolute;bottom:150px;left:20mm;right:20mm;padding:1rem;border-top:1px dashed rgba(0,0,0,0.1);border-bottom:1px dashed rgba(0,0,0,0.1);border-radius:8px;font-size:0.85rem;line-height:1.4;background:#f9fafb">${sn1En && sn1 ? `<div style="margin-bottom:12px;color:#000000;font-weight:bold">${sn1}</div>` : ""}${sn2En && sn2 ? `<div style="margin-bottom:12px;color:#000000;font-weight:bold">${sn2}</div>` : ""}</div>`;
      }

      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',sans-serif}.container{width:210mm;min-height:297mm;padding:20mm;padding-bottom:15mm;background:#fff;position:relative}.header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid ${colorBrand};padding-bottom:20px;margin-bottom:30px}.brand-wrapper{display:flex;align-items:center;gap:12px}.brand-logo{height:${logoSize}px;width:${logoSize}px;object-fit:contain;border-radius:${logoSize >= 40 ? "9999px" : "6px"}}.brand{font-size:1.2rem;font-weight:900;color:${colorBrand};text-transform:uppercase}.tag{background:${colorTag};color:#fff;padding:5px 15px;border-radius:4px;font-size:0.7rem;font-weight:700;text-transform:uppercase}.title{font-size:${titleSizeSmall}rem;font-weight:900;color:${colorTitle};line-height:1.1;margin-bottom:20px;text-transform:uppercase}.subtitle{font-size:1.1rem;color:#4B5563;margin-bottom:30px}.section{margin-bottom:20px}.section h4{color:${colorBrand};font-size:0.9rem;text-transform:uppercase;border-left:4px solid ${colorBrand};padding-left:10px;margin-bottom:15px}.content{font-size:0.9rem;color:#374151;line-height:1.8;white-space:pre-line}.cta-box{position:absolute;bottom:60px;left:20mm;right:20mm;display:flex;justify-content:center;gap:15px;flex-wrap:wrap}.cta-btn{padding:12px 25px;border-radius:8px;background:${colorButton};color:#fff;font-weight:800;text-transform:uppercase;font-size:0.85rem;text-decoration:none}.cta-btn-outline{padding:12px 25px;border-radius:8px;border:2px solid ${colorButton};color:${colorButton};font-weight:800;text-transform:uppercase;font-size:0.85rem;text-decoration:none}</style></head><body><div class="container"><div class="header"><div class="brand-wrapper">${showLogo && logoUrl ? `<img src="${logoUrl}" alt="logo" class="brand-logo" />` : ""}<div class="brand">${(businessName || "MI NEGOCIO").toUpperCase()}</div></div><div class="tag">${getTypeLabel()}</div></div><div class="title">${customTitle || "TITULO"}</div><div class="subtitle">${customIntro || ""}</div><div class="section"><div class="content">${contentHtml}</div></div>${snSection}<div class="cta-box">${cta1Enabled && cta1Text ? `<a href="${cta1Link || "#"}" class="cta-btn" target="_blank">${cta1Text}</a>` : ""}${cta2Enabled && cta2Text ? `<a href="${cta2Link || "#"}" class="cta-btn-outline" target="_blank">${cta2Text}</a>` : ""}</div></div></body></html>`;

      // 3. Generate PDF and get URL
      const { data: { session } } = await supabase.auth.getSession();
      const pdfRes = await fetch("/api/lead-magnet/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token || ""}` },
        body: JSON.stringify({ html, businessId, title: customTitle }),
      });
      const pdfData = await pdfRes.json();
      if (pdfData.error) { alert("Error al generar PDF: " + pdfData.error); return; }

      // 4. Update captacion lead magnet with file_url and set active
      await fetch(`/api/captacion/lead-magnets/${lmId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ file_url: pdfData.url, status: "active" }),
      });

      router.push("/captacion/lead-magnets");
    } finally {
      setPdfGenerating(false);
    }
  };

  // ── Render Preview (PDF) ───────────────────────────────────────────────────
  const renderDocPreview = () => (
    <div>
      <div className="text-xs uppercase tracking-widest text-[var(--brand-1)] mb-3">VISTA PREVIA DEL DOCUMENTO</div>
      <LeadMagnetPreview
        businessName={businessName}
        type={docType}
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
        sn1={sn1} sn1En={sn1En}
        sn2={sn2} sn2En={sn2En}
        sn3="" sn3En={false}
        sn4="" sn4En={false}
      />
    </div>
  );

  // ── Step renderer ──────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {

      // ── BIENVENIDA ─────────────────────────────────────────────────────────
      case "bienvenida":
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-xl md:text-3xl font-bold mb-4 text-[var(--foreground)]">Crea recursos para captar clientes nuevos</h2>
              <p className="text-sm md:text-lg text-[var(--foreground)]/70 max-w-2xl mx-auto">
                Ofrece algo de valor a cambio del contacto de tu cliente potencial. Un PDF personalizado, un enlace útil o un código de descuento es suficiente para dar el primer paso.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
              {[
                { color: "var(--brand-1)", title: "Genera confianza antes del primer contacto", body: "Demuestra tu expertise entregando valor antes de pedir nada a cambio." },
                { color: "var(--brand-4)", title: "Entrega un documento útil de verdad", body: "Convierte tu conocimiento en un PDF profesional que el cliente puede guardar y compartir." },
                { color: "#22c55e", title: "Convierte curiosos en leads cualificados", body: "Quien descarga tu recurso ya ha mostrado interés. Eso es un lead caliente." },
              ].map((c, i) => (
                <div key={i} className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
                  <div className="w-3 h-3 rounded-full mb-4 mx-auto" style={{ background: c.color }} />
                  <h3 className="text-lg font-bold text-center mb-2 text-[var(--foreground)]">{c.title}</h3>
                  <p className="text-sm text-[var(--foreground)]/60 text-center">{c.body}</p>
                </div>
              ))}
            </div>
            <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
              <h3 className="text-lg font-bold mb-3 text-[var(--foreground)]">¿Qué vas a crear?</h3>
              <ul className="text-sm text-[var(--foreground)]/70 space-y-2">
                {[["PDF personalizado:", "guía, checklist o recomendación con tu imagen de marca"], ["Enlace:", "vídeo, artículo o página web útil para tu cliente"]].map(([k, v]) => (
                  <li key={k} className="flex items-center gap-2"><span style={{ color: "var(--brand-4)" }}>+</span><strong>{k}</strong> {v}</li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center mt-8">
              <button onClick={goNext} className="px-6 md:px-10 py-3 md:py-4 rounded-full font-bold text-base md:text-lg w-full sm:w-auto" style={{ background: "var(--brand-4)", color: "black" }}>
                Comenzar a crear mi recurso →
              </button>
            </div>
          </div>
        );

      // ── TIPO ───────────────────────────────────────────────────────────────
      case "tipo":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl md:text-2xl font-bold mb-2 text-[var(--foreground)]">¿Qué tipo de recurso vas a ofrecer?</h2>
              <p className="text-[var(--foreground)]/60">Elige el formato que mejor encaje con lo que tienes</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {([
                { t: "pdf" as ResourceType, sub: "Documento descargable", desc: "PDF profesional con tu conocimiento y marca — mismo generador que Recursos de Valor" },
                { t: "url" as ResourceType, sub: "Recurso online",        desc: "Vídeo de YouTube, artículo, landing page o cualquier URL útil para tu cliente" },
              ]).map(({ t, sub, desc }) => (
                <button key={t} onClick={() => { setType(t); contentCustomized.current = false; }} className="p-5 md:p-6 rounded-xl text-left transition-all border-2 relative" style={{ borderColor: type === t ? "var(--brand-1)" : "var(--border)", backgroundColor: type === t ? "rgba(57,161,169,0.08)" : "var(--card)" }}>
                  {type === t && <span className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "var(--brand-1)", color: "white" }}>✓</span>}
                  <div className="w-2 h-2 rounded-full mb-4" style={{ background: type === t ? "var(--brand-1)" : "var(--border)" }} />
                  <h3 className="text-lg font-bold mb-1 text-[var(--foreground)]">{sub}</h3>
                  <p className="text-sm text-[var(--foreground)]/60">{desc}</p>
                  {t === "pdf" && <div className="mt-2 text-xs text-[var(--brand-4)] font-semibold">Editor completo + vista previa</div>}
                </button>
              ))}
            </div>

            <div className="mt-6">
              <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--brand-1)" }}>Nombre interno — solo lo ves tú *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Guía captación dental 2026"
                className="w-full px-4 py-3 rounded-lg border text-[var(--foreground)] text-sm"
                style={{ background: "var(--card)", borderColor: !name.trim() ? "rgba(239,68,68,0.5)" : "var(--border)" }}
              />
              {!name.trim() && <p className="text-xs text-red-400 mt-1">El nombre interno es obligatorio</p>}
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8">
              <button onClick={goPrev} className="px-6 py-3 rounded-full border border-[var(--border)] text-[var(--foreground)]">← Atrás</button>
              <button onClick={goNext} disabled={!name.trim()} className="px-8 py-3 rounded-full font-bold disabled:opacity-40" style={{ background: "var(--brand-4)", color: "black" }}>Continuar →</button>
            </div>
          </div>
        );

      // ── OBJETIVO (solo PDF) ────────────────────────────────────────────────
      case "objetivo":
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold mb-2 text-[var(--foreground)]">¿Qué quieres conseguir con este recurso?</h2>
              <p className="text-[var(--foreground)]/60 text-sm">Elige el objetivo y el asistente adaptará el contenido a tu negocio</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(Object.entries(OBJECTIVE_INFO) as [Objective, typeof OBJECTIVE_INFO[Objective]][]).map(([key, info]) => (
                <button key={key} type="button" onClick={() => { setObjective(key); contentCustomized.current = false; }}
                  className="rounded-xl transition-all border-2 p-3 md:p-4 text-left"
                  style={{ borderColor: objective === key ? info.color : "var(--border)", backgroundColor: objective === key ? `${info.color}18` : "var(--card)" }}>
                  <div className="w-2 h-2 rounded-full mb-3" style={{ background: info.color }} />
                  <h3 className="text-sm font-bold text-[var(--foreground)] leading-tight mb-1">{info.title}</h3>
                  <p className="text-[11px] text-[var(--foreground)]/60 leading-snug">{info.description}</p>
                  {objective === key && <div className="mt-2 text-[10px] font-bold" style={{ color: info.color }}>✓ Seleccionado</div>}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <label className="block text-xs uppercase tracking-widest mb-3" style={{ color: "var(--brand-1)" }}>Tipo de documento</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(Object.entries(DOC_TYPE_INFO) as [DocType, typeof DOC_TYPE_INFO[DocType]][]).map(([key, info]) => (
                  <button key={key} type="button" onClick={() => { setDocType(key); contentCustomized.current = false; }}
                    className="p-4 rounded-xl text-left transition-all border-2"
                    style={{ borderColor: docType === key ? "var(--brand-4)" : "var(--border)", backgroundColor: docType === key ? "rgba(255,180,0,0.1)" : "var(--card)" }}>
                    <h4 className="text-sm font-bold text-[var(--foreground)] mb-1">{info.title}</h4>
                    <p className="text-xs text-[var(--foreground)]/60">{info.description}</p>
                    <p className="text-xs text-[var(--foreground)]/40 italic mt-1">{info.example}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
              <button onClick={goPrev} className="px-6 py-3 rounded-full border border-[var(--border)] text-[var(--foreground)]">← Atrás</button>
              <button onClick={goNext} className="px-8 py-3 rounded-full font-bold" style={{ background: "var(--brand-4)", color: "black" }}>
                Continuar con &ldquo;{OBJECTIVE_INFO[objective].title}&rdquo; →
              </button>
            </div>
          </div>
        );

      // ── CONTENIDO ──────────────────────────────────────────────────────────
      case "contenido":
        if (type === "pdf") {
          const parsedPoints = splitPoints(customContent).map(stripBullet);

          return (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl md:text-2xl font-bold mb-2 text-[var(--foreground)]">Personaliza el contenido del documento</h2>
                <p className="text-[var(--foreground)]/60">Edita el contenido generado — la plantilla se adapta a tu objetivo</p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--brand-1)" }}>Título del documento *</label>
                  <textarea value={customTitle} onChange={e => { contentCustomized.current = true; setCustomTitle(e.target.value); }} rows={2}
                    className="w-full px-4 py-3 rounded-lg border text-[var(--foreground)] text-sm resize-none"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: !customTitle.trim() ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)" }} />
                  {!customTitle.trim() && <p className="text-xs text-red-400 mt-1">El título es obligatorio</p>}
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--brand-1)" }}>Descripción inicial</label>
                  <textarea value={customIntro} onChange={e => { contentCustomized.current = true; setCustomIntro(e.target.value); }} rows={2}
                    className="w-full px-4 py-3 rounded-lg border text-[var(--foreground)] text-sm resize-none"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                </div>

                {docType === "guia" ? (
                  <div>
                    <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--brand-1)" }}>Contenido principal (texto continuo)</label>
                    <textarea value={customContent} onChange={e => { if (e.target.value.length <= MAX_CONTENT_CHARS) { contentCustomized.current = true; setCustomContent(e.target.value); } }} rows={6}
                      className="w-full px-4 py-3 rounded-lg border text-[var(--foreground)] text-sm resize-none"
                      placeholder="Escribe aquí el contenido en texto seguido..."
                      style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                    <div className={`text-xs mt-1 ${customContent.length > MAX_CONTENT_CHARS * 0.9 ? "text-red-400" : "text-[var(--foreground)]/40"}`}>{customContent.length} / {MAX_CONTENT_CHARS} caracteres</div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--brand-1)" }}>Puntos del {docType === "checklist" ? "checklist" : "recomendación"}</label>
                    <div className="flex gap-2 mb-3">
                      <input type="text" value={newPoint} onChange={e => setNewPoint(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newPoint.trim()) { contentCustomized.current = true; setCustomContent(joinPoints([...parsedPoints, newPoint.trim()])); setNewPoint(""); } }}
                        className="flex-1 px-3 py-2 rounded-lg border text-[var(--foreground)] text-sm"
                        style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}
                        placeholder="Escribe un punto y pulsa Enter o Añadir" />
                      <button type="button" onClick={() => { if (!newPoint.trim()) return; contentCustomized.current = true; setCustomContent(joinPoints([...parsedPoints, newPoint.trim()])); setNewPoint(""); }}
                        className="text-xs px-3 py-2 rounded-lg font-bold" style={{ background: "var(--brand-1)", color: "white" }}>Añadir</button>
                    </div>
                    <div className="space-y-2 max-h-56 overflow-y-auto bg-[var(--card)] rounded-lg p-3 border border-[var(--border)]">
                      {parsedPoints.length === 0 ? (
                        <p className="text-[var(--foreground)]/40 text-sm text-center py-2">No hay puntos — escribe arriba y pulsa Añadir</p>
                      ) : parsedPoints.map((pt, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2 rounded hover:bg-[var(--border)]/20">
                          <div className="w-6 h-6 mt-0.5 flex-shrink-0 flex items-center justify-center rounded-full text-[10px] font-bold" style={{ background: "rgba(57,161,169,0.2)", color: "var(--brand-1)", border: "1px solid var(--brand-1)" }}>{idx + 1}</div>
                          <textarea value={pt} onChange={e => { const np = [...parsedPoints]; np[idx] = e.target.value; setCustomContent(joinPoints(np)); }} rows={Math.max(1, pt.split("\n").length)}
                            className="flex-1 px-2 py-1 rounded bg-transparent border border-transparent hover:border-[var(--border)] text-[var(--foreground)] text-sm resize-y"
                            placeholder={`Punto ${idx + 1}...`} />
                          <button type="button" onClick={() => setCustomContent(joinPoints(parsedPoints.filter((_, i) => i !== idx)))}
                            className="text-xs text-red-400 hover:text-red-300 flex-shrink-0 mt-1">✕</button>
                        </div>
                      ))}
                    </div>
                    <div className={`text-xs mt-1 ${customContent.length > MAX_CONTENT_CHARS * 0.9 ? "text-red-400" : "text-[var(--foreground)]/40"}`}>{customContent.length} / {MAX_CONTENT_CHARS} caracteres</div>
                  </div>
                )}

                <div className="border-t border-[var(--border)] pt-4">
                  <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--brand-1)" }}>Texto de cierre (opcional)</label>
                  <div className="space-y-2">
                    {[{ val: sn1, set: setSn1, en: sn1En, setEn: setSn1En, ph: "Texto de cierre línea 1..." },
                      { val: sn2, set: setSn2, en: sn2En, setEn: setSn2En, ph: "Texto de cierre línea 2..." }].map((row, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input type="checkbox" checked={row.en} onChange={e => row.setEn(e.target.checked)} className="w-4 h-4 accent-[var(--brand-1)]" />
                        <input type="text" value={row.val} onChange={e => row.set(e.target.value)} placeholder={row.ph}
                          className="flex-1 px-3 py-2 rounded-lg border text-[var(--foreground)] text-sm"
                          style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {renderDocPreview()}

              <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8">
                <button onClick={goPrev} className="px-6 py-3 rounded-full border border-[var(--border)] text-[var(--foreground)]">← Atrás</button>
                <button onClick={goNext} disabled={!customTitle.trim()} className="px-8 py-3 rounded-full font-bold disabled:opacity-40" style={{ background: "var(--brand-4)", color: "black" }}>Continuar →</button>
              </div>
            </div>
          );
        }

        // URL / Code simple content
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold mb-2 text-[var(--foreground)]">Configura lo que verá el cliente</h2>
              <p className="text-[var(--foreground)]/60">Estos datos aparecerán en el formulario de captación</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--brand-1)" }}>Título visible para el cliente *</label>
                <input type="text" value={customTitle} onChange={e => setCustomTitle(e.target.value)}
                  placeholder={type === "url" ? "Ej: El vídeo que necesitas ver antes de tu primera consulta" : "Ej: Tu descuento de bienvenida"}
                  className="w-full px-4 py-3 rounded-lg border text-[var(--foreground)] text-sm"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: !customTitle.trim() ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--brand-1)" }}>Descripción breve</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                  placeholder="Qué aprenderá o ganará quien lo descargue"
                  className="w-full px-4 py-3 rounded-lg border text-[var(--foreground)] text-sm resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--brand-1)" }}>Texto del botón CTA</label>
                <input type="text" value={ctaText} onChange={e => setCtaText(e.target.value)} placeholder="Obtener recurso gratis"
                  className="w-full px-4 py-3 rounded-lg border text-[var(--foreground)] text-sm"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
              </div>
              {type === "url" && (
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--brand-1)" }}>URL de destino</label>
                  <input type="url" value={externalUrl} onChange={e => setExternalUrl(e.target.value)} placeholder="https://..."
                    className="w-full px-4 py-3 rounded-lg border text-[var(--foreground)] text-sm"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                  <p className="text-xs text-[var(--foreground)]/40 mt-1">Incluye siempre https:// al inicio de la URL</p>
                </div>
              )}
            </div>
            {/* Preview simple */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-3">
              <div className="text-xs text-[var(--foreground)]/40 uppercase tracking-widest mb-1">Vista previa</div>
              <div className="font-bold text-[var(--foreground)] text-base leading-snug">{customTitle || "Título del recurso"}</div>
              <div className="text-sm text-[var(--foreground)]/60">{description || "Descripción de lo que obtendrá el cliente."}</div>
              <button className="w-full py-2.5 rounded-lg text-sm font-bold" style={{ background: "var(--brand-1)", color: "white" }}>{ctaText || "Obtener recurso gratis"}</button>
            </div>
            <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8">
              <button onClick={goPrev} className="px-6 py-3 rounded-full border border-[var(--border)] text-[var(--foreground)]">← Atrás</button>
              <button onClick={goNext} disabled={!customTitle.trim()} className="px-8 py-3 rounded-full font-bold disabled:opacity-40" style={{ background: "var(--brand-4)", color: "black" }}>Continuar →</button>
            </div>
          </div>
        );

      // ── PERSONALIZACIÓN (solo PDF) ─────────────────────────────────────────
      case "personalizacion":
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold mb-2 text-[var(--foreground)]">Diseño y botones CTA</h2>
              <p className="text-[var(--foreground)]/60">Configura los colores del documento y los botones de acción</p>
            </div>

            {/* CTAs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 mb-4">
              {[
                { label: "Botón Principal (CTA 1)", en: cta1Enabled, setEn: setCta1Enabled, text: cta1Text, setText: setCta1Text, link: cta1Link, setLink: setCta1Link },
                { label: "Botón Secundario (CTA 2)", en: cta2Enabled, setEn: setCta2Enabled, text: cta2Text, setText: setCta2Text, link: cta2Link, setLink: setCta2Link },
              ].map((cta, i) => (
                <div key={i} className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[var(--foreground)] font-bold text-sm">{cta.label}</h3>
                    <label className="flex items-center gap-2 text-xs text-[var(--foreground)]/70">
                      <input type="checkbox" checked={cta.en} onChange={e => cta.setEn(e.target.checked)} className="w-4 h-4 accent-[var(--brand-4)]" />Activar
                    </label>
                  </div>
                  {cta.en && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-[var(--foreground)]/50 mb-1">Texto del botón</label>
                        <select value={cta.text} onChange={e => cta.setText(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-[var(--foreground)] text-sm mb-1" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                          <option value="">Seleccionar...</option>
                          {CTA_PRESETS.map(p => <option key={p} value={p} style={{ background: "#1e293b" }}>{p}</option>)}
                        </select>
                        <input type="text" value={cta.text} onChange={e => cta.setText(e.target.value)} placeholder="O escribe tu propio texto..." className="w-full px-3 py-2 rounded-lg border text-[var(--foreground)] text-sm" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                      </div>
                      <div>
                        <label className="block text-xs text-[var(--foreground)]/50 mb-1">Enlace (URL)</label>
                        {actionLinks.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {actionLinks.map(al => (
                              <button
                                key={al.id}
                                type="button"
                                onClick={() => cta.setLink(al.url)}
                                title={al.url}
                                className="text-xs px-2.5 py-1 rounded-full border transition-colors"
                                style={{
                                  borderColor: cta.link === al.url ? "var(--brand-4)" : "rgba(255,255,255,0.15)",
                                  background: cta.link === al.url ? "rgba(255,180,0,0.15)" : "rgba(255,255,255,0.05)",
                                  color: cta.link === al.url ? "var(--brand-4)" : "var(--foreground)",
                                }}
                              >
                                {al.name || al.type}
                              </button>
                            ))}
                          </div>
                        )}
                        <input type="text" value={cta.link} onChange={e => cta.setLink(e.target.value)} placeholder="https://... o selecciona una herramienta arriba" className="w-full px-3 py-2 rounded-lg border text-[var(--foreground)] text-sm" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Colors */}
            <div className="bg-[var(--card)] rounded-xl p-4 md:p-6 mb-4 border border-[var(--border)]">
              <h3 className="text-[var(--foreground)] font-bold mb-4">Colores del documento</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Color marca", val: colorBrand, set: setColorBrand },
                  { label: "Color etiqueta", val: colorTag, set: setColorTag },
                  { label: "Color título", val: colorTitle, set: setColorTitle },
                  { label: "Color botón CTA", val: colorButton, set: setColorButton },
                ].map(({ label, val, set }) => (
                  <div key={label} className="bg-[var(--card)] rounded-lg p-3 border border-[var(--border)]">
                    <label className="block text-xs text-[var(--foreground)]/50 mb-2">{label}</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={val} onChange={e => set(e.target.value)} className="w-10 h-10 rounded cursor-pointer flex-shrink-0" />
                      <input type="text" value={val} onChange={e => set(e.target.value)} className="flex-1 min-w-0 px-2 py-1 rounded bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-xs uppercase" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div className="bg-[var(--card)] rounded-lg p-3 border border-[var(--border)]">
                  <label className="block text-xs text-[var(--foreground)]/50 mb-2">Tamaño del título ({titleSize}rem)</label>
                  <input type="range" min="1" max="3" step="0.1" value={titleSize} onChange={e => setTitleSize(Number(e.target.value))} className="w-full" />
                </div>
                <div className="bg-[var(--card)] rounded-lg p-3 border border-[var(--border)]">
                  <label className="block text-xs text-[var(--foreground)]/50 mb-2">Tamaño del logo ({logoSize}px)</label>
                  <input type="range" min={16} max={80} step={2} value={logoSize} onChange={e => setLogoSize(Number(e.target.value))} className="w-full" />
                </div>
              </div>
            </div>

            {renderDocPreview()}

            <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8">
              <button onClick={goPrev} className="px-6 py-3 rounded-full border border-[var(--border)] text-[var(--foreground)]">← Atrás</button>
              <button onClick={handleSavePdf} disabled={pdfGenerating || !customTitle.trim()}
                className="px-8 py-3 rounded-full font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "var(--brand-4)", color: "black" }}>
                {pdfGenerating ? (
                  <><svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>Generando PDF...</>
                ) : (editingId ? "Guardar PDF y actualizar" : "Generar PDF y guardar")}
              </button>
            </div>
          </div>
        );

      // ── PREVIEW (URL / Code) ───────────────────────────────────────────────
      case "preview":
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-xl md:text-2xl font-bold mb-2 text-[var(--foreground)]">Tu recurso está listo</h2>
              <p className="text-[var(--foreground)]/60 text-sm">Así lo verán tus clientes en el formulario de captación</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-3 max-w-sm mx-auto">
              <div className="font-bold text-[var(--foreground)] text-base leading-snug">{customTitle || "Título del recurso"}</div>
              <div className="text-sm text-[var(--foreground)]/60">{description || "Descripción de lo que obtendrá el cliente."}</div>
              {type === "url" && externalUrl && <div className="text-xs text-[var(--foreground)]/40 break-all">{externalUrl}</div>}
              <button className="w-full py-2.5 rounded-lg text-sm font-bold" style={{ background: "var(--brand-1)", color: "white" }}>{ctaText || "Obtener recurso gratis"}</button>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-2 max-w-sm mx-auto">
              <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--brand-1)" }}>Resumen</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-[var(--foreground)]/40 text-xs">Nombre interno</div><div className="text-[var(--foreground)] font-medium text-xs">{name || "—"}</div>
                <div className="text-[var(--foreground)]/40 text-xs">Tipo</div><div className="text-[var(--foreground)] font-medium text-xs">{type === "url" ? "Enlace" : "PDF"}</div>
                <div className="text-[var(--foreground)]/40 text-xs">Título</div><div className="text-[var(--foreground)] font-medium text-xs truncate">{customTitle || "—"}</div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <button onClick={goPrev} className="px-6 py-3 rounded-full border border-[var(--border)] text-[var(--foreground)]">← Atrás</button>
              <button onClick={handleSaveSimple} disabled={saving || !name.trim()}
                className="px-8 py-3 rounded-full font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "var(--brand-4)", color: "black" }}>
                {saving ? "Guardando..." : (editingId ? "Guardar cambios" : "Guardar recurso")}
              </button>
            </div>
          </div>
        );

      default: return null;
    }
  };

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto md:px-6 md:py-4 lg:px-8 lg:py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-8">
          <div>
            <h1 className="text-base md:text-lg font-extrabold tracking-widest uppercase" style={{ color: "var(--brand-4)" }}>
              {editingId ? "Editar Recurso de Captación" : "Nuevo Recurso de Captación"}
            </h1>
            <p className="text-[var(--foreground)]/60 text-xs md:text-sm">Crea un recurso de valor para atraer y captar clientes nuevos</p>
          </div>
          <Link href="/captacion/lead-magnets" className="text-[var(--foreground)]/50 hover:text-[var(--foreground)] text-xs md:text-sm transition-colors">← Volver a la lista</Link>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0.5 md:gap-1 mb-8 flex-wrap">
          {steps.map((s, i) => {
            const status = getStatus(s);
            return (
              <div key={s} className="flex items-center">
                <button type="button" onClick={() => goTo(s)}
                  className={`flex flex-col items-center group`}
                  title={STEP_LABELS[s]}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all flex-shrink-0 cursor-pointer hover:opacity-90 ${STATUS_CLASSES[status]}`}>
                    {status === "done" ? "✓" : status === "warning" ? "!" : status === "error" ? "✗" : i + 1}
                  </div>
                  <span className={`text-[9px] mt-0.5 hidden md:block font-medium transition-colors ${status === "current" ? "text-[var(--brand-4)]" : status === "done" ? "text-green-400" : status === "warning" ? "text-amber-400" : status === "error" ? "text-red-400" : "text-[var(--foreground)]/30"}`}>
                    {STEP_LABELS[s]}
                  </span>
                </button>
                {i < steps.length - 1 && (
                  <div className={`w-4 md:w-8 h-0.5 mx-0.5 flex-shrink-0 mb-3 transition-colors ${status === "done" ? "bg-green-500/60" : "bg-[var(--border)]"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step validation legend */}
        <div className="flex items-center justify-center gap-4 mb-4 text-[10px] text-[var(--foreground)]/40">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Completo</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />Incompleto</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />Requerido</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[var(--brand-4)] inline-block" />Actual</span>
        </div>

        {/* Main card */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-4 md:p-8">
          {renderStep()}
        </div>

        {/* Step index info */}
        <p className="text-center text-[var(--foreground)]/30 text-xs mt-4">Paso {stepIndex + 1} de {steps.length} — puedes navegar libremente entre pasos</p>
      </div>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────
export default function CaptacionLeadMagnetWizard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-[var(--foreground)]/50">Cargando...</div>}>
      <CaptacionLeadMagnetWizardInner />
    </Suspense>
  );
}
