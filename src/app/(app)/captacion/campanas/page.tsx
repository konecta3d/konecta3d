"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { CaptacionCampaign, CaptacionForm, CaptacionLeadMagnet } from "@/types/captacion";
import CaptacionChatPanel from "@/components/captacion/CaptacionChatPanel";
import ErrorBanner from "@/components/ui/ErrorBanner";

type CampaignWithCounts = CaptacionCampaign & { leadsCount: number };
type Mode = "list" | "creating" | "editing";

const STATUS_LABELS: Record<string, string> = { draft: "Borrador", active: "Activa", finished: "Finalizada" };
const STATUS_COLORS: Record<string, string> = {
  draft: "bg-yellow-500/15 text-yellow-400",
  active: "bg-green-500/15 text-green-400",
  finished: "bg-[var(--foreground)]/10 text-[var(--foreground)]/50",
};

const emptyForm = {
  name: "", type: "event" as "event" | "permanent",
  starts_at: "", ends_at: "", target_client: "", objective: "",
  form_id: "", lead_magnet_id: "", keychains_distributed: 0,
};

// ─── Línea de lanzamiento ─────────────────────────────────────────────────────

function CampaignPipeline({
  campaign,
  contextBlocks,
  onActivate,
}: {
  campaign: CampaignWithCounts;
  contextBlocks: number;
  onActivate: () => void;
}) {
  const stations = [
    {
      id: "contexto",
      label: "Contexto",
      complete: contextBlocks >= 3,
      href: "/captacion/contexto",
      hint: contextBlocks < 3 ? `${contextBlocks}/7 bloques` : `${contextBlocks}/7`,
    },
    {
      id: "formulario",
      label: "Formulario",
      complete: !!campaign.form_id,
      href: "/captacion/formularios",
      hint: !campaign.form_id ? "Sin asignar" : "Asignado",
    },
    {
      id: "lead_magnet",
      label: "Lead Magnet",
      complete: !!campaign.lead_magnet_id,
      href: "/captacion/lead-magnets",
      hint: !campaign.lead_magnet_id ? "Sin asignar" : "Asignado",
    },
    {
      id: "recorrido",
      label: "Recorrido",
      complete: !!(campaign.target_client && campaign.objective),
      href: "/captacion/recorrido",
      hint: !(campaign.target_client && campaign.objective) ? "Sin definir" : "Definido",
    },
  ];

  const completedCount = stations.filter((s) => s.complete).length;
  const allComplete = completedCount === stations.length;

  return (
    <div className="mt-4 pt-4 border-t border-[var(--border)]">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/40">
          Línea de lanzamiento
        </span>
        <div className="flex items-center gap-2">
          <div className="h-1 w-20 rounded-full bg-[var(--border)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(completedCount / stations.length) * 100}%`,
                background: allComplete ? "var(--brand-4)" : "var(--brand-1)",
              }}
            />
          </div>
          <span className="text-xs text-[var(--foreground)]/40">
            {completedCount}/{stations.length}
          </span>
        </div>
      </div>

      <div className="flex items-center overflow-x-auto pb-1 gap-0.5">
        {stations.map((station, i) => (
          <div key={station.id} className="flex items-center flex-shrink-0">
            <a
              href={station.href}
              className={`flex flex-col items-center px-2.5 py-2 rounded-lg text-center transition-all min-w-[72px] group ${
                station.complete
                  ? "bg-green-500/10 border border-green-500/20"
                  : "border border-dashed hover:border-[var(--brand-1)]/50 cursor-pointer"
              }`}
              style={!station.complete ? { borderColor: "var(--border)" } : undefined}
            >
              <span className={`text-xs font-bold mb-0.5 ${station.complete ? "text-green-400" : "text-[var(--foreground)]/30"}`}>{station.complete ? "OK" : "—"}</span>
              <span
                className={`text-xs font-semibold leading-tight ${
                  station.complete
                    ? "text-green-400"
                    : "text-[var(--foreground)]/50 group-hover:text-[var(--brand-1)]"
                }`}
              >
                {station.label}
              </span>
              <span
                className={`text-xs mt-0.5 ${
                  station.complete ? "text-green-400/60" : "text-[var(--foreground)]/25"
                }`}
              >
                {station.hint}
              </span>
            </a>
            <div
              className={`w-3 h-0.5 flex-shrink-0 mx-0.5 ${
                station.complete ? "bg-green-500/40" : "bg-[var(--foreground)]/8"
              }`}
            />
          </div>
        ))}

        {/* Estación final: Lanzar */}
        <button
          type="button"
          disabled={!allComplete || campaign.status === "active"}
          onClick={allComplete && campaign.status !== "active" ? onActivate : undefined}
          className={`flex flex-col items-center px-2.5 py-2 rounded-lg text-center transition-all min-w-[72px] flex-shrink-0 border-2 ${
            campaign.status === "active"
              ? "border-green-500/30 bg-green-500/10"
              : allComplete
              ? "cursor-pointer hover:opacity-90"
              : "border-dashed opacity-40 cursor-not-allowed"
          }`}
          style={
            allComplete && campaign.status !== "active"
              ? { borderColor: "var(--brand-1)", background: "rgba(57,161,169,0.10)" }
              : !allComplete
              ? { borderColor: "var(--border)" }
              : undefined
          }
        >
          <span className={`text-xs font-bold mb-0.5 ${campaign.status === "active" ? "text-green-400" : allComplete ? "text-[var(--brand-1)]" : "text-[var(--foreground)]/25"}`}>
            {campaign.status === "active" ? "OK" : allComplete ? "OK" : "—"}
          </span>
          <span
            className={`text-xs font-bold leading-tight ${
              campaign.status === "active"
                ? "text-green-400"
                : allComplete
                ? "text-[var(--brand-1)]"
                : "text-[var(--foreground)]/30"
            }`}
          >
            {campaign.status === "active" ? "Activa" : "Lanzar"}
          </span>
          <span
            className={`text-xs mt-0.5 ${
              allComplete && campaign.status !== "active"
                ? "text-[var(--brand-1)]/60"
                : "text-[var(--foreground)]/25"
            }`}
          >
            {campaign.status === "active" ? "En marcha" : allComplete ? "¡Todo listo!" : "Falta info"}
          </span>
        </button>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CampanasPage() {
  const [campaigns, setCampaigns] = useState<CampaignWithCounts[]>([]);
  const [forms, setForms] = useState<Pick<CaptacionForm, "id" | "name">[]>([]);
  const [leadMagnets, setLeadMagnets] = useState<Pick<CaptacionLeadMagnet, "id" | "name">[]>([]);
  const [businessId, setBusinessId] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [contextBlocks, setContextBlocks] = useState(0);

  // Wizard state
  const [mode, setMode] = useState<Mode>("list");
  const [wizardStep, setWizardStep] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

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
    try {
      const headers = { Authorization: `Bearer ${tok}` };
      const qs = `businessId=${bid}`;
      const [campRes, formsRes, lmRes, leadsRes, ctxRes] = await Promise.all([
        fetch(`/api/captacion/campaigns?${qs}`, { headers }),
        fetch(`/api/captacion/forms?${qs}`, { headers }),
        fetch(`/api/captacion/lead-magnets?${qs}`, { headers }),
        fetch(`/api/captacion/leads?${qs}`, { headers }),
        fetch(`/api/captacion/context?${qs}`, { headers }),
      ]);

      if (!campRes.ok) throw new Error("No se pudieron cargar las campañas. Recarga la página.");

      const [campData, formsData, lmData, leadsData, ctxData] = await Promise.all([
        campRes.json(), formsRes.json(), lmRes.json(), leadsRes.json(), ctxRes.json(),
      ]);

      if (ctxData.context) {
        const ctx = ctxData.context as Record<string, Record<string, string>>;
        const count = Object.keys(ctx).filter((blockId) => {
          const block = ctx[blockId];
          return block && Object.values(block).some((v) => (v as string)?.trim?.().length > 0);
        }).length;
        setContextBlocks(count);
      }

      const allLeads = leadsData.leads || [];
      const withCounts = (campData.campaigns || []).map((c: CaptacionCampaign) => ({
        ...c,
        leadsCount: allLeads.filter((l: { campaign_id: string }) => l.campaign_id === c.id).length,
      }));
      setCampaigns(withCounts);
      setForms((formsData.forms || []).map((f: CaptacionForm) => ({ id: f.id, name: f.name })));
      setLeadMagnets((lmData.leadMagnets || []).map((lm: CaptacionLeadMagnet) => ({ id: lm.id, name: lm.name })));
    } catch (e) {
      setPageError(e instanceof Error ? e.message : "Error al cargar las campañas.");
    } finally {
      setLoading(false);
    }
  };

  const enterCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setWizardStep(1);
    setMode("creating");
  };

  const enterEdit = (c: CampaignWithCounts) => {
    setEditingId(c.id);
    setForm({
      name: c.name, type: c.type,
      starts_at: c.starts_at ? c.starts_at.slice(0, 16) : "",
      ends_at: c.ends_at ? c.ends_at.slice(0, 16) : "",
      target_client: c.target_client || "", objective: c.objective || "",
      form_id: c.form_id || "", lead_magnet_id: c.lead_magnet_id || "",
      keychains_distributed: c.keychains_distributed,
    });
    setWizardStep(1);
    setMode("editing");
  };

  const exitWizard = () => {
    setMode("list");
    setWizardStep(1);
    setForm({ ...emptyForm });
    setEditingId(null);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
      const body = { ...form, businessId };
      const res = editingId
        ? await fetch(`/api/captacion/campaigns/${editingId}`, { method: "PUT", headers, body: JSON.stringify(body) })
        : await fetch("/api/captacion/campaigns", { method: "POST", headers, body: JSON.stringify(body) });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "No se pudo guardar la campaña. Inténtalo de nuevo.");
      }
      exitWizard();
      await loadAll(businessId, token);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Error al guardar la campaña.");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (id: string, status: "active" | "finished" | "draft") => {
    await fetch(`/api/captacion/campaigns/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    await loadAll(businessId, token);
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm("¿Eliminar esta campaña? Se eliminarán también sus leads.")) return;
    await fetch(`/api/captacion/campaigns/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    await loadAll(businessId, token);
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${origin}/c/${slug}`);
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
  };

  // ── Step indicator ──────────────────────────────────────────────────────────
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-1 mb-8">
      {[1, 2, 3].map((s, i) => (
        <div key={s} className="flex items-center">
          <button
            type="button"
            onClick={() => wizardStep > s && setWizardStep(s)}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors flex-shrink-0 ${
              wizardStep === s
                ? "bg-[var(--brand-1)] text-white"
                : wizardStep > s
                ? "bg-green-500 text-white cursor-pointer"
                : "bg-[var(--foreground)]/10 text-[var(--foreground)]/40"
            }`}
          >
            {wizardStep > s ? "✓" : s}
          </button>
          {i < 2 && (
            <div className={`w-8 h-0.5 mx-1 ${wizardStep > s ? "bg-green-500" : "bg-[var(--foreground)]/10"}`} />
          )}
        </div>
      ))}
    </div>
  );

  // ── Wizard steps ────────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (wizardStep) {
      case 1:
        return (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-1">
                {mode === "editing" ? "Editar campaña" : "Crea tu campaña"}
              </h2>
              <p className="text-sm text-[var(--foreground)]/50">Nombre e identidad de la campaña</p>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1.5">Nombre de la campaña *</label>
              <input
                autoFocus
                className="w-full rounded-xl border px-4 py-3 text-sm bg-transparent transition-colors focus:border-[var(--brand-1)] outline-none"
                style={{ borderColor: "var(--border)" }}
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Feria del Mueble Madrid 2026"
                onKeyDown={e => { if (e.key === "Enter" && form.name.trim()) setWizardStep(2); }}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-2">Tipo de campaña</label>
              <div className="grid grid-cols-2 gap-3">
                {([["event", "Evento", "Feria, congreso o acto puntual con fecha de inicio y fin"], ["permanent", "Permanente", "Activa de forma continua, sin fecha límite"]] as const).map(([val, label, desc]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: val }))}
                    className="rounded-xl border-2 p-4 text-left transition-colors"
                    style={{
                      borderColor: form.type === val ? "var(--brand-1)" : "var(--border)",
                      background: form.type === val ? "rgba(57,161,169,0.08)" : "transparent",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${form.type === val ? "border-[var(--brand-1)] bg-[var(--brand-1)]" : "border-[var(--border)]"}`}>
                        {form.type === val && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-sm font-semibold">{label}</span>
                    </div>
                    <p className="text-xs text-[var(--foreground)]/50 ml-6">{desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setWizardStep(2)}
                disabled={!form.name.trim()}
                className="px-8 py-3 rounded-full text-sm font-semibold disabled:opacity-40 transition-opacity"
                style={{ background: "var(--brand-1)", color: "white" }}
              >
                Siguiente →
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-1">Configura los detalles</h2>
              <p className="text-sm text-[var(--foreground)]/50">Fechas, cliente objetivo y meta de la campaña</p>
            </div>
            {form.type === "event" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1.5">Fecha de inicio</label>
                  <input type="datetime-local"
                    className="w-full rounded-xl border px-4 py-3 text-sm bg-transparent focus:border-[var(--brand-1)] outline-none transition-colors"
                    style={{ borderColor: "var(--border)", colorScheme: "dark" }}
                    value={form.starts_at}
                    onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1.5">Fecha de fin</label>
                  <input type="datetime-local"
                    className="w-full rounded-xl border px-4 py-3 text-sm bg-transparent focus:border-[var(--brand-1)] outline-none transition-colors"
                    style={{ borderColor: "var(--border)", colorScheme: "dark" }}
                    value={form.ends_at}
                    onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))}
                  />
                </div>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1.5">Cliente objetivo</label>
              <input
                className="w-full rounded-xl border px-4 py-3 text-sm bg-transparent focus:border-[var(--brand-1)] outline-none transition-colors"
                style={{ borderColor: "var(--border)" }}
                value={form.target_client}
                onChange={e => setForm(f => ({ ...f, target_client: e.target.value }))}
                placeholder="Ej: Empresarios de pymes de hostelería"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1.5">Objetivo de la campaña</label>
              <input
                className="w-full rounded-xl border px-4 py-3 text-sm bg-transparent focus:border-[var(--brand-1)] outline-none transition-colors"
                style={{ borderColor: "var(--border)" }}
                value={form.objective}
                onChange={e => setForm(f => ({ ...f, objective: e.target.value }))}
                placeholder="Ej: Captar 50 leads cualificados"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1.5">Llaveros distribuidos</label>
              <input type="number" min="0"
                className="w-full rounded-xl border px-4 py-3 text-sm bg-transparent focus:border-[var(--brand-1)] outline-none transition-colors"
                style={{ borderColor: "var(--border)" }}
                value={form.keychains_distributed}
                onChange={e => setForm(f => ({ ...f, keychains_distributed: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="flex justify-between pt-2">
              <button onClick={() => setWizardStep(1)}
                className="px-6 py-3 rounded-full text-sm font-medium border transition-colors hover:border-[var(--brand-1)]/40"
                style={{ borderColor: "var(--border)" }}>
                ← Atrás
              </button>
              <button onClick={() => setWizardStep(3)}
                className="px-8 py-3 rounded-full text-sm font-semibold"
                style={{ background: "var(--brand-1)", color: "white" }}>
                Siguiente →
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-1">Vincula formulario y recurso</h2>
              <p className="text-sm text-[var(--foreground)]/50">Conecta el formulario de captación y el lead magnet a entregar</p>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1.5">Formulario de captación</label>
              {forms.length === 0 ? (
                <div className="rounded-xl border border-dashed p-4 text-xs text-[var(--foreground)]/40 text-center"
                  style={{ borderColor: "var(--border)" }}>
                  No tienes formularios.{" "}
                  <a href="/captacion/formularios" className="underline" style={{ color: "var(--brand-1)" }}>Crea uno aquí</a>
                </div>
              ) : (
                <select
                  className="w-full rounded-xl border px-4 py-3 text-sm focus:border-[var(--brand-1)] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--foreground)" }}
                  value={form.form_id}
                  onChange={e => setForm(f => ({ ...f, form_id: e.target.value }))}
                >
                  <option value="">Sin formulario asignado</option>
                  {forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1.5">Lead magnet a entregar</label>
              {leadMagnets.length === 0 ? (
                <div className="rounded-xl border border-dashed p-4 text-xs text-[var(--foreground)]/40 text-center"
                  style={{ borderColor: "var(--border)" }}>
                  No tienes lead magnets.{" "}
                  <a href="/captacion/lead-magnets" className="underline" style={{ color: "var(--brand-1)" }}>Crea uno aquí</a>
                </div>
              ) : (
                <select
                  className="w-full rounded-xl border px-4 py-3 text-sm focus:border-[var(--brand-1)] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--foreground)" }}
                  value={form.lead_magnet_id}
                  onChange={e => setForm(f => ({ ...f, lead_magnet_id: e.target.value }))}
                >
                  <option value="">Sin lead magnet</option>
                  {leadMagnets.map(lm => <option key={lm.id} value={lm.id}>{lm.name}</option>)}
                </select>
              )}
            </div>
            {/* Resumen */}
            <div className="rounded-xl border p-4 space-y-2"
              style={{ background: "rgba(57,161,169,0.06)", borderColor: "rgba(57,161,169,0.25)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--brand-1)" }}>Resumen</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[var(--foreground)]/60">
                <span className="text-[var(--foreground)]/40">Nombre</span>
                <span className="font-medium text-[var(--foreground)]">{form.name}</span>
                <span className="text-[var(--foreground)]/40">Tipo</span>
                <span>{form.type === "event" ? "Evento" : "Permanente"}</span>
                {form.objective && <><span className="text-[var(--foreground)]/40">Objetivo</span><span>{form.objective}</span></>}
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <button onClick={() => setWizardStep(2)}
                className="px-6 py-3 rounded-full text-sm font-medium border transition-colors hover:border-[var(--brand-1)]/40"
                style={{ borderColor: "var(--border)" }}>
                ← Atrás
              </button>
              <button onClick={save} disabled={saving || !form.name.trim()}
                className="px-8 py-3 rounded-full text-sm font-semibold disabled:opacity-40 transition-opacity"
                style={{ background: "var(--brand-1)", color: "white" }}>
                {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear campaña"}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[var(--foreground)]/50 text-sm">Cargando...</p>
      </div>
    );
  }

  // ── Wizard view ─────────────────────────────────────────────────────────────
  if (mode === "creating" || mode === "editing") {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <ErrorBanner message={saveError} onDismiss={() => setSaveError(null)} />
        <div className="flex items-center justify-between mb-6">
          <button onClick={exitWizard}
            className="text-sm transition-colors hover:text-[var(--foreground)]"
            style={{ color: "var(--foreground)" }}>
            ← Volver a campañas
          </button>
          <span className="text-xs text-[var(--foreground)]/40">Paso {wizardStep} de 3</span>
        </div>
        <StepIndicator />
        <div className="rounded-2xl border p-6 md:p-8"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          {renderStep()}
        </div>
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ErrorBanner message={pageError} onDismiss={() => setPageError(null)} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campañas</h1>
          <p className="text-sm text-[var(--foreground)]/50 mt-1">Gestiona tus campañas de captación</p>
        </div>
        <button onClick={enterCreate}
          className="px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "var(--brand-1)", color: "white" }}>
          + Nueva campaña
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "rgba(57,161,169,0.1)" }}>
            <svg className="w-8 h-8" style={{ color: "var(--brand-1)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <p className="text-[var(--foreground)]/50 mb-2">Aún no tienes campañas</p>
          <p className="text-xs text-[var(--foreground)]/30 mb-5">Crea tu primera campaña y comparte el enlace en tu próximo evento</p>
          <button onClick={enterCreate}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold"
            style={{ background: "var(--brand-1)", color: "white" }}>
            Crear primera campaña
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c.id} className="rounded-xl border p-5"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              {/* Header de la campaña */}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${STATUS_COLORS[c.status]}`}>
                      {c.status === "active" && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
                      {STATUS_LABELS[c.status]}
                    </span>
                    <span className="text-xs text-[var(--foreground)]/40">{c.type === "event" ? "Evento" : "Permanente"}</span>
                  </div>
                  <h2 className="font-semibold text-lg">{c.name}</h2>
                  <p className="text-xs font-mono mt-0.5" style={{ color: "var(--foreground)", opacity: 0.35 }}>
                    {origin}/c/{c.slug}
                  </p>
                  <div className="flex items-center gap-4 mt-1.5 text-sm text-[var(--foreground)]/60">
                    <span>{c.leadsCount} leads</span>
                    <span>{c.keychains_distributed} llaveros</span>
                    {c.starts_at && <span>{new Date(c.starts_at).toLocaleDateString("es-ES")}</span>}
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-wrap gap-2">
                  {c.status === "draft" && (
                    <button onClick={() => changeStatus(c.id, "active")}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-green-500/15 text-green-400 hover:bg-green-500/25">
                      Activar
                    </button>
                  )}
                  {c.status === "active" && (
                    <button onClick={() => changeStatus(c.id, "finished")}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-red-500/15 text-red-400 hover:bg-red-500/25">
                      Finalizar
                    </button>
                  )}
                  {c.status === "finished" && (
                    <button onClick={() => changeStatus(c.id, "draft")}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors hover:border-[var(--brand-1)]/50"
                      style={{ borderColor: "var(--border)" }}>
                      Reactivar
                    </button>
                  )}
                  <button onClick={() => enterEdit(c)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors hover:border-[var(--brand-1)]/50"
                    style={{ borderColor: "var(--border)" }}>
                    Editar
                  </button>
                  <button
                    onClick={() => copyLink(c.slug)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${copied === c.slug ? "border-green-500/50 text-green-400" : "hover:border-[var(--brand-1)]/50"}`}
                    style={{ borderColor: copied === c.slug ? undefined : "var(--border)" }}>
                    {copied === c.slug ? "✓ Copiado" : "Copiar link"}
                  </button>
                  <button onClick={() => deleteCampaign(c.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors text-red-400 hover:bg-red-500/10">
                    Eliminar
                  </button>
                </div>
              </div>

              {/* Línea de lanzamiento — solo en borrador y activa */}
              {c.status !== "finished" && (
                <CampaignPipeline
                  campaign={c}
                  contextBlocks={contextBlocks}
                  onActivate={() => changeStatus(c.id, "active")}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Asistente IA ── */}
      {businessId && token && mode === "list" && (
        <CaptacionChatPanel
          section="campanas"
          businessId={businessId}
          token={token}
        />
      )}
    </div>
  );
}
