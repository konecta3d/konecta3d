import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendLeadNotification } from "@/lib/email";

/**
 * POST /api/svd/lead
 * Formulario «¿Lo revisamos juntos?» de la herramienta pública /svd.
 * Guarda el contacto en captacion_leads de la campaña indicada en SVD_CAMPAIGN_ID,
 * con el resumen de lo que la persona rellenó y la fecha del consentimiento en las notas.
 * Sin autenticación (formulario público). Exige consentimiento expreso.
 */

interface SvdLeadBody {
  nombre?: unknown;
  telefono?: unknown;
  negocio?: unknown;
  resumen?: unknown;
  origen?: unknown;
  consentimiento?: unknown;
  web?: unknown; // campo trampa para bots: debe llegar vacío
}

function texto(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(req: Request): Promise<NextResponse> {
  let body: SvdLeadBody;
  try {
    body = (await req.json()) as SvdLeadBody;
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  // Bot que rellena el campo oculto: respondemos OK sin guardar nada
  if (texto(body.web, 200)) return NextResponse.json({ ok: true });

  const nombre = texto(body.nombre, 120);
  const telefono = texto(body.telefono, 30);
  const negocio = texto(body.negocio, 160);
  const resumen = texto(body.resumen, 8000);
  const origen = texto(body.origen, 40).replace(/[^\w-]/g, "") || "directo";

  if (!nombre) return NextResponse.json({ error: "Falta el nombre" }, { status: 400 });
  if (telefono.replace(/\D/g, "").length < 9) {
    return NextResponse.json({ error: "Teléfono no válido" }, { status: 400 });
  }
  if (body.consentimiento !== true) {
    return NextResponse.json({ error: "Hace falta aceptar la política de privacidad" }, { status: 400 });
  }

  const campaignId = process.env.SVD_CAMPAIGN_ID;
  if (!campaignId) {
    return NextResponse.json({ error: "Formulario no configurado" }, { status: 503 });
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: campaign, error: campError } = await db
    .from("captacion_campaigns")
    .select("id, business_id, name")
    .eq("id", campaignId)
    .single();

  if (campError || !campaign) {
    return NextResponse.json({ error: "Formulario no configurado" }, { status: 503 });
  }

  const ahora = new Date();
  const notas = [
    `Desde la herramienta SVD (/svd) · origen: ${origen}.`,
    `Consentimiento de privacidad aceptado el ${ahora.toISOString()}.`,
    resumen ? `\n${resumen}` : "",
  ].join("\n").trim();

  const { error: leadError } = await db.from("captacion_leads").insert({
    business_id: campaign.business_id,
    campaign_id: campaign.id,
    name: nombre,
    phone: telefono,
    company: negocio || null,
    segment: "svd",
    notes: notas,
    lead_magnet_delivered: false,
    funnel_step: "submitted",
    status: "new",
  });

  if (leadError) {
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
  }

  // Aviso por email al negocio (no bloquea si falla)
  try {
    const { data: biz } = await db
      .from("businesses")
      .select("contact_email, name")
      .eq("id", campaign.business_id)
      .single();
    const b = biz as { contact_email: string | null; name: string | null } | null;
    if (b?.contact_email) {
      await sendLeadNotification({
        businessEmail: b.contact_email,
        businessName: b.name ?? "Konecta3D",
        leadName: nombre,
        leadPhone: telefono,
        leadEmail: null,
        campaignName: "Herramienta SVD",
        capturedAt: ahora,
      });
    }
  } catch {
    /* el lead ya está guardado */
  }

  return NextResponse.json({ ok: true });
}
