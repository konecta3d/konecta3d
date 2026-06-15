"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { PERFIL_INFO } from "@/lib/crm/stages";
import { AGENDA_DIAS, generarSlots, horaLabel, type Slot } from "@/lib/crm/agenda-config";

interface CitaLead {
  id: string; nombre: string; empresa: string | null; sector: string | null;
  whatsapp: string | null; telefono: string | null;
  etapa: string; perfil: string | null; notas: string | null;
}
interface Cita {
  id: string; agente: string; inicio: string; duracion_min: number;
  canal: string; estado: string; notas: string | null; lead: CitaLead | null;
}
interface LeadOpcion { id: string; nombre: string; empresa: string | null; whatsapp: string | null; }

interface SlotElegido { agente: string; inicio: string; label: string; diaLabel: string; }

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${data.session?.access_token || ""}`,
  };
}

function PerfilBadge({ perfil }: { perfil: string | null }) {
  if (!perfil) return null;
  const p = PERFIL_INFO[perfil as keyof typeof PERFIL_INFO];
  if (!p) return null;
  return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
    style={{ background: `${p.color}22`, color: p.color }}>{perfil}</span>;
}

function waLink(c: Cita): string {
  let num = (c.lead?.whatsapp || c.lead?.telefono || "").replace(/\D/g, "");
  if (num.length === 9) num = "34" + num; // móvil español sin prefijo
  const dia = AGENDA_DIAS.find(d => c.inicio.slice(0, 10) === d.fecha)?.label || "";
  const nombre = c.lead?.nombre?.split(" ")[0] || "";
  const msg = `Hola ${nombre}, soy ${c.agente} de Konecta3D. Te confirmo nuestra llamada de 5 min el ${dia} a las ${horaLabel(c.inicio)}. Cualquier cosa, por aquí. — Equipo Konecta3D`;
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
}

export default function CrmCitasPage() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [leads, setLeads] = useState<LeadOpcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayIdx, setDayIdx] = useState(0);

  // Modal de reserva
  const [slot, setSlot] = useState<SlotElegido | null>(null);
  const [modo, setModo] = useState<"nuevo" | "existente">("nuevo");
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [leadId, setLeadId] = useState("");
  const [buscar, setBuscar] = useState("");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    try {
      const headers = await authHeaders();
      const [rc, rl] = await Promise.all([
        fetch("/api/admin/crm/citas", { headers }),
        fetch("/api/admin/crm/leads", { headers }),
      ]);
      const jc = await rc.json();
      const jl = await rl.json();
      if (jc.citas) setCitas(jc.citas);
      if (jl.leads) setLeads(jl.leads.map((l: LeadOpcion) => ({ id: l.id, nombre: l.nombre, empresa: l.empresa, whatsapp: l.whatsapp })));
    } catch { /* silencioso */ }
    setLoading(false);
  }

  useEffect(() => { cargar(); }, []);

  // Índice de huecos ocupados: clave `agente__ms`
  const ocupados = useMemo(() => {
    const map = new Map<string, Cita>();
    for (const c of citas) {
      map.set(`${c.agente}__${Date.parse(c.inicio)}`, c);
    }
    return map;
  }, [citas]);

  const dia = AGENDA_DIAS[dayIdx];
  const agentesDelDia = Object.keys(dia.agentes);

  function citasDelDia(): Cita[] {
    return citas.filter(c => c.inicio.slice(0, 10) === dia.fecha);
  }

  function abrirReserva(agente: string, s: Slot) {
    setSlot({ agente, inicio: s.iso, label: s.label, diaLabel: dia.label });
    setModo("nuevo"); setNombre(""); setWhatsapp(""); setEmpresa("");
    setLeadId(""); setBuscar(""); setNotas(""); setError("");
  }

  async function reservar() {
    if (!slot) return;
    setSaving(true); setError("");
    const payload: Record<string, unknown> = {
      agente: slot.agente,
      inicio: slot.inicio,
      notas: notas.trim() || null,
    };
    if (modo === "existente") {
      if (!leadId) { setError("Elige un lead"); setSaving(false); return; }
      payload.leadId = leadId;
    } else {
      if (!nombre.trim()) { setError("Falta el nombre"); setSaving(false); return; }
      payload.nuevo = { nombre: nombre.trim(), whatsapp: whatsapp.trim() || null, empresa: empresa.trim() || null };
    }
    try {
      const res = await fetch("/api/admin/crm/citas", {
        method: "POST", headers: await authHeaders(), body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "No se pudo reservar"); setSaving(false); return; }
      setCitas(prev => [...prev, json.cita]);
      setSlot(null);
    } catch {
      setError("Error de conexión");
    }
    setSaving(false);
  }

  async function cambiarEstado(c: Cita, estado: string) {
    try {
      const res = await fetch(`/api/admin/crm/citas/${c.id}`, {
        method: "PATCH", headers: await authHeaders(), body: JSON.stringify({ estado }),
      });
      if (res.ok) setCitas(prev => prev.map(x => x.id === c.id ? { ...x, estado } : x));
    } catch { /* silencioso */ }
  }

  async function liberar(c: Cita) {
    if (!confirm(`¿Liberar el hueco de ${c.lead?.nombre || "este lead"}? El contacto se conserva en el pipeline.`)) return;
    try {
      const res = await fetch(`/api/admin/crm/citas/${c.id}`, { method: "DELETE", headers: await authHeaders() });
      if (res.ok) setCitas(prev => prev.filter(x => x.id !== c.id));
    } catch { /* silencioso */ }
  }

  const leadsFiltrados = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    if (!q) return leads.slice(0, 8);
    return leads.filter(l => l.nombre.toLowerCase().includes(q) || (l.empresa || "").toLowerCase().includes(q)).slice(0, 8);
  }, [leads, buscar]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: "var(--brand-1)" }} />
    </div>;
  }

  return (
    <div className="max-w-[1100px] mx-auto pb-16">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/admin/crm/agenda" className="text-sm text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors">← Agenda</Link>
      </div>

      <div className="mb-5">
        <h1 className="text-xl font-bold">Citas de la feria</h1>
        <p className="text-sm text-[var(--foreground)]/50 mt-0.5">Asigna a cada contacto un hueco para la llamada. Toca un hueco libre.</p>
      </div>

      {/* Tabs de día */}
      <div className="flex gap-2 mb-5">
        {AGENDA_DIAS.map((d, i) => {
          const n = citas.filter(c => c.inicio.slice(0, 10) === d.fecha).length;
          return (
            <button key={d.fecha} onClick={() => setDayIdx(i)}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={{
                background: i === dayIdx ? "var(--brand-1)" : "var(--card)",
                color: i === dayIdx ? "#fff" : "var(--foreground)",
                border: "1px solid var(--border)",
              }}>
              {d.label} {n > 0 && <span className="opacity-70">· {n}</span>}
            </button>
          );
        })}
      </div>

      {/* Columnas por agente */}
      <div className="grid sm:grid-cols-2 gap-5 items-start">
        {agentesDelDia.map(agente => {
          const slots = generarSlots(dia.fecha, dia.agentes[agente]);
          const reservadasAg = citasDelDia().filter(c => c.agente === agente).length;
          return (
            <section key={agente} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold">{agente}</h2>
                <span className="text-xs text-[var(--foreground)]/30">{reservadasAg}/{slots.length}</span>
              </div>
              <div className="space-y-1.5">
                {slots.map(s => {
                  const c = ocupados.get(`${agente}__${s.ms}`);
                  if (!c) {
                    return (
                      <button key={s.iso} onClick={() => abrirReserva(agente, s)}
                        className="w-full flex items-center gap-3 rounded-lg border border-dashed px-3 py-2 text-left transition-colors hover:bg-[var(--brand-1)]/10"
                        style={{ borderColor: "var(--border)" }}>
                        <span className="text-sm font-mono text-[var(--foreground)]/50 w-12">{s.label}</span>
                        <span className="text-xs text-[var(--foreground)]/35">Libre · tocar para asignar</span>
                      </button>
                    );
                  }
                  const hecha = c.estado === "hecha";
                  const noasis = c.estado === "no_asistio";
                  return (
                    <div key={s.iso} className="rounded-lg border px-3 py-2.5"
                      style={{ background: "var(--card)", borderColor: "var(--border)", opacity: noasis ? 0.6 : 1 }}>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-[var(--foreground)]/60 w-12">{s.label}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold truncate">{c.lead?.nombre || "—"}</span>
                            <PerfilBadge perfil={c.lead?.perfil ?? null} />
                            {hecha && <span className="text-[10px] text-green-500 font-semibold">hecha</span>}
                            {noasis && <span className="text-[10px] text-red-400 font-semibold">no asistió</span>}
                          </div>
                          {c.lead?.empresa && <span className="text-xs text-[var(--foreground)]/45 truncate">{c.lead.empresa}</span>}
                          {c.notas && <p className="text-[11px] text-[var(--foreground)]/40 mt-0.5 line-clamp-2">{c.notas}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <button onClick={() => cambiarEstado(c, hecha ? "agendada" : "hecha")}
                          className="text-[11px] px-2 py-1 rounded font-medium transition-colors"
                          style={{ background: hecha ? "#22c55e22" : "var(--border)", color: hecha ? "#22c55e" : "var(--foreground)" }}>
                          Hecha
                        </button>
                        <button onClick={() => cambiarEstado(c, noasis ? "agendada" : "no_asistio")}
                          className="text-[11px] px-2 py-1 rounded font-medium transition-colors"
                          style={{ background: noasis ? "#ef444422" : "var(--border)", color: noasis ? "#ef4444" : "var(--foreground)" }}>
                          No asistió
                        </button>
                        {(c.lead?.whatsapp || c.lead?.telefono) && (
                          <a href={waLink(c)} target="_blank" rel="noopener noreferrer"
                            className="text-[11px] px-2 py-1 rounded font-medium" style={{ background: "#25D36622", color: "#1da851" }}>
                            WhatsApp
                          </a>
                        )}
                        <Link href={`/admin/crm/pipeline/${c.lead?.id}`}
                          className="text-[11px] px-2 py-1 rounded font-medium" style={{ background: "var(--border)", color: "var(--foreground)" }}>
                          Ficha
                        </Link>
                        <button onClick={() => liberar(c)}
                          className="text-[11px] px-2 py-1 rounded font-medium text-[var(--foreground)]/40 hover:text-red-400 ml-auto">
                          Liberar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Modal de reserva */}
      {slot && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
          onClick={() => !saving && setSlot(null)}>
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5"
            style={{ background: "var(--background)", border: "1px solid var(--border)" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold">Asignar cita</h3>
                <p className="text-sm text-[var(--foreground)]/55">{slot.agente} · {slot.diaLabel} · {slot.label}</p>
              </div>
              <button onClick={() => setSlot(null)} className="text-[var(--foreground)]/40 hover:text-[var(--foreground)] text-xl leading-none">×</button>
            </div>

            <div className="flex gap-1 mb-3 p-1 rounded-lg" style={{ background: "var(--card)" }}>
              {(["nuevo", "existente"] as const).map(m => (
                <button key={m} onClick={() => setModo(m)}
                  className="flex-1 text-sm py-1.5 rounded-md font-medium transition-colors"
                  style={{ background: modo === m ? "var(--brand-1)" : "transparent", color: modo === m ? "#fff" : "var(--foreground)" }}>
                  {m === "nuevo" ? "Contacto nuevo" : "Ya en el pipeline"}
                </button>
              ))}
            </div>

            {modo === "nuevo" ? (
              <div className="space-y-2">
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre *"
                  className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "var(--card)", border: "1px solid var(--border)" }} />
                <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="WhatsApp" inputMode="tel"
                  className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "var(--card)", border: "1px solid var(--border)" }} />
                <input value={empresa} onChange={e => setEmpresa(e.target.value)} placeholder="Empresa"
                  className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "var(--card)", border: "1px solid var(--border)" }} />
              </div>
            ) : (
              <div className="space-y-2">
                <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar lead…"
                  className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "var(--card)", border: "1px solid var(--border)" }} />
                <div className="max-h-44 overflow-y-auto space-y-1">
                  {leadsFiltrados.length === 0 && <p className="text-xs text-[var(--foreground)]/40 py-2 text-center">Sin resultados.</p>}
                  {leadsFiltrados.map(l => (
                    <button key={l.id} onClick={() => setLeadId(l.id)}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                      style={{ background: leadId === l.id ? "var(--brand-1)" : "var(--card)", color: leadId === l.id ? "#fff" : "var(--foreground)", border: "1px solid var(--border)" }}>
                      <span className="font-medium">{l.nombre}</span>
                      {l.empresa && <span className="opacity-60"> · {l.empresa}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2}
              placeholder="Qué le llamó la atención (para la llamada)…"
              className="w-full mt-2 px-3 py-2 rounded-lg text-sm resize-none" style={{ background: "var(--card)", border: "1px solid var(--border)" }} />

            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}

            <button onClick={reservar} disabled={saving}
              className="w-full mt-3 py-2.5 rounded-lg font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ background: "var(--brand-1)" }}>
              {saving ? "Reservando…" : "Reservar hueco"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
