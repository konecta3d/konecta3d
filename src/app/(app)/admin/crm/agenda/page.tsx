"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { PERFIL_INFO, getStage } from "@/lib/crm/stages";

interface Lead {
  id: string; nombre: string; empresa: string | null;
  etapa: string; perfil: string | null;
  proxima_feria: string | null; ultimo_contacto: string | null;
  proxima_accion: string | null; fecha_proxima_accion: string | null;
  asignado_a: string | null; revenue_estimado: number;
}

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${data.session?.access_token || ""}` };
}

const CERRADOS = ["ganado", "perdido", "cliente_activo", "cliente_recurrente"];

function daysSince(date: string | null): number | null {
  if (!date) return null;
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}
function daysUntil(date: string | null): number | null {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function PerfilBadge({ perfil }: { perfil: string | null }) {
  if (!perfil) return null;
  const p = PERFIL_INFO[perfil as keyof typeof PERFIL_INFO];
  return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${p.color}22`, color: p.color }}>{perfil}</span>;
}

function LeadRow({ lead, extra }: { lead: Lead; extra: React.ReactNode }) {
  const stage = getStage(lead.etapa);
  return (
    <Link href={`/admin/crm/pipeline/${lead.id}`}
      className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-3 py-2.5 hover:bg-[var(--border)]/10 transition-colors"
      style={{ background: "var(--card)" }}>
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: stage?.color }} title={stage?.label} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold truncate">{lead.nombre}</span>
          <PerfilBadge perfil={lead.perfil} />
        </div>
        {lead.empresa && <span className="text-xs text-[var(--foreground)]/50 truncate">{lead.empresa}</span>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 text-right">
        {lead.asignado_a && <span className="text-[10px] text-[var(--foreground)]/40">{lead.asignado_a}</span>}
        {extra}
      </div>
    </Link>
  );
}

export default function CrmAgendaPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/crm/leads", { headers: await authHeaders() });
        const json = await res.json();
        if (json.leads) setLeads(json.leads);
      } catch { /* silencioso */ }
      setLoading(false);
    })();
  }, []);

  const activos = useMemo(() => leads.filter(l => !CERRADOS.includes(l.etapa)), [leads]);

  // Ferias próximas (próximos 45 días), ordenadas por fecha
  const feriasProximas = useMemo(() => activos
    .filter(l => l.proxima_feria && (daysUntil(l.proxima_feria) ?? -1) >= 0 && (daysUntil(l.proxima_feria) ?? 999) <= 45)
    .sort((a, b) => (a.proxima_feria! < b.proxima_feria! ? -1 : 1)), [activos]);

  // Próximas acciones pendientes (fecha <= hoy + 7 días)
  const proximasAcciones = useMemo(() => activos
    .filter(l => l.fecha_proxima_accion && (daysUntil(l.fecha_proxima_accion) ?? 999) <= 7)
    .sort((a, b) => (a.fecha_proxima_accion! < b.fecha_proxima_accion! ? -1 : 1)), [activos]);

  // Sin contacto > 7 días (o nunca contactados)
  const sinContacto = useMemo(() => activos
    .filter(l => {
      const d = daysSince(l.ultimo_contacto);
      return d === null || d >= 7;
    })
    .sort((a, b) => (daysSince(b.ultimo_contacto) ?? 999) - (daysSince(a.ultimo_contacto) ?? 999)), [activos]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: "var(--brand-1)" }} />
    </div>;
  }

  return (
    <div className="max-w-[1100px] mx-auto pb-12">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/admin/crm/pipeline" className="text-sm text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors">← Pipeline</Link>
      </div>

      <div className="mb-6">
        <h1 className="text-xl font-bold">Agenda comercial</h1>
        <p className="text-sm text-[var(--foreground)]/50 mt-0.5">Lo que necesita tu atención ahora</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 items-start">

        {/* Próximas acciones */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold">Próximas acciones</h2>
            <span className="text-xs text-[var(--foreground)]/30">{proximasAcciones.length}</span>
          </div>
          {proximasAcciones.length === 0 ? (
            <p className="text-xs text-[var(--foreground)]/30 py-4 text-center">Nada pendiente.</p>
          ) : proximasAcciones.map(l => {
            const d = daysUntil(l.fecha_proxima_accion);
            const overdue = (d ?? 0) < 0;
            return <LeadRow key={l.id} lead={l} extra={
              <div className="flex flex-col items-end">
                <span className={`text-[10px] ${overdue ? "text-red-400 font-semibold" : "text-[var(--foreground)]/40"}`}>
                  {overdue ? "Vencida" : d === 0 ? "Hoy" : `${d}d`}
                </span>
                {l.proxima_accion && <span className="text-[9px] text-[var(--foreground)]/40 max-w-[120px] truncate">{l.proxima_accion}</span>}
              </div>
            } />;
          })}
        </section>

        {/* Ferias próximas */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold">Ferias próximas</h2>
            <span className="text-xs text-[var(--foreground)]/30">{feriasProximas.length}</span>
          </div>
          {feriasProximas.length === 0 ? (
            <p className="text-xs text-[var(--foreground)]/30 py-4 text-center">Ninguna en 45 días.</p>
          ) : feriasProximas.map(l => {
            const d = daysUntil(l.proxima_feria);
            const urgent = (d ?? 99) <= 14;
            return <LeadRow key={l.id} lead={l} extra={
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${urgent ? "bg-amber-400/20 text-amber-500 font-semibold" : "bg-[var(--border)]/40 text-[var(--foreground)]/50"}`}>
                {d === 0 ? "Hoy" : `${d}d`}
              </span>
            } />;
          })}
        </section>

        {/* Sin contacto */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold">Se están enfriando</h2>
            <span className="text-xs text-[var(--foreground)]/30">{sinContacto.length}</span>
          </div>
          {sinContacto.length === 0 ? (
            <p className="text-xs text-[var(--foreground)]/30 py-4 text-center">Todos al día.</p>
          ) : sinContacto.map(l => {
            const d = daysSince(l.ultimo_contacto);
            return <LeadRow key={l.id} lead={l} extra={
              <span className="text-[10px] text-red-400">
                {d === null ? "Nunca" : `${d}d`}
              </span>
            } />;
          })}
        </section>
      </div>
    </div>
  );
}
