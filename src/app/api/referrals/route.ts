import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * Referidos de "Invita a un amigo".
 * Rutas públicas (sin auth) usadas desde la landing pública, con service role.
 *
 * POST  { businessId, referrerName }        -> { token }   crea el enlace personal
 * GET   ?token=<id>                         -> { referrerName }  para el banner del amigo
 */

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  let body: { businessId?: string; referrerName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const businessId = (body.businessId || "").trim();
  // Nombre: recortado, sin comillas raras, máximo 60 caracteres.
  const referrerName = (body.referrerName || "").replace(/[<>]/g, "").trim().slice(0, 60);

  if (!businessId) {
    return NextResponse.json({ error: "businessId requerido" }, { status: 400 });
  }
  if (!referrerName) {
    return NextResponse.json({ error: "Escribe tu nombre para generar el enlace" }, { status: 400 });
  }

  const supabase = db();

  // Verificar que el negocio existe (evita crear referidos hacia negocios inexistentes).
  const { data: biz } = await supabase.from("businesses").select("id").eq("id", businessId).maybeSingle();
  if (!biz) {
    return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("referrals")
    .insert({ business_id: businessId, referrer_name: referrerName })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ token: data.id });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = (searchParams.get("token") || "").trim();
  if (!token) {
    return NextResponse.json({ error: "token requerido" }, { status: 400 });
  }

  const { data } = await db()
    .from("referrals")
    .select("referrer_name")
    .eq("id", token)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ referrerName: null });
  }
  return NextResponse.json({ referrerName: data.referrer_name });
}
