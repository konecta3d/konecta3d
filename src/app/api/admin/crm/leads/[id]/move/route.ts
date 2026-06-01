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
 * POST /api/admin/crm/leads/[id]/move
 * Mueve un lead a otra etapa y registra el tiempo de permanencia.
 *
 * Body: { etapa: string, changed_by?: string }
 *
 * Lógica de medición de tiempo entre etapas:
 *  1. Cierra el registro de historial actual (exited_at + duration_hours)
 *  2. Abre un registro nuevo para la etapa de destino
 *  3. Actualiza el lead (etapa, índice, etapa_entered_at)
 *  4. Marca fecha_cierre si llega a ganado/perdido
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  try {
    const { etapa, changed_by } = await req.json();
    const stageDef = getStage(etapa);
    if (!stageDef) {
      return NextResponse.json({ error: "Etapa no válida" }, { status: 400 });
    }

    const db = adminClient();
    const now = new Date();
    const nowIso = now.toISOString();

    // Lead actual
    const { data: lead, error: leadErr } = await db
      .from("crm_leads").select("*").eq("id", id).single();
    if (leadErr || !lead) {
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
    }

    // Si ya está en esa etapa, no hacer nada
    if (lead.etapa === etapa) {
      return NextResponse.json({ lead });
    }

    // 1. Cerrar el registro de historial abierto (la etapa de la que sale)
    const { data: openRecord } = await db
      .from("crm_stage_history")
      .select("*")
      .eq("lead_id", id)
      .is("exited_at", null)
      .order("entered_at", { ascending: false })
      .limit(1)
      .single();

    if (openRecord) {
      const enteredAt = new Date(openRecord.entered_at);
      const durationHours = (now.getTime() - enteredAt.getTime()) / (1000 * 60 * 60);
      await db
        .from("crm_stage_history")
        .update({
          exited_at: nowIso,
          duration_hours: Math.round(durationHours * 100) / 100,
        })
        .eq("id", openRecord.id);
    }

    // 2. Abrir registro nuevo para la etapa de destino
    await db.from("crm_stage_history").insert({
      lead_id:     id,
      stage:       etapa,
      stage_index: stageDef.index,
      entered_at:  nowIso,
      changed_by:  changed_by ?? null,
    });

    // 3. Actualizar el lead
    const update: Record<string, unknown> = {
      etapa,
      etapa_index:      stageDef.index,
      etapa_entered_at: nowIso,
      updated_at:       nowIso,
    };

    // 4. Marcar cierre en etapas terminales
    if ((etapa === "ganado" || etapa === "perdido") && !lead.fecha_cierre) {
      update.fecha_cierre = nowIso;
    }

    const { data: updated, error: updErr } = await db
      .from("crm_leads").update(update).eq("id", id).select().single();

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    return NextResponse.json({ lead: updated });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
