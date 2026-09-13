"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  GuidedPathConfig, GuidedProfile, DEFAULT_GUIDED_PATH, SELECTABLE_SECTIONS,
} from "@/lib/guided-path";

const PROFILE_LABEL: Record<GuidedProfile, string> = {
  fidelizacion: "Fidelización",
  captacion: "Captación",
};

export default function RutaGuiadaAdmin() {
  const [config, setConfig] = useState<GuidedPathConfig>(DEFAULT_GUIDED_PATH);
  const [profile, setProfile] = useState<GuidedProfile>("fidelizacion");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/guided-path");
      const data = await res.json();
      if (data.config) setConfig({ ...DEFAULT_GUIDED_PATH, ...data.config });
    } catch { /* usa default */ }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const steps = config[profile] || [];
  const inPath = new Set(steps.map((s) => s.href));
  const available = SELECTABLE_SECTIONS[profile].filter((s) => !inPath.has(s.href));

  const setSteps = (next: typeof steps) => {
    setConfig((c) => ({ ...c, [profile]: next }));
    setDirty(true);
  };

  const labelFor = (href: string) =>
    SELECTABLE_SECTIONS[profile].find((s) => s.href === href)?.label || href;

  const addStep = (href: string) => setSteps([...steps, { href, hint: `Paso ${steps.length + 1}` }]);
  const removeStep = (i: number) => setSteps(steps.filter((_, idx) => idx !== i));
  const setHint = (i: number, hint: string) => setSteps(steps.map((s, idx) => (idx === i ? { ...s, hint } : s)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= steps.length) return;
    const next = [...steps];
    [next[i], next[j]] = [next[j], next[i]];
    setSteps(next);
  };

  const save = async () => {
    setSaving(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/guided-path", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.session?.access_token || ""}` },
        body: JSON.stringify({ config }),
      });
      if (res.ok) { showToast("Ruta guardada"); setDirty(false); }
      else showToast("Error al guardar");
    } catch { showToast("Error de red"); }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--brand-1)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-3xl">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[var(--brand-1)] text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium">{toast}</div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Ruta guiada</h1>
          <p className="text-sm text-[var(--foreground)]/50 mt-1">
            Marca el orden de secciones que el negocio debe seguir. Cada una muestra un punto naranja parpadeante y su etiqueta en la barra lateral, y se apaga sola cuando el negocio la completa.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-xs px-2 py-1 rounded-lg bg-amber-400/15 text-amber-400 font-medium">Sin guardar</span>}
          <button onClick={save} disabled={saving || !dirty}
            className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50" style={{ background: "var(--brand-1)", color: "white" }}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>

      {/* Tabs de perfil */}
      <div className="flex gap-2 border-b border-[var(--border)]">
        {(["fidelizacion", "captacion"] as GuidedProfile[]).map((p) => (
          <button key={p} type="button" onClick={() => setProfile(p)}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
              profile === p ? "border-[var(--brand-1)] text-[var(--brand-1)]" : "border-transparent text-[var(--foreground)]/50 hover:text-[var(--foreground)]"
            }`}>
            {PROFILE_LABEL[p]} <span className="opacity-60 text-xs">({(config[p] || []).length})</span>
          </button>
        ))}
      </div>

      {/* Pasos de la ruta (ordenados) */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/40">El camino (en orden)</div>
        {steps.length === 0 && (
          <div className="text-sm text-[var(--foreground)]/40 px-3 py-4 rounded-lg border border-dashed border-[var(--border)]">
            Aún no hay pasos en esta ruta. Añade secciones abajo.
          </div>
        )}
        {steps.map((s, i) => (
          <div key={s.href} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: "var(--brand-1)", color: "#fff" }}>{i + 1}</span>
              <span className="text-sm font-semibold text-[var(--foreground)] flex-1">{labelFor(s.href)}</span>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                className="w-7 h-7 rounded-lg border border-[var(--border)] text-xs disabled:opacity-30 hover:bg-[var(--border)]/40">↑</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === steps.length - 1}
                className="w-7 h-7 rounded-lg border border-[var(--border)] text-xs disabled:opacity-30 hover:bg-[var(--border)]/40">↓</button>
              <button type="button" onClick={() => removeStep(i)}
                className="w-7 h-7 rounded-lg border border-[var(--border)] text-xs text-red-400/60 hover:bg-red-500/10 hover:text-red-400">✕</button>
            </div>
            <div className="mt-2">
              <label className="block text-[10px] text-[var(--foreground)]/50 mb-1">Etiqueta que ve el negocio</label>
              <input type="text" value={s.hint} onChange={(e) => setHint(i, e.target.value)}
                placeholder="Ej: Primer paso"
                className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm" />
            </div>
          </div>
        ))}
      </div>

      {/* Secciones disponibles para añadir */}
      {available.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/40">Añadir al camino</div>
          <div className="flex flex-wrap gap-2">
            {available.map((s) => (
              <button key={s.href} type="button" onClick={() => addStep(s.href)}
                className="text-xs px-3 py-1.5 rounded-full border border-dashed border-[var(--border)] hover:border-[var(--brand-1)] hover:text-[var(--brand-1)] transition-colors">
                + {s.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
