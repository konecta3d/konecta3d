import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * POST /api/leads
 * Guarda un lead desde la landing pública. No requiere autenticación.
 * Usado cuando un cliente rellena el formulario de captación antes de descargar el lead magnet.
 */
export async function POST(req: Request) {
  const body = await req.json();
  const { businessId, name, phone, email, source, referralToken } = body as {
    businessId: string;
    name?: string;
    phone?: string;
    email?: string;
    source?: string;
    referralToken?: string;
  };

  if (!businessId) {
    return NextResponse.json({ error: "businessId requerido" }, { status: 400 });
  }
  if (!name?.trim() && !phone?.trim() && !email?.trim()) {
    return NextResponse.json({ error: "Se requiere al menos nombre o teléfono" }, { status: 400 });
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // ── Atribución de referido ("Invita a un amigo") ────────────────────────────
  // Si el amigo entró con un enlace personal, buscamos quién le recomendó para
  // atribuir el lead y avisar al negocio. Best-effort: si aún no existe la tabla
  // referrals (migración sin correr), no rompe la captación.
  let referral: { id: string; referrer_name: string; business_id: string } | null = null;
  if (referralToken?.trim()) {
    try {
      const { data: r } = await db
        .from("referrals")
        .select("id, referrer_name, business_id")
        .eq("id", referralToken.trim())
        .maybeSingle();
      // Solo válido si el referido pertenece a este mismo negocio.
      if (r && r.business_id === businessId) referral = r;
    } catch { /* tabla aún no migrada: ignorar */ }
  }

  const { data, error } = await db
    .from("leads")
    .insert({
      business_id: businessId,
      source:      referral ? "referido" : (source || "lead_magnet"),
      status:      "nuevo",
      ...(name?.trim()  ? { name:  name.trim()  } : {}),
      ...(phone?.trim() ? { phone: phone.trim() } : {}),
      ...(email?.trim() ? { email: email.trim() } : {}),
      ...(referral ? { notes: `Recomendado por ${referral.referrer_name}`, referral_id: referral.id } : {}),
    })
    .select("id")
    .single();

  if (error) {
    // Si falla por la columna referral_id (migración sin correr), reintenta sin ella.
    if (referral && /referral_id/.test(error.message)) {
      const retry = await db
        .from("leads")
        .insert({
          business_id: businessId,
          source:      "referido",
          status:      "nuevo",
          ...(name?.trim()  ? { name:  name.trim()  } : {}),
          ...(phone?.trim() ? { phone: phone.trim() } : {}),
          ...(email?.trim() ? { email: email.trim() } : {}),
          notes: `Recomendado por ${referral.referrer_name}`,
        })
        .select("id")
        .single();
      if (retry.error) {
        return NextResponse.json({ error: retry.error.message }, { status: 500 });
      }
      await notifyReferral(businessId, referral.referrer_name, name?.trim());
      return NextResponse.json({ ok: true, leadId: retry.data.id });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (referral) {
    await notifyReferral(businessId, referral.referrer_name, name?.trim());
  }

  return NextResponse.json({ ok: true, leadId: data.id });
}

/**
 * Crea una notificación para el negocio cuando un referido se capta.
 * Best-effort: si la tabla notifications aún no existe, no rompe la captación.
 */
async function notifyReferral(
  businessId: string,
  referrerName: string,
  friendName?: string
) {
  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await db.from("notifications").insert({
      business_id: businessId,
      type: "referral",
      title: `${referrerName} ha traído a un amigo`,
      body: friendName
        ? `${friendName} ha llegado recomendado por ${referrerName}.`
        : `Un nuevo contacto ha llegado recomendado por ${referrerName}.`,
    });
  } catch {
    /* tabla aún no migrada: ignorar */
  }
}
