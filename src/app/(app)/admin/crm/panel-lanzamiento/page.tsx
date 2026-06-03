"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { LaunchFunnel, DEFAULT_LAUNCH_FUNNEL } from "@/lib/crm/launch-funnel";

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${data.session?.access_token || ""}` };
}

interface Journey {
  id: string; nombre: string; etapa_actual: number;
  objetivos_cumplidos: string[];
  fecha_proxima_accion: string | null; siguiente_accion: string | null;
  etapa_entered_at: string;
}

const DIAS_ESTANCADO = 7;

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] p-4" style={{ background: "var(--card)" }}>
      <p className="text-xs text-[var(--foreground)]/50 mb-1">{label}</p>
      <p className="text-2xl font-bold" style={color ? { color } : {}}>{value}</p>
      {sub && <p className="text-[11px] text-[var(--foreground)]/40 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function PanelLanzamientoPage() {
  const [funnel, setFunnel] = useState<LaunchFunnel>(DEFAULT_LAUNCH_FUNNEL);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const headers = await authHeaders();
        const [fRes, jRes] = await Promise.all([
          fetch("/api/admin/crm/launch-funnel", { headers }),
          fetch("/api/admin/crm/journey", { headers }),
        ]);
        const fJson = await fRes.json();
        if (fJson.funnel) setFunnel(fJson.funnel);
        const jJson = await jRes.json();
        if (jJson.journeys) setJourneys(jJson.journeys.map((j: Journey) => ({ ...j, objetivos_cumplidos: j.objetivos_cumplidos || [] })));
      } catch { /* silencioso */ }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: "var(--brand-1)" }} />
    </div>;
  }

  const stages = Array.isArray(funnel?.stages) ? funnel.stages : [];
  const hoyISO = new Date().toISOString().slice(0, 10);
  const diasEnEtapa = (j: Journey) => Math.floor((Date.now() - new Date(j.etapa_entered_at).getTime()) / 86400000);

  // Métricas
  const total = journeys.length;
  const activados = journeys.filter(j => j.etapa_actual >= 3).length;
  const clientesPago = journeys.filter(j => j.etapa_actual >= 6).length;

  const estancados = journeys.filter(j => j.etapa_actual < 7 && diasEnEtapa(j) >= DIAS_ESTANCADO);
  const accionesVencidas = journeys.filter(j => j.fecha_proxima_accion && j.fecha_proxima_accion < hoyISO);
  const listosParaAvanzar = journeys.filter(j => {
    if (j.etapa_actual >= 7) return false;
    const stage = stages.find(s => s.id === j.etapa_actual);
    const objetivos = stage?.objetivos || [];
    if (objetivos.length === 0) return false;
    return objetivos.every(o => (j.objetivos_cumplidos || []).includes(o.id));
  });

  // Embudo agregado
  const maxCount = Math.max(1, ...stages.map(s => journeys.filter(j => j.etapa_actual === s.id).length));
  const stageName = (n: number) => stages.find(s => s.id === n)?.nombre || `Etapa ${n}`;

  return (
    <div className="max-w-[1000px] mx-auto pb-12">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/admin/crm/seguimiento" className="text-sm text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors">← Seguimiento</Link>
      </div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">Panel de lanzamiento</h1>
        <p className="text-sm text-[var(--foreground)]/50 mt-0.5">La foto de conjunto: dónde está cada negocio y qué necesita tu atención.</p>
      </div>

      {total === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-[var(--border)]">
          <p className="text-sm text-[var(--foreground)]/40">Aún no hay negocios en seguimiento.</p>
          <Link href="/admin/crm/seguimiento" className="text-sm text-[var(--brand-1)] hover:underline mt-1 inline-block">Añadir el primero →</Link>
        </div>
      ) : (
        <>
          {/* Números clave */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard label="Negocios en seguimiento" value={total} />
            <StatCard label="Activados (etapa 3+)" value={activados} sub="ya usan el llavero nuevo" color="#2dd4bf" />
            <StatCard label="Clientes de pago" value={clientesPago} sub="etapa 6+" color="#22c55e" />
            <StatCard label="Estancados" value={estancados.length} sub={`+${DIAS_ESTANCADO} días sin avanzar`} color={estancados.length > 0 ? "#f97316" : undefined} />
          </div>

          {/* Embudo agregado */}
          <section className="rounded-xl border border-[var(--border)] p-5 mb-6" style={{ background: "var(--card)" }}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground)]/50 mb-4">Negocios por etapa</h2>
            <div className="space-y-2">
              {stages.map(s => {
                const count = journeys.filter(j => j.etapa_actual === s.id).length;
                const pct = (count / maxCount) * 100;
                return (
                  <div key={s.id} className="flex items-center gap-3">
                    <span className="text-xs text-[var(--foreground)]/60 w-32 flex-shrink-0 truncate">{s.id}. {s.nombre}</span>
                    <div className="flex-1 h-6 rounded-md overflow-hidden" style={{ background: "var(--background)" }}>
                      <div className="h-full rounded-md flex items-center justify-end px-2 transition-all"
                        style={{ width: `${Math.max(pct, count > 0 ? 10 : 0)}%`, background: s.color }}>
                        {count > 0 && <span className="text-[10px] font-bold text-white">{count}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Necesita atención */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Listos para avanzar */}
            <section className="rounded-xl border border-[var(--border)] p-4" style={{ background: "var(--card)" }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-green-500">Listos para avanzar</h3>
                <span className="text-xs text-[var(--foreground)]/30">{listosParaAvanzar.length}</span>
              </div>
              {listosParaAvanzar.length === 0 ? (
                <p className="text-xs text-[var(--foreground)]/30 py-2">Ninguno por ahora.</p>
              ) : listosParaAvanzar.map(j => (
                <Link key={j.id} href="/admin/crm/seguimiento" className="block rounded-lg border border-[var(--border)] px-3 py-2 mb-1.5 hover:bg-[var(--border)]/10 transition-colors" style={{ background: "var(--background)" }}>
                  <p className="text-sm font-medium truncate">{j.nombre}</p>
                  <p className="text-[11px] text-green-500">Todos los objetivos de {stageName(j.etapa_actual)} cumplidos</p>
                </Link>
              ))}
            </section>

            {/* Acciones vencidas */}
            <section className="rounded-xl border border-[var(--border)] p-4" style={{ background: "var(--card)" }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-red-500">Acciones vencidas</h3>
                <span className="text-xs text-[var(--foreground)]/30">{accionesVencidas.length}</span>
              </div>
              {accionesVencidas.length === 0 ? (
                <p className="text-xs text-[var(--foreground)]/30 py-2">Nada vencido.</p>
              ) : accionesVencidas.map(j => (
                <Link key={j.id} href="/admin/crm/seguimiento" className="block rounded-lg border border-[var(--border)] px-3 py-2 mb-1.5 hover:bg-[var(--border)]/10 transition-colors" style={{ background: "var(--background)" }}>
                  <p className="text-sm font-medium truncate">{j.nombre}</p>
                  <p className="text-[11px] text-red-400 truncate">{j.siguiente_accion || "Acción pendiente"} · {j.fecha_proxima_accion}</p>
                </Link>
              ))}
            </section>

            {/* Estancados */}
            <section className="rounded-xl border border-[var(--border)] p-4" style={{ background: "var(--card)" }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-orange-500">Estancados</h3>
                <span className="text-xs text-[var(--foreground)]/30">{estancados.length}</span>
              </div>
              {estancados.length === 0 ? (
                <p className="text-xs text-[var(--foreground)]/30 py-2">Todos avanzando.</p>
              ) : estancados.map(j => (
                <Link key={j.id} href="/admin/crm/seguimiento" className="block rounded-lg border border-[var(--border)] px-3 py-2 mb-1.5 hover:bg-[var(--border)]/10 transition-colors" style={{ background: "var(--background)" }}>
                  <p className="text-sm font-medium truncate">{j.nombre}</p>
                  <p className="text-[11px] text-orange-400">{diasEnEtapa(j)} días en {stageName(j.etapa_actual)}</p>
                </Link>
              ))}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
