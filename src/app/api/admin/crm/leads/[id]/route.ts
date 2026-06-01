import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * GET /api/admin/crm/leads/[id]
 * Devuelve un lead con su historial de etapas y actividad.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  try {
    const db = adminClient();

    const { data: lead, error } = await db
      .from("crm_leads").select("*").eq("id", id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });

    const { data: history } = await db
      .from("crm_stage_history")
      .select("*")
      .eq("lead_id", id)
      .order("entered_at", { ascending: true });

    const { data: activities } = await db
      .from("crm_activities")
      .select("*")
      .eq("lead_id", id)
      .order("fecha", { ascending: false });

    return NextResponse.json({ lead, history: history ?? [], activities: activities ?? [] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * PUT /api/admin/crm/leads/[id]
 * Actualiza campos del lead. NO cambia la etapa (eso es /move).
 */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const db = adminClient();

    // Campos editables (la etapa se gestiona aparte vía /move)
    const allowed = [
      "nombre", "empresa", "sector", "email", "telefono", "whatsapp",
      "linkedin_url", "instagram_url", "score", "perfil", "fuente",
      "proxima_feria", "ferias_al_anio", "unidades_estimadas",
      "asignado_a", "ultimo_contacto", "proxima_accion",
      "fecha_proxima_accion", "notas", "motivo_perdida", "business_id",
    ];

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of allowed) {
      if (key in body) update[key] = body[key] === "" ? null : body[key];
    }

    // Recalcular revenue si cambian las unidades
    if ("unidades_estimadas" in body) {
      const u = Number(body.unidades_estimadas) || 0;
      update.unidades_estimadas = u || null;
      update.revenue_estimado = u * 3;
    }

    const { data, error } = await db
      .from("crm_leads").update(update).eq("id", id).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ lead: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/crm/leads/[id]
 * Borra un lead y todo su historial (cascade).
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  try {
    const db = adminClient();
    const { error } = await db.from("crm_leads").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
