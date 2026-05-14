import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyBusinessOwnership, verifyAdminSession } from "@/lib/auth-helpers";

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getCampaignBusiness(id: string): Promise<string | null> {
  const { data } = await supabaseAdmin()
    .from("captacion_campaigns")
    .select("business_id")
    .eq("id", id)
    .single();
  return data?.business_id ?? null;
}

// PUT /api/captacion/campaigns/[id] — actualizar campaña
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const businessId = await getCampaignBusiness(id);
  if (!businessId) return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });

  const [owns, { isAdmin }] = await Promise.all([
    verifyBusinessOwnership(req, businessId),
    verifyAdminSession(req),
  ]);
  if (!owns && !isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  const allowed = ["name", "type", "status", "starts_at", "ends_at", "target_client",
    "objective", "form_id", "lead_magnet_id", "keychains_distributed"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const { data, error } = await supabaseAdmin()
    .from("captacion_campaigns")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaign: data });
}

// DELETE /api/captacion/campaigns/[id]
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const businessId = await getCampaignBusiness(id);
  if (!businessId) return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });

  const [owns, { isAdmin }] = await Promise.all([
    verifyBusinessOwnership(req, businessId),
    verifyAdminSession(req),
  ]);
  if (!owns && !isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { error } = await supabaseAdmin()
    .from("captacion_campaigns")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
