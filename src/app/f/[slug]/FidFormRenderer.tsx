"use client";

import { useState } from "react";
import type {
  FidFormBlock, FidWelcomeConfig, FidRatingConfig, FidNpsConfig,
  FidQuestionsConfig, FidOpenTextConfig, FidCaptureConfig, FidThankYouConfig,
  FormDesign,
} from "@/types/fidelizacion-forms";
import { DEFAULT_FID_DESIGN } from "@/types/fidelizacion-forms";

interface Props {
  formId: string;
  blocks: FidFormBlock[];
  design: FormDesign;
  businessName: string;
}

// ── Logo helper ────────────────────────────────────────────────

function LogoImg({ design }: { design: FormDesign }) {
  if (!design.logo_url) return null;
  const size = design.logo_size || 72;
  const radius = design.logo_shape === "round" ? "50%" : design.logo_shape === "square" ? "12px" : "8px";
  return (
    <img
      src={design.logo_url}
      alt="logo"
      style={{ width: design.logo_shape === "rect" ? size * 1.8 : size, height: size, borderRadius: radius, objectFit: "contain" }}
    />
  );
}

// ── Barra de progreso ──────────────────────────────────────────

function ProgressBar({ current, total, accentColor }: { current: number; total: number; accentColor: string }) {
  if (total <= 1) return null;
  const pct = Math.round((current / Math.max(total - 1, 1)) * 100);
  return (
    <div className="fixed top-0 left-0 right-0 z-10 h-1" style={{ background: "rgba(255,255,255,0.1)" }}>
      <div className="h-full transition-all duration-300" style={{ width: `${pct}%`, background: accentColor }} />
    </div>
  );
}

// ── Renderer principal ────────────────────────────────────────

export default function FidFormRenderer({ formId, blocks, design: designProp, businessName }: Props) {
  const design = { ...DEFAULT_FID_DESIGN, ...(designProp || {}) };
  const s = design;
  void businessName;

  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [respondentName, setRespondentName] = useState("");
  const [respondentEmail, setRespondentEmail] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const currentBlock = sortedBlocks[currentBlockIndex] ?? null;
  const isLastBlock  = currentBlockIndex === sortedBlocks.length - 1;

  const next = () => { if (!isLastBlock) setCurrentBlockIndex(i => i + 1); };

  const submitFeedback = async () => {
    setSubmitting(true);
    setSubmitError("");
    const res = await fetch("/api/fidelizacion/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        formId,
        answers,
        respondentName: anonymous ? null : respondentName || null,
        respondentEmail: anonymous ? null : respondentEmail || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSubmitError(data.error || "Error al enviar. Inténtalo de nuevo.");
      setSubmitting(false);
      return;
    }
    setSubmitted(true);
    setSubmitting(false);
    // Avanzar al bloque de agradecimiento si existe
    const thankYouIdx = sortedBlocks.findIndex(b => b.type === "fid_thank_you");
    if (thankYouIdx !== -1) {
      setCurrentBlockIndex(thankYouIdx);
    }
  };

  if (!blocks || blocks.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6"
        style={{ background: s.bg_color, color: s.text_color, fontFamily: s.font_family }}>
        <h1 className="text-2xl font-bold mb-2">Formulario no disponible</h1>
        <p className="text-sm" style={{ opacity: 0.6 }}>Este formulario no tiene contenido.</p>
      </div>
    );
  }

  if (!currentBlock) return null;

  const renderBlock = () => {
    switch (currentBlock.type) {

      case "fid_welcome": {
        const cfg = currentBlock.config as FidWelcomeConfig;
        const bg  = cfg.bg_color   || s.bg_color;
        const col = cfg.text_color || s.text_color;
        return (
          <div className="min-h-screen flex flex-col items-center justify-center text-center p-6"
            style={{ background: bg, color: col, fontFamily: s.font_family }}>
            {s.logo_url && <div className="flex justify-center mb-6"><LogoImg design={s} /></div>}
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

      case "fid_rating": {
        const cfg = currentBlock.config as FidRatingConfig;
        const ratings = answers[currentBlock.id] as Record<string, number> || {};

        const setRating = (catId: string, stars: number) => {
          setAnswers(a => ({
            ...a,
            [currentBlock.id]: { ...(a[currentBlock.id] as Record<string, number> || {}), [catId]: stars },
            [`rating_${catId}`]: stars,
          }));
        };

        return (
          <div className="min-h-screen flex flex-col justify-center p-6"
            style={{ background: s.bg_color, color: s.text_color, fontFamily: s.font_family }}>
            <h2 className="text-xl font-bold mb-2">{cfg.title || "Valora nuestra atención"}</h2>
            <div className="flex justify-between text-xs mb-6" style={{ opacity: 0.5 }}>
              <span>{cfg.min_label || "Muy malo"}</span>
              <span>{cfg.max_label || "Excelente"}</span>
            </div>
            <div className="space-y-4 mb-8">
              {(cfg.categories || []).map(cat => (
                <div key={cat.id} className="rounded-2xl border-2 p-4" style={{ borderColor: s.border_color, background: `${s.text_color}08` }}>
                  <p className="text-sm font-medium mb-3">{cat.label}</p>
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => setRating(cat.id, star)}
                        className="text-2xl transition-transform active:scale-90"
                        style={{ color: (ratings[cat.id] || 0) >= star ? s.accent_color : `${s.text_color}30` }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
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

      case "fid_nps": {
        const cfg = currentBlock.config as FidNpsConfig;
        const selected = answers[currentBlock.id] as number | undefined;
        return (
          <div className="min-h-screen flex flex-col justify-center p-6"
            style={{ background: s.bg_color, color: s.text_color, fontFamily: s.font_family }}>
            <h2 className="text-xl font-bold mb-2">{cfg.question || "¿Nos recomendarías?"}</h2>
            <p className="text-sm mb-8" style={{ opacity: 0.5 }}>Escala del 0 al 10</p>
            <div className="grid grid-cols-6 gap-2 mb-4">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <button
                  key={n}
                  onClick={() => {
                    setAnswers(a => ({ ...a, [currentBlock.id]: n, [`nps_${currentBlock.id}`]: n }));
                  }}
                  className="aspect-square rounded-xl border-2 font-semibold text-sm transition-all active:scale-95"
                  style={{
                    borderColor: selected === n ? s.accent_color : s.border_color,
                    background: selected === n ? `${s.accent_color}25` : `${s.text_color}08`,
                    color: s.text_color,
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs mb-8" style={{ opacity: 0.5 }}>
              <span>{cfg.low_label || "Muy improbable"}</span>
              <span>{cfg.high_label || "Muy probable"}</span>
            </div>
            <button
              onClick={next}
              disabled={selected === undefined}
              className="w-full py-4 rounded-2xl font-semibold disabled:opacity-40"
              style={{ background: s.accent_color, color: s.bg_color }}>
              Continuar →
            </button>
          </div>
        );
      }

      case "fid_questions": {
        const cfg = currentBlock.config as FidQuestionsConfig;
        const blockAnswers = answers[currentBlock.id] as Record<string, unknown> || {};
        const updateQ = (qId: string, val: unknown) =>
          setAnswers(a => ({ ...a, [currentBlock.id]: { ...(a[currentBlock.id] as Record<string, unknown> || {}), [qId]: val } }));

        return (
          <div className="min-h-screen flex flex-col justify-center p-6"
            style={{ background: s.bg_color, color: s.text_color, fontFamily: s.font_family }}>
            <div className="space-y-6 mb-8">
              {(cfg.questions || []).map(q => (
                <div key={q.id}>
                  <p className="font-semibold mb-3">{q.text}</p>
                  {q.type === "yes_no" && (
                    <div className="grid grid-cols-2 gap-3">
                      {["Sí", "No"].map(v => (
                        <button key={v}
                          onClick={() => updateQ(q.id, v)}
                          className="py-3 rounded-xl border-2 font-medium transition-all"
                          style={{ borderColor: blockAnswers[q.id] === v ? s.accent_color : s.border_color, background: blockAnswers[q.id] === v ? `${s.accent_color}20` : `${s.text_color}08`, color: s.text_color }}>
                          {v}
                        </button>
                      ))}
                    </div>
                  )}
                  {q.type === "multiple_choice" && (
                    <div className="space-y-2">
                      {(q.options || []).map(opt => (
                        <button key={opt}
                          onClick={() => updateQ(q.id, opt)}
                          className="w-full text-left px-4 py-3 rounded-xl border-2 transition-all"
                          style={{ borderColor: blockAnswers[q.id] === opt ? s.accent_color : s.border_color, background: blockAnswers[q.id] === opt ? `${s.accent_color}20` : `${s.text_color}08`, color: s.text_color }}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                  {q.type === "text" && (
                    <textarea
                      rows={3}
                      className="w-full rounded-xl px-4 py-3 text-sm resize-none"
                      style={{ background: `${s.text_color}12`, border: `1px solid ${s.border_color}`, color: s.text_color }}
                      placeholder="Escribe tu respuesta..."
                      value={(blockAnswers[q.id] as string) || ""}
                      onChange={e => updateQ(q.id, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
            <button onClick={next} className="w-full py-4 rounded-2xl font-semibold" style={{ background: s.accent_color, color: s.bg_color }}>
              Continuar →
            </button>
          </div>
        );
      }

      case "fid_open_text": {
        const cfg = currentBlock.config as FidOpenTextConfig;
        const val = (answers[currentBlock.id] as string) || "";
        const maxChars = cfg.max_chars || 500;
        return (
          <div className="min-h-screen flex flex-col justify-center p-6"
            style={{ background: s.bg_color, color: s.text_color, fontFamily: s.font_family }}>
            <h2 className="text-xl font-bold mb-2">{cfg.title || "¿Qué podemos mejorar?"}</h2>
            <p className="text-sm mb-6" style={{ opacity: 0.5 }}>Cuéntanos con tus propias palabras</p>
            <textarea
              rows={6}
              className="w-full rounded-xl px-4 py-3 text-sm resize-none mb-2"
              style={{ background: `${s.text_color}12`, border: `1px solid ${s.border_color}`, color: s.text_color }}
              placeholder={cfg.placeholder || "Cuéntanos tu experiencia..."}
              maxLength={maxChars}
              value={val}
              onChange={e => setAnswers(a => ({ ...a, [currentBlock.id]: e.target.value }))}
            />
            <div className="text-right text-xs mb-8" style={{ opacity: 0.4 }}>{val.length} / {maxChars}</div>
            <button
              onClick={next}
              disabled={cfg.required && !val.trim()}
              className="w-full py-4 rounded-2xl font-semibold disabled:opacity-40"
              style={{ background: s.accent_color, color: s.bg_color }}>
              Continuar →
            </button>
          </div>
        );
      }

      case "fid_capture": {
        const cfg = currentBlock.config as FidCaptureConfig;
        const nameField  = cfg.fields.find(f => f.key === "name");
        const emailField = cfg.fields.find(f => f.key === "email");

        // Validar campos obligatorios
        const canSubmit = !submitting && (
          (!nameField?.enabled || !nameField.required || anonymous || respondentName.trim()) &&
          (!emailField?.enabled || !emailField.required || anonymous || respondentEmail.trim())
        );

        return (
          <div className="min-h-screen flex flex-col justify-center p-6"
            style={{ background: s.bg_color, color: s.text_color, fontFamily: s.font_family }}>
            <h2 className="text-xl font-bold mb-2">Últimos datos</h2>
            <p className="text-sm mb-6" style={{ opacity: 0.5 }}>Completamente opcional</p>

            {cfg.allow_anonymous && (
              <button
                onClick={() => setAnonymous(a => !a)}
                className="w-full text-left px-4 py-3 rounded-xl border-2 mb-4 flex items-center gap-3 transition-all"
                style={{ borderColor: anonymous ? s.accent_color : s.border_color, background: anonymous ? `${s.accent_color}20` : `${s.text_color}08` }}>
                <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: anonymous ? s.accent_color : s.border_color, background: anonymous ? s.accent_color : "transparent" }}>
                  {anonymous && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <span className="text-sm">Responder anónimamente</span>
              </button>
            )}

            {!anonymous && (
              <div className="space-y-4 mb-6">
                {nameField?.enabled && (
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ opacity: 0.6 }}>
                      {nameField.label}{nameField.required ? " *" : ""}
                    </label>
                    <input
                      className="w-full rounded-xl px-4 py-3 text-sm"
                      style={{ background: `${s.text_color}12`, border: `1px solid ${s.border_color}`, color: s.text_color }}
                      placeholder="Tu nombre"
                      value={respondentName}
                      onChange={e => setRespondentName(e.target.value)}
                    />
                  </div>
                )}
                {emailField?.enabled && (
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ opacity: 0.6 }}>
                      {emailField.label}{emailField.required ? " *" : ""}
                    </label>
                    <input
                      type="email"
                      className="w-full rounded-xl px-4 py-3 text-sm"
                      style={{ background: `${s.text_color}12`, border: `1px solid ${s.border_color}`, color: s.text_color }}
                      placeholder="email@ejemplo.com"
                      value={respondentEmail}
                      onChange={e => setRespondentEmail(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            {submitError && <p className="text-red-400 text-xs mb-3">{submitError}</p>}

            <button
              onClick={submitFeedback}
              disabled={!canSubmit}
              className="w-full py-4 rounded-2xl font-semibold disabled:opacity-50 transition-opacity"
              style={{ background: s.accent_color, color: s.bg_color }}>
              {submitting ? "Enviando..." : "Enviar valoración"}
            </button>
            <p className="text-xs text-center mt-3" style={{ opacity: 0.3 }}>
              Tus datos se tratan conforme a nuestra política de privacidad.
            </p>
          </div>
        );
      }

      case "fid_thank_you": {
        const cfg = currentBlock.config as FidThankYouConfig;
        const waUrl = cfg.whatsapp_phone
          ? `https://wa.me/${cfg.whatsapp_phone.replace(/\D/g, "")}${cfg.whatsapp_text ? `?text=${encodeURIComponent(cfg.whatsapp_text)}` : ""}`
          : null;
        return (
          <div className="min-h-screen flex flex-col items-center justify-center text-center p-6"
            style={{ background: s.bg_color, color: s.text_color, fontFamily: s.font_family }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
              style={{ background: `${s.accent_color}25`, border: `2px solid ${s.accent_color}50` }}>
              <svg className="w-8 h-8" style={{ color: s.accent_color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">{cfg.title || "¡Gracias!"}</h2>
            <p className="text-sm mb-8 max-w-xs" style={{ opacity: 0.6 }}>{cfg.message}</p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              {cfg.cta_text && cfg.cta_url && (
                <a
                  href={cfg.cta_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 rounded-2xl font-semibold text-sm active:scale-95 transition-transform text-center"
                  style={{ background: s.accent_color, color: s.bg_color }}
                >
                  {cfg.cta_text}
                </a>
              )}
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
    <div className="relative">
      <ProgressBar
        current={currentBlockIndex}
        total={sortedBlocks.length}
        accentColor={s.accent_color}
      />
      {renderBlock()}
    </div>
  );
}
