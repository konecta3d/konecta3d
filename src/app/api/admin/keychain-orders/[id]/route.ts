import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";
import { ORDER_ESTADOS, PAGO_ESTADOS } from "@/lib/keychain-orders";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const SELECT =
  "id, business_id, cantidad, precio_unit, estado, estado_pago, metodo_pago, fecha_pago, " +
  "fecha_pedido, fecha_evento, fecha_entrega_estimada, direccion_envio, tracking, origen, notas, " +
  "created_at, business:businesses(name, slug)";

/**
 * PATCH /api/admin/keychain-orders/[id] — actualiza estado/pago/datos. Solo admin.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.estado !== undefined) {
      if (!ORDER_ESTADOS.includes(body.estado)) return NextResponse.json({ error: "Estado no válido" }, { status: 400 });
      update.estado = body.estado;
    }
    if (body.estado_pago !== undefined) {
      if (!PAGO_ESTADOS.includes(body.estado_pago)) return NextResponse.json({ error: "Estado de pago no válido" }, { status: 400 });
      update.estado_pago = body.estado_pago;
      // Al marcar pagado sin fecha, sellar hoy
      if (body.estado_pago === "pagado" && body.fecha_pago === undefined) {
        update.fecha_pago = new Date().toISOString().slice(0, 10);
      }
    }
    for (const k of ["metodo_pago", "fecha_pago", "fecha_evento", "fecha_entrega_estimada", "direccion_envio", "tracking", "notas"]) {
      if (body[k] !== undefined) update[k] = body[k] || null;
    }
    if (body.cantidad !== undefined) update.cantidad = Number(body.cantidad);
    if (body.precio_unit !== undefined) update.precio_unit = Number(body.precio_unit);

    const db = adminClient();
    const { data, error } = await db.from("keychain_orders").update(update).eq("id", id).select(SELECT).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ order: data });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/keychain-orders/[id] — elimina un pedido. Solo admin.
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  try {
    const db = adminClient();
    const { error } = await db.from("keychain_orders").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}
