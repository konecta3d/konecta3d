/**
 * /api/clients — CRUD de clientes usando service role (bypass RLS)
 * GET  ?businessId=xxx          → listar clientes
 * POST { action, businessId, payload?, id? } → crear / actualizar / eliminar
 */
import { createClient } from "@supabase/supabase-js";
import { verifyBusinessOwnership } from "@/lib/auth-helpers";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId") || "";

  if (!businessId) return Response.json({ error: "Falta businessId" }, { status: 400 });

  const ok = await verifyBusinessOwnership(req, businessId);
  if (!ok) return Response.json({ error: "No autorizado" }, { status: 403 });

  const { data, error } = await admin()
    .from("clients")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, businessId, payload, id } = body;

    if (!businessId) return Response.json({ error: "Falta businessId" }, { status: 400 });

    const ok = await verifyBusinessOwnership(req, businessId);
    if (!ok) return Response.json({ error: "No autorizado" }, { status: 403 });

    const db = admin();

    if (action === "insert") {
      const { data, error } = await db.from("clients").insert({ ...payload, business_id: businessId }).select().single();
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ data });
    }

    if (action === "update") {
      if (!id) return Response.json({ error: "Falta id" }, { status: 400 });
      const { data, error } = await db.from("clients").update(payload).eq("id", id).eq("business_id", businessId).select().single();
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ data });
    }

    if (action === "delete") {
      if (!id) return Response.json({ error: "Falta id" }, { status: 400 });
      const { error } = await db.from("clients").delete().eq("id", id).eq("business_id", businessId);
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ success: true });
    }

    if (action === "toggle_active") {
      if (!id) return Response.json({ error: "Falta id" }, { status: 400 });
      const { data: current } = await db.from("clients").select("active").eq("id", id).single();
      const { error } = await db.from("clients").update({ active: !current?.active }).eq("id", id).eq("business_id", businessId);
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ success: true });
    }

    return Response.json({ error: "Acción desconocida" }, { status: 400 });
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}
