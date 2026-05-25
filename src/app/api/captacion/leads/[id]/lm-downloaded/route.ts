import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * PATCH /api/captacion/leads/[id]/lm-downloaded
 *
 * Llamado desde el cliente cuando pulsa el CTA de descarga del lead magnet.
 * Sin autenticación — el ID del lead viene del formulario público.
 * Marca el lead como convertido y actualiza el contador del LM.
 */
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const db = supabaseAdmin();

  // Cargar el lead para obtener el lead_magnet_id
  const { data: lead, error: leadErr } = await db
    .from("captacion_leads")
    .select("id, lead_magnet_id, lm_status")
    .eq("id", id)
    .single();

  if (leadErr || !lead) {
    return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
  }

  // Idempotente: si ya está descargado, no hacer nada
  if (lead.lm_status === "downloaded") {
    return NextResponse.json({ ok: true, already: true });
  }

  // Actualizar el lead
  const { error: updateErr } = await db
    .from("captacion_leads")
    .update({
      lm_status: "downloaded",
      funnel_step: "lm_downloaded",
      lead_magnet_delivered: true,
      lead_magnet_delivered_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Incrementar delivered_count en el lead magnet (fire-and-forget)
  if (lead.lead_magnet_id) {
    db.from("captacion_lead_magnets")
      .select("delivered_count")
      .eq("id", lead.lead_magnet_id)
      .single()
      .then(({ data: lm }) => {
        if (lm) {
          db.from("captacion_lead_magnets")
            .update({ delivered_count: (lm.delivered_count ?? 0) + 1 })
            .eq("id", lead.lead_magnet_id!)
            .then(() => {});
        }
      });
  }

  return NextResponse.json({ ok: true });
}
