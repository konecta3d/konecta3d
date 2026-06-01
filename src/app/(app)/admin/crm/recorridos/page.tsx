"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  RecorridosData, Recorrido, RecorridoStep, DEFAULT_RECORRIDOS,
  CANALES, ACCIONES_DIRECTAS, METODOS_CAPTACION, COLORES_RECORRIDO,
} from "@/lib/crm/recorridos";

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  return { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token || ""}` };
}

const inputCls = "px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm";

// ─── Editor de un paso ────────────────────────────────────────────────────────
function StepRow({ step, idx, total, color, onChange, onMove, onDelete }: {
  step: RecorridoStep; idx: number; total: number; color: string;
  onChange: (s: RecorridoStep) => void; onMove: (dir: -1 | 1) => void; onDelete: () => void;
}) {
  const set = (f: keyof RecorridoStep, v: string) => onChange({ ...step, [f]: v });
  return (
    <div className="flex items-start gap-2 group">
      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1"
        style={{ background: "var(--background)", color, border: `1.5px solid ${color}` }}>{idx + 1}</span>
      <div className="flex-1 rounded-lg border border-[var(--border)] p-2.5 space-y-2" style={{ background: "var(--background)" }}>
        <input value={step.nombre} onChange={e => set("nombre", e.target.value)}
          className={inputCls + " w-full font-medium"} placeholder="Qué pasa en este paso" />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-[var(--foreground)]/40 mb-0.5">Canal</label>
            <select value={step.canal} onChange={e => set("canal", e.target.value)} className={inputCls + " w-full"}>
              {CANALES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-green-500/70 mb-0.5">Acción directa deseada</label>
            <select value={step.accionDirecta} onChange={e => set("accionDirecta", e.target.value)} className={inputCls + " w-full"}>
              {ACCIONES_DIRECTAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-0.5 flex-shrink-0 mt-1">
        <button onClick={() => onMove(-1)} disabled={idx === 0}
          className="w-6 h-5 flex items-center justify-center rounded text-[var(--foreground)]/40 hover:text-[var(--foreground)] hover:bg-[var(--border)]/30 disabled:opacity-20 text-xs">↑</button>
        <button onClick={() => onMove(1)} disabled={idx === total - 1}
          className="w-6 h-5 flex items-center justify-center rounded text-[var(--foreground)]/40 hover:text-[var(--foreground)] hover:bg-[var(--border)]/30 disabled:opacity-20 text-xs">↓</button>
        <button onClick={onDelete}
          className="w-6 h-5 flex items-center justify-center rounded text-red-400 hover:bg-red-500/10 text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
      </div>
    </div>
  );
}

// ─── Tarjeta de recorrido ─────────────────────────────────────────────────────
function RecorridoCard({ rec, open, onToggle, onChange, onDelete }: {
  rec: Recorrido; open: boolean; onToggle: () => void;
  onChange: (r: Recorrido) => void; onDelete: () => void;
}) {
  const set = (patch: Partial<Recorrido>) => onChange({ ...rec, ...patch });
  const setStep = (i: number, s: RecorridoStep) => set({ pasos: rec.pasos.map((x, j) => j === i ? s : x) });
  const moveStep = (i: number, dir: -1 | 1) => {
    const t = i + dir; if (t < 0 || t >= rec.pasos.length) return;
    const next = [...rec.pasos]; [next[i], next[t]] = [next[t], next[i]]; set({ pasos: next });
  };

  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden" style={{ background: "var(--card)" }}>
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left hover:bg-[var(--border)]/10 transition-colors">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: rec.color }} />
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold truncate">{rec.nombre}</h3>
          <p className="text-xs text-[var(--foreground)]/50 truncate">{rec.metodoCaptacion} · {rec.perfil} · {rec.pasos.length} pasos</p>
        </div>
        <span className="text-[var(--foreground)]/30 text-lg flex-shrink-0">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-[var(--border)] pt-4 space-y-4">
          {/* Meta */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-[var(--foreground)]/40 mb-1">Nombre del recorrido</label>
              <input value={rec.nombre} onChange={e => set({ nombre: e.target.value })} className={inputCls + " w-full"} />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-[var(--foreground)]/40 mb-1">Método de captación inicial</label>
              <select value={rec.metodoCaptacion} onChange={e => set({ metodoCaptacion: e.target.value })} className={inputCls + " w-full"}>
                {METODOS_CAPTACION.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-[var(--foreground)]/40 mb-1">Perfil objetivo</label>
              <input value={rec.perfil} onChange={e => set({ perfil: e.target.value })} className={inputCls + " w-full"} />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-[var(--foreground)]/40 mb-1">Color</label>
              <div className="flex gap-1.5">
                {COLORES_RECORRIDO.map(c => (
                  <button key={c} onClick={() => set({ color: c })}
                    className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                    style={{ background: c, borderColor: rec.color === c ? "var(--foreground)" : "transparent" }} />
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-[var(--foreground)]/40 mb-1">Objetivo</label>
            <textarea value={rec.objetivo} onChange={e => set({ objetivo: e.target.value })} rows={2} className={inputCls + " w-full resize-y"} />
          </div>

          {/* Pasos */}
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-[var(--foreground)]/40 mb-2">Pasos del recorrido</label>
            <div className="space-y-2">
              {rec.pasos.map((step, i) => (
                <StepRow key={i} step={step} idx={i} total={rec.pasos.length} color={rec.color}
                  onChange={s => setStep(i, s)} onMove={dir => moveStep(i, dir)}
                  onDelete={() => set({ pasos: rec.pasos.filter((_, j) => j !== i) })} />
              ))}
            </div>
            <button onClick={() => set({ pasos: [...rec.pasos, { nombre: "", canal: CANALES[0], accionDirecta: ACCIONES_DIRECTAS[0] }] })}
              className="mt-2 text-[11px] px-2.5 py-1 rounded-lg border border-dashed border-[var(--border)] text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors">
              + Paso
            </button>
          </div>

          {/* Cierre */}
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-[var(--foreground)]/40 mb-1">Cierre (qué define el éxito)</label>
            <textarea value={rec.cierre} onChange={e => set({ cierre: e.target.value })} rows={2} className={inputCls + " w-full resize-y"} />
          </div>

          <button onClick={onDelete} className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors">
            Eliminar recorrido
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function RecorridosPage() {
  const [data, setData] = useState<RecorridosData>(DEFAULT_RECORRIDOS);
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/crm/recorridos", { headers: await authHeaders() });
      const json = await res.json();
      if (json.data) { setData(json.data); if (json.data.recorridos[0]) setOpenId(json.data.recorridos[0].id); }
    } catch { /* silencioso */ }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const updateRec = (id: string, r: Recorrido) => { setData(d => ({ recorridos: d.recorridos.map(x => x.id === id ? r : x) })); setDirty(true); };
  const deleteRec = (id: string) => { setData(d => ({ recorridos: d.recorridos.filter(x => x.id !== id) })); setDirty(true); };
  const addRec = () => {
    const id = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());
    const nuevo: Recorrido = {
      id, nombre: "Nuevo recorrido", metodoCaptacion: METODOS_CAPTACION[0],
      perfil: "El Expositor", objetivo: "", color: COLORES_RECORRIDO[data.recorridos.length % COLORES_RECORRIDO.length],
      pasos: [{ nombre: "", canal: CANALES[0], accionDirecta: ACCIONES_DIRECTAS[0] }], cierre: "",
    };
    setData(d => ({ recorridos: [...d.recorridos, nuevo] })); setOpenId(id); setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/crm/recorridos", { method: "POST", headers: await authHeaders(), body: JSON.stringify({ data }) });
      setMsg(res.ok ? "Guardado" : "Error al guardar");
      if (res.ok) setDirty(false);
    } catch { setMsg("Error de red"); }
    setSaving(false);
    setTimeout(() => setMsg(null), 2500);
  };

  const restaurar = async () => {
    if (!confirm("¿Restaurar los recorridos a los valores por defecto?")) return;
    await fetch("/api/admin/crm/recorridos", { method: "DELETE", headers: await authHeaders() });
    setData(DEFAULT_RECORRIDOS); setDirty(false);
    setMsg("Restaurado");
    setTimeout(() => setMsg(null), 2500);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: "var(--brand-1)" }} />
    </div>;
  }

  return (
    <div className="max-w-[900px] mx-auto pb-12">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/admin/crm/pipeline" className="text-sm text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors">← Pipeline</Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold">Diseñador de recorridos</h1>
          <p className="text-sm text-[var(--foreground)]/50 mt-0.5">Crea recorridos del cliente según el método de captación y el perfil.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {msg && <span className="text-xs px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 font-medium">{msg}</span>}
          {dirty && <span className="text-xs px-2 py-1 rounded-lg bg-amber-400/15 text-amber-400">Sin guardar</span>}
          <button onClick={addRec} className="px-3 py-2 rounded-lg border border-[var(--border)] text-xs text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors">+ Nuevo recorrido</button>
          <button onClick={restaurar} className="px-3 py-2 rounded-lg border border-[var(--border)] text-xs text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors">Restaurar</button>
          <button onClick={save} disabled={saving || !dirty} className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50" style={{ background: "var(--brand-1)", color: "white" }}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>

      {data.recorridos.length === 0 ? (
        <div className="text-center py-16 text-[var(--foreground)]/30 text-sm">
          Sin recorridos. <button onClick={addRec} className="underline underline-offset-2 hover:text-[var(--foreground)]/60">Crea el primero</button>.
        </div>
      ) : (
        <div className="space-y-3">
          {data.recorridos.map(rec => (
            <RecorridoCard key={rec.id} rec={rec}
              open={openId === rec.id}
              onToggle={() => setOpenId(openId === rec.id ? null : rec.id)}
              onChange={r => updateRec(rec.id, r)}
              onDelete={() => deleteRec(rec.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
