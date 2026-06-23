"use client";

import { useRouter } from "next/navigation";
import { useContextoSection } from "../useContextoSection";
import type { ContextoSeguimiento } from "@/types/contexto";

const DEFAULT: ContextoSeguimiento = {
  channels: [],
  timing: "",
  first_contact_offer: "",
  stand_promise: "",
};

const CHANNELS = [
  "WhatsApp",
  "Llamada telefonica",
  "Email",
  "Instagram DM",
  "Otro",
];

const TIMING_OPTIONS = [
  "El mismo dia al terminar",
  "Al dia siguiente por la manana",
  "En los 2-3 dias siguientes",
  "Durante la semana posterior",
];

const textareaClass =
  "w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--brand-1)] transition-colors resize-none";

export default function SeguimientoPage() {
  const router = useRouter();
  const { data, setData, loading, saving, saved, save } = useContextoSection<ContextoSeguimiento>(
    "seguimiento",
    DEFAULT
  );

  const set = <K extends keyof ContextoSeguimiento>(key: K, value: ContextoSeguimiento[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const toggleChannel = (ch: string) => {
    const next = data.channels.includes(ch)
      ? data.channels.filter((c) => c !== ch)
      : [...data.channels, ch];
    set("channels", next);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--brand-1)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="max-w-2xl mx-auto w-full flex-1 px-4 py-6 space-y-6 pb-28">
        <div>
          <button
            type="button"
            onClick={() => router.push("/captacion/contexto")}
            className="text-sm text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors mb-4 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Perfil
          </button>
          <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--brand-1)" }}>
            Pantalla 6 de 6
          </div>
          <h1 className="text-2xl font-bold">Seguimiento post-captacion</h1>
          <p className="text-sm text-[var(--foreground)]/60 mt-1">
            Que pasa despues de captar el dato.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70 mb-2">
              Por que canal contactas primero?
            </label>
            <div className="space-y-2">
              {CHANNELS.map((ch) => (
                <label key={ch} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.channels.includes(ch)}
                    onChange={() => toggleChannel(ch)}
                    className="rounded border-[var(--border)] accent-[var(--brand-1)]"
                  />
                  <span className="text-sm">{ch}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-[var(--foreground)]/50 mt-2">
              Elige el que mas rapido puedes atender. Si tardas mas de 24h en responder, ese no es tu canal prioritario.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70 mb-2">
              Cuando contactas despues del evento?
            </label>
            <div className="space-y-2">
              {TIMING_OPTIONS.map((opt) => (
                <label key={opt} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="timing"
                    checked={data.timing === opt}
                    onChange={() => set("timing", opt)}
                    className="accent-[var(--brand-1)]"
                  />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70 mb-1.5">
              Que le ofreces en ese primer contacto?
            </label>
            <textarea
              rows={3}
              className={textareaClass}
              placeholder="El recurso prometido + algo mas. Ej: el PDF + una pregunta que abre conversacion."
              value={data.first_contact_offer}
              onChange={(e) => set("first_contact_offer", e.target.value)}
            />
            <p className="text-xs text-[var(--foreground)]/50 mt-1">
              No solo el recurso. Que mas aportas en ese primer mensaje?
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70 mb-1.5">
              Que le dices en la feria sobre cuando le vas a contactar?
            </label>
            <textarea
              rows={2}
              className={textareaClass}
              placeholder="Ej: 'Te escribo esta tarde con el informe'"
              value={data.stand_promise}
              onChange={(e) => set("stand_promise", e.target.value)}
            />
            <p className="text-xs text-[var(--foreground)]/50 mt-1">
              La promesa exacta que haces mientras escanea el llavero. Puede aparecer en la pantalla de confirmacion del formulario.
            </p>
          </div>
        </div>
      </div>

      <div
        className="sticky bottom-0 border-t border-[var(--border)] px-4 py-3"
        style={{ background: "var(--background)" }}
      >
        <div className="max-w-2xl w-full mx-auto flex justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={() => save()}
            className="px-6 py-2.5 rounded-full text-sm font-semibold disabled:opacity-60 transition-opacity hover:opacity-90"
            style={{ background: "var(--brand-1)", color: "white" }}
          >
            {saving ? "Guardando..." : saved ? "Guardado" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
