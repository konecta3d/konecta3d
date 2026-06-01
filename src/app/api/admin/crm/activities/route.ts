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
 * GET /api/admin/crm/activities?lead_id=...
 * Lista actividades de un lead, o las más recientes si no se pasa lead_id.
 */
export async function GET(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("lead_id");

  try {
    const db = adminClient();
    let q = db.from("crm_activities").select("*").order("fecha", { ascending: false });
    if (leadId) q = q.eq("lead_id", leadId);
    else q = q.limit(50);

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ activities: data ?? [] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST /api/admin/crm/activities
 * Registra una interacción con un lead. Actualiza ultimo_contacto
 * del lead y, si se indica, la próxima acción.
 */
export async function POST(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.lead_id || !body.tipo) {
      return NextResponse.json({ error: "lead_id y tipo son obligatorios" }, { status: 400 });
    }

    const db = adminClient();
    const fecha = body.fecha || new Date().toISOString();

    const { data: activity, error } = await db
      .from("crm_activities")
      .insert({
        lead_id:                body.lead_id,
        tipo:                   body.tipo,
        realizado_por:          body.realizado_por ?? null,
        resultado:              body.resultado ?? null,
        resumen:                body.resumen ?? null,
        siguiente_accion:       body.siguiente_accion ?? null,
        fecha_siguiente_accion: body.fecha_siguiente_accion || null,
        duracion_min:           body.duracion_min ? Number(body.duracion_min) : null,
        fecha,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Actualizar el lead: último contacto + próxima acción
    const leadUpdate: Record<string, unknown> = { ultimo_contacto: fecha, updated_at: new Date().toISOString() };
    if (body.siguiente_accion) leadUpdate.proxima_accion = body.siguiente_accion;
    if (body.fecha_siguiente_accion) leadUpdate.fecha_proxima_accion = body.fecha_siguiente_accion;
    await db.from("crm_leads").update(leadUpdate).eq("id", body.lead_id);

    return NextResponse.json({ activity });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
