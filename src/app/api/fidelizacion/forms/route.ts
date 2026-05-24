import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyBusinessOwnership, verifyAdminSession } from "@/lib/auth-helpers";
import { DEFAULT_FID_BLOCKS } from "@/types/fidelizacion-forms";
import type { FidelizacionObjective } from "@/types/fidelizacion-forms";

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function generateSlug(base: string): string {
  const clean = base
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 30);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${clean}-${rand}`;
}

// GET /api/fidelizacion/forms
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
    .from("fidelizacion_forms")
    .select("id, name, slug, objective, status, response_count, created_at, updated_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ forms: data });
}

// POST /api/fidelizacion/forms
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

  const obj = (objective || "general") as FidelizacionObjective;
  const blocks = DEFAULT_FID_BLOCKS[obj] || DEFAULT_FID_BLOCKS.general;

  // Generar slug único basado en el nombre del formulario
  const slug = generateSlug(name.trim());

  const { data, error } = await supabaseAdmin()
    .from("fidelizacion_forms")
    .insert({
      business_id: businessId,
      name: name.trim(),
      slug,
      objective: obj,
      status: "draft",
      blocks,
      response_count: 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ form: data }, { status: 201 });
}
