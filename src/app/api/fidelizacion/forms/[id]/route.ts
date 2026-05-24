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
    .from("fidelizacion_forms")
    .select("business_id")
    .eq("id", id)
    .single();
  return data?.business_id ?? null;
}

// GET /api/fidelizacion/forms/[id]
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
    .from("fidelizacion_forms")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Normalizar bloques: puede venir como array (formato antiguo) u objeto { blocks, design }
  const rawBlocks = data.blocks;
  const blocks = Array.isArray(rawBlocks) ? rawBlocks : (rawBlocks?.blocks ?? []);
  const design  = Array.isArray(rawBlocks) ? null         : (rawBlocks?.design  ?? null);

  return NextResponse.json({ form: { ...data, blocks, design } });
}

// PUT /api/fidelizacion/forms/[id]
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

  if ("name"   in body) updates.name   = body.name;
  if ("status" in body) updates.status = body.status;

  // Empaquetar blocks + design juntos en el campo JSONB
  if ("blocks" in body || "design" in body) {
    updates.blocks = {
      blocks: body.blocks ?? [],
      design: body.design ?? null,
    };
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin()
    .from("fidelizacion_forms")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ form: data });
}

// DELETE /api/fidelizacion/forms/[id]
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
    .from("fidelizacion_forms")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
