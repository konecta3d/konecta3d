"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  PIPELINE_COLUMNS, STAGE_BY_KEY, STAGES, getTimeStatus, TIME_STATUS_COLOR,
  PERFIL_INFO, FUENTES, SECTORES, ASIGNADOS, PERFILES, StageKey,
} from "@/lib/crm/stages";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Lead {
  id: string;
  nombre: string;
  empresa: string | null;
  sector: string | null;
  email: string | null;
  telefono: string | null;
  etapa: string;
  etapa_index: number;
  etapa_entered_at: string;
  score: number;
  perfil: string | null;
  fuente: string | null;
  proxima_feria: string | null;
  unidades_estimadas: number | null;
  revenue_estimado: number;
  asignado_a: string | null;
  proxima_accion: string | null;
  fecha_proxima_accion: string | null;
}

// ─── Helpers de red ───────────────────────────────────────────────────────────

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${data.session?.access_token || ""}`,
  };
}

// ─── Tarjeta de lead ──────────────────────────────────────────────────────────

function LeadCard({ lead, onMove }: { lead: Lead; onMove: (id: string, etapa: StageKey) => void }) {
  const time = getTimeStatus(lead.etapa, lead.etapa_entered_at);
  const perfil = lead.perfil ? PERFIL_INFO[lead.perfil as keyof typeof PERFIL_INFO] : null;
  const idx = lead.etapa_index;

  const prevStage = STAGES.find(s => s.index === idx - 1);
  const nextStage = STAGES.find(s => s.index === idx + 1);

  return (
    <div
      className="rounded-lg border border-[var(--border)] p-3 space-y-2"
      style={{ background: "var(--card)" }}
    >
      <Link href={`/admin/crm/pipeline/${lead.id}`} className="block group">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--foreground)] truncate group-hover:underline">
              {lead.nombre}
            </p>
            {lead.empresa && (
              <p className="text-xs text-[var(--foreground)]/50 truncate">{lead.empresa}</p>
            )}
          </div>
          {perfil && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: `${perfil.color}22`, color: perfil.color }}
              title={`Perfil ${lead.perfil} — ${perfil.label}`}
            >
              {lead.perfil}
            </span>
          )}
        </div>
      </Link>

      {/* Semáforo de tiempo */}
      {time.status !== "none" && (
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: TIME_STATUS_COLOR[time.status] }}
          />
          <span className="text-[11px] text-[var(--foreground)]/50">
            {time.days === 0 ? "Hoy" : `${time.days} ${time.days === 1 ? "día" : "días"} en etapa`}
          </span>
        </div>
      )}

      {/* Metadatos */}
      <div className="flex flex-wrap gap-1.5 text-[10px]">
        {lead.asignado_a && (
          <span className="px-1.5 py-0.5 rounded bg-[var(--border)]/40 text-[var(--foreground)]/60">
            {lead.asignado_a}
          </span>
        )}
        {lead.proxima_feria && (
          <span className="px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-500">
            Feria {new Date(lead.proxima_feria).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
          </span>
        )}
        {lead.revenue_estimado > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-green-500/15 text-green-500">
            {lead.revenue_estimado.toLocaleString("es-ES")}€
          </span>
        )}
      </div>

      {/* Próxima acción */}
      {lead.proxima_accion && (
        <p className="text-[11px] text-[var(--foreground)]/60 border-t border-[var(--border)] pt-1.5">
          → {lead.proxima_accion}
        </p>
      )}

      {/* Mover entre etapas */}
      <div className="flex items-center justify-between gap-1 pt-1">
        <button
          type="button"
          disabled={!prevStage}
          onClick={() => prevStage && onMove(lead.id, prevStage.key)}
          className="flex-1 text-[10px] py-1 rounded border border-[var(--border)] text-[var(--foreground)]/50 hover:text-[var(--foreground)] hover:bg-[var(--border)]/20 disabled:opacity-20 transition-colors"
          title={prevStage ? `Mover a ${prevStage.label}` : ""}
        >
          ‹
        </button>
        <button
          type="button"
          disabled={!nextStage}
          onClick={() => nextStage && onMove(lead.id, nextStage.key)}
          className="flex-1 text-[10px] py-1 rounded border border-[var(--border)] text-[var(--foreground)]/50 hover:text-[var(--foreground)] hover:bg-[var(--border)]/20 disabled:opacity-20 transition-colors"
          title={nextStage ? `Mover a ${nextStage.label}` : ""}
        >
          ›
        </button>
      </div>
    </div>
  );
}

// ─── Modal nuevo lead ─────────────────────────────────────────────────────────

function NewLeadModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    nombre: "", empresa: "", sector: "", email: "", telefono: "", whatsapp: "",
    perfil: "", fuente: "", asignado_a: "", proxima_feria: "",
    unidades_estimadas: "", score: "", proxima_accion: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.nombre.trim()) { setError("El nombre es obligatorio"); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/crm/leads", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify(form),
      });
      if (res.ok) { onCreated(); onClose(); }
      else { const d = await res.json(); setError(d.error || "Error al crear"); }
    } catch {
      setError("Error de red");
    }
    setSaving(false);
  };

  const inputCls = "w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] flex flex-col"
        style={{ background: "var(--card)", maxHeight: "90vh" }}>
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)] flex-shrink-0">
          <h2 className="text-base font-bold">Nuevo lead</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--foreground)]/40 hover:text-[var(--foreground)] hover:bg-[var(--border)]/30 transition-colors">✕</button>
        </div>

        <div className="p-5 space-y-3 overflow-y-auto">
          <div>
            <label className="block text-xs text-[var(--foreground)]/50 mb-1">Nombre *</label>
            <input className={inputCls} value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Nombre del contacto" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--foreground)]/50 mb-1">Empresa</label>
              <input className={inputCls} value={form.empresa} onChange={e => set("empresa", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)]/50 mb-1">Sector</label>
              <select className={inputCls} value={form.sector} onChange={e => set("sector", e.target.value)}>
                <option value="">—</option>
                {SECTORES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--foreground)]/50 mb-1">Email</label>
              <input className={inputCls} value={form.email} onChange={e => set("email", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)]/50 mb-1">Teléfono</label>
              <input className={inputCls} value={form.telefono} onChange={e => set("telefono", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-[var(--foreground)]/50 mb-1">Perfil</label>
              <select className={inputCls} value={form.perfil} onChange={e => set("perfil", e.target.value)}>
                <option value="">—</option>
                {PERFILES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)]/50 mb-1">Fuente</label>
              <select className={inputCls} value={form.fuente} onChange={e => set("fuente", e.target.value)}>
                <option value="">—</option>
                {FUENTES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)]/50 mb-1">Asignado</label>
              <select className={inputCls} value={form.asignado_a} onChange={e => set("asignado_a", e.target.value)}>
                <option value="">—</option>
                {ASIGNADOS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-[var(--foreground)]/50 mb-1">Próxima feria</label>
              <input type="date" className={inputCls} value={form.proxima_feria} onChange={e => set("proxima_feria", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)]/50 mb-1">Unidades est.</label>
              <input type="number" className={inputCls} value={form.unidades_estimadas} onChange={e => set("unidades_estimadas", e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)]/50 mb-1">Score (0-25)</label>
              <input type="number" className={inputCls} value={form.score} onChange={e => set("score", e.target.value)} placeholder="0" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[var(--foreground)]/50 mb-1">Próxima acción</label>
            <input className={inputCls} value={form.proxima_accion} onChange={e => set("proxima_accion", e.target.value)} placeholder="Ej: Llamar para agendar demo" />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 p-5 border-t border-[var(--border)] flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors">Cancelar</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50" style={{ background: "var(--brand-1)", color: "white" }}>
            {saving ? "Creando…" : "Crear lead"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function CrmPipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [filterAsignado, setFilterAsignado] = useState("todos");
  const [filterPerfil, setFilterPerfil] = useState("todos");

  const load = async () => {
    try {
      const res = await fetch("/api/admin/crm/leads", { headers: await authHeaders() });
      const json = await res.json();
      if (json.leads) setLeads(json.leads);
    } catch { /* silencioso */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const move = async (id: string, etapa: StageKey) => {
    // Optimista
    setLeads(prev => prev.map(l =>
      l.id === id
        ? { ...l, etapa, etapa_index: STAGE_BY_KEY[etapa].index, etapa_entered_at: new Date().toISOString() }
        : l
    ));
    try {
      await fetch(`/api/admin/crm/leads/${id}/move`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ etapa }),
      });
    } catch {
      load(); // revertir desde servidor si falla
    }
  };

  const filtered = useMemo(() => leads.filter(l => {
    if (filterAsignado !== "todos" && l.asignado_a !== filterAsignado) return false;
    if (filterPerfil !== "todos" && l.perfil !== filterPerfil) return false;
    return true;
  }), [leads, filterAsignado, filterPerfil]);

  const byStage = (key: string) => filtered.filter(l => l.etapa === key);

  // Totales
  const totalRevenue = filtered
    .filter(l => !["perdido"].includes(l.etapa))
    .reduce((sum, l) => sum + (l.revenue_estimado || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: "var(--brand-1)" }} />
      </div>
    );
  }

  return (
    <div className="pb-12">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold">Pipeline de ventas</h1>
          <p className="text-sm text-[var(--foreground)]/50 mt-0.5">
            {filtered.length} leads · {totalRevenue.toLocaleString("es-ES")}€ en pipeline
          </p>
        </div>
        <button onClick={() => setShowNew(true)} className="px-4 py-2 rounded-lg text-sm font-semibold self-start" style={{ background: "var(--brand-1)", color: "white" }}>
          + Nuevo lead
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <span className="text-xs text-[var(--foreground)]/40">Asignado:</span>
        {["todos", ...ASIGNADOS].map(a => (
          <button key={a} onClick={() => setFilterAsignado(a)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              filterAsignado === a
                ? "border-[var(--brand-1)] text-[var(--brand-1)] bg-[var(--brand-1)]/10"
                : "border-[var(--border)] text-[var(--foreground)]/50 hover:text-[var(--foreground)]"
            }`}>
            {a === "todos" ? "Todos" : a}
          </button>
        ))}
        <span className="text-xs text-[var(--foreground)]/40 ml-3">Perfil:</span>
        {["todos", ...PERFILES].map(p => (
          <button key={p} onClick={() => setFilterPerfil(p)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              filterPerfil === p
                ? "border-[var(--brand-1)] text-[var(--brand-1)] bg-[var(--brand-1)]/10"
                : "border-[var(--border)] text-[var(--foreground)]/50 hover:text-[var(--foreground)]"
            }`}>
            {p === "todos" ? "Todos" : p}
          </button>
        ))}
      </div>

      {/* Kanban */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3" style={{ minWidth: "min-content" }}>
          {PIPELINE_COLUMNS.map(stageKey => {
            const stage = STAGE_BY_KEY[stageKey];
            const items = byStage(stageKey);
            return (
              <div key={stageKey} className="flex-shrink-0 w-64">
                {/* Cabecera de columna */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: stage.color }} />
                    <span className="text-xs font-semibold text-[var(--foreground)]/70">{stage.label}</span>
                  </div>
                  <span className="text-xs text-[var(--foreground)]/30">{items.length}</span>
                </div>
                {/* Tarjetas */}
                <div className="space-y-2 rounded-xl p-2 min-h-[120px]" style={{ background: "var(--background)" }}>
                  {items.length === 0 ? (
                    <p className="text-[11px] text-[var(--foreground)]/25 text-center py-4">Sin leads</p>
                  ) : (
                    items.map(lead => <LeadCard key={lead.id} lead={lead} onMove={move} />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showNew && <NewLeadModal onClose={() => setShowNew(false)} onCreated={load} />}
    </div>
  );
}
