import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * POST /api/leads
 * Guarda un lead desde la landing pública. No requiere autenticación.
 * Usado cuando un cliente rellena el formulario de captación antes de descargar el lead magnet.
 */
export async function POST(req: Request) {
  const body = await req.json();
  const { businessId, name, phone, email, source } = body as {
    businessId: string;
    name?: string;
    phone?: string;
    email?: string;
    source?: string;
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

  const { data, error } = await db
    .from("leads")
    .insert({
      business_id: businessId,
      source:      source || "lead_magnet",
      status:      "nuevo",
      ...(name?.trim()  ? { name:  name.trim()  } : {}),
      ...(phone?.trim() ? { phone: phone.trim() } : {}),
      ...(email?.trim() ? { email: email.trim() } : {}),
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, leadId: data.id });
}
