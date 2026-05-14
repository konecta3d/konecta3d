import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyBusinessOwnership, verifyAdminSession } from "@/lib/auth-helpers";

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getFormBusiness(id: string): Promise<string | null> {
  const { data } = await supabaseAdmin()
    .from("captacion_forms")
    .select("business_id")
    .eq("id", id)
    .single();
  return data?.business_id ?? null;
}

// GET /api/captacion/forms/[id] — formulario completo con bloques
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const businessId = await getFormBusiness(id);
  if (!businessId) return NextResponse.json({ error: "Formulario no encontrado" }, { status: 404 });

  const [owns, { isAdmin }] = await Promise.all([
    verifyBusinessOwnership(req, businessId),
    verifyAdminSession(req),
  ]);
  if (!owns && !isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { data, error } = await supabaseAdmin()
    .from("captacion_forms")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ form: data });
}

// PUT /api/captacion/forms/[id] — guardar bloques y config
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const businessId = await getFormBusiness(id);
  if (!businessId) return NextResponse.json({ error: "Formulario no encontrado" }, { status: 404 });

  const [owns, { isAdmin }] = await Promise.all([
    verifyBusinessOwnership(req, businessId),
    verifyAdminSession(req),
  ]);
  if (!owns && !isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if ("name" in body) updates.name = body.name;
  if ("blocks" in body) updates.blocks = body.blocks;
  if ("status" in body) updates.status = body.status;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin()
    .from("captacion_forms")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ form: data });
}

// DELETE /api/captacion/forms/[id]
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const businessId = await getFormBusiness(id);
  if (!businessId) return NextResponse.json({ error: "Formulario no encontrado" }, { status: 404 });

  const [owns, { isAdmin }] = await Promise.all([
    verifyBusinessOwnership(req, businessId),
    verifyAdminSession(req),
  ]);
  if (!owns && !isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { error } = await supabaseAdmin()
    .from("captacion_forms")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
