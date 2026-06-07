"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Stats {
  viewsToday: number; viewsWeek: number; viewsMonth: number; viewsTotal: number;
  clicks30d: number; leadsTotal: number; leads30d: number; conversion: number;
  lastActivity: string | null; onboardingDone: boolean; landingPublished: boolean;
}
interface Biz {
  id: string; name: string; sector: string | null; slug: string | null;
  last_login: string | null; created_at: string; profile_active: boolean;
  modules: { lead_magnet: boolean; vip: boolean; whatsapp: boolean };
}

function Stat({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] p-4" style={{ background: "var(--card)" }}>
      <p className="text-xs text-[var(--foreground)]/50 mb-1">{label}</p>
      <p className="text-2xl font-bold" style={color ? { color } : {}}>{value}</p>
      {sub && <p className="text-[11px] text-[var(--foreground)]/40 mt-0.5">{sub}</p>}
    </div>
  );
}

function fmtDate(s: string | null): string {
  if (!s) return "Nunca";
  const d = new Date(s);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  const txt = d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  return `${txt} · hace ${days} días`;
}

export default function AdminBusinessDashboard() {
  const params = useParams();
  const id = params?.id as string;
  const [biz, setBiz] = useState<Biz | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const res = await fetch(`/api/admin/business-stats?id=${id}`, { headers: { Authorization: `Bearer ${data.session?.access_token || ""}` } });
        const json = await res.json();
        if (json.error) setErr(json.error);
        else { setBiz(json.business); setStats(json.stats); }
      } catch { setErr("No se pudieron cargar las estadísticas"); }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><div className="animate-spin rounded-full h-9 w-9 border-b-2" style={{ borderColor: "var(--brand-1)" }} /></div>;
  if (err || !biz || !stats) return <div className="space-y-3"><Link href={`/admin/businesses/${id}`} className="text-sm text-[var(--foreground)]/50 hover:text-[var(--foreground)]">← Ficha del negocio</Link><p className="text-sm text-red-400">{err || "Sin datos"}</p></div>;

  const semaforo = stats.viewsWeek > 0 ? { c: "#22c55e", t: "Activo" } : stats.viewsTotal > 0 ? { c: "#f59e0b", t: "Sin actividad reciente" } : { c: "#f87171", t: "Sin actividad" };

  return (
    <div className="max-w-[1000px] mx-auto pb-12 space-y-6">
      <div className="flex items-center gap-2">
        <Link href={`/admin/businesses/${id}`} className="text-sm text-[var(--foreground)]/50 hover:text-[var(--foreground)]">← Ficha del negocio</Link>
      </div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">{biz.name}</h1>
          <p className="text-sm text-[var(--foreground)]/50">{biz.sector || "Sin sector"} · alta {fmtDate(biz.created_at)}</p>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ color: semaforo.c, background: `${semaforo.c}22` }}>{semaforo.t}</span>
      </div>

      {/* Visitas */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/50 mb-2">Visitas a la landing</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Hoy" value={stats.viewsToday} />
          <Stat label="Últimos 7 días" value={stats.viewsWeek} color="#2dd4bf" />
          <Stat label="Últimos 30 días" value={stats.viewsMonth} color="#2dd4bf" />
          <Stat label="Totales" value={stats.viewsTotal} />
        </div>
      </div>

      {/* Captación */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/50 mb-2">Captación</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Leads totales" value={stats.leadsTotal} color="#a78bfa" />
          <Stat label="Leads (30 días)" value={stats.leads30d} color="#22c55e" />
          <Stat label="Clics en botones (30d)" value={stats.clicks30d} />
          <Stat label="Conversión (30d)" value={`${stats.conversion}%`} sub="leads ÷ visitas" color="#ffb400" />
        </div>
      </div>

      {/* Estado */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/50 mb-2">Estado del negocio</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Último acceso" value={fmtDate(biz.last_login)} />
          <Stat label="Última actividad" value={fmtDate(stats.lastActivity)} />
          <Stat label="Onboarding" value={stats.onboardingDone ? "Completado" : "Pendiente"} color={stats.onboardingDone ? "#22c55e" : "#f59e0b"} />
          <Stat label="Landing" value={stats.landingPublished ? "Publicada" : "Sin publicar"} color={stats.landingPublished ? "#22c55e" : "#f87171"} />
        </div>
      </div>

      {/* Módulos + enlaces */}
      <div className="rounded-xl border border-[var(--border)] p-4 flex items-center justify-between gap-3 flex-wrap" style={{ background: "var(--card)" }}>
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[var(--foreground)]/50">Módulos:</span>
          <span className={`px-2 py-0.5 rounded-full ${biz.modules.lead_magnet ? "text-green-600 bg-green-500/10" : "text-[var(--foreground)]/40 bg-[var(--foreground)]/5"}`}>Recurso de valor</span>
          <span className={`px-2 py-0.5 rounded-full ${biz.modules.vip ? "text-green-600 bg-green-500/10" : "text-[var(--foreground)]/40 bg-[var(--foreground)]/5"}`}>VIP</span>
          <span className={`px-2 py-0.5 rounded-full ${biz.modules.whatsapp ? "text-green-600 bg-green-500/10" : "text-[var(--foreground)]/40 bg-[var(--foreground)]/5"}`}>WhatsApp</span>
        </div>
        {biz.slug && <a href={`/l/${biz.slug}/NFC`} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--brand-1)] hover:underline">Ver landing pública ↗</a>}
      </div>
    </div>
  );
}
