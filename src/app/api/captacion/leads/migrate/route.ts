import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyBusinessOwnership, verifyAdminSession } from "@/lib/auth-helpers";

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// POST /api/captacion/leads/migrate
// Migra en masa todos los leads no migrados de un negocio (opcionalmente filtrado por campaña)
// Body: { businessId: string, campaignId?: string }
export async function POST(req: Request) {
  const body = await req.json();
  const { businessId, campaignId } = body as { businessId?: string; campaignId?: string };

  if (!businessId) {
    return NextResponse.json({ error: "businessId es obligatorio" }, { status: 400 });
  }

  const [owns, { isAdmin }] = await Promise.all([
    verifyBusinessOwnership(req, businessId),
    verifyAdminSession(req),
  ]);
  if (!owns && !isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const db = supabaseAdmin();
  const migratedAt = new Date().toISOString();

  // Construir query dinámica — solo leads NO migrados del negocio
  let query = db
    .from("captacion_leads")
    .update({ migrated_to_fidelizacion: true, migrated_at: migratedAt })
    .eq("business_id", businessId)
    .eq("migrated_to_fidelizacion", false);

  if (campaignId) {
    query = query.eq("campaign_id", campaignId);
  }

  const { data, error } = await query.select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    migrated: data?.length ?? 0,
    migrated_at: migratedAt,
  });
}
