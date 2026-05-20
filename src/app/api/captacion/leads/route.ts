import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyBusinessOwnership, verifyAdminSession } from "@/lib/auth-helpers";
import { sendLeadNotification, sendLeadDelivery } from "@/lib/email";

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
    .select("id, business_id, lead_magnet_id, status, name")
    .eq("id", campaign_id)
    .single();

  if (campError || !campaign) {
    return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
  }
  if (campaign.status !== "active") {
    return NextResponse.json({ error: "Campaña no activa" }, { status: 400 });
  }

  // Cargar datos del negocio para notificaciones (en paralelo, no bloquea el flujo)
  const businessPromise = db
    .from("businesses")
    .select("contact_email, name")
    .eq("id", campaign.business_id)
    .single();

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
  type LMData = {
    type: string; title?: string; description?: string; cta_text?: string;
    file_url?: string; external_url?: string; code_value?: string; delivered_count?: number;
  };

  let leadMagnetUrl: string | null = null;
  let leadMagnetData: LMData | null = null;

  if (leadMagnetId) {
    const { data: lmRaw } = await db
      .from("captacion_lead_magnets")
      .select("type, title, description, cta_text, file_url, external_url, code_value, delivered_count")
      .eq("id", leadMagnetId)
      .single();

    const lm = lmRaw as LMData | null;

    if (lm) {
      leadMagnetData = lm;
      if (lm.type === "pdf" && lm.file_url) leadMagnetUrl = lm.file_url;
      else if (lm.type === "url" && lm.external_url) leadMagnetUrl = lm.external_url;
      // type === "code": se muestra en pantalla, no hay URL

      // Incrementar contador (fire-and-forget, no bloquea la respuesta)
      const prevCount = lm.delivered_count ?? 0;
      db.from("captacion_lead_magnets")
        .update({ delivered_count: prevCount + 1 })
        .eq("id", leadMagnetId)
        .then(() => {/* ignorar resultado */});
    }
  }

  // ── Notificaciones por email (fire-and-forget) ────────────────────────────
  // Se ejecutan en paralelo y no bloquean la respuesta al lead.
  // Si fallan, el lead ya está guardado y no se pierde.
  const { data: biz } = await businessPromise;
  const typedBiz = biz as { contact_email: string; name: string } | null;
  const campaignTyped = campaign as {
    id: string; business_id: string; lead_magnet_id?: string; status: string; name: string;
  };

  const emailTasks: Promise<unknown>[] = [];

  // 1. Notificación al negocio
  if (typedBiz?.contact_email) {
    emailTasks.push(
      sendLeadNotification({
        businessEmail: typedBiz.contact_email,
        businessName: typedBiz.name ?? "Tu negocio",
        leadName: name?.trim() || null,
        leadPhone: phone.trim(),
        leadEmail: email?.trim() || null,
        campaignName: campaignTyped.name ?? "Campaña",
        capturedAt: new Date(),
      })
    );
  }

  // 2. Entrega del recurso al lead (solo si tiene email y hay URL de recurso)
  if (email?.trim() && leadMagnetUrl && leadMagnetData) {
    emailTasks.push(
      sendLeadDelivery({
        leadEmail: email.trim(),
        leadName: name?.trim() || null,
        businessName: typedBiz?.name ?? "",
        resourceTitle: leadMagnetData.title ?? "Tu recurso",
        resourceDescription: leadMagnetData.description ?? null,
        resourceUrl: leadMagnetUrl,
        ctaText: leadMagnetData.cta_text ?? null,
      })
    );
  }

  // Lanzar emails sin esperar (Promise.allSettled no lanza aunque fallen)
  if (emailTasks.length > 0) {
    Promise.allSettled(emailTasks).catch(() => {/* silencioso */});
  }

  return NextResponse.json({
    ok: true,
    lead,
    lead_magnet_url: leadMagnetUrl,
  }, { status: 201 });
}
