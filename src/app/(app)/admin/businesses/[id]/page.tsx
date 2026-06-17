"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import KeychainOrders from "@/components/admin/KeychainOrders";
import { PERFIL_INFO, PERFILES } from "@/lib/crm/stages";
import { totalPedido, type KeychainOrder } from "@/lib/keychain-orders";

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type Business = {
  id: string;
  name: string;
  sector: string | null;
  slug: string | null;
  public_id: string | null;
  contact_email: string | null;
  phone: string | null;
  font_family: string | null;
  last_login: string | null;
  module_vip_benefits: boolean;
  module_lead_magnet: boolean;
  module_whatsapp: boolean;
  module_gpt: boolean;
  multi_landing_enabled: boolean;
  module_ai_landing: boolean;
  module_ai_recursos: boolean;
  // Gestión
  perfil: string | null;
  notas_admin: string | null;
  cuota_mensual: number | null;
  estado_suscripcion: string | null;
  metodo_cobro: string | null;
  proximo_cobro: string | null;
  fecha_alta_suscripcion: string | null;
};

type Tab = "datos" | "clasificacion" | "modulos" | "pedidos" | "finanzas" | "acceso";

const SUB_ESTADOS = ["prueba", "activa", "impagada", "pausada", "baja"] as const;
const SUB_LABEL: Record<string, string> = {
  prueba: "En prueba", activa: "Activa", impagada: "Impagada", pausada: "Pausada", baja: "Baja",
};
const SUB_COLOR: Record<string, string> = {
  prueba: "#facc15", activa: "#22c55e", impagada: "#ef4444", pausada: "#94a3b8", baja: "#6b7280",
};
const METODOS_COBRO = ["transferencia", "domiciliacion", "tarjeta", "bizum", "otro"] as const;

const inputCls = "w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm";

export default function BusinessDetail() {
  const params = useParams();
  const id = params?.id as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [tab, setTab] = useState<Tab>("datos");
  const [msg, setMsg] = useState<string | null>(null);
  const [crmPerfil, setCrmPerfil] = useState<{ perfil: string | null; leadId: string } | null>(null);
  const [orders, setOrders] = useState<KeychainOrder[]>([]);

  // Edición de datos
  const [editData, setEditData] = useState({ name: "", sector: "", slug: "", contact_email: "", phone: "", font_family: "" });
  // Clasificación
  const [perfil, setPerfil] = useState("");
  const [notasAdmin, setNotasAdmin] = useState("");
  // Finanzas
  const [fin, setFin] = useState({ cuota_mensual: "", estado_suscripcion: "prueba", metodo_cobro: "", proximo_cobro: "", fecha_alta_suscripcion: "" });
  // Contraseña
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  function hydrate(b: Business) {
    setBusiness(b);
    setEditData({
      name: b.name || "", sector: b.sector || "", slug: b.slug || "",
      contact_email: b.contact_email || "", phone: b.phone || "", font_family: b.font_family || "",
    });
    setPerfil(b.perfil || "");
    setNotasAdmin(b.notas_admin || "");
    setFin({
      cuota_mensual: b.cuota_mensual != null ? String(b.cuota_mensual) : "149",
      estado_suscripcion: b.estado_suscripcion || "prueba",
      metodo_cobro: b.metodo_cobro || "",
      proximo_cobro: b.proximo_cobro || "",
      fecha_alta_suscripcion: b.fecha_alta_suscripcion || "",
    });
  }

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("businesses").select("*").eq("id", id).single();
      if (data) hydrate(data as Business);
      // Perfil del CRM si el negocio está enlazado a un lead del pipeline
      try {
        const res = await fetch("/api/admin/crm/leads", { headers: await getAuthHeader() });
        const json = await res.json();
        const lead = (json.leads || []).find((l: { business_id?: string }) => l.business_id === id);
        if (lead) setCrmPerfil({ perfil: lead.perfil ?? null, leadId: lead.id });
      } catch { /* silencioso */ }
      // Pedidos (para el resumen financiero)
      try {
        const res = await fetch(`/api/admin/keychain-orders?businessId=${id}`, { headers: await getAuthHeader() });
        const json = await res.json();
        if (json.orders) setOrders(json.orders);
      } catch { /* silencioso */ }
    })();
  }, [id]);

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(null), 2500); }

  async function save(fields: Record<string, unknown>, okMsg: string) {
    if (!business) return;
    const res = await fetch("/api/admin/update-business", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await getAuthHeader()) },
      body: JSON.stringify({ id, ...fields }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setBusiness({ ...business, ...fields } as Business);
      flash(data.warning || okMsg);
    } else {
      flash(data.error || "Error al guardar");
    }
  }

  const updateModule = (module: string, value: boolean) => save({ [module]: value }, `${module} ${value ? "activado" : "desactivado"}`);

  const handlePasswordReset = async () => {
    if (!newPassword || !business?.contact_email) return;
    setIsResetting(true);
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json", ...(await getAuthHeader()) },
        body: JSON.stringify({ email: business.contact_email, newPassword }),
      });
      const data = await res.json();
      flash(res.ok ? "Contraseña actualizada" : (data.error || "Error"));
      if (res.ok) setNewPassword("");
    } catch { flash("Error de red"); }
    setIsResetting(false);
  };

  const handleGenerateOnboardingPdf = async () => {
    if (!newPassword || !business?.contact_email) return;
    setIsGeneratingPdf(true);
    try {
      const res = await fetch("/api/admin/onboarding-pdf", {
        method: "POST", headers: { "Content-Type": "application/json", ...(await getAuthHeader()) },
        body: JSON.stringify({ businessId: id, newPassword }),
      });
      if (!res.ok) { const d = await res.json(); flash(d.error || "Error al generar PDF"); }
      else {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `onboarding-${(business?.name || "negocio").replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf`;
        document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
        flash("PDF descargado y contraseña actualizada"); setNewPassword("");
      }
    } catch { flash("Error de red"); }
    setIsGeneratingPdf(false);
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsg(label); setTimeout(() => setCopiedMsg(""), 1500);
  };

  if (!business) return <div className="p-8 text-center text-[var(--foreground)]/50">Cargando…</div>;

  const pendienteCobro = orders
    .filter(o => o.estado_pago === "pendiente" && o.estado !== "cancelado")
    .reduce((s, o) => s + totalPedido(o), 0);

  const TABS: { k: Tab; l: string }[] = [
    { k: "datos", l: "Datos" },
    { k: "clasificacion", l: "Clasificación" },
    { k: "modulos", l: "Módulos" },
    { k: "pedidos", l: "Pedidos" },
    { k: "finanzas", l: "Finanzas" },
    { k: "acceso", l: "Acceso" },
  ];

  return (
    <div className="max-w-[1000px] mx-auto pb-12">
      {/* Cabecera */}
      <div className="flex items-center gap-2 mb-3 text-xs">
        <a className="text-[var(--brand-1)]" href="/admin/businesses">← Negocios</a>
        <span className="text-[var(--foreground)]/30">/</span>
        <span>{business.name}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">{business.name}</h1>
            {business.perfil && PERFIL_INFO[business.perfil as keyof typeof PERFIL_INFO] && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${PERFIL_INFO[business.perfil as keyof typeof PERFIL_INFO].color}22`, color: PERFIL_INFO[business.perfil as keyof typeof PERFIL_INFO].color }}>
                Perfil {business.perfil}
              </span>
            )}
            {business.estado_suscripcion && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${SUB_COLOR[business.estado_suscripcion] || "#888"}22`, color: SUB_COLOR[business.estado_suscripcion] || "#888" }}>
                {SUB_LABEL[business.estado_suscripcion] || business.estado_suscripcion}
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--foreground)]/50 mt-0.5">{business.sector || "Sin sector"}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {msg && <span className="text-xs px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 font-medium">{msg}</span>}
          <button onClick={() => window.open(`/business/select-profile?businessId=${id}&fromAdmin=1`, "_blank")}
            className="px-3 py-1.5 rounded-lg text-xs border border-[var(--border)] hover:bg-[var(--border)]/20">Entrar como el negocio</button>
          <a href={`/admin/businesses/${id}/dashboard`} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-black" style={{ background: "var(--brand-4)" }}>Estadísticas →</a>
        </div>
      </div>

      {/* IDs copiables */}
      <div className="flex flex-wrap gap-2 mb-5">
        <IdChip label="Business ID" value={business.id} onCopy={() => copy(business.id, "Business ID copiado")} />
        {business.public_id && <IdChip label="ID público" value={business.public_id} onCopy={() => copy(business.public_id!, "ID público copiado")} />}
        {copiedMsg && <span className="text-xs text-green-500 self-center">{copiedMsg}</span>}
      </div>

      {/* Pestañas */}
      <div className="flex gap-1 mb-5 flex-wrap border-b border-[var(--border)]">
        {TABS.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className="px-3 py-2 text-sm font-medium -mb-px border-b-2 transition-colors"
            style={{ borderColor: tab === t.k ? "var(--brand-1)" : "transparent", color: tab === t.k ? "var(--brand-1)" : "var(--foreground)", opacity: tab === t.k ? 1 : 0.6 }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* ── DATOS ── */}
      {tab === "datos" && (
        <Card>
          <h2 className="text-sm font-semibold mb-3">Datos del negocio y contacto</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Nombre"><input className={inputCls} value={editData.name} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} /></Field>
            <Field label="Sector"><input className={inputCls} value={editData.sector} onChange={e => setEditData(d => ({ ...d, sector: e.target.value }))} /></Field>
            <Field label="Slug (URL)"><input className={inputCls} value={editData.slug} onChange={e => setEditData(d => ({ ...d, slug: e.target.value }))} placeholder="mi-negocio" /></Field>
            <Field label="Email"><input className={inputCls} type="email" value={editData.contact_email} onChange={e => setEditData(d => ({ ...d, contact_email: e.target.value }))} /></Field>
            <Field label="Teléfono"><input className={inputCls} type="tel" value={editData.phone} onChange={e => setEditData(d => ({ ...d, phone: e.target.value }))} /></Field>
            <Field label="Fuente (Font)"><input className={inputCls} value={editData.font_family} onChange={e => setEditData(d => ({ ...d, font_family: e.target.value }))} placeholder="Inter, Roboto…" /></Field>
          </div>
          <button onClick={() => save(editData, "Datos guardados")} className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "var(--brand-1)", color: "white" }}>Guardar datos</button>
        </Card>
      )}

      {/* ── CLASIFICACIÓN ── */}
      {tab === "clasificacion" && (
        <Card>
          <h2 className="text-sm font-semibold mb-3">Clasificación del cliente</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Perfil (asignación manual)">
              <select className={inputCls} value={perfil} onChange={e => setPerfil(e.target.value)}>
                <option value="">— Sin asignar —</option>
                {PERFILES.map(p => <option key={p} value={p}>{p} — {PERFIL_INFO[p].label}</option>)}
              </select>
            </Field>
            <div className="flex items-end">
              {crmPerfil ? (
                <p className="text-xs text-[var(--foreground)]/50">
                  En el pipeline: <strong>{crmPerfil.perfil ? `Perfil ${crmPerfil.perfil}` : "sin perfil"}</strong>{" · "}
                  <Link href={`/admin/crm/pipeline/${crmPerfil.leadId}`} className="text-[var(--brand-1)]">ver ficha →</Link>
                </p>
              ) : (
                <p className="text-xs text-[var(--foreground)]/30">No está enlazado a ningún lead del pipeline.</p>
              )}
            </div>
          </div>
          <Field label="Notas internas (solo admin)">
            <textarea rows={4} className={inputCls + " resize-y mt-1"} value={notasAdmin} onChange={e => setNotasAdmin(e.target.value)} placeholder="Contexto comercial, acuerdos, recordatorios…" />
          </Field>
          <button onClick={() => save({ perfil: perfil || null, notas_admin: notasAdmin || null }, "Clasificación guardada")} className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "var(--brand-1)", color: "white" }}>Guardar clasificación</button>
        </Card>
      )}

      {/* ── MÓDULOS ── */}
      {tab === "modulos" && (
        <Card>
          <h2 className="text-sm font-semibold mb-3">Módulos del negocio</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {([
              { k: "module_lead_magnet", l: "Lead Magnet" },
              { k: "module_vip_benefits", l: "VIP Beneficios" },
              { k: "module_whatsapp", l: "WhatsApp" },
              { k: "module_gpt", l: "GPT de Fidelización" },
              { k: "module_ai_landing", l: "IA — Landing" },
              { k: "module_ai_recursos", l: "IA — Recursos" },
            ] as { k: keyof Business; l: string }[]).map(m => (
              <label key={m.k} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] cursor-pointer hover:bg-[var(--border)]/20">
                <input type="checkbox" checked={Boolean(business[m.k])} onChange={e => updateModule(m.k, e.target.checked)} className="accent-[var(--brand-1)]" />
                <span className={business[m.k] ? "" : "opacity-50"}>{m.l}</span>
              </label>
            ))}
          </div>
        </Card>
      )}

      {/* ── PEDIDOS ── */}
      {tab === "pedidos" && <KeychainOrders businessId={id} />}

      {/* ── FINANZAS ── */}
      {tab === "finanzas" && (
        <Card>
          <h2 className="text-sm font-semibold mb-3">Suscripción de la plataforma</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Cuota mensual (€)"><input type="number" step="0.01" className={inputCls} value={fin.cuota_mensual} onChange={e => setFin(f => ({ ...f, cuota_mensual: e.target.value }))} /></Field>
            <Field label="Estado">
              <select className={inputCls} value={fin.estado_suscripcion} onChange={e => setFin(f => ({ ...f, estado_suscripcion: e.target.value }))}>
                {SUB_ESTADOS.map(s => <option key={s} value={s}>{SUB_LABEL[s]}</option>)}
              </select>
            </Field>
            <Field label="Método de cobro">
              <select className={inputCls} value={fin.metodo_cobro} onChange={e => setFin(f => ({ ...f, metodo_cobro: e.target.value }))}>
                <option value="">—</option>
                {METODOS_COBRO.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Próximo cobro"><input type="date" className={inputCls} value={fin.proximo_cobro} onChange={e => setFin(f => ({ ...f, proximo_cobro: e.target.value }))} /></Field>
            <Field label="Alta de la suscripción"><input type="date" className={inputCls} value={fin.fecha_alta_suscripcion} onChange={e => setFin(f => ({ ...f, fecha_alta_suscripcion: e.target.value }))} /></Field>
          </div>
          <button onClick={() => save({
            cuota_mensual: fin.cuota_mensual ? Number(fin.cuota_mensual) : null,
            estado_suscripcion: fin.estado_suscripcion,
            metodo_cobro: fin.metodo_cobro || null,
            proximo_cobro: fin.proximo_cobro || null,
            fecha_alta_suscripcion: fin.fecha_alta_suscripcion || null,
          }, "Finanzas guardadas")} className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "var(--brand-1)", color: "white" }}>Guardar finanzas</button>

          <div className="mt-5 pt-4 border-t border-[var(--border)] grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Mini label="Cuota / mes" value={`${Number(fin.cuota_mensual || 0).toLocaleString("es-ES")} €`} />
            <Mini label="Pedidos pendientes de cobro" value={`${pendienteCobro.toLocaleString("es-ES")} €`} accent={pendienteCobro > 0 ? "#f59e0b" : undefined} />
            <Mini label="Pedidos totales" value={orders.length} />
          </div>
        </Card>
      )}

      {/* ── ACCESO ── */}
      {tab === "acceso" && (
        <Card>
          <h2 className="text-sm font-semibold mb-3 text-red-400">Control de acceso</h2>
          <p className="text-xs text-[var(--foreground)]/50 mb-3">
            Email: {business.contact_email || "—"} · Último acceso: {business.last_login ? new Date(business.last_login).toLocaleString("es-ES") : "nunca"}
          </p>
          <Field label={`Nueva contraseña para ${business.contact_email || "el negocio"}`}>
            <div className="flex items-center gap-2">
              <input type={showNewPassword ? "text" : "password"} className={inputCls} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nueva clave…" />
              <button type="button" onMouseDown={() => setShowNewPassword(true)} onMouseUp={() => setShowNewPassword(false)} onMouseLeave={() => setShowNewPassword(false)} className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm flex-shrink-0">Ver</button>
              <button type="button" onClick={() => setNewPassword(Math.random().toString(36).slice(2, 10))} className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm flex-shrink-0">Generar</button>
            </div>
          </Field>
          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            <button onClick={handlePasswordReset} disabled={isResetting || isGeneratingPdf || !newPassword || !business.contact_email}
              className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 text-sm font-medium hover:bg-red-500/20 disabled:opacity-50">
              {isResetting ? "Actualizando…" : "Actualizar contraseña"}
            </button>
            <button onClick={handleGenerateOnboardingPdf} disabled={isGeneratingPdf || isResetting || !newPassword || !business.contact_email}
              className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50" style={{ background: "var(--brand-1)", color: "white" }}>
              {isGeneratingPdf ? "Generando…" : "Actualizar + PDF onboarding"}
            </button>
          </div>
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <a href={business.slug ? `/l/${business.slug}/NFC` : "#"} target="_blank" className="text-sm text-green-500 hover:underline">Ver landing pública →</a>
          </div>
        </Card>
      )}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-[var(--border)] p-5" style={{ background: "var(--card)" }}>{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs text-[var(--foreground)]/50 mb-1">{label}</label>{children}</div>;
}
function Mini({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] p-3" style={{ background: "var(--background)" }}>
      <p className="text-lg font-bold" style={accent ? { color: accent } : {}}>{value}</p>
      <p className="text-[11px] text-[var(--foreground)]/50 mt-0.5">{label}</p>
    </div>
  );
}
function IdChip({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <button onClick={onCopy} title="Copiar"
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] hover:border-[var(--brand-1)]/50 transition-colors"
      style={{ background: "var(--card)" }}>
      <span className="text-[10px] uppercase tracking-wide text-[var(--foreground)]/40">{label}</span>
      <span className="text-xs font-mono">{value}</span>
      <span className="text-[var(--foreground)]/40 text-xs">⧉</span>
    </button>
  );
}
