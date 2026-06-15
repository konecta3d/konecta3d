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

const LEAD_FIELDS =
  "id, nombre, empresa, sector, whatsapp, telefono, etapa, perfil, notas";

/**
 * GET /api/admin/crm/citas
 * Lista las citas activas (no canceladas) con los datos del lead. Solo admin.
 */
export async function GET(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const db = adminClient();
    const { data, error } = await db
      .from("crm_citas")
      .select(`id, agente, inicio, duracion_min, canal, estado, notas, lead:crm_leads(${LEAD_FIELDS})`)
      .neq("estado", "cancelada")
      .order("inicio", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ citas: data ?? [] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST /api/admin/crm/citas
 * Asigna un hueco. Si no se pasa leadId, crea el lead en el pipeline (etapa
 * "contacto_iniciado", fuente "Feria") y lo liga a la cita.
 * Body: { agente, inicio, duracion_min?, canal?, notas?, leadId?,
 *         nuevo?: { nombre, whatsapp?, empresa?, sector? } }
 */
export async function POST(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const agente: string = (body.agente || "").trim();
    const inicio: string = (body.inicio || "").trim();

    if (!agente) return NextResponse.json({ error: "Falta el agente" }, { status: 400 });
    if (!inicio) return NextResponse.json({ error: "Falta la hora del hueco" }, { status: 400 });

    const db = adminClient();

    // 1) ¿Está libre el hueco? (evita crear el lead si el hueco ya está pillado)
    const { data: ocupado } = await db
      .from("crm_citas")
      .select("id")
      .eq("agente", agente)
      .eq("inicio", inicio)
      .neq("estado", "cancelada")
      .maybeSingle();
    if (ocupado) {
      return NextResponse.json({ error: "Ese hueco ya está ocupado" }, { status: 409 });
    }

    const now = new Date().toISOString();
    const fechaCita = inicio.slice(0, 10); // YYYY-MM-DD

    // 2) Determinar el lead: existente o crear uno nuevo
    let leadId: string | undefined = body.leadId || undefined;

    if (leadId) {
      // Reflejar la cita en el lead existente (alimenta la Agenda comercial)
      await db.from("crm_leads").update({
        asignado_a: agente,
        proxima_accion: "Llamada FYCMA (5 min)",
        fecha_proxima_accion: fechaCita,
      }).eq("id", leadId);
    } else {
      const nuevo = body.nuevo || {};
      const nombre = String(nuevo.nombre || "").trim();
      if (!nombre) {
        return NextResponse.json({ error: "Falta el nombre del contacto" }, { status: 400 });
      }
      const etapa = "contacto_iniciado";
      const etapaIndex = getStage(etapa)?.index ?? 4;

      const { data: lead, error: leadErr } = await db
        .from("crm_leads")
        .insert({
          nombre,
          empresa:              nuevo.empresa ?? null,
          sector:               nuevo.sector ?? null,
          whatsapp:             nuevo.whatsapp ?? null,
          telefono:             nuevo.whatsapp ?? null,
          etapa,
          etapa_index:          etapaIndex,
          etapa_entered_at:     now,
          fuente:               "Feria",
          asignado_a:           agente,
          proxima_accion:       "Llamada FYCMA (5 min)",
          fecha_proxima_accion: fechaCita,
          notas:                body.notas ?? null,
          fecha_entrada:        now,
        })
        .select("id")
        .single();

      if (leadErr || !lead) {
        return NextResponse.json({ error: leadErr?.message || "No se pudo crear el lead" }, { status: 500 });
      }
      leadId = lead.id;

      await db.from("crm_stage_history").insert({
        lead_id: leadId,
        stage: etapa,
        stage_index: etapaIndex,
        entered_at: now,
        changed_by: agente,
      });
    }

    // 3) Crear la cita
    const { data: cita, error: citaErr } = await db
      .from("crm_citas")
      .insert({
        lead_id:      leadId,
        agente,
        inicio,
        duracion_min: Number(body.duracion_min) || 10,
        canal:        body.canal || "llamada",
        notas:        body.notas ?? null,
      })
      .select(`id, agente, inicio, duracion_min, canal, estado, notas, lead:crm_leads(${LEAD_FIELDS})`)
      .single();

    if (citaErr) {
      // 23505 = violación de índice único (carrera: otro la cogió a la vez)
      const status = citaErr.code === "23505" ? 409 : 500;
      const error = status === 409 ? "Ese hueco ya está ocupado" : citaErr.message;
      return NextResponse.json({ error }, { status });
    }

    return NextResponse.json({ cita });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
