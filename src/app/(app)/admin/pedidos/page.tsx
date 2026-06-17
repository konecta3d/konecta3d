"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ORDER_ESTADOS, ORDER_ESTADO_LABEL, ORDER_ESTADO_COLOR,
  PAGO_LABEL, totalPedido, diasHastaEvento, esUrgente, ESTADOS_ABIERTOS,
  type KeychainOrder,
} from "@/lib/keychain-orders";

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  return { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token || ""}` };
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm";

type Filtro = "abiertos" | "urgentes" | "todos" | "entregados";

export default function PedidosGlobalPage() {
  const [orders, setOrders] = useState<KeychainOrder[]>([]);
  const [businesses, setBusinesses] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>("abiertos");

  // Nuevo pedido
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ businessId: "", cantidad: "", precio_unit: "3", fecha_evento: "", direccion_envio: "", notas: "" });

  async function load() {
    try {
      const headers = await authHeaders();
      const [ro, rb] = await Promise.all([
        fetch("/api/admin/keychain-orders", { headers }),
        fetch("/api/admin/businesses", { headers }),
      ]);
      const jo = await ro.json();
      const jb = await rb.json();
      if (jo.orders) setOrders(jo.orders);
      if (jb.businesses) setBusinesses(jb.businesses.map((b: { id: string; name: string }) => ({ id: b.id, name: b.name })));
    } catch { /* silencioso */ }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function patch(id: string, body: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/admin/keychain-orders/${id}`, {
        method: "PATCH", headers: await authHeaders(), body: JSON.stringify(body),
      });
      if (res.ok) { const j = await res.json(); setOrders(prev => prev.map(o => o.id === id ? j.order : o)); }
    } catch { /* silencioso */ }
  }

  async function crear() {
    const cantidad = Number(form.cantidad);
    if (!form.businessId) { setError("Elige un negocio"); return; }
    if (!cantidad || cantidad < 1) { setError("Indica una cantidad válida"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/admin/keychain-orders", {
        method: "POST", headers: await authHeaders(),
        body: JSON.stringify({
          businessId: form.businessId, cantidad,
          precio_unit: Number(form.precio_unit) || 3,
          fecha_evento: form.fecha_evento || null,
          direccion_envio: form.direccion_envio || null,
          notas: form.notas || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Error al crear"); setSaving(false); return; }
      setOrders(prev => [json.order, ...prev]);
      setForm({ businessId: "", cantidad: "", precio_unit: "3", fecha_evento: "", direccion_envio: "", notas: "" });
      setShowForm(false);
      setFiltro("abiertos");
    } catch { setError("Error de conexión"); }
    setSaving(false);
  }

  // KPIs
  const abiertos = orders.filter(o => ESTADOS_ABIERTOS.includes(o.estado));
  const porProducir = orders.filter(o => o.estado === "solicitado" || o.estado === "confirmado")
    .reduce((s, o) => s + (o.cantidad || 0), 0);
  const urgentes = orders.filter(esUrgente);
  const sinCobrar = orders.filter(o => o.estado_pago === "pendiente" && o.estado !== "cancelado")
    .reduce((s, o) => s + totalPedido(o), 0);

  const visibles = useMemo(() => {
    let list = orders.slice();
    if (filtro === "abiertos") list = list.filter(o => ESTADOS_ABIERTOS.includes(o.estado));
    else if (filtro === "urgentes") list = list.filter(esUrgente);
    else if (filtro === "entregados") list = list.filter(o => o.estado === "entregado");
    return list.sort((a, b) => {
      const ua = esUrgente(a) ? 0 : 1, ub = esUrgente(b) ? 0 : 1;
      if (ua !== ub) return ua - ub;
      const da = diasHastaEvento(a.fecha_evento), dbb = diasHastaEvento(b.fecha_evento);
      if (da !== null && dbb !== null) return da - dbb;
      if (da !== null) return -1;
      if (dbb !== null) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [orders, filtro]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: "var(--brand-1)" }} />
    </div>;
  }

  return (
    <div className="max-w-[1100px] mx-auto pb-12">
      <div className="mb-5 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Pedidos de llaveros</h1>
          <p className="text-sm text-[var(--foreground)]/50 mt-0.5">Qué hay que fabricar y enviar, y qué corre prisa.</p>
        </div>
        <button onClick={() => { setShowForm(true); setError(""); }}
          className="px-3 py-2 rounded-lg text-sm font-semibold flex-shrink-0" style={{ background: "var(--brand-1)", color: "white" }}>
          + Nuevo pedido
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Kpi label="Pedidos abiertos" value={abiertos.length} />
        <Kpi label="Llaveros por producir" value={porProducir} />
        <Kpi label="Urgentes (≤21d)" value={urgentes.length} accent={urgentes.length > 0 ? "#f59e0b" : undefined} />
        <Kpi label="Pendiente de cobro" value={`${sinCobrar.toLocaleString("es-ES")} €`} />
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {([
          { k: "abiertos", l: `Abiertos (${abiertos.length})` },
          { k: "urgentes", l: `Urgentes (${urgentes.length})` },
          { k: "entregados", l: "Entregados" },
          { k: "todos", l: "Todos" },
        ] as { k: Filtro; l: string }[]).map(t => (
          <button key={t.k} onClick={() => setFiltro(t.k)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: filtro === t.k ? "var(--brand-1)" : "var(--card)", color: filtro === t.k ? "#fff" : "var(--foreground)", border: "1px solid var(--border)" }}>
            {t.l}
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-[var(--foreground)]/40">No hay pedidos en esta vista.</p>
          <button onClick={() => { setShowForm(true); setError(""); }}
            className="mt-3 px-3 py-2 rounded-lg text-sm font-semibold" style={{ background: "var(--brand-1)", color: "white" }}>
            + Crear el primer pedido
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {visibles.map(o => {
            const dias = diasHastaEvento(o.fecha_evento);
            const urgente = esUrgente(o);
            return (
              <div key={o.id} className="rounded-xl border px-4 py-3"
                style={{ background: "var(--card)", borderColor: urgente ? "#f59e0b66" : "var(--border)" }}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/admin/businesses/${o.business_id}`} className="text-sm font-bold hover:text-[var(--brand-1)] truncate">
                        {o.business?.name || "Negocio"}
                      </Link>
                      <span className="text-xs text-[var(--foreground)]/50">{o.cantidad} llaveros · {totalPedido(o).toLocaleString("es-ES")} €</span>
                      {urgente && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 font-bold">URGENTE</span>}
                    </div>
                    <div className="flex items-center gap-x-3 gap-y-0.5 flex-wrap mt-1 text-[11px] text-[var(--foreground)]/50">
                      {o.fecha_evento && (
                        <span className={urgente ? "text-amber-500 font-semibold" : ""}>
                          Evento {new Date(o.fecha_evento).toLocaleDateString("es-ES")}{dias !== null && ` · ${dias < 0 ? "pasado" : `en ${dias}d`}`}
                        </span>
                      )}
                      <span className={o.estado_pago === "pagado" ? "text-green-500" : "text-[var(--foreground)]/40"}>{PAGO_LABEL[o.estado_pago]}</span>
                      {o.tracking && <span>Tracking: {o.tracking}</span>}
                    </div>
                  </div>
                  <select value={o.estado} onChange={e => patch(o.id, { estado: e.target.value })}
                    className="px-2 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
                    style={{ background: "var(--background)", border: `1px solid ${ORDER_ESTADO_COLOR[o.estado]}`, color: ORDER_ESTADO_COLOR[o.estado] }}>
                    {ORDER_ESTADOS.map(s => <option key={s} value={s} style={{ color: "var(--foreground)" }}>{ORDER_ESTADO_LABEL[s]}</option>)}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal nuevo pedido */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
          onClick={() => !saving && setShowForm(false)}>
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5"
            style={{ background: "var(--background)", border: "1px solid var(--border)" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">Nuevo pedido de llaveros</h3>
              <button onClick={() => setShowForm(false)} className="text-[var(--foreground)]/40 hover:text-[var(--foreground)] text-xl leading-none">×</button>
            </div>

            <div className="space-y-2">
              <label className="text-xs block">Negocio
                <select className={inputCls} value={form.businessId} onChange={e => setForm(f => ({ ...f, businessId: e.target.value }))}>
                  <option value="">— Elige un negocio —</option>
                  {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <label className="text-xs">Cantidad
                  <input type="number" min={1} className={inputCls} value={form.cantidad} onChange={e => setForm(f => ({ ...f, cantidad: e.target.value }))} placeholder="50" />
                </label>
                <label className="text-xs">Precio/ud (€)
                  <input type="number" step="0.01" className={inputCls} value={form.precio_unit} onChange={e => setForm(f => ({ ...f, precio_unit: e.target.value }))} />
                </label>
                <label className="text-xs">Fecha evento
                  <input type="date" className={inputCls} value={form.fecha_evento} onChange={e => setForm(f => ({ ...f, fecha_evento: e.target.value }))} />
                </label>
              </div>
              <label className="text-xs block">Dirección de envío
                <input className={inputCls} value={form.direccion_envio} onChange={e => setForm(f => ({ ...f, direccion_envio: e.target.value }))} placeholder="Calle, ciudad, CP" />
              </label>
              <label className="text-xs block">Notas
                <textarea rows={2} className={inputCls + " resize-none"} value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
              </label>
              {form.cantidad && (
                <p className="text-xs text-[var(--foreground)]/50">
                  Total: <strong className="text-green-500">{totalPedido({ cantidad: Number(form.cantidad), precio_unit: Number(form.precio_unit) || 3 }).toLocaleString("es-ES")} €</strong>
                </p>
              )}
              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>

            <button onClick={crear} disabled={saving}
              className="w-full mt-3 py-2.5 rounded-lg font-semibold text-white disabled:opacity-50" style={{ background: "var(--brand-1)" }}>
              {saving ? "Creando…" : "Crear pedido"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] p-3" style={{ background: "var(--card)" }}>
      <p className="text-xl font-bold" style={accent ? { color: accent } : {}}>{value}</p>
      <p className="text-[11px] text-[var(--foreground)]/50 mt-0.5">{label}</p>
    </div>
  );
}
