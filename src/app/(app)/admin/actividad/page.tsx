"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ActivityLog = {
  id: string;
  business_id: string;
  action: string;
  details: string;
  created_at: string;
  business_name?: string;
};

type Business = {
  id: string;
  name: string;
};

export default function AdminActividad() {
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("all");
  const [filterBusiness, setFilterBusiness] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    // Load activity logs
    const { data: logs } = await supabase
      .from("activity_logs")
      .select("*, businesses(name)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (logs) {
      setActivity(logs.map(l => ({
        ...l,
        business_name: l.businesses?.name
      })));
    }

    // Load businesses for filter
    const { data: biz } = await supabase
      .from("businesses")
      .select("id, name")
      .order("name");
    setBusinesses(biz || []);

    setLoading(false);
  };

  const filteredActivity = activity.filter(log => {
    // Filter by action
    if (filterAction !== "all" && !log.action.includes(filterAction)) {
      return false;
    }
    // Filter by business
    if (filterBusiness !== "all" && log.business_id !== filterBusiness) {
      return false;
    }
    // Search in details
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return log.action.toLowerCase().includes(search) || 
             (log.business_name && log.business_name.toLowerCase().includes(search)) ||
             (log.details && log.details.toLowerCase().includes(search));
    }
    return true;
  });

  // Get unique actions for filter
  const actions = [...new Set(activity.map(l => l.action.split("_")[0]))];

  const formatAction = (action: string) => {
    const labels: Record<string, string> = {
      "negocio": "Negocio",
      "login": "Login",
      "password": "Contraseña",
      "landing": "Landing",
      "lead": "Lead",
      "vip": "VIP",
    };
    const prefix = action.split("_")[0];
    return labels[prefix] || action;
  };

  const getActionColor = (action: string) => {
    if (action.includes("creado") || action.includes("login") && action.includes("exitoso")) return "text-green-400";
    if (action.includes("eliminado")) return "text-red-400";
    if (action.includes("actualizado") || action.includes("editado")) return "text-blue-400";
    return "text-white";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-4)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Registro de Actividad</h1>
        <button onClick={loadData} className="px-3 py-1 rounded-lg border border-[var(--border)] text-sm hover:bg-white/5">
          Actualizar
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Buscar en actividad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-transparent px-4 py-2"
          />
        </div>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
        >
          <option value="all">Todas las acciones</option>
          <option value="negocio">Negocios</option>
          <option value="login">Logins</option>
          <option value="password">Contraseñas</option>
          <option value="landing">Landings</option>
          <option value="lead">Leads</option>
        </select>
        <select
          value={filterBusiness}
          onChange={(e) => setFilterBusiness(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
        >
          <option value="all">Todos los negocios</option>
          {businesses.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-white">
        <span>{filteredActivity.length} registros</span>
        <span>|</span>
        <span>Total: {activity.length}</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--background)] text-xs uppercase text-white">
              <tr>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Negocio</th>
                <th className="px-4 py-3 text-left">Acción</th>
                <th className="px-4 py-3 text-left">Detalles</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivity.map((log) => (
                <tr key={log.id} className="border-t border-[var(--border)] hover:bg-white/5">
                  <td className="px-4 py-3 whitespace-nowrap text-white">
                    {new Date(log.created_at).toLocaleString("es-ES")}
                  </td>
                  <td className="px-4 py-3">
                    {log.business_name || <span className="text-white">Sistema</span>}
                  </td>
                  <td className={`px-4 py-3 font-medium ${getActionColor(log.action)}`}>
                    {formatAction(log.action)}
                  </td>
                  <td className="px-4 py-3 text-white max-w-xs truncate">
                    {log.details ? (
                      typeof log.details === "string" ? log.details : JSON.stringify(log.details)
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredActivity.length === 0 && (
          <div className="text-center py-12 text-white">
            No hay actividad que mostrar
          </div>
        )}
      </div>
    </div>
  );
}
