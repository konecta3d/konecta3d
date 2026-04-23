"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import ActionLinkPicker from "@/components/ActionLinkPicker";
import { LeadMagnetPreview } from "@/components/LeadMagnetPreview";

type LeadMagnetType = "guia" | "checklist" | "recomendacion";
type Objective = "captar" | "volvieron" | "conversion" | "referidos";
type WizardStep = "bienvenida" | "objetivo" | "tipo" | "contenido" | "personalizacion";

const OBJECTIVE_INFO: Record<Objective, {
  title: string;
  description: string;
  example: string;
  color: string;
}> = {
  captar: {
    title: "Captar nuevos clientes",
    description: "Atrae a personas que aún no te conocen con un recurso útil y claro.",
    example: "Guía rápida para aliviar dolor lumbar en casa.",
    color: "#39a1a9"
  },
  volvieron: {
    title: "Que vuelvan",
    description: "Motiva el retorno de clientes actuales con continuidad y seguimiento.",
    example: "Plan de seguimiento en 3 pasos.",
    color: "#ffb400"
  },
  conversion: {
    title: "Aumentar conversión",
    description: "Aumenta el ticket medio mostrando el valor de un servicio adicional.",
    example: "Cómo potenciar tus resultados con sesiones de refuerzo.",
    color: "#22c55e"
  },
  referidos: {
    title: "Conseguir referidos",
    description: "Facilita que tus clientes satisfechos te recomienden en un solo paso.",
    example: "Cómo recomendar en 3 pasos.",
    color: "#a78bfa"
  }
};

const OBJECTIVE_GUIDE: Record<Objective, {
  short: string;
  whatIs: string;
  subObjectives: string[];
  create: string;
  format: string;
  example: string;
}> = {
  captar: {
    short: "Atrae nuevos clientes con un recurso útil y claro.",
    whatIs: "Generar confianza inicial y convertir a quien aún no te conoce.",
    subObjectives: [
      "Generar confianza inicial",
      "Mostrar lo que ofreces",
      "Resolver una duda frecuente",
      "Reducir el miedo a probar",
      "Facilitar el primer contacto"
    ],
    create: "Recurso breve que resuelva un problema común.",
    format: "Guía breve o checklist.",
    example: "Guía rápida para aliviar dolor lumbar en casa."
  },
  volvieron: {
    short: "Motiva el retorno con continuidad y seguimiento.",
    whatIs: "Aumentar recurrencia de clientes actuales.",
    subObjectives: [
      "Recordar beneficios de volver",
      "Reforzar continuidad",
      "Generar progreso",
      "Evitar abandono",
      "Proponer siguiente paso"
    ],
    create: "Recurso de seguimiento y continuidad.",
    format: "Recomendación o checklist.",
    example: "Plan de seguimiento en 3 pasos."
  },
  conversion: {
    short: "Aumenta ticket medio con valor percibido.",
    whatIs: "Mostrar el valor de un servicio adicional.",
    subObjectives: [
      "Beneficios del extra",
      "Valor antes del precio",
      "Comparar resultados",
      "Responder objeciones",
      "Invitar al siguiente paso"
    ],
    create: "Recurso que justifique el servicio premium.",
    format: "Guía comparativa o recomendación.",
    example: "Cómo potenciar tus resultados con sesiones de refuerzo."
  },
  referidos: {
    short: "Facilita recomendaciones en un solo paso.",
    whatIs: "Conseguir recomendaciones de clientes satisfechos.",
    subObjectives: [
      "Recordar el valor recibido",
      "Facilitar cómo recomendar",
      "Dar una razón clara",
      "Hacerlo simple",
      "Incentivar sin presión"
    ],
    create: "Recurso breve para recomendar.",
    format: "Recomendación directa o checklist.",
    example: "Cómo recomendar en 3 pasos."
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

const TEMPLATES: Record<Objective, Record<LeadMagnetType, { title: string; intro: string; content: string; cta1: string; cta2: string }>> = {
  captar: {
    guia: { title: "GUÍA: Cómo conseguir el mejor resultado", intro: "Esta guía te muestra los pasos clave.", content: "En esta guía vas a acompañar al lector desde el problema hasta la solución.\n\nEmpieza explicando en qué situación se encuentra tu cliente ideal y qué error comete normalmente. Después, desarrolla 3–5 ideas clave que quieras que entienda antes de tomar una decisión.\n\nCierra el contenido resumiendo qué debería tener claro el lector antes de pasar a la siguiente acción (por ejemplo, reservar una cita o solicitar más información).", cta1: "Descargar guía", cta2: "Reservar cita" },
    checklist: { title: "CHECKLIST: Lo que debes saber", intro: "No compres sin verificar estos puntos.", content: "Verificar licencias\nComparar opciones\nRevisar garantías\nPreguntar por mantenimiento\nPedir referencias", cta1: "Descargar", cta2: "Solicitar info" },
    recomendacion: { title: "TOP 5 recomendaciones", intro: "Las opciones más recomendadas.", content: "Opción 1\nOpción 2\nOpción 3\nOpción 4\nOpción 5", cta1: "Ver", cta2: "Contactar" }
  },
  volvieron: {
    guia: { title: "GUÍA: Sacarle máximo partido a tu compra", intro: "Aprende a usar tu producto correctamente.", content: "En esta guía vas a ayudar al cliente a sacar el máximo provecho de lo que ya ha comprado.\n\nEmpieza recordándole cómo debería usarlo en el día a día y qué errores debe evitar. Después, añade recomendaciones prácticas para alargar la vida del producto y disfrutarlo más.\n\nCierra el contenido invitando al lector a aprovechar una revisión, un plan de mantenimiento o un beneficio extra que ofrezcas a tus clientes actuales.", cta1: "Descargar", cta2: "Ver beneficios" },
    checklist: { title: "CHECKLIST: Mantenimiento", intro: "Asegura la durabilidad.", content: "Limpieza semanal\nRevisión mensual\nMantenimiento trimestral", cta1: "Descargar", cta2: "Ver tips" },
    recomendacion: { title: "Productos complementarios", intro: "Complementa tu compra.", content: "Accesorio esencial\nProducto mantenimiento\nExtension garantia", cta1: "Ver Productos", cta2: "Agregar" }
  },
  conversion: {
    guia: { title: "GUÍA: Por qué elegirnos", intro: "Te mostramos por qué somos la mejor opción.", content: "En esta guía el objetivo es reducir las dudas finales de tu cliente antes de decir sí.\n\nExplica con tus palabras qué te diferencia (experiencia, garantías, casos reales) y en qué situaciones tu solución es la mejor opción. Usa ejemplos sencillos que el lector pueda imaginar en su propio negocio o vida.\n\nTermina recordando qué tiene que hacer ahora para aprovechar tu oferta (por ejemplo, solicitar presupuesto, reservar una sesión o iniciar una prueba).", cta1: "Conocer más", cta2: "Presupuesto" },
    checklist: { title: "CHECKLIST: Momento ideal", intro: "Verifica si es el mejor momento.", content: "Presupuesto disponible\nMomento adecuado\nNecesidad actual", cta1: "Verificar", cta2: "Comprar" },
    recomendacion: { title: "Mejor elección", intro: "Análisis objetivo.", content: "Beneficio principal\nSegundo beneficio\nDiferenciador", cta1: "Solicitar info", cta2: "Pedir demo" }
  },
  referidos: {
    guia: { title: "GUÍA: Comparte y gana", intro: "Invita a tus amigos.", content: "En esta guía quieres que tu cliente vea lo fácil que es invitar a otros y qué gana por hacerlo.\n\nPrimero, explica en una frase cómo funciona tu programa de referidos. Luego describe los pasos que debe seguir (por ejemplo, compartir un enlace, hablar con un amigo, enviar un código) pero sin necesidad de numerarlos como checklist.\n\nCierra reforzando el beneficio para ambos: qué gana quien invita y qué gana la persona invitada, y qué debe hacer ahora para conseguirlo.", cta1: "Invitar", cta2: "Ver programa" },
    checklist: { title: "CHECKLIST: Maximizar referidos", intro: "Aprovecha el programa.", content: "Redes sociales\nFamiliares\nGrupos\nCodigo personalizado", cta1: "Comenzar", cta2: "Ver Mis Referidos" },
    recomendacion: { title: "Gana con referidos", intro: "Por cada amigo ganas.", content: "1 referido = 10%\n3 = 15%\n5 = 20%", cta1: "Ver Programa", cta2: "Comenzar" }
  }
};

export default function LeadMagnetWizard() {
  return (
    <div className="lm-wizard">
      <LeadMagnetWizardInner />
    </div>
  );
}

function LeadMagnetWizardInner() {
  const [businessId, setBusinessId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [step, setStep] = useState<WizardStep>("bienvenida");
  const [objective, setObjective] = useState<Objective>("captar");
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

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userEmail = sessionData?.session?.user?.email || "";
      if (!userEmail) return;
      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("contact_email", userEmail)
        .single();
      const bid = biz?.id || "";
      if (!bid) return;
      setBusinessId(bid);
      const { data } = await supabase
        .from("businesses")
        .select("name, logo_url")
        .eq("id", bid)
        .single();
      if (data?.name) setBusinessName(data.name);
      if (data?.logo_url) setLogoUrl(data.logo_url);
    };
    load();
  }, []);

  useEffect(() => {
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
    } else {
      alert("PDF guardado correctamente en la plataforma.");
    }

    setPdfGenerating(false);
  };

  const renderStep = () => {
    switch (step) {
      case "bienvenida":
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4" style={{ color: "#ffffff" }}>
                Convierte tu conocimiento en un activo para tu negocio
              </h2>
              <p className="text-lg text-white max-w-2xl mx-auto">
                Este asistente te ayuda a transformar tu experiencia profesional y conocimiento de negocio en un recurso valioso que tus clientes pueden descargar.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                className="px-10 py-4 rounded-full bg-[#ffb400] text-black font-bold text-lg"
              >
                Comenzar a crear mi recurso
              </button>
            </div>
          </div>
        );

      case "objetivo":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2" style={{ color: "#ffffff" }}>¿Cuál es tu objetivo?</h2>
              <p className="text-white">Selecciona el propósito de tu recurso de valor</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.entries(OBJECTIVE_INFO) as [Objective, typeof OBJECTIVE_INFO[Objective]][]).map(([key, info]) => {
                const guide = OBJECTIVE_GUIDE[key];
                const isOpen = openGuide === key;

                return (
                  <div
                    key={key}
                    className="p-6 rounded-xl transition-all border-2"
                    style={{
                      borderColor: objective === key ? info.color : "rgba(255,255,255,0.1)",
                      backgroundColor: objective === key ? `${info.color}15` : "rgba(255,255,255,0.05)"
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setObjective(key)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: info.color }}></div>
                        <h3 className="text-lg font-bold" style={{ color: "#ffffff" }}>{info.title}</h3>
                      </div>
                      <p className="text-sm text-white mb-3">{info.description}</p>
                      <div className="text-xs text-white italic">Ej: {info.example}</div>
                    </button>

                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => setOpenGuide(isOpen ? null : key)}
                        className="text-xs px-3 py-1 rounded border border-white/20 text-white hover:bg-white/10"
                      >
                        {isOpen ? "Ocultar guía" : "Ver guía"}
                      </button>
                    </div>

                    {isOpen && guide && (
                      <div className="mt-4 text-sm text-white space-y-3">
                        <div><strong>Qué es:</strong> {guide.whatIs}</div>
                        <div>
                          <strong>Sub‑objetivos:</strong>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            {guide.subObjectives.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                        <div><strong>Qué crear:</strong> {guide.create}</div>
                        <div><strong>Formato recomendado:</strong> {guide.format}</div>
                        <div><strong>Ejemplo:</strong> {guide.example}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep("bienvenida")}
                className="px-6 py-3 rounded-full border border-white/20"
                style={{ color: "#ffffff" }}
              >
                Atras
              </button>
              <button
                onClick={() => setStep("tipo")}
                className="px-8 py-3 rounded-full bg-[#ffb400] text-black font-bold"
              >
                Continuar
              </button>
            </div>
          </div>
        );

      case "tipo":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2" style={{ color: "#ffffff" }}>¿Qué tipo de recurso es?</h2>
              <p className="text-white">Elige el formato</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(TYPE_INFO).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => setType(key as LeadMagnetType)}
                  className="p-6 rounded-xl text-center transition-all border-2"
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

            <div className="flex justify-between mt-8">
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
              <h2 className="text-2xl font-bold mb-2" style={{ color: "#ffffff" }}>Personaliza tu contenido</h2>
              <p className="text-white">Edita los datos generados</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs uppercase tracking-widest text-[#39a1a9] mb-2">Titulo del documento</label>
                <textarea
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white"
                  style={{ color: "#ffffff" }}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-[#39a1a9] mb-2">Descripcion inicial</label>
                <textarea
                  value={customIntro}
                  onChange={(e) => setCustomIntro(e.target.value)}
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
                        setCustomContent(e.target.value);
                      }
                    }}
                    rows={8}
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
                        const updated = [...parsedPoints, newPoint.trim()];
                        setCustomContent(updated.join("\n"));
                        setNewPoint("");
                      }}
                      className="text-xs px-3 py-2 rounded-lg bg-[#39a1a9]/80 text-black font-bold hover:bg-[#39a1a9]"
                    >
                      Añadir
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto bg-white/5 rounded-lg p-3 border border-white/10">
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
              <h2 className="text-2xl font-bold mb-2" style={{ color: "#ffffff" }}>Personalizacion de botones y colores</h2>
              <p className="text-white">Configura los botones CTA y los colores del documento</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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

            <div className="bg-white/5 rounded-xl p-6 mb-6">
              <h3 className="text-white font-bold mb-4">Colores del documento</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

  return (
    <div className="min-h-screen bg-[#0f1720] p-4 md:p-6 lg:p-8 overflow-x-auto">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-8">
          <div>
            <h1 className="text-[#ffb400] text-base md:text-lg font-extrabold tracking-widest uppercase">Recurso de Valor</h1>
            <p className="text-white text-xs md:text-sm">Convierte tu conocimiento en un recurso valioso para tus clientes</p>
          </div>
          <Link href="/lead-magnet/new" className="text-white hover:text-white text-xs md:text-sm">
            Volver al editor avanzado
          </Link>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8 overflow-x-auto pb-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <button
                type="button"
                onClick={() => setStep(s)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
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
                  className={`w-12 h-0.5 mx-1 ${steps.indexOf(step) > i ? "bg-green-500" : "bg-white/10"}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-[#0f1720]/50 rounded-2xl border border-white/10 p-6 md:p-10">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
