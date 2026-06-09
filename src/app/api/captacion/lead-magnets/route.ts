import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyBusinessOwnership, verifyAdminSession } from "@/lib/auth-helpers";

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "businessId requerido" }, { status: 400 });

  const [owns, { isAdmin }] = await Promise.all([
    verifyBusinessOwnership(req, businessId),
    verifyAdminSession(req),
  ]);
  if (!owns && !isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { data, error } = await supabaseAdmin()
    .from("captacion_lead_magnets")
    .select("*")
    .eq("business_id", businessId)
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ leadMagnets: data });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { businessId, name, type, file_url, external_url, code_value, title, description, cta_text, content } = body;

  if (!businessId || !name?.trim()) {
    return NextResponse.json({ error: "businessId y name son obligatorios" }, { status: 400 });
  }

  const [owns, { isAdmin }] = await Promise.all([
    verifyBusinessOwnership(req, businessId),
    verifyAdminSession(req),
  ]);
  if (!owns && !isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { data, error } = await supabaseAdmin()
    .from("captacion_lead_magnets")
    .insert({
      business_id: businessId,
      name: name.trim(),
      type: type || "pdf",
      file_url: file_url || null,
      external_url: external_url || null,
      code_value: code_value || null,
      title: title || null,
      description: description || null,
      cta_text: cta_text || "Descargar ahora",
      content: content ?? null,
      status: "draft",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ leadMagnet: data }, { status: 201 });
}
