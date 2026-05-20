"use client";

import { useState } from "react";
import type {
  FormBlock, WelcomeConfig, SegmentationConfig, QuestionsConfig,
  CaptureConfig, FinalMessageConfig, ThankYouConfig,
} from "@/types/captacion";

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
}

// ── Default flow when no form is configured ──────────────────

function DefaultForm({ campaignId, leadMagnet }: { campaignId: string; leadMagnet: LeadMagnetInfo | null }) {
  const [step, setStep] = useState<"capture" | "done">("capture");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [leadMagnetUrl, setLeadMagnetUrl] = useState<string | null>(null);
  const [codeValue, setCodeValue] = useState<string | null>(null);

  const submit = async () => {
    if (!phone.trim()) { setError("El teléfono es obligatorio"); return; }
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/captacion/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaign_id: campaignId, name: name.trim() || null, phone: phone.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Error al enviar"); setSubmitting(false); return; }
    if (data.lead_magnet_url) setLeadMagnetUrl(data.lead_magnet_url);
    if (data.lead?.lead_magnet_id && leadMagnet?.type === "code") setCodeValue(leadMagnet.code_value || null);
    setStep("done");
    setSubmitting(false);
  };

  if (step === "done") {
    const hasResource = !!(leadMagnetUrl || codeValue);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a323c] text-white p-6 text-center">

        {/* Icono de confirmación */}
        <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-400/40 flex items-center justify-center mb-5">
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold mb-2">
          {hasResource ? "¡Tu recurso está listo!" : "¡Gracias!"}
        </h1>
        <p className="text-white/50 text-sm mb-8">
          {hasResource
            ? "Pulsa el botón para descargarlo ahora"
            : "En breve nos ponemos en contacto contigo."}
        </p>

        {/* Bloque de entrega del recurso */}
        {leadMagnet && hasResource && (
          <div className="w-full max-w-sm mb-6">
            {leadMagnetUrl && (
              <a
                href={leadMagnetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold text-base bg-white text-[#0a323c] shadow-lg shadow-white/10 active:scale-95 transition-transform"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {leadMagnet.cta_text || "Descargar ahora"}
              </a>
            )}
            {codeValue && (
              <div className="bg-white/10 rounded-2xl p-5">
                <p className="text-sm text-white/60 mb-3">
                  {leadMagnet.cta_text || "Tu código exclusivo:"}
                </p>
                <div className="font-mono text-3xl font-bold tracking-widest bg-white/20 rounded-xl px-4 py-4 select-all">
                  {codeValue}
                </div>
                <p className="text-xs text-white/30 mt-3">Mantén esta pantalla abierta o anota el código</p>
              </div>
            )}
            {leadMagnet.title && (
              <p className="text-xs text-white/30 mt-3">{leadMagnet.title}</p>
            )}
          </div>
        )}

        {/* Confirmación discreta cuando no hay recurso */}
        {!hasResource && (
          <p className="text-xs text-white/30">Hemos guardado tus datos correctamente.</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a323c] text-white p-6">
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-1">{leadMagnet?.title || "Regístrate"}</h1>
          <p className="text-white/60 text-sm">{leadMagnet?.description || "Déjanos tus datos para continuar"}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-white/60 block mb-1">Nombre (opcional)</label>
          <input className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/30 text-sm"
            placeholder="Tu nombre" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-white/60 block mb-1">WhatsApp *</label>
          <input className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/30 text-sm"
            type="tel" placeholder="+34 600 000 000" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button onClick={submit} disabled={submitting}
          className="w-full py-3.5 rounded-xl font-semibold text-sm bg-white text-[#0a323c] disabled:opacity-50 transition-opacity">
          {submitting ? "Enviando..." : leadMagnet?.cta_text || "Continuar →"}
        </button>
        <p className="text-xs text-white/30 text-center">
          Tus datos se tratan conforme a nuestra política de privacidad.
        </p>
      </div>
    </div>
  );
}

// ── Full form renderer with blocks ───────────────────────────

export default function FormRenderer({ campaignId, campaignName, blocks, leadMagnet }: Props) {
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [captureData, setCaptureData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [leadMagnetUrl, setLeadMagnetUrl] = useState<string | null>(null);
  const [codeValue, setCodeValue] = useState<string | null>(null);

  // Fallback: no blocks
  if (!blocks || blocks.length === 0) {
    return <DefaultForm campaignId={campaignId} leadMagnet={leadMagnet} />;
  }

  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);
  const currentBlock = sortedBlocks[currentBlockIndex];
  const isLastBlock = currentBlockIndex === sortedBlocks.length - 1;

  const next = () => {
    if (!isLastBlock) setCurrentBlockIndex(i => i + 1);
  };

  const submitLead = async () => {
    const phoneField = captureData.phone;
    if (!phoneField?.trim()) { setSubmitError("El teléfono es obligatorio"); return; }
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
    if (data.lead_magnet_url) setLeadMagnetUrl(data.lead_magnet_url);
    if (leadMagnet?.type === "code") setCodeValue(leadMagnet.code_value || null);
    next();
    setSubmitting(false);
  };

  // Render by block type
  const renderBlock = () => {
    switch (currentBlock.type) {
      case "welcome": {
        const cfg = currentBlock.config as WelcomeConfig;
        return (
          <div className="min-h-screen flex flex-col items-center justify-center text-center p-6"
            style={{ background: cfg.bg_color, color: cfg.text_color }}>
            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold leading-tight mb-3 max-w-xs">{cfg.title}</h1>
            <p className="text-sm opacity-70 mb-10 max-w-xs">{cfg.subtitle}</p>
            <button onClick={next}
              className="px-8 py-4 rounded-2xl font-semibold text-base"
              style={{ background: cfg.text_color, color: cfg.bg_color }}>
              Comenzar →
            </button>
          </div>
        );
      }

      case "segmentation": {
        const cfg = currentBlock.config as SegmentationConfig;
        return (
          <div className="min-h-screen flex flex-col justify-center p-6 bg-[#0a323c] text-white">
            <h2 className="text-xl font-bold mb-2">¿Qué describe mejor tu situación?</h2>
            <p className="text-white/50 text-sm mb-6">Elige la opción que más se ajuste a ti</p>
            <div className="space-y-3 mb-8">
              {cfg.options.map(o => (
                <button key={o.id} onClick={() => setSelectedSegment(o.id)}
                  className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${selectedSegment === o.id ? "border-white bg-white/15" : "border-white/20 bg-white/5"}`}>
                  <p className="font-semibold">{o.title}</p>
                  {o.description && <p className="text-sm text-white/60 mt-0.5">{o.description}</p>}
                </button>
              ))}
            </div>
            <button onClick={next} disabled={!selectedSegment}
              className="w-full py-4 rounded-2xl font-semibold text-[#0a323c] bg-white disabled:opacity-40">
              Continuar →
            </button>
          </div>
        );
      }

      case "questions": {
        const cfg = currentBlock.config as QuestionsConfig;
        const qs = cfg.questions || [];
        return (
          <div className="min-h-screen flex flex-col justify-center p-6 bg-[#0a323c] text-white">
            <div className="space-y-6 mb-8">
              {qs.map(q => (
                <div key={q.id}>
                  <p className="font-semibold mb-3">{q.text}</p>
                  {q.type === "yes_no" && (
                    <div className="grid grid-cols-2 gap-3">
                      {["Sí", "No"].map(v => (
                        <button key={v} onClick={() => setAnswers(a => ({ ...a, [q.id]: v }))}
                          className={`py-3 rounded-xl border-2 font-medium transition-all ${answers[q.id] === v ? "border-white bg-white/15" : "border-white/20 bg-white/5"}`}>
                          {v}
                        </button>
                      ))}
                    </div>
                  )}
                  {q.type === "multiple_choice" && (
                    <div className="space-y-2">
                      {(q.options || []).map(opt => (
                        <button key={opt} onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                          className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${answers[q.id] === opt ? "border-white bg-white/15" : "border-white/20 bg-white/5"}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                  {q.type === "scale" && (
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => setAnswers(a => ({ ...a, [q.id]: n }))}
                          className={`flex-1 py-3 rounded-xl border-2 font-semibold transition-all ${answers[q.id] === n ? "border-white bg-white/15" : "border-white/20 bg-white/5"}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button onClick={next}
              className="w-full py-4 rounded-2xl font-semibold text-[#0a323c] bg-white">
              Continuar →
            </button>
          </div>
        );
      }

      case "capture": {
        const cfg = currentBlock.config as CaptureConfig;
        const enabledFields = cfg.fields.filter(f => f.enabled);
        return (
          <div className="min-h-screen flex flex-col justify-center p-6 bg-[#0a323c] text-white">
            <h2 className="text-xl font-bold mb-1">Tus datos</h2>
            <p className="text-white/50 text-sm mb-6">Solo pedimos lo que realmente necesitamos</p>
            <div className="space-y-4 mb-6">
              {enabledFields.map(f => (
                <div key={f.name}>
                  <label className="text-xs font-medium text-white/60 block mb-1">
                    {f.label}{f.required ? " *" : ""}
                  </label>
                  <input
                    type={f.type || "text"}
                    className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/30 text-sm"
                    placeholder={f.type === "tel" ? "+34 600 000 000" : f.type === "email" ? "email@ejemplo.com" : f.label}
                    value={captureData[f.name] || ""}
                    onChange={e => setCaptureData(d => ({ ...d, [f.name]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            {submitError && <p className="text-red-400 text-xs mb-3">{submitError}</p>}
            <button onClick={submitLead} disabled={submitting}
              className="w-full py-4 rounded-2xl font-semibold text-[#0a323c] bg-white disabled:opacity-50">
              {submitting ? "Enviando..." : isLastBlock ? "Enviar" : "Continuar →"}
            </button>
            <p className="text-xs text-white/30 text-center mt-3">
              Tus datos se tratan conforme a nuestra política de privacidad.
            </p>
          </div>
        );
      }

      case "final_message": {
        const cfg = currentBlock.config as FinalMessageConfig;
        return (
          <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-[#0a323c] text-white">
            <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-5">
              <svg className="w-7 h-7 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">{cfg.title}</h2>
            <p className="text-white/60 text-sm mb-8 max-w-xs">{cfg.text}</p>
            {leadMagnetUrl ? (
              <a href={leadMagnetUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full max-w-xs py-4 rounded-2xl font-bold text-[#0a323c] bg-white shadow-lg shadow-white/10 active:scale-95 transition-transform mb-4">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {cfg.cta_text}
              </a>
            ) : codeValue ? (
              <div className="w-full max-w-xs mb-4">
                <p className="text-sm text-white/60 mb-3">{cfg.cta_text}</p>
                <div className="font-mono text-3xl font-bold tracking-widest bg-white/20 rounded-2xl px-4 py-4 select-all">
                  {codeValue}
                </div>
                <p className="text-xs text-white/30 mt-3">Mantén esta pantalla abierta o anota el código</p>
              </div>
            ) : (
              <button onClick={next}
                className="w-full max-w-xs py-4 rounded-2xl font-semibold text-[#0a323c] bg-white">
                {cfg.cta_text}
              </button>
            )}
            {!isLastBlock && (
              <button onClick={next} className="text-sm text-white/40 underline mt-3">Continuar</button>
            )}
          </div>
        );
      }

      case "thank_you": {
        const cfg = currentBlock.config as ThankYouConfig;
        return (
          <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-[#0a323c] text-white">
            <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-400/40 flex items-center justify-center mb-5">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">{cfg.title}</h2>
            <p className="text-white/60 text-sm mb-6 max-w-xs">{cfg.message}</p>
            {(cfg.next_steps || []).length > 0 && (
              <ul className="text-left text-sm space-y-2 mb-6 w-full max-w-xs">
                {cfg.next_steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-400 flex-shrink-0">✓</span>
                    <span className="text-white/70">{s}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="relative">
      {/* Progress dots */}
      {sortedBlocks.length > 1 && currentBlock.type !== "thank_you" && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {sortedBlocks.filter(b => b.type !== "thank_you").map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentBlockIndex ? "w-6 bg-white" : i < currentBlockIndex ? "w-1.5 bg-white/60" : "w-1.5 bg-white/20"}`} />
          ))}
        </div>
      )}
      {renderBlock()}
    </div>
  );
}
