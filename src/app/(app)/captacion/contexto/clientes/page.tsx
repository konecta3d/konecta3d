"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useContextoSection } from "../useContextoSection";
import type { ContextoClientes, CIProfile, CIMotivator } from "@/types/contexto";

const DEFAULT: ContextoClientes = { profiles: [] };

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--brand-1)] transition-colors";
const textareaClass = inputClass + " resize-none";

function newProfile(slot: number): CIProfile {
  return {
    id: `ci${slot + 1}`,
    name: "",
    description: "",
    contexts: [],
    motivators: [],
    action_trigger: "",
  };
}

function newMotivator(): CIMotivator {
  return {
    id: crypto.randomUUID(),
    type: "problema",
    text: "",
    own_words: "",
    urgency: "media",
  };
}

const CONTEXT_OPTIONS = [
  "En ferias y eventos del sector",
  "Busca online soluciones",
  "Le llegan por recomendacion",
  "En redes sociales",
];

const MOTIVATOR_PLACEHOLDER: Record<CIMotivator["type"], string> = {
  problema: "Ej: Dolores de espalda cronicos que no mejoran",
  necesidad: "Ej: Saber si su hijo necesita ortodoncia",
  deseo: "Ej: Conseguir una sonrisa que no le de verguenza",
};

function MotivatorCard({
  motivator,
  onChange,
  onRemove,
}: {
  motivator: CIMotivator;
  onChange: (m: CIMotivator) => void;
  onRemove: () => void;
}) {
  const set = <K extends keyof CIMotivator>(key: K, value: CIMotivator[K]) =>
    onChange({ ...motivator, [key]: value });

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 space-y-3">
      <div className="flex gap-2">
        {(["problema", "necesidad", "deseo"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => set("type", t)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize ${
              motivator.type === t
                ? "border-[var(--brand-1)] bg-[var(--brand-1)]/10 text-[var(--brand-1)]"
                : "border-[var(--border)] text-[var(--foreground)]/50 hover:border-[var(--brand-1)]/30"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70 mb-1">
          Cual es?
        </label>
        <input
          type="text"
          className={inputClass}
          placeholder={MOTIVATOR_PLACEHOLDER[motivator.type]}
          value={motivator.text}
          onChange={(e) => set("text", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70 mb-1">
          Como lo describiria el con sus propias palabras?
        </label>
        <textarea
          rows={2}
          className={textareaClass}
          placeholder="Sus palabras, no las tuyas"
          value={motivator.own_words}
          onChange={(e) => set("own_words", e.target.value)}
        />
        <p className="text-xs text-[var(--foreground)]/50 mt-1">
          Sus palabras, no las tuyas. Es lo que usara el copy.
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70 mb-1">
          Urgencia
        </label>
        <div className="flex gap-2">
          {(["baja", "media", "alta"] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => set("urgency", u)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                motivator.urgency === u
                  ? "border-[var(--brand-1)] bg-[var(--brand-1)]/10 text-[var(--brand-1)]"
                  : "border-[var(--border)] text-[var(--foreground)]/50 hover:border-[var(--brand-1)]/30"
              }`}
            >
              {u === "baja" ? "Baja" : u === "media" ? "Media" : "Alta — lo quiere ya"}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="text-xs text-red-400/70 hover:text-red-400 transition-colors"
      >
        Eliminar este motivador
      </button>
    </div>
  );
}

function ProfileForm({
  profile,
  onChange,
}: {
  profile: CIProfile;
  onChange: (p: CIProfile) => void;
}) {
  const [otherContext, setOtherContext] = useState("");

  const set = <K extends keyof CIProfile>(key: K, value: CIProfile[K]) =>
    onChange({ ...profile, [key]: value });

  const toggleContext = (ctx: string) => {
    const next = profile.contexts.includes(ctx)
      ? profile.contexts.filter((c) => c !== ctx)
      : [...profile.contexts, ctx];
    set("contexts", next);
  };

  const toggleOther = () => {
    const label = `Otro: ${otherContext}`;
    const hasOther = profile.contexts.some((c) => c.startsWith("Otro:"));
    if (hasOther) {
      set("contexts", profile.contexts.filter((c) => !c.startsWith("Otro:")));
    } else if (otherContext.trim()) {
      set("contexts", [...profile.contexts, label]);
    }
  };

  const addMotivator = () => {
    if (profile.motivators.length >= 3) return;
    set("motivators", [...profile.motivators, newMotivator()]);
  };

  const updateMotivator = (idx: number, m: CIMotivator) => {
    const next = [...profile.motivators];
    next[idx] = m;
    set("motivators", next);
  };

  const removeMotivator = (idx: number) => {
    set("motivators", profile.motivators.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--brand-1)" }}>
          A — Identificacion
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70 mb-1.5">
              Nombre del perfil
            </label>
            <input
              type="text"
              className={inputClass}
              placeholder="Ej: Inversor inmobiliario, Padre con hijo deportista..."
              value={profile.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70 mb-1.5">
              Quien es?
            </label>
            <textarea
              rows={2}
              className={textareaClass}
              placeholder="Descripcion concreta: profesion, edad aproximada, contexto de vida"
              value={profile.description}
              onChange={(e) => set("description", e.target.value)}
            />
            <p className="text-xs text-[var(--foreground)]/50 mt-1">
              Descripcion concreta: profesion, edad aproximada, contexto de vida.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70 mb-2">
              En que contexto aparece?
            </label>
            <div className="space-y-2">
              {CONTEXT_OPTIONS.map((opt) => (
                <label key={opt} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.contexts.includes(opt)}
                    onChange={() => toggleContext(opt)}
                    className="rounded border-[var(--border)] accent-[var(--brand-1)]"
                  />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={profile.contexts.some((c) => c.startsWith("Otro:"))}
                  onChange={toggleOther}
                  className="rounded border-[var(--border)] accent-[var(--brand-1)]"
                />
                <input
                  type="text"
                  className="flex-1 rounded-lg border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--brand-1)] transition-colors"
                  placeholder="Otro..."
                  value={otherContext}
                  onChange={(e) => setOtherContext(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--brand-1)" }}>
          B — Lo que le mueve
        </p>
        <p className="text-xs text-[var(--foreground)]/50 mb-3">
          Define hasta 3 problemas, necesidades o deseos. Cuanto mas concreto, mas preciso sera el copy.
        </p>
        <div className="space-y-3">
          {profile.motivators.map((m, idx) => (
            <MotivatorCard
              key={m.id}
              motivator={m}
              onChange={(updated) => updateMotivator(idx, updated)}
              onRemove={() => removeMotivator(idx)}
            />
          ))}
          {profile.motivators.length < 3 && (
            <button
              type="button"
              onClick={addMotivator}
              className="w-full py-3 rounded-xl border border-dashed border-[var(--border)] text-sm text-[var(--foreground)]/50 hover:border-[var(--brand-1)]/40 hover:text-[var(--foreground)] transition-colors"
            >
              + Anadir motivador
            </button>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--brand-1)" }}>
          C — El detonante
        </p>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70 mb-1.5">
            Que lo haria actuar hoy?
          </label>
          <textarea
            rows={2}
            className={textareaClass}
            placeholder="Ej: Que alguien le confirme que su lesion no necesita cirugia"
            value={profile.action_trigger}
            onChange={(e) => set("action_trigger", e.target.value)}
          />
          <p className="text-xs text-[var(--foreground)]/50 mt-1">
            Que situacion, frase o promesa haria que este CI dejara sus datos sin dudar? El momento emocional, no el recurso.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ClientesPage() {
  const router = useRouter();
  const { data, setData, loading, saving, saved, save } = useContextoSection<ContextoClientes>(
    "clientes",
    DEFAULT
  );
  const [activeTab, setActiveTab] = useState(0);

  const getProfile = (slot: number): CIProfile | null => data.profiles[slot] ?? null;

  const initProfile = (slot: number) => {
    const next = [...data.profiles];
    while (next.length <= slot) next.push(null as unknown as CIProfile);
    next[slot] = newProfile(slot);
    setData({ profiles: next });
  };

  const updateProfile = (slot: number, p: CIProfile) => {
    const next = [...data.profiles];
    while (next.length <= slot) next.push(null as unknown as CIProfile);
    next[slot] = p;
    setData({ profiles: next });
  };

  const tab1Enabled = !!(getProfile(0)?.name);
  const tab2Enabled = !!(getProfile(1)?.name);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--brand-1)]" />
      </div>
    );
  }

  const activeProfile = getProfile(activeTab);

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
            Pantalla 2 de 6
          </div>
          <h1 className="text-2xl font-bold">Perfiles de Cliente Ideal</h1>
          <p className="text-sm text-[var(--foreground)]/60 mt-1">
            Hasta 3 perfiles con sus problemas, necesidades y deseos.
          </p>
        </div>

        <div className="flex gap-2 border-b border-[var(--border)] pb-0">
          {["CI 1", "CI 2", "CI 3"].map((label, i) => {
            const disabled = i === 1 ? !tab1Enabled : i === 2 ? !tab2Enabled : false;
            return (
              <button
                key={label}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setActiveTab(i)}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px ${
                  activeTab === i
                    ? "border-[var(--brand-1)] text-[var(--brand-1)]"
                    : disabled
                    ? "border-transparent text-[var(--foreground)]/25 cursor-not-allowed"
                    : "border-transparent text-[var(--foreground)]/50 hover:text-[var(--foreground)]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {activeProfile === null ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center">
            <p className="text-sm text-[var(--foreground)]/50 mb-4">
              Aun no has definido este perfil de cliente ideal.
            </p>
            <button
              type="button"
              onClick={() => initProfile(activeTab)}
              className="px-5 py-2.5 rounded-full text-sm font-semibold"
              style={{ background: "var(--brand-1)", color: "white" }}
            >
              Activar perfil
            </button>
          </div>
        ) : (
          <ProfileForm
            profile={activeProfile}
            onChange={(p) => updateProfile(activeTab, p)}
          />
        )}
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
