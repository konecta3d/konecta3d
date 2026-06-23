"use client";

import { useRouter } from "next/navigation";
import { useContextoSection } from "../useContextoSection";
import type { ContextoTono } from "@/types/contexto";

const DEFAULT: ContextoTono = {
  style: "",
  tuteo: "tuteo",
  own_words: "",
  avoid_words: "",
  ten_second_phrase: "",
};

const STYLES = [
  { value: "cercano", label: "Cercano y directo", desc: '"Como un amigo experto"' },
  { value: "profesional", label: "Profesional y serio", desc: '"Autoridad sin distancia"' },
  { value: "tecnico", label: "Tecnico y experto", desc: '"Para un publico especializado"' },
  { value: "divulgativo", label: "Educativo", desc: '"Ensenas mientras convences"' },
];

const textareaClass =
  "w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--brand-1)] transition-colors resize-none";

export default function TonoPage() {
  const router = useRouter();
  const { data, setData, loading, saving, saved, save } = useContextoSection<ContextoTono>(
    "tono",
    DEFAULT
  );

  const set = <K extends keyof ContextoTono>(key: K, value: ContextoTono[K]) =>
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
            Pantalla 3 de 6
          </div>
          <h1 className="text-2xl font-bold">Tono y comunicacion</h1>
          <p className="text-sm text-[var(--foreground)]/60 mt-1">
            Como hablas con tus clientes.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70 mb-2">
              Estilo de comunicacion
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => set("style", s.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    data.style === s.value
                      ? "border-[var(--brand-1)] bg-[var(--brand-1)]/10"
                      : "border-[var(--border)] hover:border-[var(--brand-1)]/40"
                  }`}
                >
                  <div className="text-sm font-semibold">{s.label}</div>
                  <div className="text-xs text-[var(--foreground)]/50 mt-0.5">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70 mb-2">
              Tuteas o usas usted?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => set("tuteo", "tuteo")}
                className={`py-3 px-4 rounded-xl border text-left transition-all ${
                  data.tuteo === "tuteo"
                    ? "border-[var(--brand-1)] bg-[var(--brand-1)]/10"
                    : "border-[var(--border)] hover:border-[var(--brand-1)]/40"
                }`}
              >
                <div className="text-sm font-semibold">Tuteo</div>
                <div className="text-xs text-[var(--foreground)]/50 mt-0.5">"Tu puedes..."</div>
              </button>
              <button
                type="button"
                onClick={() => set("tuteo", "usted")}
                className={`py-3 px-4 rounded-xl border text-left transition-all ${
                  data.tuteo === "usted"
                    ? "border-[var(--brand-1)] bg-[var(--brand-1)]/10"
                    : "border-[var(--border)] hover:border-[var(--brand-1)]/40"
                }`}
              >
                <div className="text-sm font-semibold">Usted</div>
                <div className="text-xs text-[var(--foreground)]/50 mt-0.5">"Usted puede..."</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70 mb-1.5">
              Que palabras o frases te definen?
            </label>
            <textarea
              rows={3}
              className={textareaClass}
              placeholder="3-5 palabras o expresiones que usas habitualmente con tus clientes."
              value={data.own_words}
              onChange={(e) => set("own_words", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70 mb-1.5">
              Que palabras o frases quieres evitar?
            </label>
            <textarea
              rows={3}
              className={textareaClass}
              placeholder="Tecnicismos, lenguaje corporativo, palabras que nunca usarias."
              value={data.avoid_words}
              onChange={(e) => set("avoid_words", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70 mb-1.5">
              Como le explicarias lo que haces a alguien en 10 segundos?
            </label>
            <textarea
              rows={2}
              className={textareaClass}
              placeholder="La frase que usarias en un pasillo. No la descripcion tecnica."
              value={data.ten_second_phrase}
              onChange={(e) => set("ten_second_phrase", e.target.value)}
            />
            <p className="text-xs text-[var(--foreground)]/50 mt-1">
              Esta frase puede aparecer como hook en tus formularios.
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
