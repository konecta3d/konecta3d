"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { CaptacionLead } from "@/types/captacion";

const STATUS_LABELS: Record<string, string> = {
  new: "Nuevo", contacted: "Contactado", active: "Activo", discarded: "Descartado",
};
const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/15 text-blue-400",
  contacted: "bg-yellow-500/15 text-yellow-400",
  active: "bg-green-500/15 text-green-400",
  discarded: "bg-[var(--foreground)]/10 text-[var(--foreground)]/40",
};

const LM_STATUS_LABEL: Record<string, string> = {
  pending: "Sin descargar",
  downloaded: "Descargado",
};
const LM_STATUS_COLOR: Record<string, string> = {
  pending: "bg-orange-500/15 text-orange-400",
  downloaded: "bg-green-500/15 text-green-400",
};

interface CampaignGroup {
  id: string;
  name: string;
  leads: CaptacionLead[];
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

// ── Panel lateral de lead ──────────────────────────────────────
function LeadPanel({
  lead,
  updating,
  onClose,
  onUpdate,
}: {
  lead: CaptacionLead;
  updating: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<CaptacionLead>) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm h-full overflow-y-auto border-l p-6 space-y-5"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">{lead.name || lead.phone}</h2>
          <button onClick={onClose} className="text-[var(--foreground)]/40 hover:text-[var(--foreground)] text-xl">×</button>
        </div>

        {/* Datos */}
        <div className="space-y-2 text-sm">
          {[
            { label: "Teléfono", value: lead.phone },
            { label: "Email", value: lead.email },
            { label: "Empresa", value: lead.company },
            { label: "Puesto", value: lead.position },
            { label: "Segmento", value: lead.segment },
            { label: "Campaña", value: lead.captacion_campaigns?.name },
          ].filter(r => r.value).map(r => (
            <div key={r.label} className="flex gap-2">
              <span className="text-[var(--foreground)]/40 w-20 flex-shrink-0">{r.label}</span>
              <span>{r.value}</span>
            </div>
          ))}
          <div className="flex gap-2">
            <span className="text-[var(--foreground)]/40 w-20 flex-shrink-0">Captado</span>
            <span>{new Date(lead.created_at).toLocaleString("es-ES")}</span>
          </div>
        </div>

        {/* Quiz answers */}
        {Object.keys(lead.quiz_answers || {}).length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-[var(--foreground)]/50 uppercase tracking-wider mb-2">Respuestas</h3>
            <div className="space-y-2">
              {Object.entries(lead.quiz_answers).map(([q, a]) => (
                <div key={q} className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: "var(--border)" }}>
                  <p className="text-[var(--foreground)]/50">{q}</p>
                  <p className="font-medium mt-0.5">{String(a)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lead Magnet — estado de descarga */}
        {lead.lead_magnet_id && (
          <div>
            <h3 className="text-xs font-semibold text-[var(--foreground)]/50 uppercase tracking-wider mb-2">Lead Magnet</h3>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${LM_STATUS_COLOR[lead.lm_status ?? "pending"]}`}>
              <span>{lead.lm_status === "downloaded" ? "✓" : "⚠"}</span>
              <span>{LM_STATUS_LABEL[lead.lm_status ?? "pending"]}</span>
              {lead.lead_magnet_delivered_at && (
                <span className="ml-auto opacity-60">
                  {new Date(lead.lead_magnet_delivered_at).toLocaleDateString("es-ES")}
                </span>
              )}
            </div>
            {/* Botón WhatsApp de seguimiento si no descargó */}
            {lead.lm_status !== "downloaded" && lead.phone && (
              <a
                href={`https://wa.me/${lead.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`¡Hola ${lead.name || ""}! 👋 Te enviamos el recurso que pediste. Puedes descargarlo aquí cuando quieras. ¿Tienes alguna duda?`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 mt-2 w-full py-2 rounded-lg text-xs font-semibold transition-colors"
                style={{ background: "#25d366", color: "white" }}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a9.9 9.9 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.856L.057 24l6.305-1.654A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.7 9.7 0 01-4.948-1.352l-.355-.21-3.676 1.025 1.025-3.676-.21-.355A9.693 9.693 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
                </svg>
                Enviar recordatorio por WhatsApp
              </a>
            )}
          </div>
        )}

        {/* Estado CRM */}
        <div>
          <h3 className="text-xs font-semibold text-[var(--foreground)]/50 uppercase tracking-wider mb-2">Estado</h3>
          <div className="grid grid-cols-2 gap-2">
            {(["new", "contacted", "active", "discarded"] as const).map(s => (
              <button key={s} disabled={updating}
                onClick={() => onUpdate(lead.id, { status: s })}
                className={`py-2 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50 ${lead.status === s ? "border-[var(--brand-1)]" : "border-[var(--border)]"}`}
                style={{ background: lead.status === s ? "rgba(57,161,169,0.1)" : "transparent" }}>
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
            defaultValue={lead.notes || ""}
            onBlur={e => {
              if (e.target.value !== (lead.notes || "")) {
                onUpdate(lead.id, { notes: e.target.value });
              }
            }}
          />
        </div>

        {/* Migrar individualmente */}
        {!lead.migrated_to_fidelizacion ? (
          <button disabled={updating}
            onClick={() => onUpdate(lead.id, { migrated_to_fidelizacion: true })}
            className="w-full py-2.5 rounded-lg text-sm font-semibold border transition-colors hover:border-[var(--brand-1)]/50 disabled:opacity-50"
            style={{ borderColor: "var(--border)" }}>
            → Mover a Fidelización
          </button>
        ) : (
          <div className="text-center py-2">
            <span className="text-xs text-[var(--foreground)]/40">✓ Migrado a Fidelización</span>
            {lead.migrated_at && (
              <p className="text-xs text-[var(--foreground)]/30">{new Date(lead.migrated_at).toLocaleDateString("es-ES")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tabla de leads de una campaña ──────────────────────────────
function CampaignLeadsTable({
  leads,
  onSelectLead,
}: {
  leads: CaptacionLead[];
  onSelectLead: (lead: CaptacionLead) => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      l.name?.toLowerCase().includes(q) ||
      l.phone?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-3">
      {/* Filtros internos de la campaña */}
      <div className="flex flex-wrap gap-2 pt-1">
        <input
          className="flex-1 min-w-40 rounded-lg border px-3 py-1.5 text-xs bg-transparent"
          style={{ borderColor: "var(--border)" }}
          placeholder="Buscar por nombre, teléfono, email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="rounded-lg border px-3 py-1.5 text-xs"
          style={{ borderColor: "var(--border)", background: "var(--card)" }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-xs text-[var(--foreground)]/40 py-4 text-center">Sin resultados</p>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ background: "var(--background)", borderColor: "var(--border)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                  {["Contacto", "Estado", "Lead magnet", "Fidelización", "Captado", ""].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--foreground)]/50 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(lead => (
                  <tr key={lead.id}
                    className="border-b last:border-b-0 hover:bg-[var(--brand-1)]/5 transition-colors cursor-pointer"
                    style={{ borderColor: "var(--border)" }}
                    onClick={() => onSelectLead(lead)}>
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
                    <td className="px-4 py-3">
                      {lead.lead_magnet_id ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LM_STATUS_COLOR[lead.lm_status ?? "pending"]}`}>
                          {lead.lm_status === "downloaded" ? "✓ Descargado" : "⚠ Pendiente"}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--foreground)]/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {lead.migrated_to_fidelizacion
                        ? <span className="text-xs text-[var(--brand-1)]">✓ Migrado</span>
                        : <span className="text-xs text-[var(--foreground)]/30">Pendiente</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--foreground)]/40 whitespace-nowrap">
                      {timeAgo(lead.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-[var(--foreground)]/30">Ver →</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tarjeta de campaña ──────────────────────────────────────────
function CampaignCard({
  group,
  token,
  businessId,
  onSelectLead,
  onRefresh,
}: {
  group: CampaignGroup;
  token: string;
  businessId: string;
  onSelectLead: (lead: CaptacionLead) => void;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState<{ ok: boolean; count: number } | null>(null);

  const total = group.leads.length;
  const migrated = group.leads.filter(l => l.migrated_to_fidelizacion).length;
  const pending = total - migrated;
  const lmLeads = group.leads.filter(l => l.lead_magnet_id);
  const lmDownloaded = lmLeads.filter(l => l.lm_status === "downloaded").length;
  const lmPending = lmLeads.filter(l => l.lm_status !== "downloaded").length;

  const exportCSV = () => {
    const rows = [
      ["Nombre", "Teléfono", "Email", "Empresa", "Puesto", "Segmento", "Estado", "Lead magnet", "Fidelización", "Fecha"],
      ...group.leads.map(l => [
        l.name || "", l.phone || "", l.email || "", l.company || "", l.position || "",
        l.segment || "", STATUS_LABELS[l.status] || l.status,
        l.lead_magnet_delivered ? "Sí" : "No",
        l.migrated_to_fidelizacion ? "Sí" : "No",
        new Date(l.created_at).toLocaleDateString("es-ES"),
      ])
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `leads-${group.name.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const migrateAll = async () => {
    if (!confirm(`¿Mover los ${pending} leads pendientes de "${group.name}" a Fidelización?\n\nNo se puede deshacer.`)) return;
    setMigrating(true);
    setMigrateResult(null);
    const res = await fetch("/api/captacion/leads/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ businessId, campaignId: group.id }),
    });
    const data = await res.json();
    setMigrating(false);
    setMigrateResult({ ok: res.ok, count: data.migrated ?? 0 });
    if (res.ok) onRefresh();
  };

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      {/* Cabecera de campaña */}
      <div className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-base truncate">{group.name}</h2>
            {/* Stats */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-[var(--foreground)]/50">
              <span><strong className="text-[var(--foreground)]">{total}</strong> leads</span>
              {lmLeads.length > 0 && <>
                <span><strong className="text-green-400">{lmDownloaded}</strong> descargaron el LM</span>
                {lmPending > 0 && (
                  <span><strong className="text-orange-400">{lmPending}</strong> sin descargar</span>
                )}
              </>}
              <span><strong className="text-[var(--brand-1)]">{migrated}</strong> en fidelización</span>
              {pending > 0 && (
                <span><strong className="text-yellow-400">{pending}</strong> pendientes de migrar</span>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2 flex-wrap">
            {pending > 0 && (
              <button
                onClick={migrateAll}
                disabled={migrating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50"
                style={{ borderColor: "var(--brand-1)", color: "var(--brand-1)" }}>
                {migrating ? (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                )}
                Mover a Fidelización
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: "var(--brand-1)", color: "var(--background)" }}>
                  {pending}
                </span>
              </button>
            )}
            <button
              onClick={exportCSV}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors hover:border-[var(--brand-1)]/50"
              style={{ borderColor: "var(--border)" }}>
              Exportar CSV
            </button>
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors hover:border-[var(--brand-1)]/50"
              style={{ borderColor: "var(--border)" }}>
              {expanded ? "Ocultar" : "Ver leads"}
              <svg className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Barra de progreso de migración */}
        {total > 0 && (
          <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(migrated / total) * 100}%`, background: "var(--brand-1)" }}
            />
          </div>
        )}

        {/* Banner resultado migración masiva */}
        {migrateResult && (
          <div className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium mt-3 ${migrateResult.ok ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
            <span>
              {migrateResult.ok
                ? `✓ ${migrateResult.count} lead${migrateResult.count !== 1 ? "s" : ""} movido${migrateResult.count !== 1 ? "s" : ""} a Fidelización`
                : "Error al migrar. Inténtalo de nuevo."}
            </span>
            <button onClick={() => setMigrateResult(null)} className="ml-3 opacity-60 hover:opacity-100">×</button>
          </div>
        )}
      </div>

      {/* Tabla desplegable */}
      {expanded && (
        <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: "var(--border)" }}>
          <CampaignLeadsTable leads={group.leads} onSelectLead={onSelectLead} />
        </div>
      )}
    </div>
  );
}

// ── Página principal ────────────────────────────────────────────
function ClientesPage() {
  const searchParams = useSearchParams();
  const campaignIdFilter = searchParams.get("campaignId");

  const [leads, setLeads] = useState<CaptacionLead[]>([]);
  const [businessId, setBusinessId] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<CaptacionLead | null>(null);
  const [updating, setUpdating] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  // Tab activo
  const [activeTab, setActiveTab] = useState<"todos" | "sin_lm" | "fidelizacion" | "manuales">("todos");

  // Modal añadir cliente manual
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", phone: "", email: "", notes: "", campaignId: "" });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([]);

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
      // Cargar campañas para el selector del modal
      const campsRes = await fetch(`/api/captacion/campaigns?businessId=${biz.id}`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const campsData = await campsRes.json();
      setCampaigns((campsData.campaigns || []).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
    };
    load();
  }, []);

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

  const addManualLead = async () => {
    if (!addForm.phone.trim()) { setAddError("El teléfono es obligatorio"); return; }
    setAdding(true);
    setAddError("");
    const res = await fetch("/api/captacion/leads/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        businessId,
        name: addForm.name,
        phone: addForm.phone,
        email: addForm.email,
        notes: addForm.notes,
        campaignId: addForm.campaignId || undefined,
      }),
    });
    if (res.ok) {
      setShowAddModal(false);
      setAddForm({ name: "", phone: "", email: "", notes: "", campaignId: "" });
      await loadLeads(businessId, token);
    } else {
      const d = await res.json();
      setAddError(d.error || "Error al añadir cliente");
    }
    setAdding(false);
  };

  // Agrupar leads por campaña (null campaign_id → "Añadidos manualmente")
  const MANUAL_KEY = "__manual__";
  const groups: CampaignGroup[] = Object.values(
    leads.reduce((acc, lead) => {
      const key = lead.campaign_id ?? MANUAL_KEY;
      if (!acc[key]) {
        acc[key] = {
          id: key,
          name: key === MANUAL_KEY ? "Añadidos manualmente" : (lead.captacion_campaigns?.name || "Sin campaña"),
          leads: [],
        };
      }
      acc[key].leads.push(lead);
      return acc;
    }, {} as Record<string, CampaignGroup>)
  ).sort((a, b) => {
    // Ordenar por fecha de último lead (más reciente primero)
    const aDate = Math.max(...a.leads.map(l => new Date(l.created_at).getTime()));
    const bDate = Math.max(...b.leads.map(l => new Date(l.created_at).getTime()));
    return bDate - aDate;
  });

  // Filtrar grupos según tab activo + campaña desde URL + búsqueda global
  const visibleGroups = groups
    .filter(g => !campaignIdFilter || g.id === campaignIdFilter)
    .filter(g => {
      if (activeTab === "fidelizacion") return g.leads.some(l => l.migrated_to_fidelizacion);
      if (activeTab === "manuales") return g.id === MANUAL_KEY;
      if (activeTab === "sin_lm") return g.leads.some(l => l.lead_magnet_id && l.lm_status !== "downloaded");
      return true; // todos
    })
    .map(g => {
      let filteredLeads = g.leads;
      if (activeTab === "fidelizacion") filteredLeads = filteredLeads.filter(l => l.migrated_to_fidelizacion);
      if (activeTab === "sin_lm") filteredLeads = filteredLeads.filter(l => l.lead_magnet_id && l.lm_status !== "downloaded");
      if (globalSearch) {
        const q = globalSearch.toLowerCase();
        filteredLeads = filteredLeads.filter(l =>
          l.name?.toLowerCase().includes(q) ||
          l.phone?.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q)
        );
      }
      return { ...g, leads: filteredLeads };
    })
    .filter(g => g.leads.length > 0);

  const totalLeads = leads.length;
  const totalMigrated = leads.filter(l => l.migrated_to_fidelizacion).length;
  const totalManual = leads.filter(l => l.campaign_id === null).length;
  const totalWithLm = leads.filter(l => l.lead_magnet_id).length;
  const totalLmPending = leads.filter(l => l.lead_magnet_id && l.lm_status !== "downloaded").length;
  const fidelizacionPct = totalLeads > 0 ? Math.round((totalMigrated / totalLeads) * 100) : 0;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-[var(--foreground)]/50 text-sm">Cargando...</p></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-[var(--foreground)]/50 mt-1">
            {totalLeads} captados · {totalMigrated} en fidelización · {totalManual} añadidos
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            className="rounded-lg border px-3 py-2 text-sm bg-transparent flex-1 sm:w-56"
            style={{ borderColor: "var(--border)" }}
            placeholder="Buscar clientes..."
            value={globalSearch}
            onChange={e => setGlobalSearch(e.target.value)}
          />
          <button
            onClick={() => setShowAddModal(true)}
            className="shrink-0 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: "var(--brand-1)", color: "white" }}
          >
            + Añadir
          </button>
        </div>
      </div>

      {/* Banner embudo captación → fidelización */}
      {totalLeads > 0 && (
        <div className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
          style={{ border: "1px solid var(--border)", background: "var(--card)" }}>
          <div className="flex items-center gap-3 flex-1">
            {/* Captados */}
            <div className="text-center">
              <div className="text-2xl font-bold">{totalLeads}</div>
              <div className="text-xs text-[var(--foreground)]/50">Captados</div>
            </div>
            {/* Flecha */}
            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${fidelizacionPct}%`, background: "var(--brand-1)" }} />
              </div>
              <span className="text-xs text-[var(--foreground)]/40">{fidelizacionPct}% fidelizados</span>
            </div>
            {/* Fidelizados */}
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: "var(--brand-1)" }}>{totalMigrated}</div>
              <div className="text-xs text-[var(--foreground)]/50">En fidelización</div>
            </div>
          </div>
          {totalManual > 0 && (
            <div className="text-xs px-3 py-1.5 rounded-lg text-center sm:text-left"
              style={{ background: "rgba(255,180,0,0.1)", color: "var(--brand-4)", border: "1px solid rgba(255,180,0,0.2)" }}>
              {totalManual} añadido{totalManual !== 1 ? "s" : ""} manualmente
            </div>
          )}
        </div>
      )}

      {/* Alerta leads sin descargar LM */}
      {totalLmPending > 0 && (
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors"
          style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)" }}
          onClick={() => setActiveTab("sin_lm")}
        >
          <div className="flex items-center gap-3">
            <span className="text-orange-400 text-lg">⚠</span>
            <div>
              <p className="text-sm font-semibold text-orange-400">
                {totalLmPending} lead{totalLmPending !== 1 ? "s" : ""} {totalLmPending !== 1 ? "no descargaron" : "no descargó"} el recurso
              </p>
              <p className="text-xs text-orange-400/60">
                Puedes contactarles por WhatsApp para enviarles el enlace.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-orange-400 whitespace-nowrap">Ver →</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 p-1 rounded-xl w-fit" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        {([
          { key: "todos", label: `Todos (${totalLeads})` },
          { key: "sin_lm", label: `Sin LM (${totalLmPending})`, hidden: totalWithLm === 0 },
          { key: "fidelizacion", label: `Fidelización (${totalMigrated})` },
          { key: "manuales", label: `Añadidos (${totalManual})` },
        ] as const).filter(t => !("hidden" in t && t.hidden)).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: activeTab === tab.key ? "var(--brand-1)" : "transparent",
              color: activeTab === tab.key ? "white" : "var(--foreground)",
              opacity: activeTab === tab.key ? 1 : 0.6,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Campañas */}
      {visibleGroups.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[var(--foreground)]/50">
            {totalLeads === 0 ? "Aún no has capturado leads" : "Sin resultados para esta búsqueda"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleGroups.map(group => (
            <CampaignCard
              key={group.id}
              group={group}
              token={token}
              businessId={businessId}
              onSelectLead={setSelectedLead}
              onRefresh={() => loadLeads(businessId, token)}
            />
          ))}
        </div>
      )}

      {/* Panel lateral */}
      {selectedLead && (
        <LeadPanel
          lead={selectedLead}
          updating={updating}
          onClose={() => setSelectedLead(null)}
          onUpdate={updateLead}
        />
      )}

      {/* Modal añadir cliente manual */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">Añadir cliente</h2>
              <button onClick={() => setShowAddModal(false)} className="text-[var(--foreground)]/40 hover:text-[var(--foreground)] text-xl leading-none">×</button>
            </div>
            <p className="text-sm text-[var(--foreground)]/50">
              Para clientes a los que ya conoces y quieres darles un llavero NFC.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-[var(--foreground)]/60">Nombre (opcional)</label>
                <input
                  className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent"
                  style={{ borderColor: "var(--border)" }}
                  placeholder="Nombre del cliente"
                  value={addForm.name}
                  onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-[var(--foreground)]/60">WhatsApp / Teléfono *</label>
                <input
                  className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent"
                  style={{ borderColor: "var(--border)" }}
                  placeholder="+34 600 000 000"
                  type="tel"
                  value={addForm.phone}
                  onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-[var(--foreground)]/60">Email (opcional)</label>
                <input
                  className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent"
                  style={{ borderColor: "var(--border)" }}
                  placeholder="cliente@email.com"
                  type="email"
                  value={addForm.email}
                  onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-[var(--foreground)]/60">Asignar a campaña (opcional)</label>
                <select
                  className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent"
                  style={{ borderColor: "var(--border)", background: "var(--card)" }}
                  value={addForm.campaignId}
                  onChange={e => setAddForm(f => ({ ...f, campaignId: e.target.value }))}
                >
                  <option value="">Sin campaña</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-[var(--foreground)]/60">Nota interna (opcional)</label>
                <textarea
                  className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent resize-none"
                  style={{ borderColor: "var(--border)" }}
                  placeholder="Cómo le conoces, qué servicio le interesa..."
                  rows={2}
                  value={addForm.notes}
                  onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>

            {addError && <p className="text-red-400 text-xs">{addError}</p>}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-lg border text-sm"
                style={{ borderColor: "var(--border)" }}
              >
                Cancelar
              </button>
              <button
                onClick={addManualLead}
                disabled={adding}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 transition-opacity"
                style={{ background: "var(--brand-1)", color: "white" }}
              >
                {adding ? "Guardando..." : "Añadir cliente"}
              </button>
            </div>
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
