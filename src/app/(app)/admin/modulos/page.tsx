"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Business = {
  id: string;
  name: string;
  sector: string | null;
  module_vip_benefits: boolean;
  module_lead_magnet: boolean;
  module_whatsapp: boolean;
  module_tools: boolean;
  module_forms: boolean;
  created_at: string;
};

export default function AdminModulos() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    loadBusinesses();
  }, []);

const loadBusinesses = async () => {
  setLoading(true);
  const { data, error } = await supabase
    .from("businesses")
    .select(
      "id, name, sector, module_vip_benefits, module_lead_magnet, module_whatsapp, module_tools, module_forms, created_at"
    )
    .order("name");

  if (error) {
    console.error("Error cargando negocios:", error);
    setLoading(false);
    return;
  }

  const businessesWithDefaults = (data || []).map(b => ({
    ...b,
    module_tools: b.module_tools ?? true,
    module_forms: b.module_forms ?? true,
  }));

  setBusinesses(businessesWithDefaults as Business[]);
  setLoading(false);
};

  const toggleModule = async (id: string, module: string, value: boolean) => {
    setBusinesses(businesses.map(b => 
      b.id === id ? { ...b, [module]: value } : b
    ));
  };

  const saveAll = async () => {
    setSaving(true);
    setMsg("Guardando...");

    for (const b of businesses) {
const { error } = await supabase
  .from("businesses")
  .update({
    module_vip_benefits: b.module_vip_benefits,
    module_lead_magnet: b.module_lead_magnet,
    module_whatsapp: b.module_whatsapp,
    module_tools: b.module_tools,
    module_forms: b.module_forms,
  })
  .eq("id", b.id);


      if (error) {
        setMsg("Error al guardar: " + error.message);
        setSaving(false);
        return;
      }
    }

    setMsg("Cambios guardados correctamente");
    setSaving(false);
    setTimeout(() => setMsg(""), 3000);
  };

  const activateAllLM = () => {
    setBusinesses(businesses.map(b => ({ ...b, module_lead_magnet: true })));
  };

  const deactivateAllLM = () => {
    setBusinesses(businesses.map(b => ({ ...b, module_lead_magnet: false })));
  };

  const activateAllVIP = () => {
    setBusinesses(businesses.map(b => ({ ...b, module_vip_benefits: true })));
  };

  const deactivateAllVIP = () => {
    setBusinesses(businesses.map(b => ({ ...b, module_vip_benefits: false })));
  };

  const activateAllWA = () => {
    setBusinesses(businesses.map(b => ({ ...b, module_whatsapp: true })));
  };

  const deactivateAllWA = () => {
    setBusinesses(businesses.map(b => ({ ...b, module_whatsapp: false })));
  };

  const activateAllForms = () => {
    setBusinesses(businesses.map(b => ({ ...b, module_forms: true })));
  };

  const deactivateAllForms = () => {
    setBusinesses(businesses.map(b => ({ ...b, module_forms: false })));
  };

  const filteredBusinesses = businesses.filter(b => {
    if (filter === "all") return true;
    if (filter === "lm") return b.module_lead_magnet;
    if (filter === "vip") return b.module_vip_benefits;
    if (filter === "wa") return b.module_whatsapp;
    if (filter === "forms") return b.module_forms;
    if (filter === "none") return !b.module_lead_magnet && !b.module_vip_benefits && !b.module_whatsapp && !b.module_forms;
    return true;
  });

  const counts = {
    total: businesses.length,
    lm: businesses.filter(b => b.module_lead_magnet).length,
    vip: businesses.filter(b => b.module_vip_benefits).length,
    wa: businesses.filter(b => b.module_whatsapp).length,
    forms: businesses.filter(b => b.module_forms).length,
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
        <h1 className="text-2xl font-semibold">Gestión de Módulos</h1>
        {msg && (
          <div className={`text-sm px-3 py-1 rounded ${msg.includes("Error") ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
            {msg}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-center">
          <div className="text-2xl font-bold">{counts.total}</div>
          <div className="text-xs text-white">Total Negocios</div>
        </div>
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-center">
          <div className="text-2xl font-bold text-green-500">{counts.lm}</div>
          <div className="text-xs text-white">Lead Magnet</div>
        </div>
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-center">
          <div className="text-2xl font-bold text-blue-500">{counts.vip}</div>
          <div className="text-xs text-white">VIP Benefits</div>
        </div>
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 text-center">
          <div className="text-2xl font-bold text-purple-500">{counts.wa}</div>
          <div className="text-xs text-white">WhatsApp</div>
        </div>
        <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 text-center">
          <div className="text-2xl font-bold text-orange-500">{counts.forms}</div>
          <div className="text-xs text-white">Formularios</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-lg text-sm ${filter === "all" ? "bg-[var(--brand-4)] text-black" : "border border-[var(--border)]"}`}
          >
            Todos ({counts.total})
          </button>
          <button
            onClick={() => setFilter("lm")}
            className={`px-3 py-1 rounded-lg text-sm ${filter === "lm" ? "bg-green-500 text-white" : "border border-[var(--border)]"}`}
          >
            LM ({counts.lm})
          </button>
          <button
            onClick={() => setFilter("vip")}
            className={`px-3 py-1 rounded-lg text-sm ${filter === "vip" ? "bg-blue-500 text-white" : "border border-[var(--border)]"}`}
          >
            VIP ({counts.vip})
          </button>
          <button
            onClick={() => setFilter("wa")}
            className={`px-3 py-1 rounded-lg text-sm ${filter === "wa" ? "bg-purple-500 text-white" : "border border-[var(--border)]"}`}
          >
            WA ({counts.wa})
          </button>
          <button
            onClick={() => setFilter("forms")}
            className={`px-3 py-1 rounded-lg text-sm ${filter === "forms" ? "bg-orange-500 text-white" : "border border-[var(--border)]"}`}
          >
            Forms ({counts.forms})
          </button>
          <button
            onClick={() => setFilter("none")}
            className={`px-3 py-1 rounded-lg text-sm ${filter === "none" ? "bg-red-500 text-white" : "border border-[var(--border)]"}`}
          >
            Sin módulos
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--background)] text-xs uppercase text-white">
              <tr>
                <th className="px-4 py-3 text-left">Negocio</th>
                <th className="px-4 py-3 text-center">Sector</th>
                <th className="px-4 py-3 text-center">Lead Magnet</th>
                <th className="px-4 py-3 text-center">VIP Benefits</th>
                <th className="px-4 py-3 text-center">WhatsApp</th>
                <th className="px-4 py-3 text-center">Herramientas</th>
                <th className="px-4 py-3 text-center">Formularios</th>
              </tr>
            </thead>
            <tbody>
              {filteredBusinesses.map((b) => (
                <tr key={b.id} className="border-t border-[var(--border)] hover:bg-white/5">
                  <td className="px-4 py-3 font-medium">{b.name}</td>
                  <td className="px-4 py-3 text-center text-white">{b.sector || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleModule(b.id, "module_lead_magnet", !b.module_lead_magnet)}
                      className={`w-12 h-6 rounded-full transition-colors ${b.module_lead_magnet ? "bg-green-500" : "bg-gray-600"}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${b.module_lead_magnet ? "translate-x-6" : "translate-x-0.5"}`}></div>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleModule(b.id, "module_vip_benefits", !b.module_vip_benefits)}
                      className={`w-12 h-6 rounded-full transition-colors ${b.module_vip_benefits ? "bg-blue-500" : "bg-gray-600"}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${b.module_vip_benefits ? "translate-x-6" : "translate-x-0.5"}`}></div>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleModule(b.id, "module_whatsapp", !b.module_whatsapp)}
                      className={`w-12 h-6 rounded-full transition-colors ${b.module_whatsapp ? "bg-purple-500" : "bg-gray-600"}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${b.module_whatsapp ? "translate-x-6" : "translate-x-0.5"}`}></div>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleModule(b.id, "module_tools", !b.module_tools)}
                      className={`w-12 h-6 rounded-full transition-colors ${b.module_tools ? "bg-yellow-500" : "bg-gray-600"}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${b.module_tools ? "translate-x-6" : "translate-x-0.5"}`}></div>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleModule(b.id, "module_forms", !b.module_forms)}
                      className={`w-12 h-6 rounded-full transition-colors ${b.module_forms ? "bg-orange-500" : "bg-gray-600"}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${b.module_forms ? "translate-x-6" : "translate-x-0.5"}`}></div>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredBusinesses.length === 0 && (
          <div className="text-center py-8 text-white">No hay negocios</div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-white">Activar todos:</span>
          <button onClick={activateAllLM} className="px-2 py-1 text-xs rounded bg-green-500/20 text-green-500 hover:bg-green-500/30">
            LM
          </button>
          <button onClick={activateAllVIP} className="px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-500 hover:bg-blue-500/30">
            VIP
          </button>
          <button onClick={activateAllWA} className="px-2 py-1 text-xs rounded bg-purple-500/20 text-purple-500 hover:bg-purple-500/30">
            WA
          </button>
          <button onClick={activateAllForms} className="px-2 py-1 text-xs rounded bg-orange-500/20 text-orange-500 hover:bg-orange-500/30">
            Forms
          </button>
          <span className="text-sm text-white ml-2">Desactivar todos:</span>
          <button onClick={deactivateAllLM} className="px-2 py-1 text-xs rounded bg-gray-500/20 text-white hover:bg-gray-500/30">
            LM
          </button>
          <button onClick={deactivateAllVIP} className="px-2 py-1 text-xs rounded bg-gray-500/20 text-white hover:bg-gray-500/30">
            VIP
          </button>
          <button onClick={deactivateAllWA} className="px-2 py-1 text-xs rounded bg-gray-500/20 text-white hover:bg-gray-500/30">
            WA
          </button>
          <button onClick={deactivateAllForms} className="px-2 py-1 text-xs rounded bg-gray-500/20 text-white hover:bg-gray-500/30">
            Forms
          </button>
        </div>
        <button
          onClick={saveAll}
          disabled={saving}
          className="px-6 py-2 rounded-lg bg-[var(--brand-4)] text-black font-medium hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </div>
  );
}
