import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyBusinessOwnership, verifyAdminSession } from "@/lib/auth-helpers";

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/captacion/context?businessId=xxx
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "businessId requerido" }, { status: 400 });

  const [owns, { isAdmin }] = await Promise.all([
    verifyBusinessOwnership(req, businessId),
    verifyAdminSession(req),
  ]);
  if (!owns && !isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const key = `captacion_context_${businessId}`;
  const { data } = await supabaseAdmin()
    .from("settings")
    .select("value")
    .eq("key", key)
    .single();

  return NextResponse.json({ context: data?.value ?? null });
}

// PUT /api/captacion/context — guardar/actualizar contexto
export async function PUT(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.businessId || !body?.context) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { businessId, context } = body;

  const [owns, { isAdmin }] = await Promise.all([
    verifyBusinessOwnership(req, businessId),
    verifyAdminSession(req),
  ]);
  if (!owns && !isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const key = `captacion_context_${businessId}`;
  const { error } = await supabaseAdmin()
    .from("settings")
    .upsert({ key, value: context }, { onConflict: "key" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
