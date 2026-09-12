"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toEmbedUrl, isDirectVideo } from "@/lib/video-embed";

// ─── Types ────────────────────────────────────────────────────────────────────

type Context = "landing" | "resources";
type Stage = "contexto" | "primeros-pasos" | "optimizacion" | "maestria";

interface Step {
  id: string;
  context: Context;
  stage: Stage;
  step_order: number;
  title: string;
  video_url: string | null;
  video_enabled: boolean | null;
  active: boolean;
}

const CONTEXT_LABELS: Record<Context, string> = {
  landing: "Editor de Landing",
  resources: "Wizard de Recursos",
};

const STAGE_LABELS: Record<Stage, string> = {
  "contexto": "Antes de empezar",
  "primeros-pasos": "Primeros pasos",
  "optimizacion": "Optimización",
  "maestria": "Estrategia avanzada",
};

const STAGE_ORDER: Stage[] = ["contexto", "primeros-pasos", "optimizacion", "maestria"];

// ─── Página ─────────────────────────────────────────────────────────────────

export default function VideosTutorialesAdmin() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [activeContext, setActiveContext] = useState<Context>("landing");
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("onboarding_steps")
      .select("id, context, stage, step_order, title, video_url, video_enabled, active")
      .order("context")
      .order("stage")
      .order("step_order");
    if (error) showToast("Error cargando pasos: " + error.message);
    else setSteps((data as Step[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveVideo = async (step: Step) => {
    const next = (drafts[step.id] ?? step.video_url ?? "").trim();
    const current = (step.video_url ?? "").trim();
    if (next === current) return; // sin cambios
    setSavingId(step.id);
    const { error } = await supabase
      .from("onboarding_steps")
      .update({ video_url: next || null, updated_at: new Date().toISOString() })
      .eq("id", step.id);
    setSavingId(null);
    if (error) {
      showToast("Error al guardar: " + error.message);
    } else {
      setSteps(prev => prev.map(s => s.id === step.id ? { ...s, video_url: next || null } : s));
      showToast(next ? "Vídeo conectado" : "Vídeo quitado");
    }
  };

  // Activar/desactivar el vídeo de un paso sin borrar el enlace.
  const toggleEnabled = async (step: Step) => {
    const next = !(step.video_enabled !== false);
    const { error } = await supabase
      .from("onboarding_steps")
      .update({ video_enabled: next, updated_at: new Date().toISOString() })
      .eq("id", step.id);
    if (error) {
      showToast("Error: " + error.message);
    } else {
      setSteps(prev => prev.map(s => s.id === step.id ? { ...s, video_enabled: next } : s));
      showToast(next ? "Vídeo activado" : "Vídeo desactivado");
    }
  };

  // Activar/desactivar TODOS los vídeos de la pantalla actual (solo los que tienen enlace).
  const bulkSetEnabled = async (enabled: boolean) => {
    const ids = steps
      .filter(s => s.context === activeContext && (s.video_url ?? "").trim())
      .map(s => s.id);
    if (ids.length === 0) return;
    const { error } = await supabase
      .from("onboarding_steps")
      .update({ video_enabled: enabled, updated_at: new Date().toISOString() })
      .in("id", ids);
    if (error) {
      showToast("Error: " + error.message);
    } else {
      setSteps(prev => prev.map(s => ids.includes(s.id) ? { ...s, video_enabled: enabled } : s));
      showToast(enabled ? "Vídeos de la pantalla activados" : "Vídeos de la pantalla desactivados");
    }
  };

  const contextSteps = steps.filter(s => s.context === activeContext);
  const totalWithVideo = steps.filter(s => (s.video_url ?? "").trim()).length;
  const ctxWithVideo = contextSteps.filter(s => (s.video_url ?? "").trim());

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--brand-1)]" />
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Vídeos tutoriales</h1>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-400">
          No hay pasos de guía cargados todavía. Crea los pasos en <b>Guía de Personalización</b> y aquí podrás conectarles su vídeo.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-4xl">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[var(--brand-1)] text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Cabecera */}
      <div>
        <h1 className="text-2xl font-semibold">Vídeos tutoriales</h1>
        <p className="text-sm text-[var(--foreground)]/50 mt-1">
          Conecta un vídeo de ~1 min a cada paso de la guía. {totalWithVideo} de {steps.length} pasos tienen vídeo.
        </p>
      </div>

      {/* Cómo funciona */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-3 text-sm">
        <h2 className="font-bold text-[var(--foreground)]">Cómo funciona</h2>
        <ul className="space-y-1.5 text-[var(--foreground)]/70 text-xs leading-relaxed">
          <li><b className="text-[var(--foreground)]">1. Sube el vídeo a YouTube</b> en modo <b>Oculto / No listado</b> (se puede incrustar; no aparece en búsquedas). Evita "Privado": ese no se incrusta.</li>
          <li><b className="text-[var(--foreground)]">2. Pega aquí su enlace</b> en el paso que corresponda (vale youtu.be/…, watch?v=…, o un .mp4). Se guarda solo al salir del campo.</li>
          <li><b className="text-[var(--foreground)]">3. El negocio lo ve</b> en dos sitios: el botón <b>"Vídeos tutoriales"</b> de la cabecera del editor (abre el reproductor + la lista) y el botón <b>"Ver vídeo del paso"</b> dentro de cada paso del panel de guía.</li>
          <li><b className="text-[var(--foreground)]">4. Actívalo o desactívalo</b> con el interruptor de cada paso (sin borrar el enlace), o todos los de una pantalla a la vez con "Activar/Desactivar todos". Un vídeo desactivado no se muestra al negocio.</li>
        </ul>
        <p className="text-[10px] text-[var(--foreground)]/40">Los vídeos solo aparecen en las pantallas donde existe la guía: el Editor de Landing y el Wizard de Recursos.</p>
      </div>

      {/* Tabs de contexto */}
      <div className="flex gap-2 border-b border-[var(--border)]">
        {(["landing", "resources"] as Context[]).map(ctx => {
          const n = steps.filter(s => s.context === ctx && (s.video_url ?? "").trim()).length;
          const t = steps.filter(s => s.context === ctx).length;
          return (
            <button
              key={ctx}
              type="button"
              onClick={() => setActiveContext(ctx)}
              className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
                activeContext === ctx
                  ? "border-[var(--brand-1)] text-[var(--brand-1)]"
                  : "border-transparent text-[var(--foreground)]/50 hover:text-[var(--foreground)]"
              }`}
            >
              {CONTEXT_LABELS[ctx]} <span className="opacity-60 text-xs">({n}/{t})</span>
            </button>
          );
        })}
      </div>

      {/* Activar/desactivar todos los vídeos de esta pantalla */}
      {ctxWithVideo.length > 0 && (
        <div className="flex items-center justify-between gap-3 flex-wrap rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3">
          <span className="text-xs text-[var(--foreground)]/60">
            {ctxWithVideo.filter(s => s.video_enabled !== false).length} de {ctxWithVideo.length} vídeos activos en <b className="text-[var(--foreground)]">{CONTEXT_LABELS[activeContext]}</b>
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => bulkSetEnabled(true)}
              className="text-xs px-3 py-1.5 rounded-lg border border-green-500/40 text-green-500 hover:bg-green-500/10 font-semibold"
            >
              Activar todos
            </button>
            <button
              type="button"
              onClick={() => bulkSetEnabled(false)}
              className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground)]/60 hover:bg-[var(--border)]/40 font-semibold"
            >
              Desactivar todos
            </button>
          </div>
        </div>
      )}

      {/* Pasos por etapa */}
      <div className="space-y-8">
        {STAGE_ORDER.map(stage => {
          const stageSteps = contextSteps
            .filter(s => s.stage === stage)
            .sort((a, b) => a.step_order - b.step_order);
          if (stageSteps.length === 0) return null;

          return (
            <div key={stage} className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/40">
                {STAGE_LABELS[stage]}
              </div>
              {stageSteps.map((step, idx) => {
                const value = drafts[step.id] ?? step.video_url ?? "";
                const connected = (step.video_url ?? "").trim().length > 0;
                const enabled = step.video_enabled !== false;
                return (
                  <div
                    key={step.id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                        style={{ background: "var(--brand-1)", color: "#fff" }}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-sm font-semibold text-[var(--foreground)] flex-1">{step.title}</span>
                      {!connected ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--border)] text-[var(--foreground)]/40 font-semibold">Sin vídeo</span>
                      ) : enabled ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-500 border border-green-500/30 font-semibold">Activo</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30 font-semibold">Desactivado</span>
                      )}
                      {/* Interruptor activar/desactivar el vídeo (solo si hay enlace) */}
                      {connected && (
                        <button
                          type="button"
                          onClick={() => toggleEnabled(step)}
                          title={enabled ? "Desactivar vídeo en esta pantalla" : "Activar vídeo en esta pantalla"}
                          className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
                          style={{ background: enabled ? "var(--brand-1)" : "var(--border)" }}
                        >
                          <span
                            className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                            style={{ left: enabled ? "22px" : "2px" }}
                          />
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setDrafts(d => ({ ...d, [step.id]: e.target.value }))}
                        onBlur={() => saveVideo(step)}
                        placeholder="https://youtu.be/...   ·   vacío = sin vídeo"
                        className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-1)]/40"
                      />
                      <button
                        type="button"
                        disabled={!value.trim()}
                        onClick={() => setPreview({ url: value.trim(), title: step.title })}
                        className="px-3 py-2 rounded-lg border border-[var(--border)] text-xs font-semibold disabled:opacity-40 hover:bg-[var(--brand-1)]/10 hover:border-[var(--brand-1)] hover:text-[var(--brand-1)] transition-colors whitespace-nowrap"
                      >
                        {savingId === step.id ? "Guardando…" : "▶ Ver"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Modal de previsualización */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={() => setPreview(null)}
        >
          <div
            className="w-full max-w-2xl bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
              <h3 className="text-sm font-bold text-[var(--foreground)]">{preview.title}</h3>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="text-[var(--foreground)]/60 hover:text-[var(--foreground)] text-xl leading-none"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              {toEmbedUrl(preview.url) ? (
                <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
                  <iframe
                    src={toEmbedUrl(preview.url)!}
                    title={preview.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0, borderRadius: 10 }}
                  />
                </div>
              ) : isDirectVideo(preview.url) ? (
                <video src={preview.url} controls className="w-full rounded-lg" />
              ) : (
                <div className="text-sm text-[var(--foreground)]/60">
                  No reconozco este enlace como YouTube, Vimeo ni un archivo de vídeo. Revisa que sea correcto.{" "}
                  <a href={preview.url} target="_blank" rel="noreferrer" className="text-[var(--brand-1)] underline">Abrir enlace →</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
