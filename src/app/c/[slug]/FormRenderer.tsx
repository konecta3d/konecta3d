"use client";

import { useState, useEffect } from "react";
import type {
  FormBlock, WelcomeConfig, SegmentationConfig, QuestionsConfig,
  CaptureConfig, FinalMessageConfig, ThankYouConfig, FormDesign,
} from "@/types/captacion";
import { DEFAULT_DESIGN } from "@/types/captacion";

interface LeadMagnetInfo {
  id: string;
  type: "pdf" | "url" | "code";
  title?: string;
  description?: string;
  cta_text?: string;
  file_url?: string;
  external_url?: string;
  code_value?: string;
}

interface Props {
  campaignId: string;
  campaignName: string;
  blocks: FormBlock[] | null;
  leadMagnet: LeadMagnetInfo | null;
  design?: FormDesign | null;
  /** Slug de la campaña — usado para marcar al cliente como convertido */
  slug?: string;
  /** public_id del negocio — destino de la redirección a fidelización */
  businessPublicId?: string;
}

// ── Mapa de fuentes → CSS variables cargadas en el root layout ──
// Convierte el nombre de fuente guardado en el diseño a la variable CSS
// que Next.js genera al importar la fuente en layout.tsx.
// Sin este mapa el browser recibe "Inter" (nombre de fuente puro) pero
// como Inter no está en las fuentes del sistema falla y usa la fuente
// por defecto. Con la variable el browser usa el subconjunto pre-cargado.
const FONT_VAR: Record<string, string> = {
  Inter:       "var(--font-inter, Inter, system-ui, sans-serif)",
  Poppins:     "var(--font-poppins, Poppins, system-ui, sans-serif)",
  Lora:        "var(--font-lora, Lora, Georgia, serif)",
  Montserrat:  "var(--font-montserrat, Montserrat, system-ui, sans-serif)",
  Outfit:      "var(--font-outfit, Outfit, system-ui, sans-serif)",
};

function resolveFont(fontFamily: string): string {
  return FONT_VAR[fontFamily] ?? fontFamily;
}

// ── Logo helper ────────────────────────────────────────────────

function LogoImg({ design }: { design: FormDesign }) {
  if (!design.logo_url) return null;

  const size = design.logo_size || 72;
  const radius =
    design.logo_shape === "round"  ? "50%" :
    design.logo_shape === "square" ? "12px" :
    "8px";

  return (
    <img
      src={design.logo_url}
      alt="logo"
      style={{
        width: design.logo_shape === "rect" ? size * 1.8 : size,
        height: size,
        borderRadius: radius,
        objectFit: "contain",
      }}
    />
  );
}

// ── Cookie de fidelización ─────────────────────────────────────
// Se llama tras completar el flujo. El servidor la leerá en la próxima
// visita y redirigirá automáticamente a la landing de fidelización.

function markConverted(slug: string) {
  try {
    // Cookie con 1 año de vida — el servidor la detecta en la siguiente visita
    document.cookie = `k3d_done_${slug}=1; max-age=31536000; path=/; SameSite=Lax`;
    // localStorage como respaldo (útil si las cookies se borran)
    localStorage.setItem(`k3d_done_${slug}`, "1");
  } catch {
    // Silencioso — no bloquear el flujo por falta de storage
  }
}

// ── Default form (sin bloques configurados) ───────────────────

function DefaultForm({
  campaignId,
  leadMagnet,
  design,
  slug,
  businessPublicId,
}: {
  campaignId: string;
  leadMagnet: LeadMagnetInfo | null;
  design: FormDesign;
  slug?: string;
  businessPublicId?: string;
}) {
  const [step, setStep] = useState<"capture" | "done">("capture");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [leadMagnetUrl, setLeadMagnetUrl] = useState<string | null>(null);
  const [codeValue, setCodeValue] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);

  // La redirección a fidelización ocurre solo al pulsar el CTA de descarga.
  const handleDownload = () => {
    // 1. Marcar LM como descargado en la BD
    if (leadId) {
      fetch(`/api/captacion/leads/${leadId}/lm-downloaded`, { method: "PATCH" })
        .catch(() => {/* silencioso */});
    }
    // 2. Marcar cookie de fidelización y redirigir tras iniciar descarga
    if (slug) markConverted(slug);
    if (businessPublicId) {
      setTimeout(() => window.location.replace(`/l/${businessPublicId}/NFC`), 1200);
    }
  };

  const submit = async () => {
    if (!phone.trim()) { setError("El teléfono es obligatorio"); return; }
    if (!consent) { setError("Debes aceptar la política de privacidad para continuar."); return; }
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/captacion/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaign_id: campaignId, name: name.trim() || null, phone: phone.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Error al enviar"); setSubmitting(false); return; }

    // Guardar el ID del lead para marcarlo como descargado al pulsar el CTA
    if (data.lead?.id) setLeadId(data.lead.id);

    // URL desde API o fallback directo desde prop
    const url = data.lead_magnet_url
      || (leadMagnet?.type === "pdf" ? leadMagnet.file_url : null)
      || (leadMagnet?.type === "url" ? leadMagnet.external_url : null)
      || null;
    if (url) setLeadMagnetUrl(url);
    if (leadMagnet?.type === "code") setCodeValue(leadMagnet.code_value || null);

    setStep("done");
    setSubmitting(false);
  };

  const s = design;

  if (step === "done") {
    const hasResource = !!(leadMagnetUrl || codeValue);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6"
        style={{ background: s.bg_color, color: s.text_color, fontFamily: resolveFont(s.font_family) }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
          style={{ background: `${s.accent_color}30`, border: `2px solid ${s.accent_color}50` }}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            style={{ color: s.accent_color }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">
          {hasResource ? "¡Tu recurso está listo!" : "¡Gracias por registrarte!"}
        </h1>
        <p className="text-sm mb-8" style={{ opacity: 0.7 }}>
          {hasResource ? "Pulsa el botón para descargarlo ahora." : "Hemos guardado tus datos correctamente."}
        </p>
        {leadMagnet && hasResource && (
          <div className="w-full max-w-sm mb-6">
            {leadMagnetUrl && (
              <a
                href={leadMagnetUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDownload}
                className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold text-base active:scale-95 transition-transform"
                style={{ background: s.accent_color, color: s.bg_color }}>
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {leadMagnet.cta_text || "Descargar ahora"}
              </a>
            )}
            {codeValue && (
              <div
                className="rounded-2xl p-5 cursor-pointer"
                style={{ background: `${s.text_color}15` }}
                onClick={handleDownload}
              >
                <p className="text-sm mb-3" style={{ opacity: 0.6 }}>
                  {leadMagnet.cta_text || "Tu código exclusivo:"}
                </p>
                <div className="font-mono text-3xl font-bold tracking-widest rounded-xl px-4 py-4 select-all"
                  style={{ background: `${s.text_color}20`, color: s.accent_color }}>
                  {codeValue}
                </div>
                <p className="text-xs mt-3" style={{ opacity: 0.3 }}>Mantén esta pantalla abierta o anota el código</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: s.bg_color, color: s.text_color, fontFamily: resolveFont(s.font_family) }}>
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center mb-6">
          {s.logo_url && <div className="flex justify-center mb-5"><LogoImg design={s} /></div>}
          <h1 className="text-2xl font-bold mb-1">{leadMagnet?.title || "Regístrate"}</h1>
          <p className="text-sm mb-0" style={{ opacity: 0.6 }}>{leadMagnet?.description || "Déjanos tus datos para continuar"}</p>
        </div>
        <div>
          <label className="text-xs font-medium block mb-1" style={{ opacity: 0.6 }}>Nombre (opcional)</label>
          <input className="w-full rounded-xl px-4 py-3 text-sm"
            style={{ background: `${s.text_color}15`, border: `1px solid ${s.border_color}`, color: s.text_color }}
            placeholder="Tu nombre" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1" style={{ opacity: 0.6 }}>WhatsApp *</label>
          <input className="w-full rounded-xl px-4 py-3 text-sm"
            style={{ background: `${s.text_color}15`, border: `1px solid ${s.border_color}`, color: s.text_color }}
            type="tel" placeholder="+34 600 000 000" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        {/* Checkbox de consentimiento */}
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <div className="relative flex-shrink-0 mt-0.5">
            <input
              type="checkbox"
              checked={consent}
              onChange={e => setConsent(e.target.checked)}
              className="sr-only"
            />
            <div
              className="w-5 h-5 rounded flex items-center justify-center transition-all"
              style={{
                background: consent ? s.accent_color : `${s.text_color}10`,
                border: `2px solid ${consent ? s.accent_color : s.border_color}`,
              }}
            >
              {consent && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  style={{ color: s.bg_color }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-xs leading-relaxed" style={{ opacity: 0.55 }}>
            He leído y acepto la{" "}
            <a
              href="#"
              onClick={e => e.preventDefault()}
              className="underline underline-offset-2"
              style={{ opacity: 1, color: s.accent_color }}
            >
              política de privacidad
            </a>
            {" "}y consiento el tratamiento de mis datos para recibir información comercial. *
          </span>
        </label>

        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button onClick={submit} disabled={submitting || !consent}
          className="w-full py-3.5 rounded-xl font-semibold text-sm disabled:opacity-40 transition-opacity"
          style={{ background: s.accent_color, color: s.bg_color }}>
          {submitting ? "Enviando..." : leadMagnet?.cta_text || "Continuar →"}
        </button>
      </div>
    </div>
  );
}

// ── Full form renderer con bloques ────────────────────────────

export default function FormRenderer({ campaignId, campaignName, blocks, leadMagnet, design: designProp, slug, businessPublicId }: Props) {
  const design = { ...DEFAULT_DESIGN, ...(designProp || {}) };
  const s = design;
  void campaignName;

  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [captureData, setCaptureData] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [leadMagnetUrl, setLeadMagnetUrl] = useState<string | null>(null);
  const [codeValue, setCodeValue] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Calcular bloque actual antes de los hooks (los hooks no pueden ir después de un return condicional)
  const sortedBlocks = blocks ? [...blocks].sort((a, b) => a.order - b.order) : [];
  const currentBlock = sortedBlocks[currentBlockIndex] ?? null;
  const isLastBlock  = currentBlockIndex === sortedBlocks.length - 1;
  const isThankYou   = currentBlock?.type === "thank_you";

  // La redirección a fidelización ocurre al pulsar el CTA de descarga.
  const handleDownload = () => {
    if (leadId) {
      fetch(`/api/captacion/leads/${leadId}/lm-downloaded`, { method: "PATCH" })
        .catch(() => {/* silencioso */});
    }
    if (slug) markConverted(slug);
    if (businessPublicId) {
      setTimeout(() => window.location.replace(`/l/${businessPublicId}/NFC`), 1200);
    }
  };

  if (!blocks || blocks.length === 0) {
    return <DefaultForm campaignId={campaignId} leadMagnet={leadMagnet} design={design} slug={slug} businessPublicId={businessPublicId} />;
  }

  const next = () => {
    if (!isLastBlock) setCurrentBlockIndex(i => i + 1);
  };

  const submitLead = async () => {
    const phoneField = captureData.phone;
    if (!phoneField?.trim()) { setSubmitError("El teléfono es obligatorio"); return; }
    if (!consent) { setSubmitError("Debes aceptar la política de privacidad para continuar."); return; }
    setSubmitting(true);
    setSubmitError("");
    const res = await fetch("/api/captacion/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaign_id: campaignId,
        name: captureData.name || null,
        phone: captureData.phone,
        email: captureData.email || null,
        company: captureData.company || null,
        position: captureData.position || null,
        segment: selectedSegment,
        quiz_answers: answers,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setSubmitError(data.error || "Error al enviar"); setSubmitting(false); return; }

    // Guardar el ID del lead para marcarlo como descargado al pulsar el CTA
    if (data.lead?.id) setLeadId(data.lead.id);

    // URL desde API; si no viene, intentar desde prop (ej: PDF sin URL guardada)
    const url = data.lead_magnet_url
      || (leadMagnet?.type === "pdf" ? leadMagnet.file_url : null)
      || (leadMagnet?.type === "url" ? leadMagnet.external_url : null)
      || null;
    if (url) setLeadMagnetUrl(url);
    if (leadMagnet?.type === "code") setCodeValue(leadMagnet.code_value || null);

    next();
    setSubmitting(false);
  };

  // ── Renderizado por tipo de bloque ─────────────────────────

  const renderBlock = () => {
    switch (currentBlock.type) {

      case "welcome": {
        const cfg = currentBlock.config as WelcomeConfig;
        const bg  = cfg.bg_color  || s.bg_color;
        const col = cfg.text_color || s.text_color;
        return (
          <div className="min-h-screen flex flex-col items-center justify-center text-center p-6"
            style={{ background: bg, color: col, fontFamily: resolveFont(s.font_family) }}>
            {/* Logo — solo si está configurado */}
            {s.logo_url && (
              <div className="flex justify-center mb-6">
                <LogoImg design={s} />
              </div>
            )}
            <h1 className="text-2xl font-bold leading-tight mb-3 max-w-xs">{cfg.title}</h1>
            <p className="text-sm mb-10 max-w-xs" style={{ opacity: 0.7 }}>{cfg.subtitle}</p>
            <button onClick={next}
              className="px-8 py-4 rounded-2xl font-semibold text-base active:scale-95 transition-transform"
              style={{ background: s.accent_color, color: bg }}>
              Comenzar →
            </button>
          </div>
        );
      }

      case "segmentation": {
        const cfg = currentBlock.config as SegmentationConfig;
        return (
          <div className="min-h-screen flex flex-col justify-center p-6"
            style={{ background: s.bg_color, color: s.text_color, fontFamily: resolveFont(s.font_family) }}>
            <h2 className="text-xl font-bold mb-2">¿Qué describe mejor tu situación?</h2>
            <p className="text-sm mb-6" style={{ opacity: 0.5 }}>Elige la opción que más se ajuste a ti</p>
            <div className="space-y-3 mb-8">
              {cfg.options.map(o => (
                <button key={o.id} onClick={() => setSelectedSegment(o.id)}
                  className="w-full text-left rounded-2xl border-2 p-4 transition-all"
                  style={{
                    borderColor: selectedSegment === o.id ? s.accent_color : s.border_color,
                    background: selectedSegment === o.id ? `${s.accent_color}20` : `${s.text_color}08`,
                    color: s.text_color,
                  }}>
                  <p className="font-semibold">{o.title}</p>
                  {o.description && <p className="text-sm mt-0.5" style={{ opacity: 0.6 }}>{o.description}</p>}
                </button>
              ))}
            </div>
            <button onClick={next} disabled={!selectedSegment}
              className="w-full py-4 rounded-2xl font-semibold disabled:opacity-40 transition-opacity"
              style={{ background: s.accent_color, color: s.bg_color }}>
              Continuar →
            </button>
          </div>
        );
      }

      case "questions": {
        const cfg = currentBlock.config as QuestionsConfig;
        const qs  = cfg.questions || [];
        return (
          <div className="min-h-screen flex flex-col justify-center p-6"
            style={{ background: s.bg_color, color: s.text_color, fontFamily: resolveFont(s.font_family) }}>
            <div className="space-y-6 mb-8">
              {qs.map(q => (
                <div key={q.id}>
                  <p className="font-semibold mb-3">{q.text}</p>
                  {q.type === "yes_no" && (
                    <div className="grid grid-cols-2 gap-3">
                      {["Sí", "No"].map(v => (
                        <button key={v} onClick={() => setAnswers(a => ({ ...a, [q.id]: v }))}
                          className="py-3 rounded-xl border-2 font-medium transition-all"
                          style={{
                            borderColor: answers[q.id] === v ? s.accent_color : s.border_color,
                            background: answers[q.id] === v ? `${s.accent_color}20` : `${s.text_color}08`,
                            color: s.text_color,
                          }}>
                          {v}
                        </button>
                      ))}
                    </div>
                  )}
                  {q.type === "multiple_choice" && (
                    <div className="space-y-2">
                      {(q.options || []).map(opt => (
                        <button key={opt} onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                          className="w-full text-left px-4 py-3 rounded-xl border-2 transition-all"
                          style={{
                            borderColor: answers[q.id] === opt ? s.accent_color : s.border_color,
                            background: answers[q.id] === opt ? `${s.accent_color}20` : `${s.text_color}08`,
                            color: s.text_color,
                          }}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                  {q.type === "scale" && (
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => setAnswers(a => ({ ...a, [q.id]: n }))}
                          className="flex-1 py-3 rounded-xl border-2 font-semibold transition-all"
                          style={{
                            borderColor: answers[q.id] === n ? s.accent_color : s.border_color,
                            background: answers[q.id] === n ? `${s.accent_color}20` : `${s.text_color}08`,
                            color: s.text_color,
                          }}>
                          {n}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button onClick={next}
              className="w-full py-4 rounded-2xl font-semibold"
              style={{ background: s.accent_color, color: s.bg_color }}>
              Continuar →
            </button>
          </div>
        );
      }

      case "capture": {
        const cfg = currentBlock.config as CaptureConfig;
        const enabledFields = cfg.fields.filter(f => f.enabled);
        return (
          <div className="min-h-screen flex flex-col justify-center p-6"
            style={{ background: s.bg_color, color: s.text_color, fontFamily: resolveFont(s.font_family) }}>
            <h2 className="text-xl font-bold mb-1">Tus datos</h2>
            <p className="text-sm mb-6" style={{ opacity: 0.5 }}>Solo pedimos lo que realmente necesitamos</p>
            <div className="space-y-4 mb-6">
              {enabledFields.map(f => (
                <div key={f.name}>
                  <label className="text-xs font-medium block mb-1" style={{ opacity: 0.6 }}>
                    {f.label}{f.required ? " *" : ""}
                  </label>
                  <input
                    type={f.type || "text"}
                    className="w-full rounded-xl px-4 py-3 text-sm"
                    style={{
                      background: `${s.text_color}12`,
                      border: `1px solid ${s.border_color}`,
                      color: s.text_color,
                    }}
                    placeholder={f.type === "tel" ? "+34 600 000 000" : f.type === "email" ? "email@ejemplo.com" : f.label}
                    value={captureData[f.name] || ""}
                    onChange={e => setCaptureData(d => ({ ...d, [f.name]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            {/* Checkbox de consentimiento */}
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={e => setConsent(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className="w-5 h-5 rounded flex items-center justify-center transition-all"
                  style={{
                    background: consent ? s.accent_color : `${s.text_color}10`,
                    border: `2px solid ${consent ? s.accent_color : s.border_color}`,
                  }}
                >
                  {consent && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      style={{ color: s.bg_color }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-xs leading-relaxed" style={{ opacity: 0.55 }}>
                He leído y acepto la{" "}
                <a
                  href="#"
                  onClick={e => e.preventDefault()}
                  className="underline underline-offset-2"
                  style={{ opacity: 1, color: s.accent_color }}
                >
                  política de privacidad
                </a>
                {" "}y consiento el tratamiento de mis datos para recibir información comercial. *
              </span>
            </label>

            {submitError && <p className="text-red-400 text-xs">{submitError}</p>}
            <button onClick={submitLead} disabled={submitting || !consent}
              className="w-full py-4 rounded-2xl font-semibold disabled:opacity-40 transition-opacity"
              style={{ background: s.accent_color, color: s.bg_color }}>
              {submitting ? "Enviando..." : isLastBlock ? "Enviar" : "Continuar →"}
            </button>
          </div>
        );
      }

      case "final_message": {
        const cfg = currentBlock.config as FinalMessageConfig;
        const hasUrl  = !!leadMagnetUrl;
        const hasCode = !!codeValue;

        return (
          <div className="min-h-screen flex flex-col items-center justify-center text-center p-6"
            style={{ background: s.bg_color, color: s.text_color, fontFamily: resolveFont(s.font_family) }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
              style={{ background: `${s.accent_color}25`, border: `1px solid ${s.accent_color}50` }}>
              <svg className="w-7 h-7" style={{ color: s.accent_color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">{cfg.title}</h2>
            <p className="text-sm mb-8 max-w-xs" style={{ opacity: 0.6 }}>{cfg.text}</p>

            {hasUrl ? (
              <a
                href={leadMagnetUrl!}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDownload}
                className="flex items-center justify-center gap-3 w-full max-w-xs py-4 rounded-2xl font-bold active:scale-95 transition-transform mb-4"
                style={{ background: s.accent_color, color: s.bg_color }}>
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {cfg.cta_text}
              </a>
            ) : hasCode ? (
              <div
                className="w-full max-w-xs mb-4 cursor-pointer"
                onClick={handleDownload}
              >
                <p className="text-sm mb-3" style={{ opacity: 0.6 }}>{cfg.cta_text}</p>
                <div className="font-mono text-3xl font-bold tracking-widest rounded-2xl px-4 py-4 select-all"
                  style={{ background: `${s.text_color}15`, color: s.accent_color }}>
                  {codeValue}
                </div>
                <p className="text-xs mt-3" style={{ opacity: 0.3 }}>Mantén esta pantalla abierta o anota el código</p>
              </div>
            ) : (
              /* Sin recurso: avanzar al siguiente bloque */
              <button onClick={next}
                className="w-full max-w-xs py-4 rounded-2xl font-semibold"
                style={{ background: s.accent_color, color: s.bg_color }}>
                {cfg.cta_text}
              </button>
            )}

            {!isLastBlock && (hasUrl || hasCode) && (
              <button onClick={next} className="text-sm mt-3 underline" style={{ opacity: 0.4 }}>
                Continuar
              </button>
            )}
          </div>
        );
      }

      case "thank_you": {
        const cfg = currentBlock.config as ThankYouConfig;
        const waUrl = cfg.whatsapp_phone
          ? `https://wa.me/${cfg.whatsapp_phone.replace(/\D/g, "")}${cfg.whatsapp_text ? `?text=${encodeURIComponent(cfg.whatsapp_text)}` : ""}`
          : null;
        return (
          <div className="min-h-screen flex flex-col items-center justify-center text-center p-6"
            style={{ background: s.bg_color, color: s.text_color, fontFamily: resolveFont(s.font_family) }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
              style={{ background: `${s.accent_color}25`, border: `2px solid ${s.accent_color}50` }}>
              <svg className="w-8 h-8" style={{ color: s.accent_color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">{cfg.title}</h2>
            <p className="text-sm mb-6 max-w-xs" style={{ opacity: 0.6 }}>{cfg.message}</p>
            {(cfg.next_steps || []).length > 0 && (
              <ul className="text-left text-sm space-y-2 mb-6 w-full max-w-xs">
                {cfg.next_steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="flex-shrink-0 font-bold" style={{ color: s.accent_color }}>✓</span>
                    <span style={{ opacity: 0.7 }}>{step}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-col gap-3 w-full max-w-xs mt-2">
              {/* PDF / URL lead magnet — aparece si el form no tiene bloque final_message (ej: objetivo quick) */}
              {leadMagnetUrl && (
                <a
                  href={leadMagnetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-semibold text-sm active:scale-95 transition-transform"
                  style={{ background: s.accent_color, color: s.bg_color }}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {leadMagnet?.cta_text || "Descargar recurso"}
                </a>
              )}
              {codeValue && !leadMagnetUrl && (
                <div
                  className="rounded-2xl p-4 mb-2 cursor-pointer"
                  style={{ background: `${s.text_color}12` }}
                  onClick={handleDownload}
                >
                  <p className="text-xs mb-2" style={{ opacity: 0.6 }}>{leadMagnet?.cta_text || "Tu código exclusivo:"}</p>
                  <div className="font-mono text-3xl font-bold tracking-widest rounded-xl px-4 py-3 select-all"
                    style={{ background: `${s.text_color}20`, color: s.accent_color }}>
                    {codeValue}
                  </div>
                  <p className="text-xs mt-2" style={{ opacity: 0.3 }}>Mantén esta pantalla abierta o anota el código</p>
                </div>
              )}
              {/* Botón CTA personalizado */}
              {cfg.cta_text && cfg.cta_url && (
                <a
                  href={cfg.cta_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 rounded-2xl font-semibold text-sm active:scale-95 transition-transform text-center"
                  style={{ background: leadMagnetUrl ? `${s.accent_color}25` : s.accent_color, color: leadMagnetUrl ? s.text_color : s.bg_color, border: leadMagnetUrl ? `1px solid ${s.border_color}` : "none" }}
                >
                  {cfg.cta_text}
                </a>
              )}
              {/* Botón WhatsApp */}
              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 rounded-2xl font-semibold text-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
                  style={{ background: "#25d366", color: "#ffffff" }}
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.856L.057 23.143a.75.75 0 00.916.916l5.287-1.475A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.693 9.693 0 01-4.948-1.352l-.355-.21-3.676 1.025 1.025-3.676-.21-.355A9.693 9.693 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
                  </svg>
                  {cfg.whatsapp_text ? "Escríbenos por WhatsApp" : "Contactar por WhatsApp"}
                </a>
              )}
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="relative captacion-form-public">
      {/* Progress dots */}
      {sortedBlocks.length > 1 && currentBlock.type !== "thank_you" && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {sortedBlocks
            .filter(b => b.type !== "thank_you")
            .map((_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === currentBlockIndex ? "24px" : "6px",
                  background:
                    i === currentBlockIndex ? design.accent_color :
                    i < currentBlockIndex   ? `${design.text_color}60` :
                                              `${design.text_color}20`,
                }}
              />
            ))}
        </div>
      )}
      {renderBlock()}
    </div>
  );
}
