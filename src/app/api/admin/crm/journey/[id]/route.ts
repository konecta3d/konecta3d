import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** GET — un negocio en seguimiento con sus insights. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;

  try {
    const db = adminClient();
    const { data: journey, error } = await db.from("crm_journey").select("*").eq("id", id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    const { data: insights } = await db
      .from("crm_journey_insights").select("*").eq("journey_id", id).order("fecha", { ascending: false });
    return NextResponse.json({ journey, insights: insights ?? [] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** PUT — actualiza etapa, objetivos cumplidos, siguiente acción, notas. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;

  try {
    const body = await req.json();
    const db = adminClient();

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const k of ["nombre", "objetivos_cumplidos", "siguiente_accion", "fecha_proxima_accion", "notas"]) {
      if (k in body) update[k] = body[k] === "" ? null : body[k];
    }
    // Cambio de etapa: reinicia el cronómetro de la etapa
    if ("etapa_actual" in body) {
      update.etapa_actual = body.etapa_actual;
      update.etapa_entered_at = new Date().toISOString();
    }

    const { data, error } = await db.from("crm_journey").update(update).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ journey: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** DELETE — quita un negocio del seguimiento (cascade borra sus insights). */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;

  try {
    const db = adminClient();
    const { error } = await db.from("crm_journey").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
