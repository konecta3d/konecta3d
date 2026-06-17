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
 * POST /api/captacion/leads/[id]/to-pipeline
 * Crea (o reutiliza) la ficha del lead en el pipeline de ventas (crm_leads).
 * Solo admin (el pipeline es la herramienta de venta de Konecta).
 * Idempotente: si el lead ya está enlazado, devuelve el crm_lead existente.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  try {
    const db = adminClient();

    const { data: lead, error } = await db
      .from("captacion_leads")
      .select("id, name, company, email, phone, segment, crm_lead_id, captacion_campaigns(name)")
      .eq("id", id)
      .single();
    if (error || !lead) return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });

    // Idempotente: ya está en el pipeline
    if (lead.crm_lead_id) {
      return NextResponse.json({ ok: true, crm_lead_id: lead.crm_lead_id, already: true });
    }

    const etapa = "lead_frio";
    const etapaIndex = getStage(etapa)?.index ?? 2;
    const now = new Date().toISOString();
    const campName = (lead as { captacion_campaigns?: { name?: string } }).captacion_campaigns?.name;

    const { data: crmLead, error: insErr } = await db
      .from("crm_leads")
      .insert({
        nombre: lead.name || lead.company || "(sin nombre)",
        empresa: lead.company ?? null,
        email: lead.email ?? null,
        telefono: lead.phone ?? null,
        whatsapp: lead.phone ?? null,
        etapa,
        etapa_index: etapaIndex,
        etapa_entered_at: now,
        fuente: "Feria",
        asignado_a: "Miguel",
        notas: campName ? `Captado en la campaña "${campName}".` : "Captado en una campaña.",
        fecha_entrada: now,
      })
      .select("id")
      .single();
    if (insErr || !crmLead) {
      return NextResponse.json({ error: insErr?.message || "No se pudo crear el lead en el pipeline" }, { status: 500 });
    }

    await db.from("crm_stage_history").insert({
      lead_id: crmLead.id, stage: etapa, stage_index: etapaIndex, entered_at: now, changed_by: "Miguel",
    });
    await db.from("captacion_leads").update({ crm_lead_id: crmLead.id }).eq("id", id);

    return NextResponse.json({ ok: true, crm_lead_id: crmLead.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
