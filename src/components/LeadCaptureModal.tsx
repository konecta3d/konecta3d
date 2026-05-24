"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  slug: string;
  leadMagnetId: string;
  ctaText?: string;
  /** Color de acento de la landing para el botón de envío */
  accentColor?: string;
}

export default function LeadCaptureModal({
  isOpen, onClose, businessId, slug, leadMagnetId, ctaText, accentColor = "#39a1a9",
}: Props) {
  const router = useRouter();
  const [name, setName]       = useState("");
  const [phone, setPhone]     = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() && !phone.trim()) {
      setError("Introduce tu nombre o teléfono para continuar.");
      return;
    }
    if (!consent) {
      setError("Debes aceptar la política de privacidad para continuar.");
      return;
    }
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId,
        name:   name.trim()  || undefined,
        phone:  phone.trim() || undefined,
        source: `lead_magnet_${leadMagnetId}`,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Error al enviar. Inténtalo de nuevo.");
      setSubmitting(false);
      return;
    }

    // Redirigir a la página de gracias con el lead magnet
    const params = new URLSearchParams({
      lm:   leadMagnetId,
      name: name.trim() || "",
    });
    router.push(`/l/${slug}/gracias?${params.toString()}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden"
        style={{ background: "#111214", border: "1px solid rgba(255,255,255,0.1)" }}>

        {/* Handle móvil */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        <div className="px-6 pt-4 pb-8">
          {/* Cabecera */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">
                {ctaText ? `Acceder a "${ctaText}"` : "Acceder al recurso"}
              </h2>
              <p className="text-sm text-white/50 mt-1">
                Deja tus datos y te lo entregamos al momento
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white/70 text-2xl leading-none ml-4 mt-0.5 transition-colors"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5 font-medium">
                Nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-white/30 outline-none transition-colors"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                onFocus={e => (e.currentTarget.style.borderColor = accentColor)}
                onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
              />
            </div>

            <div>
              <label className="block text-xs text-white/50 mb-1.5 font-medium">
                Teléfono
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+34 600 000 000"
                className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-white/30 outline-none transition-colors"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                onFocus={e => (e.currentTarget.style.borderColor = accentColor)}
                onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
              />
            </div>

            {/* Checkbox de consentimiento */}
            <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
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
                    background: consent ? accentColor : "rgba(255,255,255,0.07)",
                    border: `2px solid ${consent ? accentColor : "rgba(255,255,255,0.18)"}`,
                  }}
                >
                  {consent && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-[11px] text-white/45 leading-relaxed">
                He leído y acepto la{" "}
                <a
                  href="#"
                  onClick={e => e.preventDefault()}
                  className="underline underline-offset-2"
                  style={{ color: accentColor, opacity: 1 }}
                >
                  política de privacidad
                </a>
                {" "}y consiento el tratamiento de mis datos. *
              </span>
            </label>

            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting || !consent}
              className="w-full py-4 rounded-xl text-sm font-bold transition-opacity disabled:opacity-40 mt-1"
              style={{ background: accentColor, color: "#fff" }}
            >
              {submitting ? "Enviando..." : "Recibir recurso"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
