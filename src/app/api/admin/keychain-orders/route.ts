import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";

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
 * GET /api/admin/keychain-orders[?businessId=...]
 * Lista pedidos de llaveros. Con businessId, los de un negocio; sin él, todos. Solo admin.
 */
export async function GET(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  try {
    const db = adminClient();
    let q = db.from("keychain_orders").select(SELECT).order("created_at", { ascending: false });
    if (businessId) q = q.eq("business_id", businessId);
    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ orders: data ?? [] });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/keychain-orders — crea un pedido. Solo admin.
 * Body: { businessId, cantidad, precio_unit?, estado?, estado_pago?, metodo_pago?,
 *         fecha_evento?, direccion_envio?, notas?, origen? }
 */
export async function POST(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const businessId = body.businessId || body.business_id;
    const cantidad = Number(body.cantidad);
    if (!businessId) return NextResponse.json({ error: "Falta el negocio" }, { status: 400 });
    if (!cantidad || cantidad < 1) return NextResponse.json({ error: "Cantidad no válida" }, { status: 400 });

    const db = adminClient();
    const { data, error } = await db
      .from("keychain_orders")
      .insert({
        business_id: businessId,
        cantidad,
        precio_unit: body.precio_unit != null ? Number(body.precio_unit) : 3,
        estado: body.estado || "solicitado",
        estado_pago: body.estado_pago || "pendiente",
        metodo_pago: body.metodo_pago ?? null,
        fecha_evento: body.fecha_evento || null,
        direccion_envio: body.direccion_envio ?? null,
        notas: body.notas ?? null,
        origen: body.origen || "admin",
      })
      .select(SELECT)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ order: data });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}
