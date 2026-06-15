import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const ESTADOS = ["agendada", "hecha", "no_asistio", "cancelada"];

/**
 * PATCH /api/admin/crm/citas/[id]
 * Actualiza el estado de la cita (hecha / no_asistio / cancelada) o la reubica.
 * Body: { estado? , agente?, inicio?, notas? }
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.estado !== undefined) {
      if (!ESTADOS.includes(body.estado)) {
        return NextResponse.json({ error: "Estado no válido" }, { status: 400 });
      }
      update.estado = body.estado;
    }
    if (body.agente !== undefined) update.agente = body.agente;
    if (body.inicio !== undefined) update.inicio = body.inicio;
    if (body.notas !== undefined) update.notas = body.notas;

    const db = adminClient();
    const { data, error } = await db
      .from("crm_citas")
      .update(update)
      .eq("id", id)
      .select("id, agente, inicio, duracion_min, canal, estado, notas")
      .single();

    if (error) {
      const status = error.code === "23505" ? 409 : 500;
      const msg = status === 409 ? "Ese hueco ya está ocupado" : error.message;
      return NextResponse.json({ error: msg }, { status });
    }
    return NextResponse.json({ cita: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/crm/citas/[id]
 * Libera el hueco (cancelación suave: estado = cancelada). El lead se conserva.
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  try {
    const db = adminClient();
    const { error } = await db
      .from("crm_citas")
      .update({ estado: "cancelada", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
