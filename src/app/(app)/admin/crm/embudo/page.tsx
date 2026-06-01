"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Funnel, FunnelPhase, FunnelDoc, KonectaAction, DEFAULT_FUNNEL,
  ESTADO_INFO, DONDE_LABEL, QUIEN_COLOR, QUIEN_OPCIONES, DOC_TIPOS,
  DocEstado, DocDonde,
} from "@/lib/crm/funnel";

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  return { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token || ""}` };
}

const inputCls = "px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm";

// ─── Carril de acciones Konecta ───────────────────────────────────────────────
function AccionesEditor({ items, onChange }: { items: KonectaAction[]; onChange: (i: KonectaAction[]) => void }) {
  return (
    <div className="space-y-1.5">
      {items.map((a, i) => (
        <div key={i} className="flex items-start gap-1.5 group">
          <select value={a.quien} onChange={e => { const n = [...items]; n[i] = { ...n[i], quien: e.target.value }; onChange(n); }}
            className={inputCls + " flex-shrink-0 text-[11px]"} style={{ color: QUIEN_COLOR[a.quien] }}>
            {QUIEN_OPCIONES.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
          <textarea value={a.texto} onChange={e => { const n = [...items]; n[i] = { ...n[i], texto: e.target.value }; onChange(n); }}
            rows={1} className={inputCls + " flex-1 resize-y text-xs"} />
          <button onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="text-red-400 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">✕</button>
        </div>
      ))}
      <button onClick={() => onChange([...items, { texto: "", quien: "Miriam" }])}
        className="text-[11px] px-2.5 py-1 rounded-lg border border-dashed border-[var(--border)] text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors">
        + Acción
      </button>
    </div>
  );
}

// ─── Carril recorrido cliente ─────────────────────────────────────────────────
function RecorridoEditor({ items, onChange }: { items: string[]; onChange: (i: string[]) => void }) {
  return (
    <div className="space-y-1.5">
      {items.map((t, i) => (
        <div key={i} className="flex items-start gap-1.5 group">
          <span className="text-[var(--foreground)]/30 text-xs mt-2 flex-shrink-0">·</span>
          <textarea value={t} onChange={e => { const n = [...items]; n[i] = e.target.value; onChange(n); }}
            rows={1} className={inputCls + " flex-1 resize-y text-xs"} />
          <button onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="text-red-400 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">✕</button>
        </div>
      ))}
      <button onClick={() => onChange([...items, ""])}
        className="text-[11px] px-2.5 py-1 rounded-lg border border-dashed border-[var(--border)] text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors">
        + Paso del cliente
      </button>
    </div>
  );
}

// ─── Documentos ───────────────────────────────────────────────────────────────
function DocsEditor({ items, onChange }: { items: FunnelDoc[]; onChange: (i: FunnelDoc[]) => void }) {
  const set = (i: number, field: keyof FunnelDoc, v: string) => {
    const n = [...items]; n[i] = { ...n[i], [field]: v } as FunnelDoc; onChange(n);
  };
  return (
    <div className="space-y-1.5">
      {items.map((d, i) => (
        <div key={i} className="flex flex-wrap items-center gap-1.5 group rounded-lg border border-[var(--border)] p-2" style={{ background: "var(--background)" }}>
          <button onClick={() => set(i, "estado", d.estado === "pendiente" ? "proceso" : d.estado === "proceso" ? "listo" : "pendiente")}
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
            style={{ background: `${ESTADO_INFO[d.estado].color}22`, color: ESTADO_INFO[d.estado].color }}
            title="Click para cambiar estado">
            {ESTADO_INFO[d.estado].label}
          </button>
          <input value={d.nombre} onChange={e => set(i, "nombre", e.target.value)}
            className="flex-1 min-w-[140px] px-2 py-1 rounded border border-[var(--border)] bg-[var(--card)] text-xs" placeholder="Nombre del documento" />
          <select value={d.tipo} onChange={e => set(i, "tipo", e.target.value)} className="text-[11px] px-1.5 py-1 rounded border border-[var(--border)] bg-[var(--card)]">
            {DOC_TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={d.donde} onChange={e => set(i, "donde", e.target.value as DocDonde)} className="text-[11px] px-1.5 py-1 rounded border border-[var(--border)] bg-[var(--card)]">
            {(Object.keys(DONDE_LABEL) as DocDonde[]).map(k => <option key={k} value={k}>{DONDE_LABEL[k]}</option>)}
          </select>
          <button onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">✕</button>
        </div>
      ))}
      <button onClick={() => onChange([...items, { nombre: "", tipo: "PDF", donde: "plataforma", estado: "pendiente" }])}
        className="text-[11px] px-2.5 py-1 rounded-lg border border-dashed border-[var(--border)] text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors">
        + Documento
      </button>
    </div>
  );
}

// ─── Tarjeta de fase ──────────────────────────────────────────────────────────
function PhaseCard({ phase, open, onToggle, onChange }: {
  phase: FunnelPhase; open: boolean; onToggle: () => void; onChange: (p: FunnelPhase) => void;
}) {
  const set = (patch: Partial<FunnelPhase>) => onChange({ ...phase, ...patch });
  const docsListos = phase.documentos.filter(d => d.estado === "listo").length;

  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden" style={{ background: "var(--card)" }}>
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left hover:bg-[var(--border)]/10 transition-colors">
        <span className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black text-white flex-shrink-0" style={{ background: phase.color }}>{phase.id}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold">{phase.nombre}</h3>
          <p className="text-xs text-[var(--foreground)]/50 truncate">{phase.objetivo}</p>
        </div>
        <span className="text-[10px] text-[var(--foreground)]/40 flex-shrink-0">{docsListos}/{phase.documentos.length} docs</span>
        <span className="text-[var(--foreground)]/30 text-lg flex-shrink-0">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-[var(--border)] pt-4 space-y-4">
          {/* Objetivo editable */}
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-[var(--foreground)]/40 mb-1">Objetivo de la fase</label>
            <textarea value={phase.objetivo} onChange={e => set({ objetivo: e.target.value })} rows={2}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm resize-y" />
          </div>

          {/* Doble carril */}
          <div className="grid md:grid-cols-2 gap-3">
            <div className="rounded-lg p-3" style={{ background: "var(--background)" }}>
              <p className="text-[10px] uppercase tracking-wide font-bold mb-2" style={{ color: phase.color }}>Lo que hace Konecta</p>
              <AccionesEditor items={phase.accionesKonecta} onChange={a => set({ accionesKonecta: a })} />
            </div>
            <div className="rounded-lg p-3" style={{ background: "var(--background)" }}>
              <p className="text-[10px] uppercase tracking-wide font-bold mb-2 text-[var(--foreground)]/50">Lo que vive el cliente</p>
              <RecorridoEditor items={phase.recorridoCliente} onChange={r => set({ recorridoCliente: r })} />
            </div>
          </div>

          {/* Documentos */}
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[var(--foreground)]/40 mb-2">Documentos de esta fase</p>
            <DocsEditor items={phase.documentos} onChange={d => set({ documentos: d })} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function FunnelPage() {
  const [funnel, setFunnel] = useState<Funnel>(DEFAULT_FUNNEL);
  const [openId, setOpenId] = useState<string | null>("P1");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [view, setView] = useState<"flujo" | "docs">("flujo");

  const load = async () => {
    try {
      const res = await fetch("/api/admin/crm/funnel", { headers: await authHeaders() });
      const json = await res.json();
      if (json.funnel) setFunnel(json.funnel);
    } catch { /* silencioso */ }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const updatePhase = (id: string, p: FunnelPhase) => {
    setFunnel(f => ({ fases: f.fases.map(x => x.id === id ? p : x) }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/crm/funnel", { method: "POST", headers: await authHeaders(), body: JSON.stringify({ funnel }) });
      setMsg(res.ok ? "Guardado" : "Error al guardar");
      if (res.ok) setDirty(false);
    } catch { setMsg("Error de red"); }
    setSaving(false);
    setTimeout(() => setMsg(null), 2500);
  };

  const restaurar = async () => {
    if (!confirm("¿Restaurar el embudo a los valores por defecto?")) return;
    await fetch("/api/admin/crm/funnel", { method: "DELETE", headers: await authHeaders() });
    setFunnel(DEFAULT_FUNNEL); setDirty(false);
    setMsg("Restaurado");
    setTimeout(() => setMsg(null), 2500);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: "var(--brand-1)" }} />
    </div>;
  }

  // Vista de documentos: todos los docs de todas las fases
  const allDocs = funnel.fases.flatMap(f => f.documentos.map(d => ({ ...d, fase: f.id, faseNombre: f.nombre, color: f.color })));
  const docsListos = allDocs.filter(d => d.estado === "listo").length;

  return (
    <div className="max-w-[1000px] mx-auto pb-12">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/admin/crm/pipeline" className="text-sm text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors">← Pipeline</Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold">Embudo de lanzamiento</h1>
          <p className="text-sm text-[var(--foreground)]/50 mt-0.5">El flujo completo por fases · {docsListos}/{allDocs.length} documentos listos</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {msg && <span className="text-xs px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 font-medium">{msg}</span>}
          {dirty && <span className="text-xs px-2 py-1 rounded-lg bg-amber-400/15 text-amber-400">Sin guardar</span>}
          <button onClick={restaurar} className="px-3 py-2 rounded-lg border border-[var(--border)] text-xs text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors">Restaurar</button>
          <button onClick={save} disabled={saving || !dirty} className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50" style={{ background: "var(--brand-1)", color: "white" }}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>

      {/* Toggle vista */}
      <div className="flex items-center gap-2 mb-5">
        {(["flujo", "docs"] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              view === v ? "border-[var(--brand-1)] text-[var(--brand-1)] bg-[var(--brand-1)]/10"
                : "border-[var(--border)] text-[var(--foreground)]/50 hover:text-[var(--foreground)]"
            }`}>
            {v === "flujo" ? "Flujo por fases" : "Todos los documentos"}
          </button>
        ))}
      </div>

      {view === "flujo" ? (
        <>
          {/* Línea del flujo */}
          <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-2">
            {funnel.fases.map((p, i) => (
              <div key={p.id} className="flex items-center flex-shrink-0">
                <button onClick={() => setOpenId(p.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors"
                  style={{ borderColor: openId === p.id ? p.color : "var(--border)", background: openId === p.id ? `${p.color}15` : "transparent" }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                  <span className="text-[11px] font-semibold whitespace-nowrap">{p.id} {p.nombre}</span>
                </button>
                {i < funnel.fases.length - 1 && <span className="text-[var(--foreground)]/20 mx-0.5">→</span>}
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {funnel.fases.map(phase => (
              <PhaseCard key={phase.id} phase={phase}
                open={openId === phase.id}
                onToggle={() => setOpenId(openId === phase.id ? null : phase.id)}
                onChange={p => updatePhase(phase.id, p)} />
            ))}
          </div>
        </>
      ) : (
        /* Vista de todos los documentos por estado */
        <div className="space-y-2">
          {allDocs.map((d, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2.5" style={{ background: "var(--card)" }}>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0" style={{ background: `${ESTADO_INFO[d.estado].color}22`, color: ESTADO_INFO[d.estado].color }}>
                {ESTADO_INFO[d.estado].label}
              </span>
              <span className="text-sm font-medium flex-1 min-w-[140px]">{d.nombre || "(sin nombre)"}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--border)]/40 text-[var(--foreground)]/60">{d.tipo}</span>
              <span className="text-[10px] text-[var(--foreground)]/40">{DONDE_LABEL[d.donde]}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: `${d.color}22`, color: d.color }}>{d.fase}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
