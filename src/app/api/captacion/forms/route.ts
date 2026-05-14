import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyBusinessOwnership, verifyAdminSession } from "@/lib/auth-helpers";
import { DEFAULT_BLOCKS } from "@/types/captacion";

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/captacion/forms
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
    .from("captacion_forms")
    .select("id, name, objective, status, created_at, updated_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ forms: data });
}

// POST /api/captacion/forms
export async function POST(req: Request) {
  const body = await req.json();
  const { businessId, name, objective } = body;

  if (!businessId || !name?.trim()) {
    return NextResponse.json({ error: "businessId y name son obligatorios" }, { status: 400 });
  }

  const [owns, { isAdmin }] = await Promise.all([
    verifyBusinessOwnership(req, businessId),
    verifyAdminSession(req),
  ]);
  if (!owns && !isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const obj = (objective || "diagnostic") as "quick" | "diagnostic" | "full";
  const blocks = DEFAULT_BLOCKS[obj] || DEFAULT_BLOCKS.diagnostic;

  const { data, error } = await supabaseAdmin()
    .from("captacion_forms")
    .insert({
      business_id: businessId,
      name: name.trim(),
      objective: obj,
      status: "draft",
      blocks,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ form: data }, { status: 201 });
}
