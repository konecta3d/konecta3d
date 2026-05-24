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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() && !phone.trim()) {
      setError("Introduce tu nombre o teléfono para continuar.");
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

            {error && (
              <p className="text-xs text-red-400 pt-1">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-xl text-sm font-bold transition-opacity disabled:opacity-50 mt-2"
              style={{ background: accentColor, color: "#fff" }}
            >
              {submitting ? "Enviando..." : "Recibir recurso"}
            </button>

            <p className="text-[11px] text-white/25 text-center pt-1">
              Tus datos no se compartirán con terceros
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
