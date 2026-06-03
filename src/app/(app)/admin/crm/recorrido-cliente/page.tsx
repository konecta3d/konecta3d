"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  LaunchFunnel, LaunchStage, FunnelObjective, FunnelMessage, FunnelDoc,
  DEFAULT_LAUNCH_FUNNEL,
} from "@/lib/crm/launch-funnel";

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  return { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token || ""}` };
}

const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));
const inputCls = "px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm";

// ─── Expandible ───────────────────────────────────────────────────────────────
function Expandible({ titulo, count, color, children, defaultOpen }: {
  titulo: string; count: number; color: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden" style={{ background: "var(--card)" }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--border)]/10 transition-colors">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
          <h3 className="text-sm font-bold">{titulo}</h3>
          <span className="text-xs text-[var(--foreground)]/40">({count})</span>
        </div>
        <span className="text-[var(--foreground)]/30 text-lg">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// ─── Editor de objetivos ──────────────────────────────────────────────────────
function ObjetivosEditor({ items, onChange }: { items: FunnelObjective[]; onChange: (i: FunnelObjective[]) => void }) {
  const set = (idx: number, field: keyof FunnelObjective, v: string) => {
    const n = [...items]; n[idx] = { ...n[idx], [field]: v }; onChange(n);
  };
  return (
    <div className="space-y-2">
      {items.map((o, i) => (
        <div key={o.id} className="rounded-lg border border-[var(--border)] p-3 group" style={{ background: "var(--background)" }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wide text-[var(--foreground)]/40">Objetivo {i + 1}</span>
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
          </div>
          <input value={o.titulo} onChange={e => set(i, "titulo", e.target.value)} className={inputCls + " w-full font-semibold mb-2"} placeholder="Título del objetivo" />
          <div className="flex items-center gap-1.5">
            <span className="text-green-500 text-xs flex-shrink-0">✓</span>
            <input value={o.check} onChange={e => set(i, "check", e.target.value)} className={inputCls + " w-full text-xs"} placeholder="Qué confirma que está cumplido" />
          </div>
        </div>
      ))}
      <button onClick={() => onChange([...items, { id: uid(), titulo: "", check: "" }])}
        className="text-[11px] px-2.5 py-1 rounded-lg border border-dashed border-[var(--border)] text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors">
        + Objetivo
      </button>
    </div>
  );
}

// ─── Editor de mensajes (con copiar y vínculo a objetivo) ─────────────────────
function MensajesEditor({ items, objetivos, onChange }: {
  items: FunnelMessage[]; objetivos: FunnelObjective[]; onChange: (i: FunnelMessage[]) => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const set = (idx: number, field: keyof FunnelMessage, v: string) => {
    const n = [...items]; n[idx] = { ...n[idx], [field]: v }; onChange(n);
  };
  const copy = (m: FunnelMessage) => {
    navigator.clipboard.writeText(m.contenido);
    setCopied(m.id);
    setTimeout(() => setCopied(null), 1500);
  };
  return (
    <div className="space-y-2">
      {items.map((m, i) => (
        <div key={m.id} className="rounded-lg border border-[var(--border)] p-3 group" style={{ background: "var(--background)" }}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <input value={m.titulo} onChange={e => set(i, "titulo", e.target.value)} className="flex-1 px-2 py-1 rounded border border-[var(--border)] bg-[var(--card)] text-sm font-semibold" placeholder="Título del mensaje" />
            <button onClick={() => copy(m)} className="text-[11px] px-2 py-1 rounded-lg border border-[var(--brand-1)]/40 text-[var(--brand-1)] hover:bg-[var(--brand-1)]/10 transition-colors flex-shrink-0">
              {copied === m.id ? "Copiado ✓" : "Copiar"}
            </button>
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">✕</button>
          </div>
          {objetivos.length > 0 && (
            <select value={m.objetivoId || ""} onChange={e => set(i, "objetivoId", e.target.value)} className="text-[11px] px-2 py-1 rounded border border-[var(--border)] bg-[var(--card)] mb-2 w-full">
              <option value="">— Sin objetivo asignado —</option>
              {objetivos.map(o => <option key={o.id} value={o.id}>{o.titulo || "(objetivo sin título)"}</option>)}
            </select>
          )}
          <textarea value={m.contenido} onChange={e => set(i, "contenido", e.target.value)}
            rows={Math.max(2, m.contenido.split("\n").length)}
            className="w-full px-2.5 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm resize-y" placeholder="Contenido del mensaje (lo que envías al cliente)" />
        </div>
      ))}
      <button onClick={() => onChange([...items, { id: uid(), titulo: "", contenido: "", objetivoId: "" }])}
        className="text-[11px] px-2.5 py-1 rounded-lg border border-dashed border-[var(--border)] text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors">
        + Mensaje
      </button>
    </div>
  );
}

// ─── Editor de documentos ─────────────────────────────────────────────────────
function DocumentosEditor({ items, onChange }: { items: FunnelDoc[]; onChange: (i: FunnelDoc[]) => void }) {
  const set = (idx: number, field: keyof FunnelDoc, v: string) => {
    const n = [...items]; n[idx] = { ...n[idx], [field]: v } as FunnelDoc; onChange(n);
  };
  return (
    <div className="space-y-1.5">
      {items.map((d, i) => (
        <div key={d.id} className="flex items-center gap-2 group rounded-lg border border-[var(--border)] p-2" style={{ background: "var(--background)" }}>
          <button onClick={() => set(i, "estado", d.estado === "existe" ? "por_crear" : "existe")}
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
            style={{ background: d.estado === "existe" ? "rgba(34,197,94,0.15)" : "var(--border)", color: d.estado === "existe" ? "#22c55e" : "var(--foreground)" }}
            title="Click para cambiar estado">
            {d.estado === "existe" ? "Listo" : "Por crear"}
          </button>
          <input value={d.nombre} onChange={e => set(i, "nombre", e.target.value)} className="flex-1 px-2 py-1 rounded border border-[var(--border)] bg-[var(--card)] text-sm" placeholder="Nombre del documento" />
          <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">✕</button>
        </div>
      ))}
      <button onClick={() => onChange([...items, { id: uid(), nombre: "", estado: "por_crear" }])}
        className="text-[11px] px-2.5 py-1 rounded-lg border border-dashed border-[var(--border)] text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors">
        + Documento
      </button>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function RecorridoClientePage() {
  const [funnel, setFunnel] = useState<LaunchFunnel>(DEFAULT_LAUNCH_FUNNEL);
  const [selectedId, setSelectedId] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/crm/launch-funnel", { headers: await authHeaders() });
      const json = await res.json();
      if (json.funnel) setFunnel(json.funnel);
    } catch { /* silencioso */ }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const stage = funnel.stages.find(s => s.id === selectedId) || funnel.stages[0];

  const updateStage = (patch: Partial<LaunchStage>) => {
    setFunnel(f => ({ stages: f.stages.map(s => s.id === selectedId ? { ...s, ...patch } : s) }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/crm/launch-funnel", { method: "POST", headers: await authHeaders(), body: JSON.stringify({ funnel }) });
      setMsg(res.ok ? "Guardado" : "Error al guardar");
      if (res.ok) setDirty(false);
    } catch { setMsg("Error de red"); }
    setSaving(false);
    setTimeout(() => setMsg(null), 2500);
  };

  const restaurar = async () => {
    if (!confirm("¿Restaurar el recorrido a los valores por defecto?")) return;
    await fetch("/api/admin/crm/launch-funnel", { method: "DELETE", headers: await authHeaders() });
    setFunnel(DEFAULT_LAUNCH_FUNNEL); setDirty(false);
    setMsg("Restaurado");
    setTimeout(() => setMsg(null), 2500);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: "var(--brand-1)" }} />
    </div>;
  }

  return (
    <div className="max-w-[1000px] mx-auto pb-12">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/admin/crm/pipeline" className="text-sm text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors">← CRM</Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold">Recorrido del cliente</h1>
          <p className="text-sm text-[var(--foreground)]/50 mt-0.5">El embudo de lanzamiento, editable. Objetivos, mensajes y documentos por etapa.</p>
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

      {/* Flujo de etapas */}
      <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-2">
        {funnel.stages.map((s, i) => (
          <div key={s.id} className="flex items-center flex-shrink-0">
            <button onClick={() => setSelectedId(s.id)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors"
              style={{ borderColor: selectedId === s.id ? s.color : "var(--border)", background: selectedId === s.id ? `${s.color}15` : "transparent" }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: s.color }}>{s.id}</span>
              <span className="text-[11px] font-semibold whitespace-nowrap">{s.nombre}</span>
            </button>
            {i < funnel.stages.length - 1 && <span className="text-[var(--foreground)]/20 mx-0.5">→</span>}
          </div>
        ))}
      </div>

      {/* Cabecera de etapa editable */}
      <div className="rounded-xl border border-[var(--border)] p-4 mb-4" style={{ background: "var(--card)" }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white flex-shrink-0" style={{ background: stage.color }}>{stage.id}</span>
          <input value={stage.nombre} onChange={e => updateStage({ nombre: e.target.value })} className="flex-1 px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-base font-bold" />
        </div>
        <textarea value={stage.proposito} onChange={e => updateStage({ proposito: e.target.value })} rows={2} className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm resize-y" placeholder="Propósito de la etapa" />
      </div>

      {/* Expandibles */}
      <div className="space-y-3">
        <Expandible titulo="Objetivos" count={stage.objetivos.length} color={stage.color} defaultOpen>
          <ObjetivosEditor items={stage.objetivos} onChange={items => updateStage({ objetivos: items })} />
        </Expandible>

        <Expandible titulo="Mensajes" count={stage.mensajes.length} color={stage.color} defaultOpen>
          <MensajesEditor items={stage.mensajes} objetivos={stage.objetivos} onChange={items => updateStage({ mensajes: items })} />
        </Expandible>

        <Expandible titulo="Documentos" count={stage.documentos.length} color={stage.color}>
          <DocumentosEditor items={stage.documentos} onChange={items => updateStage({ documentos: items })} />
        </Expandible>

        {stage.fases && (
          <Expandible titulo="Fases del onboarding" count={stage.fases.length} color={stage.color}>
            <div className="space-y-2">
              {stage.fases.map((f) => (
                <div key={f.id} className="rounded-lg border border-[var(--border)] p-3" style={{ background: "var(--background)" }}>
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold">{f.nombre}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--border)]/40 text-[var(--foreground)]/60">{f.seccion}</span>
                  </div>
                  <p className="text-xs text-[var(--foreground)]/60">{f.objetivo}</p>
                  <p className="text-[11px] text-green-500/80 mt-1">✓ {f.check}</p>
                  <p className="text-[10px] text-[var(--foreground)]/40 mt-0.5">📄 {f.documento}</p>
                </div>
              ))}
              <p className="text-[10px] text-[var(--foreground)]/30 italic">Las fases se editarán en la siguiente iteración.</p>
            </div>
          </Expandible>
        )}
      </div>
    </div>
  );
}
