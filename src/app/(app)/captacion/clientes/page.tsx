"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { CaptacionLead } from "@/types/captacion";

const STATUS_LABELS: Record<string, string> = { new: "Nuevo", contacted: "Contactado", active: "Activo", discarded: "Descartado" };
const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/15 text-blue-400",
  contacted: "bg-yellow-500/15 text-yellow-400",
  active: "bg-green-500/15 text-green-400",
  discarded: "bg-[var(--foreground)]/10 text-[var(--foreground)]/40",
};

function ClientesPage() {
  const searchParams = useSearchParams();
  const campaignIdFilter = searchParams.get("campaignId");

  const [leads, setLeads] = useState<CaptacionLead[]>([]);
  const [filtered, setFiltered] = useState<CaptacionLead[]>([]);
  const [businessId, setBusinessId] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<CaptacionLead | null>(null);
  const [updating, setUpdating] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState<{ ok: boolean; count: number } | null>(null);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    campaignId: campaignIdFilter || "",
  });

  const campaigns = Array.from(
    new Map(leads.filter(l => l.captacion_campaigns).map(l => [l.campaign_id, l.captacion_campaigns!.name])).entries()
  ).map(([id, name]) => ({ id, name }));

  useEffect(() => {
    const load = async () => {
      const { data: s } = await supabase.auth.getSession();
      const t = s?.session?.access_token;
      const email = s?.session?.user?.email;
      if (!email || !t) { setLoading(false); return; }
      setToken(t);
      const { data: biz } = await supabase.from("businesses").select("id").eq("contact_email", email).single();
      if (!biz) { setLoading(false); return; }
      setBusinessId(biz.id);
      await loadLeads(biz.id, t);
    };
    load();
  }, []);

  useEffect(() => {
    let result = [...leads];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(l =>
        l.name?.toLowerCase().includes(q) ||
        l.phone?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.company?.toLowerCase().includes(q)
      );
    }
    if (filters.status) result = result.filter(l => l.status === filters.status);
    if (filters.campaignId) result = result.filter(l => l.campaign_id === filters.campaignId);
    setFiltered(result);
  }, [leads, filters]);

  const loadLeads = async (bid: string, tok: string) => {
    const res = await fetch(`/api/captacion/leads?businessId=${bid}`, {
      headers: { Authorization: `Bearer ${tok}` },
    });
    const data = await res.json();
    setLeads(data.leads || []);
    setLoading(false);
  };

  const updateLead = async (id: string, updates: Partial<CaptacionLead>) => {
    setUpdating(true);
    const res = await fetch(`/api/captacion/leads/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      await loadLeads(businessId, token);
      if (selectedLead?.id === id) {
        setSelectedLead(prev => prev ? { ...prev, ...updates } : prev);
      }
    }
    setUpdating(false);
  };

  const exportCSV = () => {
    const rows = [
      ["Nombre", "Teléfono", "Email", "Empresa", "Puesto", "Segmento", "Estado", "Campaña", "Fecha"],
      ...filtered.map(l => [
        l.name || "", l.phone || "", l.email || "", l.company || "", l.position || "",
        l.segment || "", STATUS_LABELS[l.status] || l.status,
        l.captacion_campaigns?.name || "",
        new Date(l.created_at).toLocaleDateString("es-ES"),
      ])
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Leads no migrados que coinciden con el filtro de campaña actual
  const pendingMigration = leads.filter(
    l => !l.migrated_to_fidelizacion && (!filters.campaignId || l.campaign_id === filters.campaignId)
  );

  const migrateAll = async () => {
    const scope = filters.campaignId
      ? `los ${pendingMigration.length} leads de esta campaña`
      : `los ${pendingMigration.length} leads pendientes`;
    if (!confirm(`¿Mover ${scope} a Fidelización?\n\nEsta acción marcará todos como migrados. No se puede deshacer.`)) return;

    setMigrating(true);
    setMigrateResult(null);
    const res = await fetch("/api/captacion/leads/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        businessId,
        ...(filters.campaignId ? { campaignId: filters.campaignId } : {}),
      }),
    });
    const data = await res.json();
    setMigrating(false);
    if (res.ok) {
      setMigrateResult({ ok: true, count: data.migrated });
      await loadLeads(businessId, token);
    } else {
      setMigrateResult({ ok: false, count: 0 });
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    return `hace ${Math.floor(hrs / 24)}d`;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-[var(--foreground)]/50 text-sm">Cargando...</p></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Clientes captados</h1>
          <p className="text-sm text-[var(--foreground)]/50 mt-1">{filtered.length} de {leads.length} leads</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Botón migración masiva */}
          <button
            onClick={migrateAll}
            disabled={migrating || pendingMigration.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors disabled:opacity-40"
            style={{ borderColor: "var(--brand-1)", color: "var(--brand-1)" }}
            title={pendingMigration.length === 0 ? "Todos los leads ya están en Fidelización" : ""}
          >
            {migrating ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Migrando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                Mover a Fidelización
                {pendingMigration.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: "var(--brand-1)", color: "var(--background)" }}>
                    {pendingMigration.length}
                  </span>
                )}
              </>
            )}
          </button>

          <button onClick={exportCSV} disabled={filtered.length === 0}
            className="px-4 py-2 rounded-lg text-sm font-semibold border transition-colors hover:border-[var(--brand-1)]/50 disabled:opacity-40"
            style={{ borderColor: "var(--border)" }}>
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Banner resultado migración */}
      {migrateResult && (
        <div className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium ${migrateResult.ok ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
          <span>
            {migrateResult.ok
              ? `✓ ${migrateResult.count} lead${migrateResult.count !== 1 ? "s" : ""} movido${migrateResult.count !== 1 ? "s" : ""} a Fidelización`
              : "Error al migrar. Inténtalo de nuevo."}
          </span>
          <button onClick={() => setMigrateResult(null)} className="ml-4 opacity-60 hover:opacity-100">×</button>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <input
          className="flex-1 min-w-40 rounded-lg border px-3 py-2 text-sm bg-transparent"
          style={{ borderColor: "var(--border)" }}
          placeholder="Buscar por nombre, teléfono, email..."
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
        />
        <select className="rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)", background: "var(--card)" }}
          value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {campaigns.length > 0 && (
          <select className="rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)", background: "var(--card)" }}
            value={filters.campaignId} onChange={e => setFilters(f => ({ ...f, campaignId: e.target.value }))}>
            <option value="">Todas las campañas</option>
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[var(--foreground)]/50">{leads.length === 0 ? "Aún no has capturado leads" : "Sin resultados para estos filtros"}</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                  {["Contacto", "Estado", "Campaña", "Lead magnet", "Fecha", ""].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[var(--foreground)]/50 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => (
                  <tr key={lead.id} className="border-b last:border-b-0 hover:bg-[var(--brand-1)]/5 transition-colors cursor-pointer"
                    style={{ borderColor: "var(--border)" }}
                    onClick={() => setSelectedLead(lead)}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{lead.name || "—"}</p>
                      <p className="text-xs text-[var(--foreground)]/50">{lead.phone}</p>
                      {lead.email && <p className="text-xs text-[var(--foreground)]/40">{lead.email}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[lead.status]}`}>
                        {STATUS_LABELS[lead.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--foreground)]/60">
                      {lead.captacion_campaigns?.name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {lead.lead_magnet_delivered ? (
                        <span className="text-xs text-green-400">✓ Entregado</span>
                      ) : (
                        <span className="text-xs text-[var(--foreground)]/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--foreground)]/40 whitespace-nowrap">
                      {timeAgo(lead.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {lead.migrated_to_fidelizacion && (
                        <span className="text-xs text-[var(--foreground)]/40">→ Fidelización</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Panel lateral lead */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedLead(null); }}>
          <div className="w-full max-w-sm h-full overflow-y-auto border-l p-6 space-y-5"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">{selectedLead.name || selectedLead.phone}</h2>
              <button onClick={() => setSelectedLead(null)} className="text-[var(--foreground)]/40 hover:text-[var(--foreground)] text-xl">×</button>
            </div>

            {/* Datos */}
            <div className="space-y-2 text-sm">
              {[
                { label: "Teléfono", value: selectedLead.phone },
                { label: "Email", value: selectedLead.email },
                { label: "Empresa", value: selectedLead.company },
                { label: "Puesto", value: selectedLead.position },
                { label: "Segmento", value: selectedLead.segment },
                { label: "Campaña", value: selectedLead.captacion_campaigns?.name },
              ].filter(r => r.value).map(r => (
                <div key={r.label} className="flex gap-2">
                  <span className="text-[var(--foreground)]/40 w-20 flex-shrink-0">{r.label}</span>
                  <span>{r.value}</span>
                </div>
              ))}
              <div className="flex gap-2">
                <span className="text-[var(--foreground)]/40 w-20 flex-shrink-0">Captado</span>
                <span>{new Date(selectedLead.created_at).toLocaleString("es-ES")}</span>
              </div>
            </div>

            {/* Quiz answers */}
            {Object.keys(selectedLead.quiz_answers || {}).length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-[var(--foreground)]/50 uppercase tracking-wider mb-2">Respuestas</h3>
                <div className="space-y-2">
                  {Object.entries(selectedLead.quiz_answers).map(([q, a]) => (
                    <div key={q} className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: "var(--border)" }}>
                      <p className="text-[var(--foreground)]/50">{q}</p>
                      <p className="font-medium mt-0.5">{String(a)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Estado */}
            <div>
              <h3 className="text-xs font-semibold text-[var(--foreground)]/50 uppercase tracking-wider mb-2">Estado</h3>
              <div className="grid grid-cols-2 gap-2">
                {(["new", "contacted", "active", "discarded"] as const).map(s => (
                  <button key={s} disabled={updating}
                    onClick={() => updateLead(selectedLead.id, { status: s })}
                    className={`py-2 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50 ${selectedLead.status === s ? "border-[var(--brand-1)]" : "border-[var(--border)]"}`}
                    style={{ background: selectedLead.status === s ? "rgba(57,161,169,0.1)" : "transparent" }}>
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Notas */}
            <div>
              <h3 className="text-xs font-semibold text-[var(--foreground)]/50 uppercase tracking-wider mb-2">Notas</h3>
              <textarea
                className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent resize-none"
                style={{ borderColor: "var(--border)" }}
                rows={4}
                placeholder="Añade notas sobre este lead..."
                defaultValue={selectedLead.notes || ""}
                onBlur={e => {
                  if (e.target.value !== (selectedLead.notes || "")) {
                    updateLead(selectedLead.id, { notes: e.target.value });
                  }
                }}
              />
            </div>

            {/* Migrar a fidelización */}
            {!selectedLead.migrated_to_fidelizacion && (
              <button
                disabled={updating}
                onClick={() => updateLead(selectedLead.id, { migrated_to_fidelizacion: true })}
                className="w-full py-2.5 rounded-lg text-sm font-semibold border transition-colors hover:border-[var(--brand-1)]/50 disabled:opacity-50"
                style={{ borderColor: "var(--border)" }}>
                → Mover a Fidelización
              </button>
            )}
            {selectedLead.migrated_to_fidelizacion && (
              <div className="text-center py-2">
                <span className="text-xs text-[var(--foreground)]/40">✓ Migrado a Fidelización</span>
                {selectedLead.migrated_at && (
                  <p className="text-xs text-[var(--foreground)]/30">{new Date(selectedLead.migrated_at).toLocaleDateString("es-ES")}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClientesPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><p className="text-[var(--foreground)]/50 text-sm">Cargando...</p></div>}>
      <ClientesPage />
    </Suspense>
  );
}
