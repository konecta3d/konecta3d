"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ORDER_ESTADOS, ORDER_ESTADO_LABEL, ORDER_ESTADO_COLOR,
  PAGO_LABEL, METODOS_PAGO, totalPedido, diasHastaEvento,
  type KeychainOrder,
} from "@/lib/keychain-orders";

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  return { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token || ""}` };
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm";

export default function KeychainOrders({ businessId }: { businessId: string }) {
  const [orders, setOrders] = useState<KeychainOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ cantidad: "", precio_unit: "3", fecha_evento: "", direccion_envio: "", notas: "" });

  async function load() {
    try {
      const res = await fetch(`/api/admin/keychain-orders?businessId=${businessId}`, { headers: await authHeaders() });
      const json = await res.json();
      if (json.orders) setOrders(json.orders);
    } catch { /* silencioso */ }
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [businessId]);

  async function crear() {
    const cantidad = Number(form.cantidad);
    if (!cantidad || cantidad < 1) { setError("Indica una cantidad válida"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/admin/keychain-orders", {
        method: "POST", headers: await authHeaders(),
        body: JSON.stringify({
          businessId, cantidad,
          precio_unit: Number(form.precio_unit) || 3,
          fecha_evento: form.fecha_evento || null,
          direccion_envio: form.direccion_envio || null,
          notas: form.notas || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Error al crear"); setSaving(false); return; }
      setOrders(prev => [json.order, ...prev]);
      setForm({ cantidad: "", precio_unit: "3", fecha_evento: "", direccion_envio: "", notas: "" });
      setShowForm(false);
    } catch { setError("Error de conexión"); }
    setSaving(false);
  }

  async function patch(id: string, body: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/admin/keychain-orders/${id}`, {
        method: "PATCH", headers: await authHeaders(), body: JSON.stringify(body),
      });
      if (res.ok) { const j = await res.json(); setOrders(prev => prev.map(o => o.id === id ? j.order : o)); }
    } catch { /* silencioso */ }
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este pedido?")) return;
    try {
      const res = await fetch(`/api/admin/keychain-orders/${id}`, { method: "DELETE", headers: await authHeaders() });
      if (res.ok) setOrders(prev => prev.filter(o => o.id !== id));
    } catch { /* silencioso */ }
  }

  const totalUds = orders.filter(o => o.estado !== "cancelado").reduce((s, o) => s + (o.cantidad || 0), 0);

  return (
    <div className="mt-6 rounded-xl border border-[var(--border)] p-4">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold">Pedidos de llaveros</h2>
          {orders.length > 0 && (
            <p className="text-xs text-[var(--foreground)]/50 mt-0.5">{orders.length} pedido{orders.length !== 1 ? "s" : ""} · {totalUds} llaveros en total</p>
          )}
        </div>
        <button onClick={() => setShowForm(s => !s)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "var(--brand-1)", color: "white" }}>
          {showForm ? "Cerrar" : "+ Nuevo pedido"}
        </button>
      </div>

      {/* Formulario nuevo pedido */}
      {showForm && (
        <div className="rounded-lg border border-[var(--border)] p-3 mb-4 space-y-2" style={{ background: "var(--background)" }}>
          <div className="grid sm:grid-cols-3 gap-2">
            <label className="text-xs">Cantidad
              <input type="number" min={1} className={inputCls} value={form.cantidad} onChange={e => setForm(f => ({ ...f, cantidad: e.target.value }))} placeholder="50" />
            </label>
            <label className="text-xs">Precio/ud (€)
              <input type="number" step="0.01" className={inputCls} value={form.precio_unit} onChange={e => setForm(f => ({ ...f, precio_unit: e.target.value }))} />
            </label>
            <label className="text-xs">Fecha del evento
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
          <button onClick={crear} disabled={saving}
            className="w-full py-2 rounded-lg text-sm font-semibold disabled:opacity-50" style={{ background: "var(--brand-1)", color: "white" }}>
            {saving ? "Creando…" : "Crear pedido"}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-xs text-[var(--foreground)]/40 py-3 text-center">Cargando pedidos…</p>
      ) : orders.length === 0 ? (
        <p className="text-xs text-[var(--foreground)]/40 py-3 text-center">Sin pedidos todavía.</p>
      ) : (
        <div className="space-y-2">
          {orders.map(o => <OrderRow key={o.id} order={o} onPatch={patch} onDelete={eliminar} />)}
        </div>
      )}
    </div>
  );
}

function OrderRow({ order, onPatch, onDelete }: {
  order: KeychainOrder;
  onPatch: (id: string, body: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
}) {
  const dias = diasHastaEvento(order.fecha_evento);
  const urgente = order.estado !== "entregado" && order.estado !== "cancelado" && dias !== null && dias <= 21;
  const [tracking, setTracking] = useState(order.tracking ?? "");

  return (
    <div className="rounded-lg border px-3 py-3" style={{ background: "var(--background)", borderColor: urgente ? "#f59e0b66" : "var(--border)" }}>
      <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{order.cantidad} llaveros</span>
          <span className="text-xs text-[var(--foreground)]/50">· {totalPedido(order).toLocaleString("es-ES")} € ({order.precio_unit}€/ud)</span>
          {order.origen === "autoservicio" && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--brand-1)]/15 text-[var(--brand-1)]">solicitado por el negocio</span>}
        </div>
        <button onClick={() => onDelete(order.id)} className="text-[11px] text-[var(--foreground)]/40 hover:text-red-400">Eliminar</button>
      </div>

      <div className="grid sm:grid-cols-2 gap-2 mb-2">
        <label className="text-[11px] text-[var(--foreground)]/50">Estado del pedido
          <select className={inputCls} value={order.estado} onChange={e => onPatch(order.id, { estado: e.target.value })}
            style={{ borderColor: ORDER_ESTADO_COLOR[order.estado] }}>
            {ORDER_ESTADOS.map(s => <option key={s} value={s}>{ORDER_ESTADO_LABEL[s]}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[11px] text-[var(--foreground)]/50">Pago
            <select className={inputCls} value={order.estado_pago} onChange={e => onPatch(order.id, { estado_pago: e.target.value })}>
              <option value="pendiente">{PAGO_LABEL.pendiente}</option>
              <option value="pagado">{PAGO_LABEL.pagado}</option>
            </select>
          </label>
          <label className="text-[11px] text-[var(--foreground)]/50">Método
            <select className={inputCls} value={order.metodo_pago ?? ""} onChange={e => onPatch(order.id, { metodo_pago: e.target.value || null })}>
              <option value="">—</option>
              {METODOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        <div className="text-[11px] text-[var(--foreground)]/50 flex flex-wrap gap-x-3 gap-y-0.5 items-center">
          <span>Pedido: {new Date(order.fecha_pedido).toLocaleDateString("es-ES")}</span>
          {order.fecha_evento && (
            <span className={urgente ? "text-amber-500 font-semibold" : ""}>
              Evento: {new Date(order.fecha_evento).toLocaleDateString("es-ES")}{dias !== null && ` (${dias < 0 ? "pasado" : `en ${dias}d`})`}
            </span>
          )}
          {order.fecha_pago && <span className="text-green-500">Pagado: {new Date(order.fecha_pago).toLocaleDateString("es-ES")}</span>}
        </div>
        <input className={inputCls + " text-xs"} placeholder="Nº de seguimiento / tracking"
          value={tracking} onChange={e => setTracking(e.target.value)}
          onBlur={() => { if (tracking !== (order.tracking ?? "")) onPatch(order.id, { tracking: tracking || null }); }} />
      </div>

      {order.direccion_envio && <p className="text-[11px] text-[var(--foreground)]/40 mt-1.5">Envío: {order.direccion_envio}</p>}
      {order.notas && <p className="text-[11px] text-[var(--foreground)]/40 mt-1">{order.notas}</p>}
    </div>
  );
}
