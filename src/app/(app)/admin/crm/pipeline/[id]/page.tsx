"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  STAGES, getStage, getTimeStatus, TIME_STATUS_COLOR,
  PERFIL_INFO, FUENTES, SECTORES, ASIGNADOS, PERFILES,
} from "@/lib/crm/stages";

const TIPOS_ACTIVIDAD = [
  { key: "llamada",   label: "Llamada" },
  { key: "whatsapp",  label: "WhatsApp" },
  { key: "email",     label: "Email" },
  { key: "dm",        label: "DM" },
  { key: "demo",      label: "Demo" },
  { key: "propuesta", label: "Propuesta" },
  { key: "feria",     label: "Feria" },
];

const RESULTADOS = [
  { key: "muy_positivo", label: "Muy positivo", color: "#22c55e" },
  { key: "positivo",     label: "Positivo",     color: "#84cc16" },
  { key: "neutral",      label: "Neutral",      color: "#94a3b8" },
  { key: "negativo",     label: "Negativo",     color: "#f97316" },
  { key: "sin_respuesta",label: "Sin respuesta",color: "#ef4444" },
];

interface Activity {
  id: string; tipo: string; realizado_por: string | null;
  resultado: string | null; resumen: string | null;
  siguiente_accion: string | null; fecha_siguiente_accion: string | null;
  duracion_min: number | null; fecha: string;
}

interface Lead {
  id: string;
  nombre: string; empresa: string | null; sector: string | null;
  email: string | null; telefono: string | null; whatsapp: string | null;
  linkedin_url: string | null; instagram_url: string | null;
  etapa: string; etapa_index: number; etapa_entered_at: string;
  score: number; perfil: string | null; fuente: string | null;
  proxima_feria: string | null; ferias_al_anio: number | null;
  unidades_estimadas: number | null; revenue_estimado: number;
  asignado_a: string | null; ultimo_contacto: string | null;
  proxima_accion: string | null; fecha_proxima_accion: string | null;
  notas: string | null; motivo_perdida: string | null;
  fecha_entrada: string; fecha_cierre: string | null;
  business_id: string | null;
}

interface StageRecord {
  id: string; stage: string; stage_index: number;
  entered_at: string; exited_at: string | null; duration_hours: number | null;
  changed_by: string | null;
}

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  return { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token || ""}` };
}

function fmtDuration(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 24) return `${Math.round(hours)} h`;
  const days = Math.floor(hours / 24);
  const rem = Math.round(hours % 24);
  return rem > 0 ? `${days}d ${rem}h` : `${days} ${days === 1 ? "día" : "días"}`;
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [history, setHistory] = useState<StageRecord[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Lead>>({});

  const load = async () => {
    try {
      const res = await fetch(`/api/admin/crm/leads/${id}`, { headers: await authHeaders() });
      const json = await res.json();
      if (json.lead) { setLead(json.lead); setForm(json.lead); }
      if (json.history) setHistory(json.history);
      if (json.activities) setActivities(json.activities);
    } catch { /* silencioso */ }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const set = (k: keyof Lead, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/crm/leads/${id}`, {
        method: "PUT", headers: await authHeaders(), body: JSON.stringify(form),
      });
      if (res.ok) { const j = await res.json(); setLead(j.lead); setMsg("Guardado"); }
      else setMsg("Error al guardar");
    } catch { setMsg("Error de red"); }
    setSaving(false);
    setTimeout(() => setMsg(null), 2500);
  };

  const moveTo = async (etapa: string) => {
    try {
      const res = await fetch(`/api/admin/crm/leads/${id}/move`, {
        method: "POST", headers: await authHeaders(), body: JSON.stringify({ etapa }),
      });
      if (res.ok) load();
    } catch { /* silencioso */ }
  };

  const del = async () => {
    if (!confirm("¿Eliminar este lead permanentemente?")) return;
    await fetch(`/api/admin/crm/leads/${id}`, { method: "DELETE", headers: await authHeaders() });
    router.push("/admin/crm/pipeline");
  };

  // Conversión a negocio
  const [converting, setConverting] = useState(false);
  const [convertResult, setConvertResult] = useState<{ password: string | null; publicId: string } | null>(null);

  const convertirEnNegocio = async () => {
    if (!lead) return;
    if (!lead.email) { alert("El lead necesita un email para crear el negocio."); return; }
    if (!confirm(`¿Crear el negocio "${lead.empresa || lead.nombre}" en la plataforma? Se generará un acceso para el cliente.`)) return;

    setConverting(true);
    try {
      const headers = await authHeaders();
      // 1. Crear el negocio reutilizando el endpoint existente
      const res = await fetch("/api/admin/create-business", {
        method: "POST", headers,
        body: JSON.stringify({
          name: lead.empresa || lead.nombre,
          email: lead.email,
          phone: lead.telefono || "",
          sector: lead.sector || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert("Error al crear negocio: " + (data.error || "")); setConverting(false); return; }

      // 2. Vincular el negocio al lead
      await fetch(`/api/admin/crm/leads/${id}`, {
        method: "PUT", headers,
        body: JSON.stringify({ business_id: data.business.id }),
      });

      // 3. Mover el lead a cliente activo
      await fetch(`/api/admin/crm/leads/${id}/move`, {
        method: "POST", headers,
        body: JSON.stringify({ etapa: "cliente_activo" }),
      });

      setConvertResult({ password: data.password, publicId: data.publicId });
      load();
    } catch {
      alert("Error de red al convertir.");
    }
    setConverting(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: "var(--brand-1)" }} />
    </div>;
  }

  if (!lead) {
    return <div className="text-center py-12 text-[var(--foreground)]/50">Lead no encontrado.</div>;
  }

  const stage = getStage(lead.etapa);
  const time = getTimeStatus(lead.etapa, lead.etapa_entered_at);
  const totalDays = Math.floor((Date.now() - new Date(lead.fecha_entrada).getTime()) / (1000 * 60 * 60 * 24));
  const inputCls = "w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm";

  return (
    <div className="max-w-[1100px] mx-auto pb-12">
      {/* Cabecera */}
      <div className="flex items-center gap-2 mb-4">
        <Link href="/admin/crm/pipeline" className="text-sm text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors">
          ← Pipeline
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold">{lead.nombre}</h1>
            {lead.perfil && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${PERFIL_INFO[lead.perfil as keyof typeof PERFIL_INFO].color}22`, color: PERFIL_INFO[lead.perfil as keyof typeof PERFIL_INFO].color }}>
                Perfil {lead.perfil}
              </span>
            )}
          </div>
          {lead.empresa && <p className="text-sm text-[var(--foreground)]/50 mt-0.5">{lead.empresa}</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {msg && <span className="text-xs px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 font-medium">{msg}</span>}
          <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50" style={{ background: "var(--brand-1)", color: "white" }}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
          <button onClick={del} className="px-3 py-2 rounded-lg border border-red-500/30 text-xs text-red-500 hover:bg-red-500/10 transition-colors">
            Eliminar
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">

        {/* ── Columna izquierda: datos ── */}
        <div className="space-y-5">

          {/* Etapa actual + mover */}
          <div className="rounded-xl border border-[var(--border)] p-5" style={{ background: "var(--card)" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground)]/50">Etapa actual</h2>
              {time.status !== "none" && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: TIME_STATUS_COLOR[time.status] }} />
                  <span className="text-xs text-[var(--foreground)]/50">{time.days === 0 ? "Hoy" : `${time.days} ${time.days === 1 ? "día" : "días"}`}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 rounded-full" style={{ background: stage?.color }} />
              <span className="text-base font-bold">{stage?.label}</span>
            </div>
            <p className="text-xs text-[var(--foreground)]/50 mb-3">{stage?.description}</p>
            {/* Selector de etapa */}
            <div className="flex flex-wrap gap-1.5">
              {STAGES.map(s => (
                <button key={s.key} onClick={() => moveTo(s.key)}
                  className={`text-[11px] px-2 py-1 rounded-lg border transition-colors ${
                    s.key === lead.etapa
                      ? "border-transparent text-white"
                      : "border-[var(--border)] text-[var(--foreground)]/50 hover:text-[var(--foreground)]"
                  }`}
                  style={s.key === lead.etapa ? { background: s.color } : {}}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Datos de contacto */}
          <div className="rounded-xl border border-[var(--border)] p-5 space-y-3" style={{ background: "var(--card)" }}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground)]/50">Datos de contacto</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Nombre"><input className={inputCls} value={form.nombre ?? ""} onChange={e => set("nombre", e.target.value)} /></Field>
              <Field label="Empresa"><input className={inputCls} value={form.empresa ?? ""} onChange={e => set("empresa", e.target.value)} /></Field>
              <Field label="Email"><input className={inputCls} value={form.email ?? ""} onChange={e => set("email", e.target.value)} /></Field>
              <Field label="Teléfono"><input className={inputCls} value={form.telefono ?? ""} onChange={e => set("telefono", e.target.value)} /></Field>
              <Field label="WhatsApp"><input className={inputCls} value={form.whatsapp ?? ""} onChange={e => set("whatsapp", e.target.value)} /></Field>
              <Field label="Sector">
                <select className={inputCls} value={form.sector ?? ""} onChange={e => set("sector", e.target.value)}>
                  <option value="">—</option>{SECTORES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="LinkedIn"><input className={inputCls} value={form.linkedin_url ?? ""} onChange={e => set("linkedin_url", e.target.value)} /></Field>
              <Field label="Instagram"><input className={inputCls} value={form.instagram_url ?? ""} onChange={e => set("instagram_url", e.target.value)} /></Field>
            </div>
          </div>

          {/* Datos comerciales */}
          <div className="rounded-xl border border-[var(--border)] p-5 space-y-3" style={{ background: "var(--card)" }}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground)]/50">Datos comerciales</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Perfil">
                <select className={inputCls} value={form.perfil ?? ""} onChange={e => set("perfil", e.target.value)}>
                  <option value="">—</option>{PERFILES.map(p => <option key={p} value={p}>{p} — {PERFIL_INFO[p].label}</option>)}
                </select>
              </Field>
              <Field label="Score (0-25)"><input type="number" className={inputCls} value={form.score ?? 0} onChange={e => set("score", Number(e.target.value))} /></Field>
              <Field label="Fuente">
                <select className={inputCls} value={form.fuente ?? ""} onChange={e => set("fuente", e.target.value)}>
                  <option value="">—</option>{FUENTES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </Field>
              <Field label="Próxima feria"><input type="date" className={inputCls} value={form.proxima_feria ?? ""} onChange={e => set("proxima_feria", e.target.value)} /></Field>
              <Field label="Ferias/año"><input type="number" className={inputCls} value={form.ferias_al_anio ?? ""} onChange={e => set("ferias_al_anio", Number(e.target.value))} /></Field>
              <Field label="Unidades est."><input type="number" className={inputCls} value={form.unidades_estimadas ?? ""} onChange={e => set("unidades_estimadas", Number(e.target.value))} /></Field>
            </div>
            <p className="text-xs text-[var(--foreground)]/40">
              Revenue estimado: <strong className="text-green-500">{((Number(form.unidades_estimadas) || 0) * 3).toLocaleString("es-ES")}€</strong> ({form.unidades_estimadas || 0} × 3€)
            </p>
          </div>

          {/* Gestión */}
          <div className="rounded-xl border border-[var(--border)] p-5 space-y-3" style={{ background: "var(--card)" }}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground)]/50">Gestión</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Asignado a">
                <select className={inputCls} value={form.asignado_a ?? ""} onChange={e => set("asignado_a", e.target.value)}>
                  <option value="">—</option>{ASIGNADOS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </Field>
              <Field label="Fecha próxima acción"><input type="date" className={inputCls} value={form.fecha_proxima_accion ?? ""} onChange={e => set("fecha_proxima_accion", e.target.value)} /></Field>
            </div>
            <Field label="Próxima acción"><input className={inputCls} value={form.proxima_accion ?? ""} onChange={e => set("proxima_accion", e.target.value)} placeholder="Ej: Llamar el jueves para cerrar" /></Field>
            <Field label="Notas"><textarea rows={3} className={inputCls + " resize-y"} value={form.notas ?? ""} onChange={e => set("notas", e.target.value)} /></Field>
            {lead.etapa === "perdido" && (
              <Field label="Motivo de pérdida"><input className={inputCls} value={form.motivo_perdida ?? ""} onChange={e => set("motivo_perdida", e.target.value)} /></Field>
            )}
          </div>

          {/* Actividad */}
          <ActivitySection leadId={id} activities={activities} onChange={load} defaultPerson={lead.asignado_a} />
        </div>

        {/* ── Columna derecha: historial de tiempos ── */}
        <div className="space-y-4 lg:sticky lg:top-6">
          <div className="rounded-xl border border-[var(--border)] p-5" style={{ background: "var(--card)" }}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground)]/50 mb-1">Tiempo en pipeline</h2>
            <p className="text-2xl font-bold mb-4">{totalDays} <span className="text-sm font-normal text-[var(--foreground)]/50">{totalDays === 1 ? "día" : "días"}</span></p>

            <div className="space-y-2">
              {history.map((h, i) => {
                const st = getStage(h.stage);
                const isCurrent = h.exited_at === null;
                return (
                  <div key={h.id} className="flex items-start gap-2.5">
                    <div className="flex flex-col items-center">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ background: st?.color }} />
                      {i < history.length - 1 && <span className="w-px flex-1 my-0.5" style={{ background: "var(--border)", minHeight: 16 }} />}
                    </div>
                    <div className="flex-1 min-w-0 pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs ${isCurrent ? "font-bold" : "font-medium"} text-[var(--foreground)]`}>{st?.label}</span>
                        <span className="text-[11px] text-[var(--foreground)]/40">
                          {isCurrent ? "ahora" : fmtDuration(h.duration_hours)}
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--foreground)]/30">
                        {new Date(h.entered_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resumen rápido */}
          <div className="rounded-xl border border-[var(--border)] p-5 space-y-2 text-xs" style={{ background: "var(--card)" }}>
            <div className="flex justify-between"><span className="text-[var(--foreground)]/40">Entrada</span><span>{new Date(lead.fecha_entrada).toLocaleDateString("es-ES")}</span></div>
            {lead.fuente && <div className="flex justify-between"><span className="text-[var(--foreground)]/40">Fuente</span><span>{lead.fuente}</span></div>}
            {lead.fecha_cierre && <div className="flex justify-between"><span className="text-[var(--foreground)]/40">Cierre</span><span>{new Date(lead.fecha_cierre).toLocaleDateString("es-ES")}</span></div>}
          </div>

          {/* Conversión a negocio — disponible en cualquier etapa */}
          <div className="rounded-xl border border-green-500/30 p-5" style={{ background: "var(--card)" }}>
              <h2 className="text-sm font-semibold text-green-500 mb-1">Convertir en negocio</h2>
              {lead.business_id ? (
                <div className="space-y-2">
                  <p className="text-xs text-[var(--foreground)]/50">Este lead ya está vinculado a un negocio en la plataforma.</p>
                  <Link href={`/admin/businesses/${lead.business_id}`}
                    className="inline-block text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--brand-1)] hover:bg-[var(--brand-1)]/10 transition-colors">
                    Ver negocio →
                  </Link>
                </div>
              ) : convertResult ? (
                <div className="space-y-2 text-xs">
                  <p className="text-green-500 font-medium">Negocio creado correctamente.</p>
                  <div className="rounded-lg border border-[var(--border)] p-2.5 space-y-1 font-mono" style={{ background: "var(--background)" }}>
                    <div className="flex justify-between"><span className="text-[var(--foreground)]/40">ID público</span><span>{convertResult.publicId}</span></div>
                    {convertResult.password && <div className="flex justify-between"><span className="text-[var(--foreground)]/40">Contraseña</span><span>{convertResult.password}</span></div>}
                  </div>
                  <p className="text-[10px] text-[var(--foreground)]/40">Guarda estas credenciales y envíaselas al cliente.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-[var(--foreground)]/50">
                    Crea automáticamente el negocio en la plataforma con los datos de este lead (empresa, email, teléfono, sector) y genera su acceso.
                  </p>
                  <button onClick={convertirEnNegocio} disabled={converting}
                    className="w-full py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                    style={{ background: "#22c55e", color: "white" }}>
                    {converting ? "Creando negocio…" : "Convertir en negocio"}
                  </button>
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-[var(--foreground)]/50 mb-1">{label}</label>
      {children}
    </div>
  );
}

// ─── Sección de actividad ─────────────────────────────────────────────────────

function ActivitySection({
  leadId, activities, onChange, defaultPerson,
}: {
  leadId: string; activities: Activity[]; onChange: () => void; defaultPerson: string | null;
}) {
  const [tipo, setTipo] = useState("llamada");
  const [resultado, setResultado] = useState("positivo");
  const [resumen, setResumen] = useState("");
  const [siguienteAccion, setSiguienteAccion] = useState("");
  const [fechaSiguiente, setFechaSiguiente] = useState("");
  const [persona, setPersona] = useState(defaultPerson || "Miguel");
  const [saving, setSaving] = useState(false);

  const inputCls = "w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm";

  const registrar = async () => {
    setSaving(true);
    try {
      await fetch("/api/admin/crm/activities", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({
          lead_id: leadId, tipo, resultado, resumen,
          realizado_por: persona,
          siguiente_accion: siguienteAccion || null,
          fecha_siguiente_accion: fechaSiguiente || null,
        }),
      });
      setResumen(""); setSiguienteAccion(""); setFechaSiguiente("");
      onChange();
    } catch { /* silencioso */ }
    setSaving(false);
  };

  const borrar = async (id: string) => {
    await fetch(`/api/admin/crm/activities/${id}`, { method: "DELETE", headers: await authHeaders() });
    onChange();
  };

  const tipoLabel = (k: string) => TIPOS_ACTIVIDAD.find(t => t.key === k)?.label || k;
  const resInfo = (k: string | null) => RESULTADOS.find(r => r.key === k);

  return (
    <div className="rounded-xl border border-[var(--border)] p-5 space-y-4" style={{ background: "var(--card)" }}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground)]/50">Actividad</h2>

      {/* Registro rápido */}
      <div className="rounded-lg border border-[var(--border)] p-3 space-y-2.5" style={{ background: "var(--background)" }}>
        <div className="grid grid-cols-3 gap-2">
          <select className={inputCls} value={tipo} onChange={e => setTipo(e.target.value)}>
            {TIPOS_ACTIVIDAD.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
          <select className={inputCls} value={resultado} onChange={e => setResultado(e.target.value)}>
            {RESULTADOS.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
          <select className={inputCls} value={persona} onChange={e => setPersona(e.target.value)}>
            {ASIGNADOS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <textarea className={inputCls + " resize-none"} rows={2} value={resumen}
          onChange={e => setResumen(e.target.value)} placeholder="¿Qué pasó? ¿Qué se dijo?" />
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input className={inputCls} value={siguienteAccion}
            onChange={e => setSiguienteAccion(e.target.value)} placeholder="Próxima acción (opcional)" />
          <input type="date" className={inputCls} value={fechaSiguiente}
            onChange={e => setFechaSiguiente(e.target.value)} />
        </div>
        <button onClick={registrar} disabled={saving}
          className="w-full py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
          style={{ background: "var(--brand-1)", color: "white" }}>
          {saving ? "Registrando…" : "Registrar actividad"}
        </button>
      </div>

      {/* Historial de actividad */}
      {activities.length === 0 ? (
        <p className="text-xs text-[var(--foreground)]/30 text-center py-2">Sin actividad registrada todavía.</p>
      ) : (
        <div className="space-y-2">
          {activities.map(a => {
            const ri = resInfo(a.resultado);
            return (
              <div key={a.id} className="rounded-lg border border-[var(--border)] p-3 group" style={{ background: "var(--background)" }}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{tipoLabel(a.tipo)}</span>
                    {ri && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: `${ri.color}22`, color: ri.color }}>
                        {ri.label}
                      </span>
                    )}
                    {a.realizado_por && <span className="text-[10px] text-[var(--foreground)]/40">{a.realizado_por}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--foreground)]/30">
                      {new Date(a.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <button onClick={() => borrar(a.id)}
                      className="text-[10px] text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                  </div>
                </div>
                {a.resumen && <p className="text-xs text-[var(--foreground)]/70 leading-relaxed">{a.resumen}</p>}
                {a.siguiente_accion && (
                  <p className="text-[11px] text-[var(--foreground)]/50 mt-1 border-t border-[var(--border)] pt-1">
                    → {a.siguiente_accion}
                    {a.fecha_siguiente_accion && ` · ${new Date(a.fecha_siguiente_accion).toLocaleDateString("es-ES")}`}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
