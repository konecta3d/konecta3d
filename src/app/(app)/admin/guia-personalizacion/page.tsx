"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type Context = "landing" | "resources";
type Stage = "contexto" | "primeros-pasos" | "optimizacion" | "maestria";

interface Step {
  id: string;
  context: Context;
  stage: Stage;
  step_order: number;
  title: string;
  body: string;
  tip: string | null;
  active: boolean;
}

// ─── Labels ──────────────────────────────────────────────────────────────────

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

const STAGE_COLORS: Record<Stage, string> = {
  "contexto": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "primeros-pasos": "bg-green-500/15 text-green-400 border-green-500/30",
  "optimizacion": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "maestria": "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function GuiaPersonalizacionAdmin() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeContext, setActiveContext] = useState<Context>("landing");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Step>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<{ context: Context; stage: Stage } | null>(null);
  const [newStep, setNewStep] = useState({ title: "", body: "", tip: "" });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadSteps = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("onboarding_steps")
      .select("*")
      .order("context")
      .order("stage")
      .order("step_order");

    if (error) {
      showToast("Error cargando pasos: " + error.message);
    } else {
      setSteps((data as Step[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadSteps(); }, [loadSteps]);

  // ── Edit ──────────────────────────────────────────────────
  const startEdit = (step: Step) => {
    setEditingId(step.id);
    setEditData({ title: step.title, body: step.body, tip: step.tip || "" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async (step: Step) => {
    setSaving(true);
    const { error } = await supabase
      .from("onboarding_steps")
      .update({
        title: editData.title,
        body: editData.body,
        tip: editData.tip || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", step.id);

    if (error) {
      showToast("Error al guardar: " + error.message);
    } else {
      setSteps(steps.map(s => s.id === step.id
        ? { ...s, title: editData.title!, body: editData.body!, tip: editData.tip || null }
        : s
      ));
      setEditingId(null);
      showToast("Paso guardado");
    }
    setSaving(false);
  };

  // ── Toggle active ─────────────────────────────────────────
  const toggleActive = async (step: Step) => {
    const next = !step.active;
    const { error } = await supabase
      .from("onboarding_steps")
      .update({ active: next, updated_at: new Date().toISOString() })
      .eq("id", step.id);

    if (!error) {
      setSteps(steps.map(s => s.id === step.id ? { ...s, active: next } : s));
      showToast(next ? "Paso activado" : "Paso desactivado");
    }
  };

  // ── Delete ────────────────────────────────────────────────
  const deleteStep = async (id: string) => {
    if (!confirm("¿Eliminar este paso? Esta acción no se puede deshacer.")) return;
    const { error } = await supabase.from("onboarding_steps").delete().eq("id", id);
    if (!error) {
      setSteps(steps.filter(s => s.id !== id));
      showToast("Paso eliminado");
    }
  };

  // ── Add new step ──────────────────────────────────────────
  const saveNewStep = async () => {
    if (!addingTo || !newStep.title.trim() || !newStep.body.trim()) return;
    setSaving(true);

    const stageSteps = steps.filter(
      s => s.context === addingTo.context && s.stage === addingTo.stage
    );
    const nextOrder = stageSteps.length > 0
      ? Math.max(...stageSteps.map(s => s.step_order)) + 1
      : 1;

    const { data, error } = await supabase
      .from("onboarding_steps")
      .insert({
        context: addingTo.context,
        stage: addingTo.stage,
        step_order: nextOrder,
        title: newStep.title,
        body: newStep.body,
        tip: newStep.tip || null,
        active: true,
      })
      .select()
      .single();

    if (error) {
      showToast("Error al crear paso: " + error.message);
    } else {
      setSteps([...steps, data as Step]);
      setAddingTo(null);
      setNewStep({ title: "", body: "", tip: "" });
      showToast("Paso creado");
    }
    setSaving(false);
  };

  // ── Filtered steps ────────────────────────────────────────
  const contextSteps = steps.filter(s => s.context === activeContext);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--brand-4)]" />
      </div>
    );
  }

  // ── No steps in DB ────────────────────────────────────────
  if (steps.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Guía de Personalización</h1>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-400 space-y-3">
          <p className="font-semibold">La tabla de pasos está vacía.</p>
          <p>Ejecuta el archivo <code className="bg-black/30 px-1 rounded">sql-onboarding-steps.sql</code> en el SQL Editor de Supabase para cargar los pasos iniciales.</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-16">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[var(--brand-1)] text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Guía de Personalización</h1>
          <p className="text-sm text-[var(--foreground)]/50 mt-1">
            Edita los mensajes que recibe el negocio en el panel lateral de guía
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-[var(--foreground)]/40">
            {steps.filter(s => s.active).length} activos · {steps.length} totales
          </div>
          {steps.filter(s => !s.active).length > 0 && (
            <button
              type="button"
              onClick={async () => {
                const ids = steps.filter(s => !s.active).map(s => s.id);
                const { error } = await supabase
                  .from("onboarding_steps")
                  .update({ active: true, updated_at: new Date().toISOString() })
                  .in("id", ids);
                if (!error) {
                  setSteps(steps.map(s => ({ ...s, active: true })));
                  showToast(`${ids.length} pasos reactivados`);
                }
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 transition-colors font-semibold"
            >
              ⚠ {steps.filter(s => !s.active).length} paso{steps.filter(s => !s.active).length !== 1 ? "s" : ""} oculto{steps.filter(s => !s.active).length !== 1 ? "s" : ""} — Activar todos
            </button>
          )}
        </div>
      </div>

      {/* Context tabs */}
      <div className="flex gap-2 border-b border-[var(--border)] pb-0">
        {(["landing", "resources"] as Context[]).map(ctx => (
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
            {CONTEXT_LABELS[ctx]}
          </button>
        ))}
      </div>

      {/* Stages */}
      <div className="space-y-8">
        {STAGE_ORDER.map(stage => {
          const stageSteps = contextSteps
            .filter(s => s.stage === stage)
            .sort((a, b) => a.step_order - b.step_order);

          return (
            <div key={stage} className="space-y-3">
              {/* Stage header */}
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${STAGE_COLORS[stage]}`}>
                  {STAGE_LABELS[stage]}
                  <span className="ml-2 opacity-60">{stageSteps.length} pasos</span>
                </span>
                <button
                  type="button"
                  onClick={() => { setAddingTo({ context: activeContext, stage }); setNewStep({ title: "", body: "", tip: "" }); }}
                  className="text-xs px-2.5 py-1 rounded-lg border border-[var(--border)] hover:bg-[var(--brand-1)]/10 hover:border-[var(--brand-1)] hover:text-[var(--brand-1)] transition-colors"
                >
                  + Añadir paso
                </button>
              </div>

              {/* Steps list */}
              <div className="space-y-2">
                {stageSteps.length === 0 && (
                  <div className="text-xs text-[var(--foreground)]/30 px-3 py-2 rounded-lg border border-dashed border-[var(--border)]">
                    Sin pasos en esta etapa
                  </div>
                )}

                {stageSteps.map((step, idx) => (
                  <div
                    key={step.id}
                    className={`rounded-xl border bg-[var(--card)] transition-opacity ${
                      step.active ? "border-[var(--border)] opacity-100" : "border-[var(--border)]/40 opacity-50"
                    }`}
                  >
                    {editingId === step.id ? (
                      /* ── Edit mode ── */
                      <div className="p-4 space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-[var(--foreground)]/40">PASO {idx + 1}</span>
                        </div>
                        <div>
                          <label className="block text-xs text-[var(--foreground)]/50 mb-1">Título</label>
                          <input
                            type="text"
                            value={editData.title || ""}
                            onChange={e => setEditData({ ...editData, title: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-1)]/40"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[var(--foreground)]/50 mb-1">Cuerpo del mensaje</label>
                          <textarea
                            rows={5}
                            value={editData.body || ""}
                            onChange={e => setEditData({ ...editData, body: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[var(--brand-1)]/40"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[var(--foreground)]/50 mb-1">
                            Enlace al GPT <span className="text-[var(--foreground)]/30">(opcional — solo visible si el negocio tiene GPT activo)</span>
                          </label>
                          <input
                            type="text"
                            value={editData.tip || ""}
                            onChange={e => setEditData({ ...editData, tip: e.target.value })}
                            placeholder="Ej: Pídele al GPT ideas para este paso →"
                            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-1)]/40"
                          />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => saveEdit(step)}
                            disabled={saving}
                            className="px-4 py-2 rounded-lg bg-[var(--brand-1)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                          >
                            {saving ? "Guardando..." : "Guardar"}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="px-4 py-2 rounded-lg border border-[var(--border)] text-xs hover:bg-[var(--border)]/50"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ── View mode ── */
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold text-[var(--foreground)]/30">PASO {idx + 1}</span>
                              {!step.active && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">Oculto</span>
                              )}
                              {step.tip && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">GPT</span>
                              )}
                            </div>
                            <h3 className="text-sm font-semibold mb-1">{step.title}</h3>
                            <p className="text-xs text-[var(--foreground)]/60 whitespace-pre-line leading-relaxed line-clamp-3">
                              {step.body}
                            </p>
                            {step.tip && (
                              <p className="text-[10px] text-amber-400/70 mt-1.5 truncate">{step.tip}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => toggleActive(step)}
                              title={step.active ? "Desactivar paso" : "Activar paso"}
                              className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs transition-colors ${
                                step.active
                                  ? "border-green-500/40 text-green-500 hover:bg-green-500/10"
                                  : "border-[var(--border)] text-[var(--foreground)]/30 hover:bg-[var(--border)]/50"
                              }`}
                            >
                              {step.active ? "●" : "○"}
                            </button>
                            <button
                              type="button"
                              onClick={() => startEdit(step)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] text-xs hover:bg-[var(--brand-1)]/10 hover:border-[var(--brand-1)] hover:text-[var(--brand-1)] transition-colors"
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteStep(step.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] text-xs text-red-400/50 hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* New step form */}
                {addingTo?.context === activeContext && addingTo?.stage === stage && (
                  <div className="rounded-xl border border-[var(--brand-1)]/30 bg-[var(--card)] p-4 space-y-3">
                    <div className="text-xs font-semibold text-[var(--brand-1)]">Nuevo paso</div>
                    <div>
                      <label className="block text-xs text-[var(--foreground)]/50 mb-1">Título</label>
                      <input
                        type="text"
                        value={newStep.title}
                        onChange={e => setNewStep({ ...newStep, title: e.target.value })}
                        placeholder="Título del paso..."
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-1)]/40"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--foreground)]/50 mb-1">Cuerpo del mensaje</label>
                      <textarea
                        rows={4}
                        value={newStep.body}
                        onChange={e => setNewStep({ ...newStep, body: e.target.value })}
                        placeholder="Escribe el contenido del paso..."
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[var(--brand-1)]/40"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--foreground)]/50 mb-1">
                        Enlace al GPT <span className="text-[var(--foreground)]/30">(opcional)</span>
                      </label>
                      <input
                        type="text"
                        value={newStep.tip}
                        onChange={e => setNewStep({ ...newStep, tip: e.target.value })}
                        placeholder="Ej: Pídele al GPT ideas para este paso →"
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-1)]/40"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={saveNewStep}
                        disabled={saving || !newStep.title.trim() || !newStep.body.trim()}
                        className="px-4 py-2 rounded-lg bg-[var(--brand-1)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                      >
                        {saving ? "Creando..." : "Crear paso"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddingTo(null)}
                        className="px-4 py-2 rounded-lg border border-[var(--border)] text-xs"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
