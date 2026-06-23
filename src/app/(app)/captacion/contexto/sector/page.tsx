"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useContextoSection } from "../useContextoSection";
import type { ContextoSector } from "@/types/contexto";

const DEFAULT: ContextoSector = { sector: "", event_types: [], geography: "" };

const SECTORS = [
  "Salud y bienestar",
  "Inmobiliario",
  "Legal y financiero",
  "Educacion",
  "Hosteleria",
  "Comercio y retail",
  "Servicios profesionales",
  "Tecnologia",
];

const EVENT_TYPES = [
  "Ferias sectoriales",
  "Congresos profesionales",
  "Eventos de barrio o locales",
  "Asociaciones empresariales",
  "Eventos deportivos",
  "Centros comerciales / pop-ups",
  "Online / webinars",
];

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--brand-1)] transition-colors";

export default function SectorPage() {
  const router = useRouter();
  const { data, setData, loading, saving, saved, save } = useContextoSection<ContextoSector>(
    "sector",
    DEFAULT
  );
  const [otherSector, setOtherSector] = useState("");
  const [otherEvent, setOtherEvent] = useState("");

  const set = <K extends keyof ContextoSector>(key: K, value: ContextoSector[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const selectSector = (s: string) => {
    set("sector", s);
  };

  const toggleEventType = (evt: string) => {
    const next = data.event_types.includes(evt)
      ? data.event_types.filter((e) => e !== evt)
      : [...data.event_types, evt];
    set("event_types", next);
  };

  const toggleOtherEvent = () => {
    const label = `Otro: ${otherEvent}`;
    const hasOther = data.event_types.some((e) => e.startsWith("Otro:"));
    if (hasOther) {
      set("event_types", data.event_types.filter((e) => !e.startsWith("Otro:")));
    } else if (otherEvent.trim()) {
      set("event_types", [...data.event_types, label]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--brand-1)]" />
      </div>
    );
  }

  const isOtherSector = data.sector && !SECTORS.includes(data.sector);

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
            Pantalla 4 de 6
          </div>
          <h1 className="text-2xl font-bold">Sector y tipo de eventos</h1>
          <p className="text-sm text-[var(--foreground)]/60 mt-1">
            Donde y como haces captacion.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70 mb-2">
              En que sector trabajas?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SECTORS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => selectSector(s)}
                  className={`py-2 px-3 rounded-lg border text-sm text-left font-medium transition-all ${
                    data.sector === s
                      ? "border-[var(--brand-1)] bg-[var(--brand-1)]/10 text-[var(--brand-1)]"
                      : "border-[var(--border)] text-[var(--foreground)]/60 hover:border-[var(--brand-1)]/40"
                  }`}
                >
                  {s}
                </button>
              ))}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => isOtherSector ? selectSector("") : selectSector(otherSector || "Otro")}
                  className={`w-full py-2 px-3 rounded-lg border text-sm text-left font-medium transition-all ${
                    isOtherSector
                      ? "border-[var(--brand-1)] bg-[var(--brand-1)]/10 text-[var(--brand-1)]"
                      : "border-[var(--border)] text-[var(--foreground)]/60 hover:border-[var(--brand-1)]/40"
                  }`}
                >
                  Otro
                </button>
              </div>
            </div>
            {(isOtherSector || data.sector === "Otro") && (
              <input
                type="text"
                className={`${inputClass} mt-2`}
                placeholder="Especifica tu sector..."
                value={isOtherSector ? data.sector : otherSector}
                onChange={(e) => {
                  setOtherSector(e.target.value);
                  set("sector", e.target.value);
                }}
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70 mb-2">
              En que tipo de eventos sueles estar?
            </label>
            <div className="space-y-2">
              {EVENT_TYPES.map((evt) => (
                <label key={evt} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.event_types.includes(evt)}
                    onChange={() => toggleEventType(evt)}
                    className="rounded border-[var(--border)] accent-[var(--brand-1)]"
                  />
                  <span className="text-sm">{evt}</span>
                </label>
              ))}
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={data.event_types.some((e) => e.startsWith("Otro:"))}
                  onChange={toggleOtherEvent}
                  className="rounded border-[var(--border)] accent-[var(--brand-1)]"
                />
                <input
                  type="text"
                  className="flex-1 rounded-lg border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--brand-1)] transition-colors"
                  placeholder="Otro..."
                  value={otherEvent}
                  onChange={(e) => setOtherEvent(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70 mb-1.5">
              A que zona te diriges?
            </label>
            <input
              type="text"
              className={inputClass}
              placeholder="Ej: Madrid capital, Andalucia, toda Espana"
              value={data.geography}
              onChange={(e) => set("geography", e.target.value)}
            />
            <p className="text-xs text-[var(--foreground)]/50 mt-1">
              Ciudad, region o si operas a nivel nacional u online.
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
