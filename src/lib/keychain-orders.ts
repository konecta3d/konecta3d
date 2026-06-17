// ─── Pedidos de llaveros: constantes y helpers compartidos ────────────────────
// Usado por la API, la sección de la ficha del negocio y la vista global.

export const ORDER_ESTADOS = [
  "solicitado", "confirmado", "en_produccion", "enviado", "entregado", "cancelado",
] as const;
export type OrderEstado = (typeof ORDER_ESTADOS)[number];

export const ORDER_ESTADO_LABEL: Record<OrderEstado, string> = {
  solicitado: "Solicitado",
  confirmado: "Confirmado",
  en_produccion: "En producción",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export const ORDER_ESTADO_COLOR: Record<OrderEstado, string> = {
  solicitado: "#facc15",
  confirmado: "#38bdf8",
  en_produccion: "#a78bfa",
  enviado: "#2dd4bf",
  entregado: "#22c55e",
  cancelado: "#94a3b8",
};

export const PAGO_ESTADOS = ["pendiente", "pagado"] as const;
export type PagoEstado = (typeof PAGO_ESTADOS)[number];

export const PAGO_LABEL: Record<PagoEstado, string> = {
  pendiente: "Pago pendiente",
  pagado: "Transferencia recibida",
};

export const METODOS_PAGO = ["transferencia", "bizum", "tarjeta", "otro"] as const;

export interface KeychainOrder {
  id: string;
  business_id: string;
  cantidad: number;
  precio_unit: number;
  estado: OrderEstado;
  estado_pago: PagoEstado;
  metodo_pago: string | null;
  fecha_pago: string | null;
  fecha_pedido: string;
  fecha_evento: string | null;
  fecha_entrega_estimada: string | null;
  direccion_envio: string | null;
  tracking: string | null;
  origen: string;
  notas: string | null;
  created_at: string;
  business?: { name: string; slug: string | null } | null;
}

/** Total del pedido (cantidad × precio unitario). */
export function totalPedido(o: { cantidad: number; precio_unit: number }): number {
  return (Number(o.cantidad) || 0) * (Number(o.precio_unit) || 0);
}

/** Días que faltan hasta el evento (negativo si ya pasó, null si no hay fecha). */
export function diasHastaEvento(fechaEvento: string | null): number | null {
  if (!fechaEvento) return null;
  return Math.ceil((new Date(fechaEvento).getTime() - Date.now()) / 86_400_000);
}

/** Un pedido abierto cuyo evento está cerca (≤ 21 días) es urgente. */
export function esUrgente(o: { estado: string; fecha_evento: string | null }): boolean {
  if (o.estado === "entregado" || o.estado === "cancelado") return false;
  const d = diasHastaEvento(o.fecha_evento);
  return d !== null && d <= 21;
}

/** Estados "abiertos" (siguen requiriendo acción). */
export const ESTADOS_ABIERTOS: string[] = ["solicitado", "confirmado", "en_produccion", "enviado"];
