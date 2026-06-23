"use client";

import { useRouter } from "next/navigation";
import { useContextoSection } from "../useContextoSection";
import type { ContextoIdentidad } from "@/types/contexto";

const DEFAULT: ContextoIdentidad = {
  what_you_do: "",
  what_you_sell: "",
  client_result: "",
  differentiator: "",
  credibility: "",
};

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--brand-1)] transition-colors resize-none";

export default function IdentidadPage() {
  const router = useRouter();
  const { data, setData, loading, saving, saved, save } = useContextoSection<ContextoIdentidad>(
    "identidad",
    DEFAULT
  );

  const set = (key: keyof ContextoIdentidad) => (value: string) =>
    setData((prev) => ({ ...prev, [key]: value }));

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
            Pantalla 1 de 6
          </div>
          <h1 className="text-2xl font-bold">Identidad del negocio</h1>
          <p className="text-sm text-[var(--foreground)]/60 mt-1">
            Qué haces, qué resultado produces y qué te diferencia.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70 mb-1.5">
              A que te dedicas exactamente?
            </label>
            <textarea
              rows={2}
              className={inputClass}
              placeholder="Ej: Recupero lesiones deportivas para que no pierdas entrenamientos"
              value={data.what_you_do}
              onChange={(e) => set("what_you_do")(e.target.value)}
            />
            <p className="text-xs text-[var(--foreground)]/50 mt-1">
              No el nombre del sector — lo concreto que haces. "Fisioterapeuta" no. "Recupero lesiones deportivas para que no pierdas entrenamientos" si.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70 mb-1.5">
              Que servicio o producto ofreces?
            </label>
            <textarea
              rows={2}
              className={inputClass}
              placeholder="Ej: Sesiones presenciales de recuperacion post-lesion"
              value={data.what_you_sell}
              onChange={(e) => set("what_you_sell")(e.target.value)}
            />
            <p className="text-xs text-[var(--foreground)]/50 mt-1">
              Lo especifico que entregas: sesiones, consultas, productos, proyectos.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70 mb-1.5">
              Que resultado concreto consigue tu cliente?
            </label>
            <textarea
              rows={3}
              className={inputClass}
              placeholder="Ej: Mi cliente pasa de tener dolor cronico a volver al deporte en 3 semanas"
              value={data.client_result}
              onChange={(e) => set("client_result")(e.target.value)}
            />
            <p className="text-xs text-[var(--foreground)]/50 mt-1">
              Completa: Mi cliente pasa de ___ a ___ en ___. Es el argumento mas potente que tienes.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70 mb-1.5">
              Que te diferencia de otros que hacen lo mismo?
            </label>
            <textarea
              rows={2}
              className={inputClass}
              placeholder="Ej: Protocolo propio de recuperacion acelerada, atencion en 24h"
              value={data.differentiator}
              onChange={(e) => set("differentiator")(e.target.value)}
            />
            <p className="text-xs text-[var(--foreground)]/50 mt-1">
              No "calidad y profesionalidad". Algo que solo tu haces o como lo haces diferente.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70 mb-1.5">
              Que prueba de credibilidad tienes?
            </label>
            <textarea
              rows={2}
              className={inputClass}
              placeholder="Ej: 12 anos de experiencia, mas de 400 pacientes, certificacion en fisioterapia deportiva"
              value={data.credibility}
              onChange={(e) => set("credibility")(e.target.value)}
            />
            <p className="text-xs text-[var(--foreground)]/50 mt-1">
              Anos de experiencia, numero de casos, certificaciones, resultados medibles.
            </p>
          </div>
        </div>
      </div>

      <div
        className="sticky bottom-0 border-t border-[var(--border)] px-4 py-3 flex justify-end"
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
