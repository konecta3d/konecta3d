import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyBusinessOwnership, verifyAdminSession } from "@/lib/auth-helpers";

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/captacion/campaigns — listar campañas del negocio
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
    .from("captacion_campaigns")
    .select("*, captacion_forms(id, name), captacion_lead_magnets(id, name)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: data });
}

// POST /api/captacion/campaigns — crear campaña
export async function POST(req: Request) {
  const body = await req.json();
  const { businessId, name, type, starts_at, ends_at, target_client, objective, form_id, lead_magnet_id, keychains_distributed, privacy_url, privacy_text } = body;

  if (!businessId || !name?.trim()) {
    return NextResponse.json({ error: "businessId y name son obligatorios" }, { status: 400 });
  }

  const [owns, { isAdmin }] = await Promise.all([
    verifyBusinessOwnership(req, businessId),
    verifyAdminSession(req),
  ]);
  if (!owns && !isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  // Generar slug único
  const base = name.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const slug = `${base}-${Date.now().toString(36)}`;

  const { data, error } = await supabaseAdmin()
    .from("captacion_campaigns")
    .insert({
      business_id: businessId,
      name: name.trim(),
      type: type || "event",
      status: "draft",
      starts_at: starts_at || null,
      ends_at: ends_at || null,
      target_client: target_client || null,
      objective: objective || null,
      form_id: form_id || null,
      lead_magnet_id: lead_magnet_id || null,
      keychains_distributed: keychains_distributed || 0,
      privacy_url: privacy_url || null,
      privacy_text: privacy_text || null,
      slug,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaign: data }, { status: 201 });
}
