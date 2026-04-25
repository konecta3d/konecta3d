"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { LeadMagnetPreview } from "@/components/LeadMagnetPreview";
import ActionLinkPicker from "@/components/ActionLinkPicker";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";

type LeadMagnetType = "guia" | "checklist" | "recomendacion";
type Objective = "vuelvan" | "conversion" | "referidos";

const BASE_TITLE_PLACEHOLDER = "Tu recurso de valor";
const BASE_INTRO_PLACEHOLDER = "Introducción al documento";
const BASE_CONTENT_PLACEHOLDER = "Contenido principal del recurso";
type BusinessType = "servicio" | "producto" | "ambos";

interface LeadMagnetState {
  businessName: string;
  businessType: BusinessType;
  objective: Objective;
  type: LeadMagnetType;
  typeLabel: string;
  title: string;
  subtitle: string;
  intro: string;
  introFixed: boolean;
  content: string;
  content2: string;
  content3: string;
  sn1: string;
  sn2: string;
  sn3: string;
  sn4: string;
  sn1En: boolean;
  sn2En: boolean;
  sn3En: boolean;
  sn4En: boolean;
  logoUrl: string;
  logoSize: number;
  showLogo: boolean;
  cta1Enabled: boolean;
  cta1Text: string;
  cta1Link: string;
  cta1Action: string;
  cta2Enabled: boolean;
  cta2Text: string;
  cta2Link: string;
  colorBrand: string;
  colorTag: string;
  colorTitle: string;
  colorButton: string;
  titleSize: number;
  activeTheme: string;
  themeVariant: number;
  activeStep: number;
}

const THEMES = {
  konecta: [
    { bn: "#C5A059", tag: "#C5A059", tit: "#0A0A0B", btn: "#C5A059" },
    { bn: "#E5D5B7", tag: "#C5A059", tit: "#2D2926", btn: "#C5A059" },
    { bn: "#A67C52", tag: "#A67C52", tit: "#1A1A1A", btn: "#A67C52" },
  ],
  ocean: [
    { bn: "#0891B2", tag: "#0891B2", tit: "#164E63", btn: "#06B6D4" },
    { bn: "#0E7490", tag: "#155EEF", tit: "#1E3A8A", btn: "#3B82F6" },
    { bn: "#14B8A6", tag: "#14B8A6", tit: "#134E4A", btn: "#2DD4BF" },
  ],
  forest: [
    { bn: "#059669", tag: "#059669", tit: "#064E3B", btn: "#10B981" },
    { bn: "#65A30D", tag: "#65A30D", tit: "#365314", btn: "#84CC16" },
    { bn: "#047857", tag: "#047857", tit: "#064E3B", btn: "#34D399" },
  ],
  sunset: [
    { bn: "#EA580C", tag: "#EA580C", tit: "#7C2D12", btn: "#F97316" },
    { bn: "#DC2626", tag: "#DC2626", tit: "#7F1D1D", btn: "#EF4444" },
    { bn: "#C2410C", tag: "#C2410C", tit: "#7C2D12", btn: "#FB923C" },
  ],
  royal: [
    { bn: "#7C3AED", tag: "#7C3AED", tit: "#4C1D95", btn: "#A78BFA" },
    { bn: "#DB2777", tag: "#DB2777", tit: "#831843", btn: "#F472B6" },
    { bn: "#8B5CF6", tag: "#8B5CF6", tit: "#4C1D95", btn: "#A78BFA" },
  ],
  minimal: [
    { bn: "#1F2937", tag: "#1F2937", tit: "#111827", btn: "#374151" },
    { bn: "#000000", tag: "#374151", tit: "#000000", btn: "#000000" },
    { bn: "#4B5563", tag: "#6B7280", tit: "#1F2937", btn: "#6B7280" },
  ],
};

const TYPE_LABELS: Record<LeadMagnetType, string> = {
  guia: "GUÍA ESTRATÉGICA",
  checklist: "CHECKLIST DE IMPLEMENTACIÓN",
  recomendacion: "RECOMENDACIÓN TÉCNICA",
};

// Opciones comunes para botones CTA (reutilizadas del asistente)
const CTA_PRESETS = [
  "Descargar ahora",
  "Reservar cita",
  "Contactar",
  "Más información",
  "Comenzar ahora",
];

const INTRO_SUGGESTIONS: Record<LeadMagnetType, string> = {
  guia: "Este documento es una ruta paso a paso diseñada para educarte sobre la mejor estrategia para tu situación actual.",
  checklist: "Añade una breve descripción de este recurso y su propósito.",
  recomendacion: "Esta recomendación técnica se basa en estándares de la industria para optimizar tu toma de decisiones.",
};

const ORIENTATION_MESSAGES: Record<string, Record<string, string>> = {
  vuelvan: {
    servicio: "Una **Recomendación técnica personalizada** tras el servicio asegura que el cliente se sienta cuidado y regrese.",
    producto: "Una **Guía de uso avanzado** o mantenimiento alarga la vida del producto y fomenta que el cliente vuelva a confiar en ti.",
    ambos: "Enfócate en aportar valor post-venta para asegurar la recurrencia.",
  },
  conversion: {
    all: "Para maximizar la **CONVERSIÓN**, utiliza este recurso para **reducir la fricción** en la decisión de compra, aclarando dudas técnicas finales.",
  },
  referidos: {
    all: "Para incentivar **REFERIDOS**, enfoca el contenido en lo **fácil que es compartir** este valor con otros conocidos del cliente.",
  },
};

const CTA_SUGGESTIONS: Record<Objective, string[]> = {
  vuelvan: ["Agendar Revisión", "Ver Novedades", "Acceso Club VIP"],
  conversion: ["Comprar Ahora", "Solicitar Presupuesto", "Ver Demo En Vivo"],
  referidos: ["Regalar a un Amigo", "Compartir en WhatsApp", "Invitar y Ganar"],
};

const SN_SUGGESTIONS: Record<Objective, { s1: string[]; s2: string[]; s3: string[]; s4: string[] }> = {
  vuelvan: {
    s1: ["Envía esta encuesta a tus clientes", "Regala este cupón en el próximo ticket", "Añade este detalle en tu packaging"],
    s2: ["Aumentarás tu recurrencia mensual", "Clientes más felices y fieles", "Más recomendaciones positivas"],
    s3: ["Si quieres el sistema de fidelidad...", "Pregunta por nuestro plan VIP", "Activa tus recompensas aquí"],
    s4: ["Ver plan de fidelización", "Contactar con soporte VIP", "Ir a mi panel de cliente"],
  },
  conversion: {
    s1: ["Calcula tu ROI con este dato", "Compara este precio con tu gasto actual", "Inicia tu prueba de 7 días"],
    s2: ["Ahorrarás un 20% de costes", "Resultados visibles en 48h", "Retorno de inversión garantizado"],
    s3: ["Oferta válida solo por 24h", "Últimas plazas con descuento", "Desbloquea el bonus especial"],
    s4: ["Comprar ahora con descuento", "Ver oferta por tiempo limitado", "Solicitar acceso inmediato"],
  },
  referidos: {
    s1: ["Comparte este enlace con 3 amigos", "Muestra este resultado en tus redes", "Invita a un socio a probarlo"],
    s2: ["Obtén 1 mes gratis por referido", "Premios exclusivos por compartir", "Ayuda a otros a crecer"],
    s3: ["Si traes a alguien antes de...", "Tu red ganará un beneficio extra", "Sé un embajador"],
    s4: ["Generar mi link de referido", "Ver mis recompensas", "Compartir en WhatsApp"],
  },
};

function LeadMagnetNewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [businessId, setBusinessId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const [state, setState] = useState<LeadMagnetState>({
    businessName: "",
    businessType: "servicio",
    objective: "vuelvan",
    type: "guia",
    typeLabel: "GUÍA ESTRATÉGICA",
    title: "",
    subtitle: "",
    intro: "",
    introFixed: false,
    content: "",
    content2: "",
    content3: "",
    sn1: "",
    sn2: "",
    sn3: "",
    sn4: "",
    sn1En: true,
    sn2En: true,
    sn3En: true,
    sn4En: true,
    logoUrl: "",
    logoSize: 32,
    showLogo: true,
    cta1Enabled: true,
    cta1Text: "Descargar Guía",
    cta1Link: "",
    cta1Action: "descarga",
    cta2Enabled: false,
    cta2Text: "",
    cta2Link: "",
    colorBrand: "#C5A059",
    colorTag: "#C5A059",
    colorTitle: "#0A0A0B",
    colorButton: "#C5A059",
    titleSize: 1.5,
    activeTheme: "konecta",
    themeVariant: 0,
    activeStep: 1,
  });

  const previewRef = useRef<HTMLDivElement>(null);

  const update = (patch: Partial<LeadMagnetState>) => setState(s => ({ ...s, ...patch }));
  const goToStep = (step: number) => update({ activeStep: step });

  const setResourceType = (type: LeadMagnetType) => {
    update({ type, typeLabel: TYPE_LABELS[type] });
    if (!state.introFixed) {
      update({ intro: INTRO_SUGGESTIONS[type], introFixed: true });
    }
  };

  const applyTheme = (theme: string) => {
    if (state.activeTheme === theme) {
      update({ themeVariant: (state.themeVariant + 1) % 3 });
    } else {
      update({ activeTheme: theme, themeVariant: 0 });
    }
    const variant = THEMES[theme as keyof typeof THEMES]?.[state.activeTheme === theme ? state.themeVariant : 0];
    if (variant) {
      update({
        colorBrand: variant.bn,
        colorTag: variant.tag,
        colorTitle: variant.tit,
        colorButton: variant.btn,
      });
    }
  };

  const applyCtaSuggestion = (text: string) => {
    update({ cta1Text: text });
  };

  const applySnSuggestion = (field: number, text: string) => {
    if (field === 1) update({ sn1: text });
    if (field === 2) update({ sn2: text });
    if (field === 3) update({ sn3: text });
    if (field === 4) update({ sn4: text });
  };

  const getOrientationMessage = () => {
    if (state.objective === "conversion") return ORIENTATION_MESSAGES.conversion.all;
    if (state.objective === "referidos") return ORIENTATION_MESSAGES.referidos.all;
    return ORIENTATION_MESSAGES[state.objective]?.[state.businessType] || ORIENTATION_MESSAGES[state.objective]?.servicio || "";
  };

  useEffect(() => {
    // Verificar autenticación primero y, si viene ?edit=, cargar el Recurso de Valor
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/business/login?redirect=/lead-magnet/new");
        return;
      }

      const role = localStorage.getItem("konecta-role");
      if (role !== "business") {
        router.push("/business/login?redirect=/lead-magnet/new");
        return;
      }

      const userEmail = session.user.email || "";
      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("contact_email", userEmail)
        .single();
      const bid = biz?.id || "";
      if (!bid) {
        router.push("/business/login?redirect=/lead-magnet/new");
        return;
      }

      setBusinessId(bid);
      setCheckingAuth(false);

      const loadBizAndLeadMagnet = async () => {
        const { data: biz } = await supabase
          .from("businesses")
          .select("name, logo_url")
          .eq("id", bid)
          .single();
        if (biz?.name) update({ businessName: biz.name });
        if (biz?.logo_url) update({ logoUrl: biz.logo_url });

        const editId = searchParams.get("edit");
        if (editId) {
          const { data: lm } = await supabase
            .from("lead_magnets")
            .select("*")
            .eq("id", editId)
            .maybeSingle();
          if (lm) {
            setEditingId(lm.id);
            update({
              title: lm.title || "",
              subtitle: lm.subtitle || "",
              type: (lm.type || "guia") as LeadMagnetType,
              objective: (lm.objective || "captar") as Objective,
              businessType: (lm.business_type || "servicio") as BusinessType,
              intro: lm.intro || "",
              content: lm.content || "",
              content2: lm.content2 || "",
              content3: lm.content3 || "",
              sn1: lm.sn1 || "",
              sn2: lm.sn2 || "",
              sn3: lm.sn3 || "",
              sn4: lm.sn4 || "",
              sn1En: lm.sn1_en ?? true,
              sn2En: lm.sn2_en ?? true,
              sn3En: lm.sn3_en ?? true,
              sn4En: lm.sn4_en ?? true,
              cta1Enabled: lm.cta1_enabled ?? true,
              cta1Text: lm.cta1_text || "",
              cta1Link: lm.cta1_link || "",
              cta1Action: lm.cta1_action || "descarga",
              cta2Enabled: lm.cta2_enabled ?? false,
              cta2Text: lm.cta2_text || "",
              cta2Link: lm.cta2_link || "",
              colorBrand: lm.color_brand || "#C5A059",
              colorTag: lm.color_tag || "#C5A059",
              colorTitle: lm.color_title || "#0A0A0B",
              colorButton: lm.color_button || "#C5A059",
              typeLabel: TYPE_LABELS[(lm.type || "guia") as LeadMagnetType],
            });
          }
        }
      };
      loadBizAndLeadMagnet();
    };

    checkAuth();
  }, [router, searchParams]);

  // Upload logo to reuse same endpoint as Landing
  const uploadLogo = async (file: File): Promise<string | null> => {
    if (!businessId) {
      alert("Falta businessId");
      return null;
    }
    const form = new FormData();
    form.append("file", file);
    form.append("kind", "logo");
    form.append("businessId", businessId);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/landing/upload", {
      method: "POST",
      headers: { "Authorization": `Bearer ${session?.access_token || ""}` },
      body: form,
    });
    if (!res.ok) {
      alert("Error al subir el logo");
      return null;
    }
    const data = await res.json();
    return data.url as string;
  };

  const load = async () => {
    if (!businessId) return;
    const { data } = await supabase
      .from("lead_magnets")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    setItems(data || []);
  };

  const saveAndGetId = async (): Promise<string | null> => {
    if (!businessId) {
      alert("Falta businessId; no se puede guardar el PDF.");
      return null;
    }

    setLoading(true);

      const effectiveTitle = state.title || BASE_TITLE_PLACEHOLDER;
      const effectiveIntro = state.intro || BASE_INTRO_PLACEHOLDER;
      const effectiveContent = state.content || BASE_CONTENT_PLACEHOLDER;

    const payload = {
      business_id: businessId,
      title: state.title,
      subtitle: state.subtitle,
      type: state.type,
      objective: state.objective,
      business_type: state.businessType,
      intro: state.intro,
      content: state.content,
      content2: state.content2,
      content3: state.content3,
      sn1: state.sn1,
      sn2: state.sn2,
      sn3: state.sn3,
      sn4: state.sn4,
      sn1_en: state.sn1En,
      sn2_en: state.sn2En,
      sn3_en: state.sn3En,
      sn4_en: state.sn4En,
      cta1_enabled: state.cta1Enabled,
      cta1_text: state.cta1Text,
      cta1_link: state.cta1Link,
      cta1_action: state.cta1Action,
      cta2_enabled: state.cta2Enabled,
      cta2_text: state.cta2Text,
      cta2_link: state.cta2Link,
      color_brand: state.colorBrand,
      color_tag: state.colorTag,
      color_title: state.colorTitle,
      color_button: state.colorButton,
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

      const { data, error } = result as any;
      if (error) {
        console.error("Error al guardar lead_magnet:", error);
        alert("Error al guardar el Recurso de Valor: " + error.message);
        return null;
      }

      const id = editingId || data?.id || null;
      if (!editingId && id) {
        setEditingId(id);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      load();
      alert("PDF guardado correctamente.");
      return id;
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    await saveAndGetId();
  };

  const savePdf = async () => {
    if (!businessId) return;

    setPdfGenerating(true);

      const effectiveTitle = state.title || BASE_TITLE_PLACEHOLDER;
      const effectiveIntro = state.intro || BASE_INTRO_PLACEHOLDER;
      const effectiveContent = state.content || BASE_CONTENT_PLACEHOLDER;

    let lmId = editingId;
    if (!lmId) {
      lmId = await saveAndGetId();
      if (!lmId) {
        setPdfGenerating(false);
        return;
      }
    }

      let contentHtml = effectiveContent;
    if (state.type === "checklist") {
      contentHtml = effectiveContent
  .split("\n")
        .filter((l) => l.trim())
        .map(
          (l) =>
            `<li style="display:flex;align-items:flex-start;gap:10px;margin-bottom:0.8rem"><span style="min-width:18px;height:18px;border:2px solid ${state.colorButton};border-radius:4px;display:inline-block;margin-top:3px"></span><span>${l}</span></li>`
        )
        .join("");
      contentHtml = `<ul style="list-style:none;padding:0">${contentHtml}</ul>`;
    } else if (state.type === "recomendacion") {
      contentHtml = state.content
        .split("\n")
        .filter((l) => l.trim())
        .map(
          (l, i) =>
            `<li style="margin-bottom:1rem;padding-left:10px;list-style:decimal;color:#000000"><span style="font-weight:bold;color:${state.colorBrand}">${i + 1}.</span> ${l}</li>`
        )
        .join("");
      contentHtml = `<ol style="padding-left:1.5rem;color:#000000;list-style:decimal;">${contentHtml}</ol>`;
    }

    // Título 40% más pequeño
    const titleSizeSmall = Math.round(state.titleSize * 0.6 * 10) / 10;

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',sans-serif}.container{width:210mm;min-height:297mm;padding:20mm;padding-bottom:15mm;background:#fff;position:relative}.header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid ${state.colorBrand};padding-bottom:20px;margin-bottom:30px}.brand{font-size:1.2rem;font-weight:900;color:${state.colorBrand};text-transform:uppercase}.tag{background:${state.colorTag};color:#fff;padding:5px 15px;border-radius:4px;font-size:0.7rem;font-weight:700;text-transform:uppercase}.title{font-size:${titleSizeSmall}rem;font-weight:900;color:${state.colorTitle};line-height:1.1;margin-bottom:20px;text-transform:uppercase}.subtitle{font-size:1.1rem;color:#4B5563;margin-bottom:40px}.section{margin-bottom:30px}.section h4{color:${state.colorBrand};font-size:0.9rem;text-transform:uppercase;border-left:4px solid ${state.colorBrand};padding-left:10px;margin-bottom:15px}.content{font-size:0.9rem;color:#374151;line-height:1.8;white-space:pre-line}.sn-section{padding:1.2rem;border-top:1px dashed rgba(0,0,0,0.1);border-bottom:1px dashed rgba(0,0,0,0.1);margin-bottom:20px;border-radius:8px;font-size:0.85rem;line-height:1.4;color:#000000;background:#f9fafb}.cta-box{position:absolute;bottom:60px;left:20mm;right:20mm;display:flex;justify-content:center;gap:15px;flex-wrap:wrap}.cta-btn{padding:12px 25px;border-radius:8px;background:${state.colorButton};color:#fff;font-weight:800;text-transform:uppercase;font-size:0.85rem;text-decoration:none}.cta-btn-outline{padding:12px 25px;border-radius:8px;border:2px solid ${state.colorButton};color:${state.colorButton};font-weight:800;text-transform:uppercase;font-size:0.85rem;text-decoration:none}.footer{position:absolute;bottom:20px;left:20mm;right:20mm;border-top:1px solid #E5E7EB;padding-top:20px;font-size:0.7rem;color:#9CA3AF;text-align:center}</style></head><body><div class="container"><div class="header"><div class="brand">${(state.businessName || "MI NEGOCIO").toUpperCase()}</div><div class="tag">${state.typeLabel}</div></div><div class="title">${effectiveTitle}
</div>${effectiveIntro ? `<div class="subtitle">${effectiveIntro}</div>` : ""}${state.intro ? `<div class="subtitle">${state.intro}</div>` : ""}<div class="section"><h4>${state.typeLabel}</h4><div class="content">${contentHtml}</div></div>${(state.sn1En && state.sn1) || (state.sn2En && state.sn2) || (state.sn3En && state.sn3) || (state.sn4En && state.sn4) ? `<div class="sn-section">${state.sn1En && state.sn1 ? `<div style="margin-bottom:12px;color:#000000;font-weight:bold">${state.sn1}</div>` : ""}${state.sn2En && state.sn2 ? `<div style="margin-bottom:12px;color:#000000;font-weight:bold">${state.sn2}</div>` : ""}${state.sn3En && state.sn3 ? `<div style="margin-bottom:12px;color:#000000;font-weight:bold">${state.sn3}</div>` : ""}${state.sn4En && state.sn4 ? `<div style="margin-top:10px;margin-bottom:15px;font-weight:bold;text-align:center;color:#000000">${state.sn4}</div>` : ""}</div>` : ""}<div class="cta-box"><a href="${state.cta1Link || "#"}" class="cta-btn" target="_blank">${state.cta1Text || "ACCION"}</a>${state.cta2Enabled && state.cta2Text ? `<a href="${state.cta2Link || "#"}" class="cta-btn-outline" target="_blank">${state.cta2Text}</a>` : ""}</div><div class="footer">Personalizado para ti por ${state.businessName || "Mi Negocio"}</div></div></body></html>`;

    const { data: { session: pdfSession } } = await supabase.auth.getSession();
    const res = await fetch("/api/lead-magnet/generate-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${pdfSession?.access_token || ""}`,
      },
      body: JSON.stringify({
        html,
        businessId,
        title: state.title,
        leadMagnetId: lmId,
      }),
    });

    const data = await res.json();
    if (data.error) {
      alert("Error al guardar el PDF: " + data.error);
    } else {
      // Refuerzo: actualizar pdf_url tambien desde el cliente para este Recurso de Valor
      if (data.url && lmId) {
        await supabase
          .from("lead_magnets")
          .update({ pdf_url: data.url })
          .eq("id", lmId);
      }
      alert("PDF guardado correctamente en la plataforma.");
    }
    setPdfGenerating(false);
  };

  const stepTitles = ["Estrategia Base", "Contenido de Valor", "El Cierre (SN)", "Personalización"];

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-4)] mx-auto mb-4"></div>
          <p className="text-white">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1720]">
      <div className="max-w-5xl mx-auto md:px-6 md:py-4 lg:px-8 lg:py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-[#C5A059] text-sm font-extrabold tracking-widest uppercase">Recurso de Valor</h1>
          </div>
          <div className="flex gap-3 items-center">
            {/* Toggle between Wizard and Advanced */}
            <a 
              href="/lead-magnet/wizard" 
              className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border border-[#39a1a9] text-[#39a1a9] hover:bg-[#39a1a9]/10 transition-colors"
            >
              Modo Asistente
            </a>
            <button
              onClick={savePdf}
              disabled={pdfGenerating}
              className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--brand-4)] text-[#001e3c] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {pdfGenerating ? "Guardando..." : "Guardar PDF"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1 md:gap-2 mb-8">
          {[1, 2, 3, 4].map((step, idx) => (
            <div key={step} className="flex items-center">
              <button onClick={() => goToStep(step)} className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full transition-all text-xs font-bold ${state.activeStep === step ? "bg-[#C5A059] text-[#0A0A0B]" : "border border-white/10 text-white"}`}>
                <span>{step}</span>
                <span className="hidden md:inline">{stepTitles[idx]}</span>
              </button>
              {step < 4 && <div className="w-4 md:w-8 h-px bg-white/10 mx-1" />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[#0f1720] p-4 md:p-8 lg:p-10 mb-6 shadow-xl">
          {state.activeStep === 1 && (
            <>
              <button onClick={() => goToStep(1)} className="w-full text-left mb-6">
                <h2 className="text-[var(--brand-3)] text-lg uppercase tracking-widest mb-1">1. Estrategia Base</h2>
                <p className="text-white text-sm">Define los fundamentos de tu Recurso de Valor</p>
              </button>
              <div className="border-l-4 border-[var(--brand-4)] bg-[var(--brand-4)]/5 p-4 rounded-r-lg mb-6">
                <h4 className="text-[var(--brand-3)] text-xs uppercase tracking-widest mb-2">Tutor Estratégico: Objetivos</h4>
                <p className="text-white text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: getOrientationMessage().replace(/\*\*(.*?)\*\*/g, "<b>$1</b>") }} />
              </div>
              
              <div className="mb-6">
                <h3 className="text-[var(--brand-1)] text-sm uppercase tracking-widest mb-4">Datos del Negocio</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[var(--brand-1)] text-xs uppercase tracking-widest block mb-2">Nombre Comercial</label>
                    <input type="text" value={state.businessName} onChange={(e) => update({ businessName: e.target.value })} placeholder="Tu marca..." className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-transparent text-sm outline-none focus:border-[var(--brand-3)]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[var(--brand-1)] text-xs uppercase tracking-widest block mb-1">Logo del negocio (PDF)</label>
                    {state.logoUrl && (
                      <div className="flex items-center gap-3">
                        <img
                          src={state.logoUrl}
                          alt="logo actual"
                          className="h-10 w-10 rounded-lg object-contain border border-[var(--border)] bg-black/20"
                        />
                        <span className="text-xs text-white">Este logo se usará en el encabezado del PDF.</span>
                      </div>
                    )}
                    <label className="inline-flex items-center gap-2 text-xs text-white cursor-pointer">
                      <span className="px-3 py-2 rounded-full border border-[var(--border)] bg-white/5 hover:bg-white/10 transition-colors">
                        Subir logo
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const url = await uploadLogo(file);
                          if (url) update({ logoUrl: url });
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                  <div>
                    <label className="text-[var(--brand-3)] text-xs uppercase tracking-widest block mb-2">¿Qué comercializas?</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(["servicio", "producto", "ambos"] as BusinessType[]).map(t => (
                        <button key={t} onClick={() => update({ businessType: t })} className={`py-3 rounded-xl text-xs font-extrabold uppercase transition-all ${state.businessType === t ? "border-2 border-[var(--brand-3)] bg-[#0f1720] text-white" : "border border-[var(--brand-3)] bg-[#0f1720] text-white/70"}`}>
                          {t === "servicio" ? "SERVICIO" : t === "producto" ? "PRODUCTO" : "AMBOS"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-2 border-[var(--brand-3)] rounded-2xl p-4 mb-6">
                <h3 className="text-[var(--brand-1)] text-sm uppercase tracking-widest mb-4">Estrategia del Recurso</h3>
                <label className="text-[var(--brand-4)] text-xs uppercase tracking-widest block mb-2">Objetivo Principal</label>
                <div className="grid grid-cols-1 gap-2 mt-3">
                  {(["vuelvan", "conversion", "referidos"] as Objective[]).map(o => (
                    <button key={o} onClick={() => update({ objective: o })} className={`py-3 rounded-xl text-xs font-extrabold uppercase transition-all ${state.objective === o ? "border-2 border-[var(--brand-3)] bg-[#0f1720] text-white" : "border border-[var(--brand-3)] bg-[#0f1720] text-white/70"}`}>
                      {o === "vuelvan" ? "FIDELIZACIÓN" : o === "conversion" ? "CONVERSIÓN" : "REFERIDOS"}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => goToStep(2)} className="w-full py-3 rounded-full text-sm font-bold uppercase tracking-wider bg-[var(--brand-4)] text-black hover:opacity-90 transition-opacity">
                Siguiente: Contenido
              </button>
            </>
          )}

          {state.activeStep === 2 && (
            <>
              <button onClick={() => goToStep(2)} className="w-full text-left mb-6">
                <h2 className="text-[var(--brand-3)] text-lg uppercase tracking-widest mb-1">2. Contenido de Valor</h2>
                <p className="text-white text-sm">Crea el contenido de tu recurso</p>
              </button>

              <div className="border-2 border-[var(--brand-3)] bg-[var(--brand-3)]/5 p-4 rounded-xl mb-6">
                <h4 className="text-[var(--brand-3)] text-xs uppercase tracking-widest mb-2">Tutor Estratégico: Contenido AIDA</h4>
                <p className="text-white text-sm leading-relaxed">Usa el <b>Título</b> para captar Atención. La <b>Aclaración</b> para generar Interés. El <b>Contenido</b> debe alimentar el Deseo resolviendo un problema real.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[var(--brand-3)] text-xs uppercase tracking-widest block mb-2">Formato del Recurso</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {([{ t: "guia" as LeadMagnetType, l: "GUÍA" }, { t: "checklist" as LeadMagnetType, l: "CHECKLIST" }, { t: "recomendacion" as LeadMagnetType, l: "RECOMENDACIÓN" }]).map(x => (
                      <button key={x.t} onClick={() => setResourceType(x.t)} className={`py-3 rounded-xl text-xs font-extrabold uppercase transition-all ${state.type === x.t ? "border-2 border-[var(--brand-3)] bg-[#0f1720] text-white" : "border border-[var(--brand-3)] bg-[#0f1720] text-white/70"}`}>
                        {x.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[var(--brand-3)] text-xs uppercase tracking-widest block mb-2">Título del Documento</label>
                  <input type="text" value={state.title} onChange={(e) => update({ title: e.target.value })} placeholder="Ej: Guía de autocuidado para corredores" className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm outline-none focus:border-[var(--brand-4)]" />
                </div>

                <div>
                  <label className="text-[var(--brand-3)] text-xs uppercase tracking-widest block mb-2">Personalización / Aclaración Inicial</label>
                  <textarea value={state.intro} onChange={(e) => update({ intro: e.target.value, introFixed: true })} placeholder="Explica qué es este documento..." rows={2} className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm outline-none focus:border-[var(--brand-3)] resize-none" />
                </div>

                <div>
                  <label className="text-[var(--brand-3)] text-xs uppercase tracking-widest block mb-2">Contenido Principal (Aporte de Valor)</label>
                  <textarea value={state.content} onChange={(e) => update({ content: e.target.value })} placeholder="Escribe aquí el contenido técnico..." rows={5} className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm outline-none focus:border-[var(--brand-3)] resize-none" />
                  <p className="text-white text-xs mt-1">Usa **texto** para negrita.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mt-6">
                <button onClick={() => goToStep(1)} className="flex-1 py-3 rounded-full text-sm font-bold uppercase tracking-wider border border-white/10 text-white hover:bg-white/5 transition-colors">Atrás</button>
                <button onClick={() => goToStep(3)} className="flex-1 py-3 rounded-full text-sm font-bold uppercase tracking-wider bg-[var(--brand-4)] text-black hover:opacity-90 transition-opacity">Siguiente</button>
              </div>
            </>
          )}

          {state.activeStep === 3 && (
            <>
              <button onClick={() => goToStep(3)} className="w-full text-left mb-6">
                <h2 className="text-[var(--brand-3)] text-lg uppercase tracking-widest mb-1">3. El Cierre (SN)</h2>
                <p className="text-white text-sm">Define las acciones que quieres que tome el cliente</p>
              </button>

              <div className="space-y-4">
                {[
                  { n: 1, k: "sn1", en: "sn1En", p: "¿Qué debe hacer el cliente ahora?", max: 110, sug: SN_SUGGESTIONS[state.objective]?.s1 || [] },
                  { n: 2, k: "sn2", en: "sn2En", p: "¿Qué logrará?", max: 110, sug: SN_SUGGESTIONS[state.objective]?.s2 || [] },
                  { n: 4, k: "sn4", en: "sn4En", p: "Transición hacia el botón.", max: 110, sug: SN_SUGGESTIONS[state.objective]?.s4 || [] },
                ].map((item, i) => (
                  <div key={item.k} className={`p-4 rounded-xl bg-white/5 border border-white/10 ${i === 3 ? "" : "mb-4"}`}>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[var(--brand-3)] text-xs uppercase tracking-widest font-extrabold">{item.n}. {item.k === "sn1" ? "Sugerencia de aplicación" : item.k === "sn2" ? "Beneficios obtenidos" : "Acción siguiente (CTA)"} <span className="font-normal opacity-70 text-[10px]">(Máx {item.max})</span></label>
                      <input type="checkbox" checked={state[item.en as keyof LeadMagnetState] as boolean} onChange={(e) => update({ [item.en]: e.target.checked })} className="w-5 h-5 cursor-pointer accent-[var(--brand-3)]" />
                    </div>
                    <p className="text-white text-xs italic mb-2">{item.p}</p>
                    <textarea value={state[item.k as keyof LeadMagnetState] as string} onChange={(e) => update({ [item.k]: e.target.value })} rows={2} maxLength={item.max} className="w-full px-3 py-2 rounded-lg border border-[#0f1720] bg-[#0f1720] text-white text-xs outline-none focus:border-[var(--brand-3)] resize-none" />
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.sug.map(s => (
                        <button key={s} onClick={() => applySnSuggestion(item.n, s)} className="text-[9px] md:text-[10px] px-2 py-1 rounded-full bg-[var(--brand-3)]/10 text-[var(--brand-3)] border border-[var(--brand-3)]/20 hover:bg-[var(--brand-3)] hover:text-black transition-colors">+ {s}</button>
                      ))}
                    </div>
                    <div className="text-right text-[var(--brand-3)] text-xs mt-1">{(state[item.k as keyof LeadMagnetState] as string || "").length} / {item.max}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mt-6">
                <button onClick={() => goToStep(2)} className="flex-1 py-3 rounded-full text-sm font-bold uppercase tracking-wider border border-white/10 text-white hover:bg-white/5 transition-colors">Atrás</button>
                <button onClick={() => goToStep(4)} className="flex-1 py-3 rounded-full text-sm font-bold uppercase tracking-wider bg-[var(--brand-4)] text-black hover:opacity-90 transition-opacity">Siguiente</button>
              </div>
            </>
          )}

          {state.activeStep === 4 && (
            <div>
              <button onClick={() => goToStep(4)} className="w-full text-left mb-6">
                <h2 className="text-white text-lg uppercase tracking-widest mb-1">4. Personalización</h2>
                <p className="text-white text-sm">Ajusta los colores y CTAs del PDF</p>
              </button>

              <div className="bg-[var(--brand-3)]/5 p-4 rounded-xl mb-6">
                <p className="text-white text-sm italic">El botón debe ser una orden directa y clara. Usa colores que contrasten.</p>
              </div>

              <div className="space-y-4 mb-6">
                {/* Botones y acciones (CTA 1 y CTA 2) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 mb-2">
                  {/* CTA 1 */}
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-bold">Botón Principal (CTA 1)</h3>
                      <label className="flex items-center gap-2 text-sm text-white">
                        <input
                          type="checkbox"
                          checked={state.cta1Enabled}
                          onChange={(e) => update({ cta1Enabled: e.target.checked })}
                          className="w-4 h-4 accent-[var(--brand-4)]"
                        />
                        Activar
                      </label>
                    </div>
                    {state.cta1Enabled && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-white mb-1">Texto del botón</label>
                          <div className="flex gap-2">
                            <select
                              value={state.cta1Text}
                              onChange={(e) => update({ cta1Text: e.target.value })}
                              className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm"
                              style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "white" }}
                            >
                              <option value="" style={{ color: "#999" }}>
                                Seleccionar opción...
                              </option>
                              {CTA_PRESETS.map((opt) => (
                                <option
                                  key={opt}
                                  value={opt}
                                  style={{ color: "white", backgroundColor: "#1e293b" }}
                                >
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </div>
                          <input
                            type="text"
                            value={state.cta1Text}
                            onChange={(e) => update({ cta1Text: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm mt-2 placeholder-slate-400"
                            style={{ color: "#f9fafb" }}
                            placeholder="O escribe tu propio texto..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-white mb-1">Enlace (URL)</label>
                          <div className="space-y-2">
                            <ActionLinkPicker
                              value={state.cta1Link}
                              onChange={(url) => update({ cta1Link: url })}
                              label=""
                            />
                            <input
                              type="text"
                              value={state.cta1Link}
                              onChange={(e) => update({ cta1Link: e.target.value })}
                              placeholder="O escribe una URL manualmente..."
                              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm placeholder-slate-400"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CTA 2 */}
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-bold">Botón Secundario (CTA 2)</h3>
                      <label className="flex items-center gap-2 text-sm text-white">
                        <input
                          type="checkbox"
                          checked={state.cta2Enabled}
                          onChange={(e) =>
                            update({
                              cta2Enabled: e.target.checked,
                              ...(e.target.checked && !state.cta2Text
                                ? { cta2Text: "Más información" }
                                : {}),
                            })
                          }
                          className="w-4 h-4 accent-[var(--brand-4)]"
                        />
                        Activar
                      </label>
                    </div>
                    {state.cta2Enabled && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-white mb-1">Texto del botón</label>
                          <div className="flex gap-2">
                            <select
                              value={state.cta2Text}
                              onChange={(e) => update({ cta2Text: e.target.value })}
                              className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm"
                              style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "white" }}
                            >
                              <option value="" style={{ color: "#999" }}>
                                Seleccionar opción...
                              </option>
                              {CTA_PRESETS.map((opt) => (
                                <option
                                  key={opt}
                                  value={opt}
                                  style={{ color: "white", backgroundColor: "#1e293b" }}
                                >
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </div>
                          <input
                            type="text"
                            value={state.cta2Text}
                            onChange={(e) => update({ cta2Text: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm mt-2 placeholder-slate-400"
                            style={{ color: "#f9fafb" }}
                            placeholder="O escribe tu propio texto..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-white mb-1">Enlace (URL)</label>
                          <div className="space-y-2">
                            <ActionLinkPicker
                              value={state.cta2Link}
                              onChange={(url) => update({ cta2Link: url })}
                              label=""
                            />
                            <input
                              type="text"
                              value={state.cta2Link}
                              onChange={(e) => update({ cta2Link: e.target.value })}
                              placeholder="O escribe una URL manualmente..."
                              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm placeholder-slate-400"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Identidad visual del PDF */}
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div>
                    <label className="text-[#C5A059] text-xs uppercase tracking-widest block mb-2">Tamaño del Título</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="1.5"
                        max="4.5"
                        step="0.1"
                        value={state.titleSize}
                        onChange={(e) => update({ titleSize: Number(e.target.value) })}
                        className="flex-1"
                      />
                      <span className="text-white text-xs font-mono w-12">{state.titleSize}rem</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={state.showLogo}
                        onChange={(e) => update({ showLogo: e.target.checked })}
                        className="accent-[var(--brand-3)]"
                      />
                      <span className="text-xs text-white/80">Mostrar logo en el PDF</span>
                    </div>
                    <div>
                      <label className="text-[#C5A059] text-xs uppercase tracking-widest block mb-1">Tamaño del Logo</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={16}
                          max={80}
                          step={2}
                          value={state.logoSize}
                          onChange={(e) => update({ logoSize: Number(e.target.value) })}
                          className="flex-1"
                          disabled={!state.showLogo}
                        />
                        <span className="text-white text-xs font-mono w-12">{state.logoSize}px</span>
                      </div>
                    </div>
                  </div>
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer text-[11px] text-white">
                    Ajustes avanzados de color
                  </summary>
                  <div className="space-y-4 mt-3">
                    <h3 className="text-[var(--brand-3)] text-sm uppercase tracking-widest">
                      Colores personalizados
                    </h3>
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                      {[{ l: "Marca/Cabecera", k: "colorBrand" }, { l: "Etiqueta Perfil", k: "colorTag" }, { l: "Título Principal", k: "colorTitle" }, { l: "Botones de Acción", k: "colorButton" }].map((c) => (
                        <div key={c.k}>
                          <label className="text-[#C5A059] text-xs uppercase tracking-widest block mb-2">{c.l}</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={state[c.k as keyof LeadMagnetState] as string}
                              onChange={(e) => update({ [c.k]: e.target.value })}
                              className="w-10 h-10 rounded-lg cursor-pointer border border-[#0f1720]"
                            />
                            <input
                              type="text"
                              value={state[c.k as keyof LeadMagnetState] as string}
                              onChange={(e) => update({ [c.k]: e.target.value })}
                              className="flex-1 px-2 py-2 rounded-lg border border-[#0f1720] bg-[#0f1720] text-white text-xs font-mono outline-none focus:border-[var(--brand-3)]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </details>

                <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mt-6">
                  <button
                    onClick={() => goToStep(3)}
                    className="flex-1 py-3 rounded-full text-sm font-bold uppercase tracking-wider border border-[#0f1720] text-white/70 hover:opacity-90 transition-colors"
                  >
                    Atrás
                  </button>
                  <button
                    onClick={savePdf}
                    disabled={pdfGenerating}
                    className="flex-1 py-3 rounded-full text-sm font-bold uppercase tracking-wider bg-[var(--brand-4)] text-black hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {pdfGenerating ? "Guardando..." : "Guardar PDF"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preview PDF — scrollable horizontalmente en móvil */}
        <div className="lg:sticky lg:top-6">
          <div className="rounded-xl border border-[var(--border)] bg-[#0f1720] p-2 md:p-4 shadow-xl" style={{ overflowX: "auto", overflowY: "visible" }}>
            <div className="text-center mb-2">
              <span className="text-[var(--brand-3)] text-xs tracking-widest uppercase">Vista Previa PDF Final</span>
            </div>
            <LeadMagnetPreview
              businessName={state.businessName}
              type={state.type}
              customTitle={state.title}
              customIntro={state.intro}
              customContent={state.content}
              logoUrl={state.logoUrl}
              logoSize={state.logoSize}
              showLogo={state.showLogo}
              cta1Enabled={state.cta1Enabled}
              cta2Enabled={state.cta2Enabled}
              cta1Text={state.cta1Text}
              cta1Link={state.cta1Link}
              cta2Text={state.cta2Text}
              cta2Link={state.cta2Link}
              colorBrand={state.colorBrand}
              colorTag={state.colorTag}
              colorTitle={state.colorTitle}
              colorButton={state.colorButton}
              titleSize={state.titleSize}
              sn1={state.sn1}
              sn1En={state.sn1En}
              sn2={state.sn2}
              sn2En={state.sn2En}
              sn3={state.sn3}
              sn3En={state.sn3En}
              sn4={state.sn4}
              sn4En={state.sn4En}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LeadMagnetPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm">Cargando...</div>}>
      <LeadMagnetNewContent />
    </Suspense>
  );
}
