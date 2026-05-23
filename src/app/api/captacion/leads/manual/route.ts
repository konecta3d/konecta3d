import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyBusinessOwnership, verifyAdminSession } from "@/lib/auth-helpers";

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// POST /api/captacion/leads/manual
// Añadir un cliente de forma manual (sin pasar por el formulario público)
// Body: { businessId, name?, phone, email?, notes?, campaignId? }
export async function POST(req: Request) {
  const body = await req.json();
  const { businessId, name, phone, email, notes, campaignId } = body as {
    businessId?: string;
    name?: string;
    phone?: string;
    email?: string;
    notes?: string;
    campaignId?: string;
  };

  if (!businessId) return NextResponse.json({ error: "businessId es obligatorio" }, { status: 400 });
  if (!phone?.trim()) return NextResponse.json({ error: "El teléfono es obligatorio" }, { status: 400 });

  const [owns, { isAdmin }] = await Promise.all([
    verifyBusinessOwnership(req, businessId),
    verifyAdminSession(req),
  ]);
  if (!owns && !isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const db = supabaseAdmin();

  // Si se asignó campaña, verificar que pertenece al negocio
  if (campaignId) {
    const { data: camp } = await db
      .from("captacion_campaigns")
      .select("id")
      .eq("id", campaignId)
      .eq("business_id", businessId)
      .single();
    if (!camp) return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
  }

  const { data: lead, error } = await db
    .from("captacion_leads")
    .insert({
      business_id: businessId,
      campaign_id: campaignId || null,
      name: name?.trim() || null,
      phone: phone.trim(),
      email: email?.trim() || null,
      notes: notes?.trim() || null,
      quiz_answers: {},
      lead_magnet_delivered: false,
      status: "new",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, lead }, { status: 201 });
}
