import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyBusinessOwnership } from "@/lib/auth-helpers";

/**
 * Notificaciones del negocio (avisos de referidos, etc.).
 * Autenticado como negocio; se sirve con service role tras verificar propiedad.
 *
 * GET   ?businessId=<id>            -> { notifications, unread }
 * POST  { businessId, ids? }        -> marca como leídas (todas, o las de ids)
 */

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const businessId = (searchParams.get("businessId") || "").trim();
  if (!businessId) return NextResponse.json({ error: "businessId requerido" }, { status: 400 });

  const owns = await verifyBusinessOwnership(req, businessId);
  if (!owns) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const supabase = db();

  try {
    const [{ data: list }, { count: unread }] = await Promise.all([
      supabase
        .from("notifications")
        .select("id, type, title, body, read, created_at")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .eq("read", false),
    ]);
    return NextResponse.json({ notifications: list || [], unread: unread ?? 0 });
  } catch {
    // Tabla aún no migrada: devolver vacío para no romper el panel.
    return NextResponse.json({ notifications: [], unread: 0 });
  }
}

export async function POST(req: Request) {
  let body: { businessId?: string; ids?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }
  const businessId = (body.businessId || "").trim();
  if (!businessId) return NextResponse.json({ error: "businessId requerido" }, { status: 400 });

  const owns = await verifyBusinessOwnership(req, businessId);
  if (!owns) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const supabase = db();
  try {
    let q = supabase.from("notifications").update({ read: true }).eq("business_id", businessId);
    if (body.ids && body.ids.length > 0) q = q.in("id", body.ids);
    else q = q.eq("read", false);
    const { error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
