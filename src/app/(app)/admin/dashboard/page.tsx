"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    activeBusinesses30d: 0,
    totalLeads: 0,
    leads30d: 0,
    totalLandings: 0,
    onboardingCompleted: 0,
  });
  const [recentBusinesses, setRecentBusinesses] = useState<any[]>([]);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token || "";

      const res = await fetch("/api/admin/dashboard-stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.error("Dashboard stats error:", await res.text());
        setLoading(false);
        return;
      }

      const json = await res.json();
      setStats(json.stats);
      setRecentBusinesses(json.recentBusinesses);
      setRecentLeads(json.recentLeads);
    } catch (err) {
      console.error("Dashboard error:", err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-4)] mx-auto mb-4"></div>
          <p className="text-white">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Panel de Control</h1>
        <button onClick={loadDashboardData} className="px-3 py-1 rounded-lg border border-[var(--border)] text-sm hover:bg-white/5">
          Actualizar
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="text-xs text-white uppercase tracking-wide mb-1">Negocios totales</div>
          <div className="text-3xl font-bold text-[var(--brand-1)]">{stats.totalBusinesses}</div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="text-xs text-white uppercase tracking-wide mb-1">Negocios activos (30 días)</div>
          <div className="text-3xl font-bold text-green-500">{stats.activeBusinesses30d}</div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="text-xs text-white uppercase tracking-wide mb-1">Onboarding completado*</div>
          <div className="text-3xl font-bold text-blue-500">{stats.onboardingCompleted}</div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="text-xs text-white uppercase tracking-wide mb-1">Leads totales</div>
          <div className="text-3xl font-bold text-purple-500">{stats.totalLeads}</div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="text-xs text-white uppercase tracking-wide mb-1">Leads últimos 30 días</div>
          <div className="text-3xl font-bold text-green-400">{stats.leads30d}</div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="text-xs text-white uppercase tracking-wide mb-1">Landings creadas</div>
          <div className="text-3xl font-bold text-orange-400">{stats.totalLandings}</div>
        </div>
      </div>

      <p className="text-xs text-white">* Se considera onboarding completado si el negocio tiene sector y slug de landing definidos.</p>

      {/* Quick lists */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Businesses */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Negocios recientes</h2>
            <a href="/admin/configuracion" className="text-sm text-[var(--brand-4)] hover:underline">
              Ver todos
            </a>
          </div>
          {recentBusinesses.length === 0 ? (
            <p className="text-white text-sm">No hay negocios</p>
          ) : (
            <div className="space-y-2">
              {recentBusinesses.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-2 rounded-lg bg-[var(--background)]">
                  <div>
                    <div className="font-medium text-sm">{b.name}</div>
                    <div className="text-xs text-white">{b.sector || "Sin sector"}</div>
                  </div>
                  <div className="text-xs text-white">
                    {new Date(b.created_at).toLocaleDateString("es-ES")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Leads */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Leads recientes</h2>
            <span className="text-sm text-white">{stats.totalLeads} totales</span>
          </div>
          {recentLeads.length === 0 ? (
            <p className="text-white text-sm">No hay leads</p>
          ) : (
            <div className="space-y-2">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-2 rounded-lg bg-[var(--background)]">
                  <div>
                    <div className="font-medium text-sm">{lead.name || lead.email}</div>
                    <div className="text-xs text-white">{lead.business_name}</div>
                  </div>
                  <div className="text-xs text-white">
                    {new Date(lead.created_at).toLocaleDateString("es-ES")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <h2 className="text-lg font-semibold mb-4">Acciones rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <a href="/admin/configuracion" className="px-4 py-2 rounded-lg bg-[var(--brand-4)] text-black font-medium hover:opacity-90">
            + Nuevo negocio
          </a>
          <a href="/admin/modulos" className="px-4 py-2 rounded-lg border border-[var(--border)] hover:bg:white/5">
            Gestionar módulos
          </a>
          <a href="/admin/settings" className="px-4 py-2 rounded-lg border border-[var(--border)] hover:bg:white/5">
            Configuración
          </a>
          <a href="/admin/actividad" className="px-4 py-2 rounded-lg border border-[var(--border)] hover:bg:white/5">
            Ver actividad
          </a>
        </div>
      </div>
    </div>
  );
}
