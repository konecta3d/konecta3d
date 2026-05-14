"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { CaptacionCampaign, CaptacionForm, CaptacionLeadMagnet } from "@/types/captacion";

type CampaignWithCounts = CaptacionCampaign & { leadsCount: number };

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  active: "Activa",
  finished: "Finalizada",
};
const STATUS_COLORS: Record<string, string> = {
  draft: "bg-yellow-500/15 text-yellow-400",
  active: "bg-green-500/15 text-green-400",
  finished: "bg-[var(--foreground)]/10 text-[var(--foreground)]/50",
};

export default function CampanasPage() {
  const [campaigns, setCampaigns] = useState<CampaignWithCounts[]>([]);
  const [forms, setForms] = useState<Pick<CaptacionForm, "id" | "name">[]>([]);
  const [leadMagnets, setLeadMagnets] = useState<Pick<CaptacionLeadMagnet, "id" | "name">[]>([]);
  const [businessId, setBusinessId] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [origin, setOrigin] = useState("");

  const [form, setForm] = useState({
    name: "",
    type: "event" as "event" | "permanent",
    starts_at: "",
    ends_at: "",
    target_client: "",
    objective: "",
    form_id: "",
    lead_magnet_id: "",
    keychains_distributed: 0,
  });

  useEffect(() => {
    setOrigin(window.location.origin);
    const load = async () => {
      const { data: s } = await supabase.auth.getSession();
      const t = s?.session?.access_token;
      const email = s?.session?.user?.email;
      if (!email || !t) { setLoading(false); return; }
      setToken(t);
      const { data: biz } = await supabase.from("businesses").select("id").eq("contact_email", email).single();
      if (!biz) { setLoading(false); return; }
      setBusinessId(biz.id);
      await loadAll(biz.id, t);
    };
    load();
  }, []);

  const loadAll = async (bid: string, tok: string) => {
    const headers = { Authorization: `Bearer ${tok}` };
    const qs = `businessId=${bid}`;
    const [campRes, formsRes, lmRes, leadsRes] = await Promise.all([
      fetch(`/api/captacion/campaigns?${qs}`, { headers }),
      fetch(`/api/captacion/forms?${qs}`, { headers }),
      fetch(`/api/captacion/lead-magnets?${qs}`, { headers }),
      fetch(`/api/captacion/leads?${qs}`, { headers }),
    ]);
    const [campData, formsData, lmData, leadsData] = await Promise.all([
      campRes.json(), formsRes.json(), lmRes.json(), leadsRes.json(),
    ]);
    const allLeads = leadsData.leads || [];
    const withCounts = (campData.campaigns || []).map((c: CaptacionCampaign) => ({
      ...c,
      leadsCount: allLeads.filter((l: { campaign_id: string }) => l.campaign_id === c.id).length,
    }));
    setCampaigns(withCounts);
    setForms((formsData.forms || []).map((f: CaptacionForm) => ({ id: f.id, name: f.name })));
    setLeadMagnets((lmData.leadMagnets || []).map((lm: CaptacionLeadMagnet) => ({ id: lm.id, name: lm.name })));
    setLoading(false);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: "", type: "event", starts_at: "", ends_at: "", target_client: "", objective: "", form_id: "", lead_magnet_id: "", keychains_distributed: 0 });
    setShowModal(true);
  };

  const openEdit = (c: CampaignWithCounts) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      type: c.type,
      starts_at: c.starts_at ? c.starts_at.slice(0, 16) : "",
      ends_at: c.ends_at ? c.ends_at.slice(0, 16) : "",
      target_client: c.target_client || "",
      objective: c.objective || "",
      form_id: c.form_id || "",
      lead_magnet_id: c.lead_magnet_id || "",
      keychains_distributed: c.keychains_distributed,
    });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    const body = { ...form, businessId };
    let res;
    if (editingId) {
      res = await fetch(`/api/captacion/campaigns/${editingId}`, { method: "PUT", headers, body: JSON.stringify(body) });
    } else {
      res = await fetch("/api/captacion/campaigns", { method: "POST", headers, body: JSON.stringify(body) });
    }
    if (res.ok) {
      setShowModal(false);
      await loadAll(businessId, token);
    }
    setSaving(false);
  };

  const changeStatus = async (id: string, status: "active" | "finished" | "draft") => {
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    await fetch(`/api/captacion/campaigns/${id}`, { method: "PUT", headers, body: JSON.stringify({ status }) });
    await loadAll(businessId, token);
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm("¿Eliminar esta campaña? Se eliminarán también sus leads.")) return;
    const headers = { Authorization: `Bearer ${token}` };
    await fetch(`/api/captacion/campaigns/${id}`, { method: "DELETE", headers });
    await loadAll(businessId, token);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-[var(--foreground)]/50 text-sm">Cargando...</p></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campañas</h1>
          <p className="text-sm text-[var(--foreground)]/50 mt-1">Gestiona tus campañas de captación</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "var(--brand-1)", color: "white" }}
        >
          + Nueva campaña
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-16">
            <p className="text-[var(--foreground)]/50 mb-4">Aún no tienes campañas</p>
          <button onClick={openCreate} className="px-5 py-2 rounded-lg text-sm font-semibold" style={{ background: "var(--brand-1)", color: "white" }}>
            Crear primera campaña
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c.id} className="rounded-xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[c.status]}`}>
                      {c.status === "active" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-1 animate-pulse" />}
                      {STATUS_LABELS[c.status]}
                    </span>
                    <span className="text-xs text-[var(--foreground)]/40">{c.type === "event" ? "Evento" : "Permanente"}</span>
                  </div>
                  <h2 className="font-semibold text-lg">{c.name}</h2>
                  <p className="text-xs font-mono text-[var(--foreground)]/40 mt-1">{origin}/c/{c.slug}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-[var(--foreground)]/60">
                    <span>{c.leadsCount} leads</span>
                    <span>{c.keychains_distributed} llaveros</span>
                    {c.starts_at && <span>{new Date(c.starts_at).toLocaleDateString("es-ES")}</span>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {c.status === "draft" && (
                    <button onClick={() => changeStatus(c.id, "active")}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors">
                      Activar
                    </button>
                  )}
                  {c.status === "active" && (
                    <button onClick={() => changeStatus(c.id, "finished")}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors">
                      Finalizar
                    </button>
                  )}
                  {c.status === "finished" && (
                    <button onClick={() => changeStatus(c.id, "draft")}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border)] hover:border-[var(--brand-1)]/50 transition-colors">
                      Reactivar
                    </button>
                  )}
                  <button onClick={() => openEdit(c)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border)] hover:border-[var(--brand-1)]/50 transition-colors">
                    Editar
                  </button>
                  <button onClick={() => navigator.clipboard.writeText(`${origin}/c/${c.slug}`)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border)] hover:border-[var(--brand-1)]/50 transition-colors">
                    Copiar link
                  </button>
                  <button onClick={() => deleteCampaign(c.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors">
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-lg rounded-2xl border p-6 space-y-4 overflow-y-auto max-h-[90vh]"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">{editingId ? "Editar campaña" : "Nueva campaña"}</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--foreground)]/40 hover:text-[var(--foreground)] text-xl leading-none">×</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Nombre *</label>
                <input
                  className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent"
                  style={{ borderColor: "var(--border)" }}
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: Feria del Mueble Madrid 2026"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Tipo</label>
                  <select className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)", background: "var(--card)" }}
                    value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as "event" | "permanent" }))}>
                    <option value="event">Evento</option>
                    <option value="permanent">Permanente</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Llaveros distribuidos</label>
                  <input type="number" min="0"
                    className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent"
                    style={{ borderColor: "var(--border)" }}
                    value={form.keychains_distributed}
                    onChange={e => setForm(f => ({ ...f, keychains_distributed: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              {form.type === "event" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Inicio</label>
                    <input type="datetime-local" className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
                      value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Fin</label>
                    <input type="datetime-local" className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
                      value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Cliente objetivo</label>
                <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
                  value={form.target_client} onChange={e => setForm(f => ({ ...f, target_client: e.target.value }))}
                  placeholder="Ej: Empresarios de pymes de hostelería" />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Objetivo de la campaña</label>
                <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
                  value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))}
                  placeholder="Ej: Captar 50 leads cualificados" />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Formulario</label>
                <select className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)", background: "var(--card)" }}
                  value={form.form_id} onChange={e => setForm(f => ({ ...f, form_id: e.target.value }))}>
                  <option value="">Sin formulario asignado</option>
                  {forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Lead magnet</label>
                <select className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)", background: "var(--card)" }}
                  value={form.lead_magnet_id} onChange={e => setForm(f => ({ ...f, lead_magnet_id: e.target.value }))}>
                  <option value="">Sin lead magnet</option>
                  {leadMagnets.map(lm => <option key={lm.id} value={lm.id}>{lm.name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-lg border text-sm font-medium"
                style={{ borderColor: "var(--border)" }}>
                Cancelar
              </button>
              <button onClick={save} disabled={saving || !form.name.trim()}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
                style={{ background: "var(--brand-1)", color: "white" }}>
                {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear campaña"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
