"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { LaunchFunnel, LaunchStage, DEFAULT_LAUNCH_FUNNEL } from "@/lib/crm/launch-funnel";

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  return { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token || ""}` };
}

interface Journey {
  id: string; nombre: string; etapa_actual: number;
  business_id: string | null;
  objetivos_cumplidos: string[];
  siguiente_accion: string | null; fecha_proxima_accion: string | null; notas: string | null;
}
interface Business { id: string; name: string; }
interface Insight {
  id: string; etapa_id: number | null; tipo: string; contenido: string | null; fecha: string;
}

export default function SeguimientoPage() {
  const [funnel, setFunnel] = useState<LaunchFunnel>(DEFAULT_LAUNCH_FUNNEL);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [stageView, setStageView] = useState(1);
  const [loading, setLoading] = useState(true);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selBizId, setSelBizId] = useState("");

  // Form de insight
  const [insTipo, setInsTipo] = useState("");
  const [insContenido, setInsContenido] = useState("");

  const loadJourneys = useCallback(async () => {
    const res = await fetch("/api/admin/crm/journey", { headers: await authHeaders() });
    const json = await res.json();
    if (json.journeys) setJourneys(json.journeys);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const headers = await authHeaders();
        const [fRes, bRes] = await Promise.all([
          fetch("/api/admin/crm/launch-funnel", { headers }),
          fetch("/api/admin/businesses", { headers }),
        ]);
        const fJson = await fRes.json();
        if (fJson.funnel) setFunnel(fJson.funnel);
        const bJson = await bRes.json();
        if (bJson.businesses) setBusinesses(bJson.businesses.map((b: { id: string; name: string }) => ({ id: b.id, name: b.name })));
        await loadJourneys();
      } catch { /* silencioso */ }
      setLoading(false);
    })();
  }, [loadJourneys]);

  const openJourney = async (id: string) => {
    setSelId(id);
    const res = await fetch(`/api/admin/crm/journey/${id}`, { headers: await authHeaders() });
    const json = await res.json();
    if (json.journey) {
      setJourney({ ...json.journey, objetivos_cumplidos: json.journey.objetivos_cumplidos || [] });
      setStageView(json.journey.etapa_actual || 1);
    }
    setInsights(json.insights || []);
  };

  const addJourney = async () => {
    if (!nuevoNombre.trim()) return;
    const res = await fetch("/api/admin/crm/journey", { method: "POST", headers: await authHeaders(), body: JSON.stringify({ nombre: nuevoNombre.trim() }) });
    const json = await res.json();
    setNuevoNombre("");
    await loadJourneys();
    if (json.journey) openJourney(json.journey.id);
  };

  const addFromBusiness = async () => {
    if (!selBizId) return;
    const biz = businesses.find(b => b.id === selBizId);
    if (!biz) return;
    const res = await fetch("/api/admin/crm/journey", {
      method: "POST", headers: await authHeaders(),
      body: JSON.stringify({ nombre: biz.name, business_id: biz.id }),
    });
    const json = await res.json();
    setSelBizId("");
    await loadJourneys();
    if (json.journey) openJourney(json.journey.id);
  };

  const patchJourney = async (patch: Partial<Journey>) => {
    if (!journey) return;
    const updated = { ...journey, ...patch };
    setJourney(updated);
    await fetch(`/api/admin/crm/journey/${journey.id}`, { method: "PUT", headers: await authHeaders(), body: JSON.stringify(patch) });
    loadJourneys();
  };

  const toggleObjetivo = (objId: string) => {
    if (!journey) return;
    const set = new Set(journey.objetivos_cumplidos);
    if (set.has(objId)) set.delete(objId); else set.add(objId);
    patchJourney({ objetivos_cumplidos: Array.from(set) });
  };

  const addInsight = async () => {
    if (!journey || !insTipo) return;
    const res = await fetch(`/api/admin/crm/journey/${journey.id}/insight`, {
      method: "POST", headers: await authHeaders(),
      body: JSON.stringify({ tipo: insTipo, contenido: insContenido, etapa_id: stageView }),
    });
    const json = await res.json();
    if (json.insight) setInsights([json.insight, ...insights]);
    setInsTipo(""); setInsContenido("");
  };

  const delInsight = async (insightId: string) => {
    await fetch(`/api/admin/crm/journey/${journey!.id}/insight?insightId=${insightId}`, { method: "DELETE", headers: await authHeaders() });
    setInsights(insights.filter(i => i.id !== insightId));
  };

  const delJourney = async (id: string) => {
    if (!confirm("¿Quitar este negocio del seguimiento?")) return;
    await fetch(`/api/admin/crm/journey/${id}`, { method: "DELETE", headers: await authHeaders() });
    if (selId === id) { setSelId(null); setJourney(null); }
    loadJourneys();
  };

  const copy = (t: string) => navigator.clipboard.writeText(t);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: "var(--brand-1)" }} />
    </div>;
  }

  const stage: LaunchStage | undefined = funnel.stages.find(s => s.id === stageView);
  const stageName = (n: number) => funnel.stages.find(s => s.id === n)?.nombre || `Etapa ${n}`;
  const objsCumplidosEtapa = stage ? stage.objetivos.filter(o => journey?.objetivos_cumplidos.includes(o.id)).length : 0;

  return (
    <div className="max-w-[1100px] mx-auto pb-12">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/admin/crm/recorrido-cliente" className="text-sm text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors">← Recorrido del cliente</Link>
      </div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">Seguimiento de clientes</h1>
        <p className="text-sm text-[var(--foreground)]/50 mt-0.5">Estado de cada negocio en el embudo de lanzamiento.</p>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6 items-start">

        {/* Lista de negocios */}
        <div className="rounded-xl border border-[var(--border)] overflow-hidden lg:sticky lg:top-6" style={{ background: "var(--card)" }}>
          <div className="p-3 border-b border-[var(--border)] space-y-2">
            {/* Añadir un negocio existente de la plataforma */}
            {(() => {
              const enSeguimiento = new Set(journeys.map(j => j.business_id).filter(Boolean));
              const disponibles = businesses.filter(b => !enSeguimiento.has(b.id));
              return (
                <div className="flex gap-1.5">
                  <select value={selBizId} onChange={e => setSelBizId(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm">
                    <option value="">Añadir un negocio…</option>
                    {disponibles.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <button onClick={addFromBusiness} disabled={!selBizId} className="px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-40" style={{ background: "var(--brand-1)", color: "white" }}>+</button>
                </div>
              );
            })()}
            {/* O añadir un prospecto suelto que aún no es negocio */}
            <div className="flex gap-1.5">
              <input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addJourney()}
                placeholder="O un prospecto nuevo…"
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm" />
              <button onClick={addJourney} className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-[var(--border)] text-[var(--foreground)]/60" title="Añadir prospecto manual">+</button>
            </div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {journeys.length === 0 ? (
              <p className="text-xs text-[var(--foreground)]/30 text-center py-6">Sin negocios en seguimiento.</p>
            ) : journeys.map(j => {
              const st = funnel.stages.find(s => s.id === j.etapa_actual);
              return (
                <button key={j.id} onClick={() => openJourney(j.id)}
                  className={`w-full text-left px-3 py-2.5 border-b border-[var(--border)] transition-colors ${selId === j.id ? "bg-[var(--brand-1)]/10" : "hover:bg-[var(--border)]/10"}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: st?.color }} />
                    <span className="text-sm font-medium truncate flex-1">{j.nombre}</span>
                  </div>
                  <span className="text-[10px] text-[var(--foreground)]/40 ml-4">{st?.id}. {st?.nombre}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detalle del negocio */}
        {!journey ? (
          <div className="text-center py-16 text-[var(--foreground)]/30 text-sm rounded-xl border border-dashed border-[var(--border)]">
            Selecciona un negocio para ver su estado.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cabecera */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h2 className="text-lg font-bold">{journey.nombre}</h2>
                <p className="text-xs text-[var(--foreground)]/50">Etapa actual: {journey.etapa_actual}. {stageName(journey.etapa_actual)}</p>
              </div>
              <button onClick={() => delJourney(journey.id)} className="text-xs px-2.5 py-1.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors">Quitar</button>
            </div>

            {/* Flujo de etapas */}
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {funnel.stages.map((s, i) => (
                <div key={s.id} className="flex items-center flex-shrink-0">
                  <button onClick={() => setStageView(s.id)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-colors"
                    style={{
                      borderColor: stageView === s.id ? s.color : "var(--border)",
                      background: stageView === s.id ? `${s.color}15` : "transparent",
                    }}>
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: s.color }}>{s.id}</span>
                    <span className="text-[10px] font-semibold whitespace-nowrap">{s.nombre}</span>
                    {journey.etapa_actual === s.id && <span className="text-[8px] text-[var(--foreground)]/40">●</span>}
                  </button>
                  {i < funnel.stages.length - 1 && <span className="text-[var(--foreground)]/20 mx-0.5 text-xs">→</span>}
                </div>
              ))}
            </div>

            {stage && (
              <>
                {/* Marcar etapa actual */}
                {journey.etapa_actual !== stage.id && (
                  <button onClick={() => patchJourney({ etapa_actual: stage.id })}
                    className="text-xs px-3 py-1.5 rounded-lg border border-[var(--brand-1)]/40 text-[var(--brand-1)] hover:bg-[var(--brand-1)]/10 transition-colors">
                    Mover a este negocio a la etapa &ldquo;{stage.nombre}&rdquo;
                  </button>
                )}

                {/* Objetivos con check */}
                <div className="rounded-xl border border-[var(--border)] p-4" style={{ background: "var(--card)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold">Objetivos</h3>
                    <span className="text-xs text-[var(--foreground)]/40">{objsCumplidosEtapa}/{stage.objetivos.length} cumplidos</span>
                  </div>
                  <div className="space-y-1.5">
                    {stage.objetivos.map(o => {
                      const done = journey.objetivos_cumplidos.includes(o.id);
                      return (
                        <button key={o.id} onClick={() => toggleObjetivo(o.id)}
                          className="w-full flex items-start gap-2.5 text-left p-2 rounded-lg hover:bg-[var(--border)]/10 transition-colors">
                          <span className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors ${done ? "bg-green-500 border-green-500" : "border-[var(--border)]"}`}>
                            {done && <span className="text-white text-xs leading-none">✓</span>}
                          </span>
                          <div>
                            <p className={`text-sm ${done ? "line-through text-[var(--foreground)]/40" : "text-[var(--foreground)]"}`}>{o.titulo}</p>
                            <p className="text-[11px] text-[var(--foreground)]/40">{o.check}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mensajes (copiar) */}
                {stage.mensajes.length > 0 && (
                  <div className="rounded-xl border border-[var(--border)] p-4" style={{ background: "var(--card)" }}>
                    <h3 className="text-sm font-bold mb-2">Mensajes de esta etapa</h3>
                    <div className="space-y-1.5">
                      {stage.mensajes.map(m => (
                        <div key={m.id} className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] px-3 py-2" style={{ background: "var(--background)" }}>
                          <span className="text-xs text-[var(--foreground)]/70 truncate">{m.titulo}</span>
                          <button onClick={() => copy(m.contenido)} className="text-[11px] px-2 py-1 rounded border border-[var(--brand-1)]/40 text-[var(--brand-1)] hover:bg-[var(--brand-1)]/10 transition-colors flex-shrink-0">Copiar</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Insights */}
                <div className="rounded-xl border border-[var(--border)] p-4" style={{ background: "var(--card)" }}>
                  <h3 className="text-sm font-bold mb-2">Información recogida</h3>
                  {/* Form añadir */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <select value={insTipo} onChange={e => setInsTipo(e.target.value)} className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm">
                      <option value="">Tipo…</option>
                      {stage.tiposInsight.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input value={insContenido} onChange={e => setInsContenido(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addInsight()}
                      placeholder="Qué te dijo el cliente…"
                      className="flex-1 min-w-[160px] px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm" />
                    <button onClick={addInsight} disabled={!insTipo} className="px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-40" style={{ background: "var(--brand-1)", color: "white" }}>Añadir</button>
                  </div>
                  {/* Lista */}
                  {insights.length === 0 ? (
                    <p className="text-xs text-[var(--foreground)]/30 text-center py-2">Sin información recogida todavía.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {insights.map(ins => (
                        <div key={ins.id} className="flex items-start justify-between gap-2 rounded-lg border border-[var(--border)] px-3 py-2 group" style={{ background: "var(--background)" }}>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-[var(--brand-1)]/15 text-[var(--brand-1)]">{ins.tipo}</span>
                              {ins.etapa_id && <span className="text-[10px] text-[var(--foreground)]/30">{stageName(ins.etapa_id)}</span>}
                              <span className="text-[10px] text-[var(--foreground)]/30">{new Date(ins.fecha).toLocaleDateString("es-ES")}</span>
                            </div>
                            {ins.contenido && <p className="text-xs text-[var(--foreground)]/70 mt-1">{ins.contenido}</p>}
                          </div>
                          <button onClick={() => delInsight(ins.id)} className="text-[11px] text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Siguiente acción y notas */}
            <div className="rounded-xl border border-[var(--border)] p-4 space-y-3" style={{ background: "var(--card)" }}>
              <h3 className="text-sm font-bold">Siguiente paso</h3>
              <div className="grid sm:grid-cols-[1fr_auto] gap-2">
                <input defaultValue={journey.siguiente_accion || ""} onBlur={e => patchJourney({ siguiente_accion: e.target.value })}
                  placeholder="¿Cuál es el siguiente paso con este negocio?"
                  className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm" />
                <input type="date" defaultValue={journey.fecha_proxima_accion || ""} onBlur={e => patchJourney({ fecha_proxima_accion: e.target.value })}
                  className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm" />
              </div>
              <textarea defaultValue={journey.notas || ""} onBlur={e => patchJourney({ notas: e.target.value })} rows={2}
                placeholder="Notas generales del negocio…"
                className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm resize-y" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
