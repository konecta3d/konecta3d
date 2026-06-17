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

type Filtro = "abiertos" | "urgentes" | "todos" | "entregados";

export default function PedidosGlobalPage() {
  const [orders, setOrders] = useState<KeychainOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>("abiertos");

  async function load() {
    try {
      const res = await fetch("/api/admin/keychain-orders", { headers: await authHeaders() });
      const json = await res.json();
      if (json.orders) setOrders(json.orders);
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
    // Orden: urgentes primero, luego por días hasta evento (nulls al final), luego más recientes
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
      <div className="mb-5">
        <h1 className="text-xl font-bold">Pedidos de llaveros</h1>
        <p className="text-sm text-[var(--foreground)]/50 mt-0.5">Qué hay que fabricar y enviar, y qué corre prisa.</p>
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
        <p className="text-sm text-[var(--foreground)]/40 py-10 text-center">No hay pedidos en esta vista.</p>
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
