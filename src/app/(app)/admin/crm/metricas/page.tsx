"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { STAGES, PERFIL_INFO, getStage } from "@/lib/crm/stages";

interface Metrics {
  total: number;
  activos: number;
  porEtapa: Record<string, number>;
  porPerfil: Record<string, number>;
  revenuePipeline: number;
  revenueGanado: number;
  ganados: number;
  perdidos: number;
  tasaConversion: number;
  nuevosSemana: number;
  nuevosMes: number;
  tiempoMedioEtapa: Record<string, number>;
}

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${data.session?.access_token || ""}` };
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] p-4" style={{ background: "var(--card)" }}>
      <p className="text-xs text-[var(--foreground)]/50 mb-1">{label}</p>
      <p className="text-2xl font-bold" style={accent ? { color: accent } : {}}>{value}</p>
      {sub && <p className="text-[11px] text-[var(--foreground)]/40 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function CrmMetricsPage() {
  const [m, setM] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/crm/metrics", { headers: await authHeaders() });
        const json = await res.json();
        if (!json.error) setM(json);
      } catch { /* silencioso */ }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: "var(--brand-1)" }} />
    </div>;
  }
  if (!m) return <div className="text-center py-12 text-[var(--foreground)]/50">No se pudieron cargar las métricas.</div>;

  const maxEtapa = Math.max(1, ...Object.values(m.porEtapa));

  return (
    <div className="max-w-[1100px] mx-auto pb-12">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/admin/crm/pipeline" className="text-sm text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors">← Pipeline</Link>
      </div>

      <div className="mb-6">
        <h1 className="text-xl font-bold">Métricas</h1>
        <p className="text-sm text-[var(--foreground)]/50 mt-0.5">Estado del pipeline en tiempo real</p>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Leads activos" value={String(m.activos)} sub={`${m.total} en total`} />
        <StatCard label="Revenue en pipeline" value={`${m.revenuePipeline.toLocaleString("es-ES")}€`} sub="leads sin cerrar" accent="#22c55e" />
        <StatCard label="Tasa de conversión" value={`${m.tasaConversion}%`} sub={`${m.ganados} ganados · ${m.perdidos} perdidos`} accent="var(--brand-1)" />
        <StatCard label="Revenue ganado" value={`${m.revenueGanado.toLocaleString("es-ES")}€`} sub="clientes cerrados" accent="#0ea5e9" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard label="Nuevos esta semana" value={`+${m.nuevosSemana}`} />
        <StatCard label="Nuevos este mes" value={`+${m.nuevosMes}`} />
        <StatCard label="Clientes activos" value={String((m.porEtapa["cliente_activo"] || 0) + (m.porEtapa["cliente_recurrente"] || 0))} />
        <StatCard label="Perfil A" value={String(m.porPerfil["A"] || 0)} sub="leads ideales" accent={PERFIL_INFO.A.color} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">

        {/* Embudo por etapa */}
        <section className="rounded-xl border border-[var(--border)] p-5" style={{ background: "var(--card)" }}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground)]/50 mb-4">Leads por etapa</h2>
          <div className="space-y-2">
            {STAGES.map(s => {
              const count = m.porEtapa[s.key] || 0;
              const pct = (count / maxEtapa) * 100;
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <span className="text-xs text-[var(--foreground)]/60 w-32 flex-shrink-0 truncate">{s.label}</span>
                  <div className="flex-1 h-6 rounded-md overflow-hidden" style={{ background: "var(--background)" }}>
                    <div className="h-full rounded-md flex items-center justify-end px-2 transition-all"
                      style={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%`, background: s.color }}>
                      {count > 0 && <span className="text-[10px] font-bold text-white">{count}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Tiempo medio por etapa */}
        <section className="rounded-xl border border-[var(--border)] p-5" style={{ background: "var(--card)" }}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground)]/50 mb-4">Tiempo medio por etapa</h2>
          {Object.keys(m.tiempoMedioEtapa).length === 0 ? (
            <p className="text-xs text-[var(--foreground)]/30 py-4 text-center">Aún no hay suficiente historial. Los tiempos aparecen cuando los leads avanzan entre etapas.</p>
          ) : (
            <div className="space-y-2.5">
              {STAGES.filter(s => m.tiempoMedioEtapa[s.key] !== undefined).map(s => {
                const dias = m.tiempoMedioEtapa[s.key];
                return (
                  <div key={s.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      <span className="text-xs text-[var(--foreground)]/70">{s.label}</span>
                    </div>
                    <span className="text-xs font-semibold">
                      {dias < 1 ? `${Math.round(dias * 24)}h` : `${dias.toFixed(1)} días`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Distribución por perfil */}
      <section className="rounded-xl border border-[var(--border)] p-5 mt-6" style={{ background: "var(--card)" }}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground)]/50 mb-4">Distribución por perfil</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {(["A", "B", "C", "D"] as const).map(p => (
            <div key={p} className="text-center p-3 rounded-lg" style={{ background: "var(--background)" }}>
              <p className="text-2xl font-bold" style={{ color: PERFIL_INFO[p].color }}>{m.porPerfil[p] || 0}</p>
              <p className="text-xs text-[var(--foreground)]/50 mt-0.5">Perfil {p}</p>
              <p className="text-[10px] text-[var(--foreground)]/30">{PERFIL_INFO[p].label}</p>
            </div>
          ))}
          <div className="text-center p-3 rounded-lg" style={{ background: "var(--background)" }}>
            <p className="text-2xl font-bold text-[var(--foreground)]/40">{m.porPerfil["sin"] || 0}</p>
            <p className="text-xs text-[var(--foreground)]/50 mt-0.5">Sin perfil</p>
            <p className="text-[10px] text-[var(--foreground)]/30">por cualificar</p>
          </div>
        </div>
      </section>
    </div>
  );
}
