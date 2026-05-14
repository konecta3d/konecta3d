import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyBusinessOwnership, verifyAdminSession } from "@/lib/auth-helpers";

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getLeadBusiness(id: string): Promise<string | null> {
  const { data } = await supabaseAdmin()
    .from("captacion_leads")
    .select("business_id")
    .eq("id", id)
    .single();
  return data?.business_id ?? null;
}

// PUT /api/captacion/leads/[id] — actualizar estado y notas
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const businessId = await getLeadBusiness(id);
  if (!businessId) return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });

  const [owns, { isAdmin }] = await Promise.all([
    verifyBusinessOwnership(req, businessId),
    verifyAdminSession(req),
  ]);
  if (!owns && !isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  const allowed = ["status", "notes", "migrated_to_fidelizacion"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }
  if (body.migrated_to_fidelizacion === true) {
    updates.migrated_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin()
    .from("captacion_leads")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lead: data });
}
