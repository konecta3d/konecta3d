import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";
import { getStage } from "@/lib/crm/stages";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * GET /api/admin/crm/leads
 * Lista todos los leads del pipeline. Solo admin.
 */
export async function GET(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const db = adminClient();
    const { data, error } = await db
      .from("crm_leads")
      .select("*")
      .order("etapa_index", { ascending: true })
      .order("etapa_entered_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ leads: data ?? [] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST /api/admin/crm/leads
 * Crea un lead nuevo. Inicia el historial de etapas.
 */
export async function POST(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.nombre || !String(body.nombre).trim()) {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }

    const db = adminClient();
    const etapa = body.etapa || "prospecto";
    const stageDef = getStage(etapa);
    const etapaIndex = stageDef?.index ?? 1;
    const now = new Date().toISOString();

    // Calcular revenue estimado si hay unidades
    const unidades = Number(body.unidades_estimadas) || 0;
    const revenueEstimado = unidades * 3;

    const insert = {
      nombre:               String(body.nombre).trim(),
      empresa:              body.empresa ?? null,
      sector:               body.sector ?? null,
      email:                body.email ?? null,
      telefono:             body.telefono ?? null,
      whatsapp:             body.whatsapp ?? null,
      linkedin_url:         body.linkedin_url ?? null,
      instagram_url:        body.instagram_url ?? null,
      etapa,
      etapa_index:          etapaIndex,
      etapa_entered_at:     now,
      score:                Number(body.score) || 0,
      perfil:               body.perfil ?? null,
      fuente:               body.fuente ?? null,
      proxima_feria:        body.proxima_feria || null,
      ferias_al_anio:       body.ferias_al_anio ? Number(body.ferias_al_anio) : null,
      unidades_estimadas:   unidades || null,
      revenue_estimado:     revenueEstimado,
      asignado_a:           body.asignado_a ?? null,
      proxima_accion:       body.proxima_accion ?? null,
      fecha_proxima_accion: body.fecha_proxima_accion || null,
      notas:                body.notas ?? null,
      fecha_entrada:        now,
    };

    const { data: lead, error } = await db
      .from("crm_leads")
      .insert(insert)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Primer registro de historial de etapas
    await db.from("crm_stage_history").insert({
      lead_id:     lead.id,
      stage:       etapa,
      stage_index: etapaIndex,
      entered_at:  now,
      changed_by:  body.asignado_a ?? null,
    });

    return NextResponse.json({ lead });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
