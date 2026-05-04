"use client";

import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import LandingRenderer from "@/components/LandingRenderer";
import CollapsibleSection from "@/components/CollapsibleSection";
import ActionLinkPicker from "@/components/ActionLinkPicker";
import { LandingConfig, defaultLandingConfig } from "@/lib/landingTypes";
import OnboardingDrawer from "@/components/onboarding/OnboardingDrawer";
import LandingAiChat from "@/components/landing/LandingAiChat";

interface Benefit {
  id: string;
  title: string;
}

interface LeadMagnet {
  id: string;
  title: string;
  pdf_url: string | null;
}

export default function LandingNew() {
  const [config, setConfig] = useState<LandingConfig>(defaultLandingConfig);
  const [businessId, setBusinessId] = useState("");
  const [slug, setSlug] = useState("");
  const [saveStatus, setSaveStatus] = useState("Pendiente");
  const [lastSaved, setLastSaved] = useState("");
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [leadMagnets, setLeadMagnets] = useState<LeadMagnet[]>([]);
  const [modules, setModules] = useState({ vip_benefits: true, lead_magnet: true });
  const [moduleGpt, setModuleGpt] = useState(false);
  const [gptUrl, setGptUrl] = useState("https://chatgpt.com/");
  const [guideOpen, setGuideOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  // Evita autoguardar en la carga inicial (solo cuando el usuario cambia algo)
  const initialLoadDone = useRef(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // El chat se abre por defecto en pantallas xl (≥1280px); colapsado debajo
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1280px)");
    const apply = () => setChatOpen(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  // Scale dinámico: el preview de 390px se escala al ancho disponible del contenedor
  const previewWrapRef = useRef<HTMLDivElement>(null);
  const previewContentRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.923);
  // Altura real del contenido renderizado (medida con ResizeObserver)
  const [previewContentHeight, setPreviewContentHeight] = useState(820);

  // ResizeObserver en el wrapper del preview: actualiza la escala cada vez que
  // cambie el ancho del contenedor (resize de ventana O cambio de columnas al
  // abrir/cerrar el chat IA). window.resize solo no es suficiente.
  useEffect(() => {
    if (!previewWrapRef.current) return;
    const updateScale = () => {
      if (previewWrapRef.current) {
        const available = previewWrapRef.current.clientWidth;
        const scale = Math.min(0.923, available / 390);
        setPreviewScale(scale);
      }
    };
    updateScale(); // Cálculo inicial
    const ro = new ResizeObserver(updateScale);
    ro.observe(previewWrapRef.current);
    return () => ro.disconnect();
  }, []);

  // Autoguardar 1.5s después del último cambio de config (no en la carga inicial)
  useEffect(() => {
    if (!initialLoadDone.current || !businessId) return;
    setHasUnsaved(true);
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      saveNow();
    }, 1500);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  // saveNow se declara abajo pero es estable — no hace falta incluirla como dep
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  // Medir altura real de LandingRenderer para que el contenedor no corte el fondo
  useEffect(() => {
    if (!previewContentRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const h = entry.contentRect.height;
      if (h > 0) setPreviewContentHeight(Math.ceil(h));
    });
    ro.observe(previewContentRef.current);
    return () => ro.disconnect();
  }, []);

  const update = (patch: Partial<LandingConfig>) =>
    setConfig((prev) => ({ ...prev, ...patch }));

  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");

  // Migración: si toolsIds existe pero tools no, convertir (ejecutado tras mount)
  useEffect(() => {
    if (config.toolsIds && !config.tools) {
      const migrated = (config.toolsIds as string[]).map((url, i) => ({
        id: `tool-${i}-${Date.now()}`,
        label: "Abrir enlace",
        url,
      }));
      update({ tools: migrated });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resolver businessId desde URL o sesión
  useEffect(() => {
    const load = async () => {
      const paramId = new URLSearchParams(window.location.search).get("businessId");
      if (paramId) { setBusinessId(paramId); return; }
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userEmail = sessionData?.session?.user?.email || "";
        if (!userEmail) return;
        const { data: biz } = await supabase
          .from("businesses")
          .select("id")
          .eq("contact_email", userEmail)
          .single();
        setBusinessId(biz?.id || "");
      } catch { }
    };
    load();
  }, []);

// Cargar config + datos de negocio + beneficios + recursos de valor
useEffect(() => {
  if (!businessId) return;

  const load = async () => {
    const [bizRes, landingRes, benefitsRes, leadMagnetsRes, settingsRes] = await Promise.all([
      supabase.from("businesses").select("name, slug, logo_url, module_vip_benefits, module_lead_magnet, module_gpt").eq("id", businessId).single(),
      supabase.from("landing_configs").select("config").eq("business_id", businessId).single(),
      supabase.from("benefits").select("id, title").eq("business_id", businessId).order("created_at", { ascending: false }),
      supabase.from("lead_magnets").select("id, title, pdf_url").eq("business_id", businessId).order("created_at", { ascending: false }),
      supabase.from("settings").select("value").eq("key", "gpt_url").single(),
    ]);

    const biz = bizRes.data;
    const bizName = biz?.name || "";
    const businessLogo = biz?.logo_url || "";
    setBusinessName(bizName);
    if (biz?.slug) setSlug(biz.slug);
    setModules({
      vip_benefits: biz?.module_vip_benefits ?? true,
      lead_magnet: biz?.module_lead_magnet ?? true,
    });
    setModuleGpt(biz?.module_gpt ?? false);
    if (settingsRes.data?.value) {
      try {
        const url = typeof settingsRes.data.value === "string"
          ? JSON.parse(settingsRes.data.value)
          : settingsRes.data.value;
        if (url) setGptUrl(url);
      } catch { /* keep default */ }
    }

    setBenefits((benefitsRes.data || []) as Benefit[]);
    setLeadMagnets((leadMagnetsRes.data || []) as LeadMagnet[]);

    const c = landingRes.data?.config || null;
    if (!c) {
      setConfig({ ...defaultLandingConfig, businessName: bizName, logoUrl: businessLogo });
    } else {
      const merged = { ...defaultLandingConfig, ...c };
      setConfig({ ...merged, businessName: merged.businessName || bizName, logoUrl: merged.logoUrl || businessLogo });
    }
    // Marcar carga inicial completada DESPUÉS del ciclo de render actual.
    // Si lo marcamos sincrónicamente aquí, el efecto [config] lo ve a true
    // durante el re-render que causa setConfig y dispara un autoguardado
    // innecesario (403 cuando el admin accede con ?businessId=).
    // setTimeout(0) garantiza que el flag se pone en el siguiente "tick",
    // una vez que React ya procesó el setConfig.
    setTimeout(() => { initialLoadDone.current = true; }, 0);
  };

  load();
}, [businessId]);


  // Guardar config
  const saveNow = async () => {
    if (!businessId) return;
    const s = slugify(config.businessName || "negocio");
    setSlug(s);

    try {
      setSaveStatus("Guardando...");
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      const res = await fetch("/api/landing/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          businessId,
          slug: s,
          config,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error("[save] API error", res.status, errData);
        setSaveStatus(`Error ${res.status}`);
        return;
      }
      setSaveStatus("Guardado ✓");
      setLastSaved(new Date().toLocaleTimeString());
      setHasUnsaved(false);
    } catch (e) {
      console.error("[save] fetch error", e);
      setSaveStatus("Error de red");
    }
  };

  // Subir imagen
  const uploadImage = async (
    file: File,
    kind: "bg" | "logo" | "review",
  ): Promise<string | null> => {
    if (!businessId) {
      alert("Falta businessId");
      return null;
    }
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);
    form.append("businessId", businessId);
    const { data: { session: uploadSession } } = await supabase.auth.getSession();
    const res = await fetch("/api/landing/upload", {
      method: "POST",
      headers: { "Authorization": `Bearer ${uploadSession?.access_token || ""}` },
      body: form,
    });
    if (!res.ok) {
      alert("Error al subir imagen");
      return null;
    }
    const data = await res.json();
    return data.url as string;
  };

  // FIX #4: ctaStyle con los mismos fallbacks que LandingRenderer
  const ctaStyle = {
    backgroundColor: config.ctaBg || "#ffffff",
    color: config.ctaTextColor || "#ffffff",
    borderColor: config.ctaBorderColor || "#ffffff",
    borderWidth: `${config.ctaBorderWidth ?? 2}px`,
    borderStyle: "solid",
    borderRadius: `${config.ctaRadius ?? 16}px`,
    opacity: (config.ctaOpacity ?? 20) / 100,
    fontSize: `${config.ctaFontSize ?? 14}px`,
  } as React.CSSProperties;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Onboarding drawer — panel lateral controlado desde el header */}
      {businessId && (
        <OnboardingDrawer
          context="landing"
          businessId={businessId}
          moduleGpt={moduleGpt}
          gptUrl={gptUrl}
          open={guideOpen}
          onOpenChange={setGuideOpen}
        />
      )}
      <div className="max-w-6xl mx-auto py-6 px-4 md:px-0 space-y-6">
        {/* Cabecera */}
        <header className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold">Editor de Landing</h1>
          <p className="text-sm text-white">
            Configura el contenido, el diseño y las herramientas de tu landing.
          </p>
        </header>

        {/* Barra de guardado */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button type="button" className="rounded-lg border border-[var(--brand-3)] px-4 py-2 text-sm font-semibold text-[var(--brand-3)] hover:bg-[var(--brand-3)]/10" onClick={async () => {
              await saveNow();
              localStorage.setItem("konecta-landing-preview", JSON.stringify(config));
              window.open(`/l/${slug}/NFC?preview=1`, "_blank");
            }}>
              Previsualizar Landing
            </button>
            {businessId && (
              <button
                type="button"
                onClick={() => setGuideOpen(!guideOpen)}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                  guideOpen
                    ? "bg-[var(--brand-1)] border-[var(--brand-1)] text-white"
                    : "border-[var(--brand-1)] text-[var(--brand-1)] hover:bg-[var(--brand-1)]/10"
                }`}
              >
                {guideOpen ? "Cerrar guía" : "Guía de Personalización"}
              </button>
            )}
            {businessId && (
              <button
                type="button"
                onClick={() => setChatOpen(!chatOpen)}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                  chatOpen
                    ? "bg-[var(--brand-4)] border-[var(--brand-4)] text-black"
                    : "border-[var(--brand-4)] text-[var(--brand-4)] hover:bg-[var(--brand-4)]/10"
                }`}
              >
                {chatOpen ? "Cerrar Asistente IA" : "Asistente IA"}
              </button>
            )}
          </div>
  <div className="flex items-center gap-3">
    {hasUnsaved && saveStatus !== "Guardando..." && (
      <span className="flex items-center gap-1 text-xs text-amber-400">
        <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
        Sin guardar
      </span>
    )}
    <button onClick={saveNow} className="rounded-lg bg-[var(--brand-4)] px-4 py-2 font-semibold text-black" >
      Guardar cambios
    </button>
            <div className="text-xs text-[var(--brand-1)]">
              {saveStatus}
              {lastSaved ? ` · ${lastSaved}` : ""}
            </div>
          </div>
        </div>

        {!businessId && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            Falta businessId en la URL. Abre esta página con:
            {" /landing/new?businessId=TU_ID"}
          </div>
        )}

        <div className={`grid grid-cols-1 gap-6 ${chatOpen ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
          {/* Panel de chat IA — primera columna cuando está abierto */}
          {chatOpen && businessId && (
            <LandingAiChat
              businessId={businessId}
              businessName={businessName}
              config={config}
              onApply={(changes) => setConfig((prev) => ({ ...prev, ...changes }))}
              onFinalize={saveNow}
            />
          )}

          {/* Panel de controles */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-6 md:p-6">

            {/* Fondo */}
            <CollapsibleSection
              title="Fondo"
              description="Color o imagen de fondo de tu landing."
            >
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={config.showBg}
                    onChange={(e) => update({ showBg: e.target.checked })}
                  />
                  Mostrar fondo
                </label>

                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={config.bgMode === "color"}
                      onChange={() => update({ bgMode: "color" })}
                    />
                    Color
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={config.bgMode === "image"}
                      onChange={() => update({ bgMode: "image" })}
                    />
                    Imagen
                  </label>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">
                    Color de texto
                  </label>
                  <input
                    type="color"
                    value={config.textColor}
                    onChange={(e) => update({ textColor: e.target.value })}
                    className="mt-2 h-8 w-16 rounded-lg border border-[var(--border)]"
                  />
                </div>

                {config.bgMode === "color" && (
                  <div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.bgColor}
                        onChange={(e) => update({ bgColor: e.target.value })}
                        className="h-8 w-16 rounded-lg border border-[var(--border)]"
                      />
                      <span className="text-xs text-[var(--brand-1)]">Intensidad</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={100}
                      value={config.bgOpacity}
                      onChange={(e) =>
                        update({ bgOpacity: Number(e.target.value) })
                      }
                      className="mt-2 w-full"
                    />
                  </div>
                )}

                {config.bgMode === "image" && (
                  <div className="space-y-3">
                    <input
                      className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const url = await uploadImage(file, "bg");
                        if (url)
                          update({
                            bgUrl: url,
                            bgMode: "image",
                            showBg: true,
                          });
                      }}
                    />
                  </div>
                )}
              </div>
            </CollapsibleSection>

            {/* Identidad */}
            <CollapsibleSection
              title="Identidad de la landing"
              description="Logo, nombre del negocio y subtítulo."
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[var(--brand-1)]">Logo</div>
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={config.showLogo}
                      onChange={(e) => update({ showLogo: e.target.checked })}
                    />
                    Mostrar logo
                  </label>
                  <input
                    className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const url = await uploadImage(file, "logo");
                      if (url) update({ logoUrl: url });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[var(--brand-1)]">
                    Nombre y subtítulo
                  </div>
                  <input
                    className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
                    value={config.businessName}
                    onChange={(e) => update({ businessName: e.target.value })}
                    placeholder="Nombre del negocio"
                  />
                  <input
                    className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
                    value={config.subtitle}
                    onChange={(e) => update({ subtitle: e.target.value })}
                    placeholder="Mensaje de bienvenida"
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Botones principales */}
            <CollapsibleSection
              title="Botones de acción (CTA)"
              description="Configura los botones principales que invitan a tus clientes a actuar."
            >
              <div className="space-y-3">
                {[
                  {
                    textKey: "cta1Text" as const,
                    linkKey: "cta1Link" as const,
                    typeKey: "cta1Type" as const,
                    benefitKey: "cta1BenefitId" as const,
                    leadMagnetKey: "cta1LeadMagnetId" as const,
                    label: "CTA 1",
                  },
                  {
                    textKey: "cta2Text" as const,
                    linkKey: "cta2Link" as const,
                    typeKey: "cta2Type" as const,
                    benefitKey: "cta2BenefitId" as const,
                    leadMagnetKey: "cta2LeadMagnetId" as const,
                    label: "CTA 2",
                  },
                  {
                    textKey: "cta3Text" as const,
                    linkKey: "cta3Link" as const,
                    typeKey: "cta3Type" as const,
                    benefitKey: "cta3BenefitId" as const,
                    leadMagnetKey: "cta3LeadMagnetId" as const,
                    label: "CTA 3",
                  },
                ].map(({ textKey, linkKey, typeKey, benefitKey, leadMagnetKey, label }) => {
                  // El tipo se lee directamente del config — sin estado local
                  // Migración automática: si viene de una versión anterior sin typeKey,
                  // se infiere del valor guardado
                  const rawCtaType: "link" | "benefit" | "leadmagnet" =
                    (config[typeKey] as "link" | "benefit" | "leadmagnet") ||
                    (config[leadMagnetKey] ? "leadmagnet" : config[benefitKey] ? "benefit" : "link");
                  // Si el módulo de este tipo está desactivado, forzar a "link"
                  const ctaType: "link" | "benefit" | "leadmagnet" =
                    (rawCtaType === "leadmagnet" && !modules.lead_magnet) ? "link" :
                    (rawCtaType === "benefit" && !modules.vip_benefits) ? "link" :
                    rawCtaType;

                  const selectType = (t: "link" | "benefit" | "leadmagnet") => {
                    const patch: Record<string, string> = { [typeKey]: t };
                    if (t !== "benefit") patch[benefitKey] = "";
                    if (t !== "leadmagnet") patch[leadMagnetKey] = "";
                    if (t !== "link") patch[linkKey] = "";
                    update(patch as any);
                  };

                  // Los botones se filtran según módulos activos del negocio
                  const TYPE_OPTIONS = [
                    { id: "link" as const,        icon: "🔗", label: "Link",             show: true                   },
                    { id: "leadmagnet" as const,   icon: "📄", label: "Recurso de Valor", show: modules.lead_magnet    },
                    { id: "benefit" as const,      icon: "⭐", label: "Beneficio VIP",    show: modules.vip_benefits   },
                  ].filter(o => o.show);

                  return (
                  <div key={textKey} className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                    {/* Cabecera: texto del botón */}
                    <div className="px-3 pt-3 pb-2">
                      <label className="text-[10px] uppercase tracking-wide text-[var(--brand-1)] mb-1 block">{label}</label>
                      <input
                        className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 font-semibold text-sm"
                        value={config[textKey]}
                        onChange={(e) => update({ [textKey]: e.target.value } as any)}
                        placeholder="Texto del botón"
                        style={ctaStyle}
                      />
                    </div>

                    {/* Paso 1 — Elegir tipo (siempre 3 botones) */}
                    <div className="px-3 pb-2">
                      <p className="text-[10px] uppercase tracking-wide text-[var(--foreground)]/40 mb-1.5">¿Qué hace este botón?</p>
                      <div className={`grid gap-1.5 ${TYPE_OPTIONS.length === 1 ? "grid-cols-1" : TYPE_OPTIONS.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                        {TYPE_OPTIONS.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => selectType(opt.id)}
                            className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg border text-center transition-all ${
                              ctaType === opt.id
                                ? "border-[var(--brand-4)] bg-[var(--brand-4)]/10 text-[var(--brand-4)]"
                                : "border-[var(--border)] text-[var(--foreground)]/60 hover:border-[var(--brand-3)] hover:text-[var(--foreground)]"
                            }`}
                          >
                            <span className="text-base leading-none">{opt.icon}</span>
                            <span className="text-[10px] font-semibold leading-tight">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Paso 2 — Opciones según tipo */}
                    <div className="px-3 pb-3 pt-1 border-t border-[var(--border)]/50">
                      {ctaType === "link" && (
                        <div className="flex gap-2 items-center mt-2">
                          <input
                            className="flex-1 rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
                            value={config[linkKey]}
                            onChange={(e) => update({ [linkKey]: e.target.value } as any)}
                            placeholder="Pega la URL aquí..."
                          />
                          <ActionLinkPicker
                            value={config[linkKey] as string}
                            onChange={(url) => update({ [linkKey]: url } as any)}
                            label=""
                          />
                        </div>
                      )}

                      {ctaType === "benefit" && (
                        <div className="mt-2 space-y-1">
                          <p className="text-[10px] text-[var(--foreground)]/50">El cliente descargará el cupón PDF al pulsar</p>
                          {benefits.length > 0 ? (
                          <select
                            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-2 text-sm"
                            value={(config[benefitKey] as string) || ""}
                            onChange={(e) => update({ [benefitKey]: e.target.value } as any)}
                          >
                            <option value="">— Seleccionar beneficio —</option>
                            {benefits.map((b) => (
                              <option key={b.id} value={b.id}>{b.title}</option>
                            ))}
                          </select>
                          ) : (
                            <p className="text-xs text-[var(--foreground)]/40 italic">
                              Aún no tienes beneficios VIP creados.{" "}
                              <a href="/vip-benefits" target="_blank" className="text-[var(--brand-3)] hover:underline">Crear uno →</a>
                            </p>
                          )}
                        </div>
                      )}

                      {ctaType === "leadmagnet" && (
                        <div className="mt-2 space-y-1">
                          <p className="text-[10px] text-[var(--foreground)]/50">El cliente descargará el recurso PDF al pulsar</p>
                          {leadMagnets.length > 0 ? (
                            <div className="space-y-1.5">
                              <select
                                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-2 text-sm"
                                value={(config[leadMagnetKey] as string) || ""}
                                onChange={(e) => update({ [leadMagnetKey]: e.target.value } as any)}
                              >
                                <option value="">— Seleccionar recurso —</option>
                                {leadMagnets.map((lm) => (
                                  <option key={lm.id} value={lm.id}>
                                    {lm.title}{!lm.pdf_url ? " ⚠ sin PDF" : ""}
                                  </option>
                                ))}
                              </select>
                              {/* Aviso si el recurso seleccionado no tiene PDF */}
                              {(config[leadMagnetKey] as string) && (() => {
                                const sel = leadMagnets.find(lm => lm.id === (config[leadMagnetKey] as string));
                                return sel && !sel.pdf_url ? (
                                  <p className="text-[10px] text-amber-400 leading-snug">
                                    ⚠ Este recurso no tiene PDF generado.{" "}
                                    <a
                                      href={`/lead-magnet/new?edit=${sel.id}`}
                                      target="_blank"
                                      className="underline hover:text-amber-300"
                                    >
                                      Ir a generarlo →
                                    </a>
                                  </p>
                                ) : null;
                              })()}
                            </div>
                          ) : (
                            <p className="text-xs text-[var(--foreground)]/40 italic">
                              Aún no tienes recursos de valor creados.{" "}
                              <a href="/lead-magnet" target="_blank" className="text-[var(--brand-3)] hover:underline">Crear uno →</a>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}

                {/* Botones extra 4 y 5 */}
                <div className="pt-2 border-t border-[var(--border)] space-y-2">
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={config.showMoreButtons}
                      onChange={(e) =>
                        update({ showMoreButtons: e.target.checked })
                      }
                    />
                    Mostrar botones extra (CTA 4 y CTA 5)
                  </label>

                  {config.showMoreButtons && (
                    <div className="space-y-3">
                      {[
                        {
                          textKey: "cta4Text" as const,
                          linkKey: "cta4Link" as const,
                          label: "CTA 4",
                          showKey: "showCta4" as const,
                        },
                        {
                          textKey: "cta5Text" as const,
                          linkKey: "cta5Link" as const,
                          label: "CTA 5",
                          showKey: "showCta5" as const,
                        },
                      ].map(({ textKey, linkKey, label, showKey }) => (
                        <div key={textKey} className="space-y-1">
                          <label className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={config[showKey]}
                              onChange={(e) =>
                                update({ [showKey]: e.target.checked } as any)
                              }
                            />
                            Mostrar {label}
                          </label>
                          {config[showKey] && (
                            <>
                              <input
                                className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 font-semibold"
                                value={config[textKey]}
                                onChange={(e) =>
                                  update({ [textKey]: e.target.value } as any)
                                }
                                placeholder={label}
                                style={ctaStyle}
                              />
                              <div className="flex gap-2">
                                <input
                                  className="flex-1 rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
                                  value={config[linkKey]}
                                  onChange={(e) =>
                                    update({ [linkKey]: e.target.value } as any)
                                  }
                                  placeholder={`Link ${label}`}
                                />
                                <ActionLinkPicker
                                  value={config[linkKey] as string}
                                  onChange={(url) =>
                                    update({ [linkKey]: url } as any)
                                  }
                                  label=""
                                />
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Estilo de botones */}
                <div className="space-y-2 pt-3 border-t border-[var(--border)]">
                  <div className="text-xs font-semibold text-[var(--brand-1)]">
                    Estilo de botones
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">
                        Fondo botón
                      </label>
                      <input
                        type="color"
                        value={config.ctaBg}
                        onChange={(e) => update({ ctaBg: e.target.value })}
                        className="mt-1 h-8 w-16 rounded-lg border border-[var(--border)]"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">
                        Texto botón
                      </label>
                      <input
                        type="color"
                        value={config.ctaTextColor}
                        onChange={(e) =>
                          update({ ctaTextColor: e.target.value })
                        }
                        className="mt-1 h-8 w-16 rounded-lg border border-[var(--border)]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">
                      Radio
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={32}
                      value={config.ctaRadius}
                      onChange={(e) =>
                        update({ ctaRadius: Number(e.target.value) })
                      }
                      className="mt-2 w-full"
                    />
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            {/* Bloque final de la landing */}
            <CollapsibleSection
              title="Bloque final de la landing"
              description="Elige qué quieres mostrar debajo de los botones."
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[var(--brand-1)]">
                    Contenido del bloque final
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {[
                      { id: "none", label: "Sin bloque" },
                      { id: "tools", label: "Herramientas" },
                      { id: "invite", label: "Invita a un amigo" },
                      { id: "image", label: "Imagen con link" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          update({ finalBlockMode: opt.id as any })
                        }
                        className={`px-3 py-1 rounded-full border ${
                          config.finalBlockMode === opt.id
                            ? "border-[var(--brand-4)] bg-[var(--brand-4)]/15 text-[var(--brand-4)]"
                            : "border-[var(--border)] text-[var(--brand-1)]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

{/* Herramientas */}
{config.finalBlockMode === "tools" && (
  <div className="space-y-3">
    {/* Título y subtítulo */}
    <div className="space-y-1">
      <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">
        Título
      </label>
      <input
        className="flex-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
        value={config.toolsTitle}
        onChange={(e) => update({ toolsTitle: e.target.value })}
        placeholder="Herramientas para tu cliente"
      />
    </div>
    <div className="space-y-1">
      <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">
        Subtítulo
      </label>
      <input
        className="flex-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
        value={config.toolsSubtitle}
        onChange={(e) => update({ toolsSubtitle: e.target.value })}
        placeholder="Accede rápido a tus enlaces principales"
      />
    </div>

    {/* Lista de herramientas */}
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">
        Herramientas ({config.tools?.length || 0}/5)
      </label>

{(config.tools || []).map((tool, index) => (
  <div key={tool.id} className="flex gap-2 items-start">
    <input
      className="flex-1 rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
      value={tool.label}
      onChange={(e) => {
        const currentTools = config.tools || [];
        const updated = [...currentTools];
        updated[index] = { ...updated[index], label: e.target.value };
        update({ tools: updated });
      }}
      placeholder="Texto del botón (ej: Reservar cita)"
    />
    <div className="flex-1">
      <ActionLinkPicker
        value={tool.url}
        onChange={(url) => {
          const currentTools = config.tools || [];
          const updated = [...currentTools];
          updated[index] = { ...updated[index], url };
          update({ tools: updated });
        }}
      />
    </div>
    <button
      type="button"
      onClick={() => {
        const currentTools = config.tools || [];
        const updated = currentTools.filter((_, i) => i !== index);
        update({ tools: updated });
      }}
      className="mt-2 px-2 py-1 text-xs text-red-400 border border-red-400 rounded hover:bg-red-400/10"
    >
      ×
    </button>
  </div>
))}

      {/* Añadir herramienta */}
      {(config.tools || []).length < 5 && (
        <button
          type="button"
          onClick={() => {
            const newTool = {
              id: crypto.randomUUID(),
              label: "",
              url: "",
            };
            update({ tools: [...(config.tools || []), newTool] });
          }}
          className="w-full py-2 text-xs border border-dashed border-[var(--brand-3)] text-[var(--brand-3)] rounded-lg hover:bg-[var(--brand-3)]/10"
        >
          + Añadir herramienta
        </button>
      )}
    </div>
  </div>
)}

                {/* Invitación */}
                {config.finalBlockMode === "invite" && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">
                        Título
                      </label>
                      <input
                        className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
                        value={config.inviteTitle}
                        onChange={(e) =>
                          update({ inviteTitle: e.target.value })
                        }
                        placeholder="Invita a un amigo"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">
                        Texto
                      </label>
                      <textarea
                        className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
                        rows={3}
                        value={config.inviteText}
                        onChange={(e) =>
                          update({ inviteText: e.target.value })
                        }
                        placeholder="Explica el beneficio de invitar a un amigo."
                      />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">
                          Texto del botón
                        </label>
                        <input
                          className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
                          value={config.inviteBtnText}
                          onChange={(e) =>
                            update({ inviteBtnText: e.target.value })
                          }
                          placeholder="Compartir enlace"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">
                          Link del botón
                        </label>
                        <input
                          className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
                          value={config.inviteBtnLink}
                          onChange={(e) =>
                            update({ inviteBtnLink: e.target.value })
                          }
                          placeholder="Pega un link de invitación"
                        />
                      </div>
                    </div>
                  </div>
                )}
{/* Imagen con link */}
{config.finalBlockMode === "image" && (
  <div className="space-y-3">
    {/* Link */}
    <div className="space-y-1">
      <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">
        Link al pulsar la imagen (opcional)
      </label>
      <input
        className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
        value={config.reviewLink}
        onChange={(e) => update({ reviewLink: e.target.value })}
        placeholder="Pega un link de reseñas u oferta"
      />
    </div>

    {/* Imagen */}
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">
        Imagen final
      </label>
      <input
        className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
        type="file"
        accept="image/*"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const url = await uploadImage(file, "review");
          if (url) update({ reviewImage: url });
        }}
      />
      {config.reviewImage && (
        <div className="mt-2 text-xs text-[var(--brand-1)]">
          Imagen cargada. Se mostrará al final de la landing.
        </div>
      )}
    </div>

    {/* Tamaño (presets) */}
    <div className="space-y-1">
      <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">
        Tamaño de la imagen
      </label>
      <div className="flex flex-wrap gap-2 text-xs">
        {[
          { id: "small", label: "Compacta" },
          { id: "medium", label: "Media" },
          { id: "large", label: "Destacada" },
        ].map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() =>
              update({ finalImageSize: opt.id as "small" | "medium" | "large" })
            }
            className={`px-3 py-1 rounded-full border ${
              config.finalImageSize === opt.id
                ? "border-[var(--brand-4)] bg-[var(--brand-4)]/15 text-[var(--brand-4)]"
                : "border-[var(--border)] text-[var(--brand-1)]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>

    {/* Altura fina (slider) */}
    <div className="space-y-1">
      <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">
        Altura de la imagen (px)
      </label>
      <input
        type="range"
        min={120}
        max={320}
        value={config.finalImageHeight}
        onChange={(e) =>
          update({ finalImageHeight: Number(e.target.value) })
        }
        className="mt-1 w-full"
      />
      <div className="text-[10px] text-[var(--brand-1)]">
        {config.finalImageHeight} px
      </div>
    </div>

    {/* Padding lateral contenido (mismo control que en Espacio avanzado) */}
    <div className="space-y-1">
      <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">
        Padding lateral contenido
      </label>
      <input
        type="range"
        min={12}
        max={32}
        value={config.contentPaddingX}
        onChange={(e) =>
          update({ contentPaddingX: Number(e.target.value) })
        }
        className="mt-1 w-full"
      />
      <div className="text-[10px] text-[var(--brand-1)]">
        {config.contentPaddingX} px
      </div>
    </div>

    {/* Marco + sombra */}
    <div className="flex flex-wrap gap-4 text-xs pt-1">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={config.finalImageFramed}
          onChange={(e) => update({ finalImageFramed: e.target.checked })}
        />
        <span>Mostrar marco alrededor</span>
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={config.finalImageShadow}
          onChange={(e) => update({ finalImageShadow: e.target.checked })}
        />
        <span>Aplicar sombra suave</span>
      </label>
    </div>
  </div>
)}
              </div>
            </CollapsibleSection>

            {/* Espacio avanzado */}
            <CollapsibleSection
              title="Espacio avanzado"
              description="Ajusta márgenes y contenedores de la landing."
            >
              <div className="space-y-4 text-xs">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">
                      Padding superior del hero
                    </label>
                    <input
                      type="range"
                      min={24}
                      max={80}
                      value={config.heroPaddingTop}
                      onChange={(e) =>
                        update({ heroPaddingTop: Number(e.target.value) })
                      }
                      className="mt-1 w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">
                      Padding inferior del hero
                    </label>
                    <input
                      type="range"
                      min={12}
                      max={60}
                      value={config.heroPaddingBottom}
                      onChange={(e) =>
                        update({ heroPaddingBottom: Number(e.target.value) })
                      }
                      className="mt-1 w-full"
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">
                      Margen superior divisor
                    </label>
                    <input
                      type="range"
                      min={8}
                      max={32}
                      value={config.dividerMarginTop}
                      onChange={(e) =>
                        update({ dividerMarginTop: Number(e.target.value) })
                      }
                      className="mt-1 w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">
                      Margen inferior divisor
                    </label>
                    <input
                      type="range"
                      min={8}
                      max={32}
                      value={config.dividerMarginBottom}
                      onChange={(e) =>
                        update({ dividerMarginBottom: Number(e.target.value) })
                      }
                      className="mt-1 w-full"
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">
                      Separación entre botones
                    </label>
                    <input
                      type="range"
                      min={8}
                      max={32}
                      value={config.buttonsGap}
                      onChange={(e) =>
                        update({ buttonsGap: Number(e.target.value) })
                      }
                      className="mt-1 w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">
                      Margen bloques finales
                    </label>
                    <input
                      type="range"
                      min={16}
                      max={64}
                      value={config.finalBlockMarginTop}
                      onChange={(e) =>
                        update({ finalBlockMarginTop: Number(e.target.value) })
                      }
                      className="mt-1 w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">
                      Padding lateral contenido
                    </label>
                    <input
                      type="range"
                      min={12}
                      max={32}
                      value={config.contentPaddingX}
                      onChange={(e) =>
                        update({ contentPaddingX: Number(e.target.value) })
                      }
                      className="mt-1 w-full"
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">
                      Padding vertical general
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={32}
                      value={config.landingPaddingY}
                      onChange={(e) =>
                        update({ landingPaddingY: Number(e.target.value) })
                      }
                      className="mt-1 w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">
                      Tamaño del fondo (imagen)
                    </label>
                    <input
                      type="range"
                      min={80}
                      max={160}
                      value={config.bgSize}
                      onChange={(e) =>
                        update({ bgSize: Number(e.target.value) })
                      }
                      className="mt-1 w-full"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-wide text-[var(--brand-1)]">
                    Posición del fondo
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["center center", "top center", "bottom center"].map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => update({ bgPosition: pos })}
                        className={`px-3 py-1 rounded-full border text-[11px] ${
                          config.bgPosition === pos
                            ? "border-[var(--brand-4)] bg-[var(--brand-4)]/10"
                            : "border-[var(--border)]"
                        }`}
                      >
                        {pos === "center center" && "Centro"}
                        {pos === "top center" && "Arriba"}
                        {pos === "bottom center" && "Abajo"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-2 border-t border-[var(--border)] mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.heroContainer}
                      onChange={(e) =>
                        update({ heroContainer: e.target.checked })
                      }
                    />
                    <span>Fondo suave detrás del hero</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.bodyContainer}
                      onChange={(e) =>
                        update({ bodyContainer: e.target.checked })
                      }
                    />
                    <span>Fondo suave detrás de los botones</span>
                  </label>
                </div>
                {/* FIX #1 y #2: eliminada la sección showReview duplicada
                    y el selector de finalOrder sin efecto real */}
              </div>
            </CollapsibleSection>
          </div>

          {/* Vista previa — responsiva, se escala al ancho disponible */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 lg:sticky lg:top-6 lg:self-start">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">Vista previa (móvil)</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-md border border-red-300 px-3 py-1 text-xs text-red-500 hover:bg-red-50"
                  onClick={() => {
                    if (
                      confirm(
                        "¿Restaurar valores por defecto? Perderás los cambios no guardados.",
                      )
                    ) {
                      setConfig(defaultLandingConfig);
                    }
                  }}
                >
                  Reset
                </button>
                {/* FIX #5: usar el estado `slug` en lugar de recalcular con slugify */}
                <button
                  type="button"
                  className="rounded-md border border-[var(--border)] px-3 py-1 text-xs"
                  onClick={async () => {
                    await saveNow();
                    localStorage.setItem(
                      "konecta-landing-preview",
                      JSON.stringify(config),
                    );
                    window.open(`/l/${slug}/NFC?preview=1`, "_blank");
                  }}
                >
                  Previsualizar Landing
                </button>
              </div>
            </div>
            {/* Marco de móvil — 390px escalado dinámicamente al ancho disponible */}
            <div ref={previewWrapRef} className="w-full">
              <div
                ref={previewRef}
                className="mx-auto rounded-[28px] border border-[var(--border)] overflow-hidden"
                style={{
                  width: Math.round(390 * previewScale),
                  // Altura = altura real del contenido × escala (nunca corta el fondo)
                  height: Math.round(previewContentHeight * previewScale),
                  position: "relative",
                  // isolation:isolate fuerza un stacking context nuevo → overflow+border-radius
                  // recorta correctamente contenido con transform en navegadores modernos
                  isolation: "isolate",
                }}
              >
                <div
                  ref={previewContentRef}
                  style={{
                    width: 390,
                    transform: `scale(${previewScale})`,
                    transformOrigin: "top left",
                    position: "absolute",
                    top: 0,
                    left: 0,
                  }}
                >
                  <LandingRenderer config={config} toolsEnabled={true} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
