"use client";

import { useRouter } from "next/navigation";
import { useContextoSection } from "../useContextoSection";
import type { ContextoExpectativas } from "@/types/contexto";

const DEFAULT: ContextoExpectativas = {
  visitors: "",
  keychains: "",
  contacts_target: "",
  conversion_rate: "",
};

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--brand-1)] transition-colors";

function FunnelViz({
  visitors,
  keychains,
  contacts,
}: {
  visitors: number;
  keychains: number;
  contacts: number;
}) {
  const rows = [
    { label: "Visitantes esperados", value: visitors, color: "var(--brand-1)", width: "100%" },
    { label: "Llaveros a distribuir", value: keychains, color: "var(--brand-1)", width: visitors > 0 ? `${Math.min(100, (keychains / visitors) * 100)}%` : "0%" },
    { label: "Contactos objetivo", value: contacts, color: "var(--brand-4)", width: visitors > 0 ? `${Math.min(100, (contacts / visitors) * 100)}%` : "0%" },
  ];

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--brand-1)" }}>
        Embudo estimado
      </p>
      {rows.map((row) => (
        <div key={row.label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[var(--foreground)]/60">{row.label}</span>
            <span className="font-semibold">{row.value > 0 ? row.value : "—"}</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: row.width, background: row.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ExpectativasPage() {
  const router = useRouter();
  const { data, setData, loading, saving, saved, save } = useContextoSection<ContextoExpectativas>(
    "expectativas",
    DEFAULT
  );

  const set = (key: keyof ContextoExpectativas) => (value: string) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const visitors = parseInt(data.visitors) || 0;
  const keychains = parseInt(data.keychains) || 0;
  const contacts = parseInt(data.contacts_target) || 0;

  const recommendedKeychains = visitors > 0 ? Math.round(visitors * 0.675) : 0;
  const conservativeContacts = keychains > 0 ? Math.round(keychains * 0.4) : 0;
  const optimisticContacts = keychains > 0 ? Math.round(keychains * 0.6) : 0;

  const showFunnel = visitors > 0 || keychains > 0 || contacts > 0;

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
            Pantalla 5 de 6
          </div>
          <h1 className="text-2xl font-bold">Expectativas de captacion</h1>
          <p className="text-sm text-[var(--foreground)]/60 mt-1">
            Cuantos contactos quieres conseguir por evento.
          </p>
        </div>

        {showFunnel && (
          <FunnelViz visitors={visitors} keychains={keychains} contacts={contacts} />
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70 mb-1.5">
              Cuantos visitantes esperas que pasen por tu stand en un evento tipico?
            </label>
            <input
              type="number"
              min="0"
              className={inputClass}
              placeholder="Ej: 200"
              value={data.visitors}
              onChange={(e) => set("visitors")(e.target.value)}
            />
            <p className="text-xs text-[var(--foreground)]/50 mt-1">
              El total de personas que podrian pararse contigo. Es el techo de tu oportunidad.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70 mb-1.5">
              Cuantos llaveros estimas que vas a distribuir?
            </label>
            <input
              type="number"
              min="0"
              className={inputClass}
              placeholder="Ej: 150"
              value={data.keychains}
              onChange={(e) => set("keychains")(e.target.value)}
            />
            {visitors > 0 && (
              <div className="mt-2 rounded-lg p-3 border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)]/60">
                Con {visitors} visitantes esperados, para maximizar contactos deberias entregar al menos el 65-70%.
                <br />
                <span className="font-semibold" style={{ color: "var(--brand-1)" }}>
                  Recomendacion: {recommendedKeychains} llaveros
                </span>
              </div>
            )}
            <p className="text-xs text-[var(--foreground)]/50 mt-1">
              Cada llavero no entregado es un contacto que no puedes captar.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70 mb-1.5">
              Cuantos contactos quieres conseguir?
            </label>
            <input
              type="number"
              min="0"
              className={inputClass}
              placeholder="Ej: 80"
              value={data.contacts_target}
              onChange={(e) => set("contacts_target")(e.target.value)}
            />
            {keychains > 0 && (
              <div className="mt-2 rounded-lg p-3 border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)]/60">
                Con {keychains} llaveros distribuidos (tasa 40-60%):
                <br />
                Estimacion conservadora: <span className="font-semibold">{conservativeContacts} contactos</span>
                <br />
                Estimacion optimista: <span className="font-semibold">{optimisticContacts} contactos</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70 mb-1.5">
              Cuantos de esos contactos esperas que avancen a cliente? (opcional)
            </label>
            <input
              type="number"
              min="0"
              className={inputClass}
              placeholder="Ej: 10"
              value={data.conversion_rate}
              onChange={(e) => set("conversion_rate")(e.target.value)}
            />
            <p className="text-xs text-[var(--foreground)]/50 mt-1">
              Si no lo sabes todavia, dejalo en blanco. Lo ajustaras despues de tu primera feria.
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
