"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import type { ReactNode } from "react";

type ResourceType = "pdf" | "url" | "code";
type WizardStep = "bienvenida" | "tipo" | "contenido" | "preview";

const STEPS: WizardStep[] = ["bienvenida", "tipo", "contenido", "preview"];

const TYPE_INFO: Record<ResourceType, { label: string; subtitle: string; description: string; icon: ReactNode }> = {
  pdf: {
    label: "PDF",
    subtitle: "Documento descargable",
    description: "Guía, checklist, ebook que el cliente puede guardar",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  url: {
    label: "Enlace",
    subtitle: "Recurso online",
    description: "Vídeo, artículo, landing page o cualquier URL",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
  code: {
    label: "Código",
    subtitle: "Cupón o acceso",
    description: "Descuento, código promocional o acceso exclusivo",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
};

function getTitlePlaceholder(type: ResourceType): string {
  const map: Record<ResourceType, string> = {
    pdf: "Ej: 5 errores que ahuyentan clientes nuevos",
    url: "Ej: El vídeo que necesitas ver antes de tu primera consulta",
    code: "Ej: Tu descuento de bienvenida",
  };
  return map[type];
}

// ── Componente de vista previa inline (tarjeta de cliente) ────
function ResourcePreviewCard({
  type,
  title,
  description,
  ctaText,
}: {
  type: ResourceType;
  title: string;
  description: string;
  ctaText: string;
}) {
  const info = TYPE_INFO[type];
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <span
          className="text-xs font-bold px-2 py-0.5 rounded"
          style={{ background: "var(--brand-1)", color: "white" }}
        >
          {info.label}
        </span>
      </div>
      <div className="font-bold text-white text-base leading-snug">{title || "Título del recurso"}</div>
      <div className="text-sm text-white/70">{description || "Descripción breve de lo que obtendrá el cliente."}</div>
      {type === "pdf" && (
        <div className="flex items-center gap-2 text-xs text-white/40">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Documento PDF
        </div>
      )}
      {type === "url" && (
        <div className="flex items-center gap-2 text-xs text-white/40">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Recurso online
        </div>
      )}
      {type === "code" && (
        <div className="flex items-center gap-2 text-xs text-white/40">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          Código / Cupón
        </div>
      )}
      <button
        className="w-full py-2.5 rounded-lg text-sm font-bold"
        style={{ background: "var(--brand-1)", color: "white" }}
      >
        {ctaText || "Obtener recurso gratis"}
      </button>
    </div>
  );
}

// ── Vista previa tipo "phone card" para el paso final ─────────
function PhonePreviewCard({
  type,
  title,
  description,
  ctaText,
}: {
  type: ResourceType;
  title: string;
  description: string;
  ctaText: string;
}) {
  const info = TYPE_INFO[type];
  return (
    <div className="mx-auto w-full max-w-xs">
      {/* Simulación de pantalla de móvil */}
      <div
        className="rounded-3xl border-4 border-white/20 overflow-hidden"
        style={{ background: "#0a0a0b" }}
      >
        {/* Barra de estado simulada */}
        <div className="h-6 bg-black/40 flex items-center justify-end px-4">
          <div className="flex gap-1">
            <div className="w-3 h-1.5 bg-white/40 rounded-sm" />
            <div className="w-1 h-1.5 bg-white/40 rounded-sm" />
          </div>
        </div>

        {/* Contenido */}
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="text-center">
            <div className="text-xs text-white/40 mb-1">Tu recurso de captación</div>
            <div
              className="text-xs font-bold px-2 py-0.5 rounded inline-block"
              style={{ background: "var(--brand-1)", color: "white" }}
            >
              {info.label}
            </div>
          </div>

          {/* Card del recurso */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
            <div className="font-bold text-white text-sm leading-snug">
              {title || "Título del recurso"}
            </div>
            <div className="text-xs text-white/60">
              {description || "Descripción de lo que obtendrá el cliente."}
            </div>
            {type === "pdf" && (
              <div className="flex items-center gap-1 text-xs text-white/40">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                PDF descargable
              </div>
            )}
            {type === "url" && (
              <div className="flex items-center gap-1 text-xs text-white/40">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Enlace externo
              </div>
            )}
            {type === "code" && (
              <div className="flex items-center gap-1 text-xs text-white/40">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Cupón / Código
              </div>
            )}
            <button
              className="w-full py-2 rounded-lg text-xs font-bold mt-1"
              style={{ background: "var(--brand-1)", color: "white" }}
            >
              {ctaText || "Obtener recurso gratis"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Wizard interno ────────────────────────────────────────────
function CaptacionLeadMagnetWizardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [businessId, setBusinessId] = useState("");
  const [token, setToken] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [step, setStep] = useState<WizardStep>("bienvenida");
  const [type, setType] = useState<ResourceType>("pdf");
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ctaText, setCtaText] = useState("Obtener recurso gratis");
  const [fileUrl, setFileUrl] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [codeValue, setCodeValue] = useState("");
  const [saving, setSaving] = useState(false);

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
        .select("id")
        .eq("contact_email", userEmail)
        .single();

      const bid = biz?.id || "";
      if (!bid) return;
      setBusinessId(bid);

      if (editId) {
        setEditingId(editId);
        const res = await fetch(`/api/captacion/lead-magnets?businessId=${bid}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        const lm = (data.leadMagnets || []).find(
          (l: { id: string }) => l.id === editId
        );
        if (lm) {
          setType(lm.type || "pdf");
          setName(lm.name || "");
          setTitle(lm.title || "");
          setDescription(lm.description || "");
          setCtaText(lm.cta_text || "Obtener recurso gratis");
          setFileUrl(lm.file_url || "");
          setExternalUrl(lm.external_url || "");
          setCodeValue(lm.code_value || "");
          setStep("tipo");
        }
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (!businessId || !name.trim()) return;
    setSaving(true);

    const payload = {
      businessId,
      name,
      type,
      title,
      description,
      cta_text: ctaText,
      file_url: fileUrl,
      external_url: externalUrl,
      code_value: codeValue,
    };

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    try {
      let res: Response;
      if (editingId) {
        res = await fetch(`/api/captacion/lead-magnets/${editingId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ ...payload, status: "active" }),
        });
      } else {
        res = await fetch("/api/captacion/lead-magnets", {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        router.push("/captacion/lead-magnets");
      } else {
        const data = await res.json();
        alert("Error al guardar: " + (data.error || "Error desconocido"));
      }
    } finally {
      setSaving(false);
    }
  };

  const stepIndex = STEPS.indexOf(step);

  const renderStep = () => {
    switch (step) {
      case "bienvenida":
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-xl md:text-3xl font-bold mb-4 text-white">
                Crea recursos para captar clientes nuevos
              </h2>
              <p className="text-sm md:text-lg text-white max-w-2xl mx-auto">
                Ofrece algo de valor a cambio del contacto de tu cliente potencial. Un PDF, un enlace útil o un código de descuento es suficiente para dar el primer paso.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto"
                  style={{ background: "var(--brand-1)" }}
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-center mb-2 text-white">Genera confianza antes del primer contacto</h3>
                <p className="text-sm text-white text-center">
                  Demuestra tu expertise entregando valor antes de pedir nada a cambio.
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto"
                  style={{ background: "var(--brand-4)" }}
                >
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-center mb-2 text-white">Entrega algo de valor a cambio del contacto</h3>
                <p className="text-sm text-white text-center">
                  Un buen recurso justifica que el cliente te deje su teléfono o email.
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-center mb-2 text-white">Convierte curiosos en leads cualificados</h3>
                <p className="text-sm text-white text-center">
                  Quien descarga tu recurso ya ha mostrado interés. Eso es un lead caliente.
                </p>
              </div>
            </div>

            <div
              className="rounded-xl p-6 border"
              style={{
                background: "linear-gradient(to right, #0a323c, #001e3c)",
                borderColor: "rgba(57,161,169,0.3)",
              }}
            >
              <h3 className="text-lg font-bold mb-3 text-white">¿Qué vas a crear?</h3>
              <p className="text-white text-sm mb-4">
                Elige entre tres formatos según lo que tengas disponible. No necesitas crear nada desde cero si ya tienes materiales.
              </p>
              <ul className="text-sm text-white space-y-2">
                <li className="flex items-center gap-2">
                  <span style={{ color: "var(--brand-4)" }}>+</span>
                  <strong>PDF:</strong> guía, checklist o ebook descargable
                </li>
                <li className="flex items-center gap-2">
                  <span style={{ color: "var(--brand-4)" }}>+</span>
                  <strong>Enlace:</strong> vídeo de YouTube, artículo, página web útil
                </li>
                <li className="flex items-center gap-2">
                  <span style={{ color: "var(--brand-4)" }}>+</span>
                  <strong>Código:</strong> descuento, cupón o acceso exclusivo
                </li>
              </ul>
            </div>

            <div className="flex justify-center mt-8">
              <button
                onClick={() => setStep("tipo")}
                className="px-6 md:px-10 py-3 md:py-4 rounded-full font-bold text-base md:text-lg w-full sm:w-auto"
                style={{ background: "var(--brand-4)", color: "black" }}
              >
                Comenzar a crear mi recurso →
              </button>
            </div>
          </div>
        );

      case "tipo":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl md:text-2xl font-bold mb-2 text-white">
                ¿Qué tipo de recurso vas a ofrecer?
              </h2>
              <p className="text-white">Elige el formato que mejor encaje con lo que tienes</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {(["pdf", "url", "code"] as ResourceType[]).map((t) => {
                const info = TYPE_INFO[t];
                const isSelected = type === t;
                return (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className="p-5 md:p-6 rounded-xl text-left transition-all border-2 relative"
                    style={{
                      borderColor: isSelected ? "var(--brand-1)" : "rgba(255,255,255,0.1)",
                      backgroundColor: isSelected ? "rgba(57,161,169,0.08)" : "rgba(255,255,255,0.05)",
                    }}
                  >
                    {isSelected && (
                      <span
                        className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: "var(--brand-1)", color: "white" }}
                      >
                        ✓
                      </span>
                    )}
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                      style={{ background: isSelected ? "var(--brand-1)" : "rgba(255,255,255,0.08)" }}
                    >
                      <span className={isSelected ? "text-white" : "text-white/60"}>
                        {info.icon}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold mb-1 text-white">{info.subtitle}</h3>
                    <p className="text-sm text-white/60">{info.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--brand-1)" }}>
                Nombre interno — solo lo ves tú
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Guía captación dental 2026"
                className="w-full px-4 py-3 rounded-lg border text-white text-sm"
                style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8">
              <button
                onClick={() => setStep("bienvenida")}
                className="px-6 py-3 rounded-full border border-white/20 text-white"
              >
                Atrás
              </button>
              <button
                onClick={() => setStep("contenido")}
                disabled={!name.trim()}
                className="px-8 py-3 rounded-full font-bold disabled:opacity-40"
                style={{ background: "var(--brand-4)", color: "black" }}
              >
                Continuar
              </button>
            </div>
          </div>
        );

      case "contenido":
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold mb-2 text-white">
                Configura lo que verá el cliente
              </h2>
              <p className="text-white">Estos son los datos que aparecerán en el formulario de captación</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--brand-1)" }}>
                  Título visible para el cliente
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={getTitlePlaceholder(type)}
                  className="w-full px-4 py-3 rounded-lg border text-white text-sm"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--brand-1)" }}>
                  Descripción breve
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Qué aprenderá o ganará quien lo descargue"
                  className="w-full px-4 py-3 rounded-lg border text-white text-sm resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--brand-1)" }}>
                  Texto del botón CTA
                </label>
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="Obtener recurso gratis"
                  className="w-full px-4 py-3 rounded-lg border text-white text-sm"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}
                />
              </div>

              {type === "pdf" && (
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--brand-1)" }}>
                    URL del PDF
                  </label>
                  <input
                    type="url"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    placeholder="https://... (sube el archivo a Supabase Storage)"
                    className="w-full px-4 py-3 rounded-lg border text-white text-sm"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}
                  />
                </div>
              )}

              {type === "url" && (
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--brand-1)" }}>
                    URL de destino
                  </label>
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 rounded-lg border text-white text-sm"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}
                  />
                </div>
              )}

              {type === "code" && (
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--brand-1)" }}>
                    Código o cupón
                  </label>
                  <input
                    type="text"
                    value={codeValue}
                    onChange={(e) => setCodeValue(e.target.value)}
                    placeholder="BIENVENIDO20"
                    className="w-full px-4 py-3 rounded-lg border text-white text-sm font-mono tracking-widest"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}
                  />
                </div>
              )}
            </div>

            {/* Vista previa inline */}
            <div className="mt-6">
              <div className="text-xs uppercase tracking-widest mb-3" style={{ color: "var(--brand-1)" }}>
                VISTA PREVIA
              </div>
              <ResourcePreviewCard
                type={type}
                title={title}
                description={description}
                ctaText={ctaText}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8">
              <button
                onClick={() => setStep("tipo")}
                className="px-6 py-3 rounded-full border border-white/20 text-white"
              >
                Atrás
              </button>
              <button
                onClick={() => setStep("preview")}
                className="px-8 py-3 rounded-full font-bold"
                style={{ background: "var(--brand-4)", color: "black" }}
              >
                Continuar
              </button>
            </div>
          </div>
        );

      case "preview":
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-xl md:text-2xl font-bold mb-2 text-white">
                Tu recurso está listo
              </h2>
              <p className="text-white/70 text-sm">
                Así lo verán tus clientes potenciales en el formulario de captación
              </p>
            </div>

            {/* Vista tipo teléfono */}
            <PhonePreviewCard
              type={type}
              title={title}
              description={description}
              ctaText={ctaText}
            />

            {/* Resumen de configuración */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
              <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--brand-1)" }}>
                Resumen
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-white/40 text-xs mb-0.5">Nombre interno</div>
                  <div className="text-white font-medium">{name || "—"}</div>
                </div>
                <div>
                  <div className="text-white/40 text-xs mb-0.5">Tipo</div>
                  <div className="text-white font-medium">{TYPE_INFO[type].label}</div>
                </div>
                <div>
                  <div className="text-white/40 text-xs mb-0.5">Título</div>
                  <div className="text-white font-medium truncate">{title || "—"}</div>
                </div>
                <div>
                  <div className="text-white/40 text-xs mb-0.5">CTA</div>
                  <div className="text-white font-medium">{ctaText || "—"}</div>
                </div>
                {type === "pdf" && fileUrl && (
                  <div className="col-span-2">
                    <div className="text-white/40 text-xs mb-0.5">URL del PDF</div>
                    <div className="text-white/60 text-xs truncate">{fileUrl}</div>
                  </div>
                )}
                {type === "url" && externalUrl && (
                  <div className="col-span-2">
                    <div className="text-white/40 text-xs mb-0.5">URL de destino</div>
                    <div className="text-white/60 text-xs truncate">{externalUrl}</div>
                  </div>
                )}
                {type === "code" && codeValue && (
                  <div className="col-span-2">
                    <div className="text-white/40 text-xs mb-0.5">Código</div>
                    <div className="text-white font-mono font-bold">{codeValue}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <button
                onClick={() => setStep("contenido")}
                className="px-6 py-3 rounded-full border border-white/20 text-white"
              >
                Atrás
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !businessId || !name.trim()}
                className="px-8 py-3 rounded-full font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "var(--brand-4)", color: "black" }}
              >
                {saving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Guardando...
                  </>
                ) : (
                  editingId ? "Guardar cambios" : "Guardar recurso"
                )}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-5xl mx-auto md:px-6 md:py-4 lg:px-8 lg:py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-8">
          <div>
            <h1
              className="text-base md:text-lg font-extrabold tracking-widest uppercase"
              style={{ color: "var(--brand-4)" }}
            >
              {editingId ? "Editar Recurso de Captación" : "Nuevo Recurso de Captación"}
            </h1>
            <p className="text-white text-xs md:text-sm">
              Ofrece algo de valor a cambio del contacto de tu cliente potencial
            </p>
          </div>
          <Link
            href="/captacion/lead-magnets"
            className="text-white/60 hover:text-white text-xs md:text-sm"
          >
            ← Volver a la lista
          </Link>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-1 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  // Only allow going back or to completed steps
                  if (i <= stepIndex) setStep(s);
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors flex-shrink-0 ${
                  step === s
                    ? "bg-[var(--brand-4)] text-black"
                    : stepIndex > i
                    ? "bg-green-500 text-white"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {stepIndex > i ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-4 md:w-8 h-0.5 mx-0.5 flex-shrink-0 transition-colors ${
                    stepIndex > i ? "bg-green-500" : "bg-white/10"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Main card */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-4 md:p-8">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}

// ── Export con Suspense (necesario por useSearchParams) ────────
export default function CaptacionLeadMagnetWizard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-white">
          Cargando...
        </div>
      }
    >
      <CaptacionLeadMagnetWizardInner />
    </Suspense>
  );
}
