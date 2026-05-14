import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyBusinessOwnership, verifyAdminSession } from "@/lib/auth-helpers";

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/captacion/leads — listar leads (requiere auth)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  const campaignId = searchParams.get("campaignId");
  if (!businessId) return NextResponse.json({ error: "businessId requerido" }, { status: 400 });

  const [owns, { isAdmin }] = await Promise.all([
    verifyBusinessOwnership(req, businessId),
    verifyAdminSession(req),
  ]);
  if (!owns && !isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  let query = supabaseAdmin()
    .from("captacion_leads")
    .select("*, captacion_campaigns(id, name)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (campaignId) query = query.eq("campaign_id", campaignId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ leads: data });
}

// POST /api/captacion/leads — capturar lead desde formulario público (sin auth)
export async function POST(req: Request) {
  const body = await req.json();
  const { campaign_id, name, phone, email, company, position, segment, quiz_answers } = body;

  if (!campaign_id) {
    return NextResponse.json({ error: "campaign_id es obligatorio" }, { status: 400 });
  }
  if (!phone?.trim()) {
    return NextResponse.json({ error: "El teléfono es obligatorio" }, { status: 400 });
  }

  const db = supabaseAdmin();

  // Verificar que la campaña existe y está activa
  const { data: campaign, error: campError } = await db
    .from("captacion_campaigns")
    .select("id, business_id, lead_magnet_id, status")
    .eq("id", campaign_id)
    .single();

  if (campError || !campaign) {
    return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
  }
  if (campaign.status !== "active") {
    return NextResponse.json({ error: "Campaña no activa" }, { status: 400 });
  }

  // Determinar lead magnet a entregar (del formulario o de la campaña)
  const leadMagnetId = body.lead_magnet_id || campaign.lead_magnet_id || null;

  // Insertar lead
  const { data: lead, error: leadError } = await db
    .from("captacion_leads")
    .insert({
      business_id: campaign.business_id,
      campaign_id,
      name: name?.trim() || null,
      phone: phone.trim(),
      email: email?.trim() || null,
      company: company?.trim() || null,
      position: position?.trim() || null,
      segment: segment || null,
      quiz_answers: quiz_answers || {},
      lead_magnet_id: leadMagnetId,
      lead_magnet_delivered: !!leadMagnetId,
      lead_magnet_delivered_at: leadMagnetId ? new Date().toISOString() : null,
      status: "new",
    })
    .select()
    .single();

  if (leadError) return NextResponse.json({ error: leadError.message }, { status: 500 });

  // Si hay lead magnet, devolver su URL para redirigir al cliente
  let leadMagnetUrl: string | null = null;
  if (leadMagnetId) {
    const { data: lm } = await db
      .from("captacion_lead_magnets")
      .select("type, file_url, external_url, code_value")
      .eq("id", leadMagnetId)
      .single();

    if (lm) {
      if (lm.type === "pdf" && lm.file_url) leadMagnetUrl = lm.file_url;
      else if (lm.type === "url" && lm.external_url) leadMagnetUrl = lm.external_url;
      else if (lm.type === "code") leadMagnetUrl = null; // se muestra en página

      // Incrementar contador
      await db
        .from("captacion_lead_magnets")
        .update({ delivered_count: (lm as { delivered_count?: number }).delivered_count ?? 0 + 1 })
        .eq("id", leadMagnetId);
    }
  }

  return NextResponse.json({
    ok: true,
    lead,
    lead_magnet_url: leadMagnetUrl,
  }, { status: 201 });
}
