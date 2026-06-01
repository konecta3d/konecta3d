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
 * GET /api/admin/crm/tasks
 * Lista tareas con datos del lead vinculado. Opcional ?asignado= y ?pendientes=1
 */
export async function GET(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const asignado = searchParams.get("asignado");
  const pendientes = searchParams.get("pendientes");

  try {
    const db = adminClient();
    let q = db
      .from("crm_tasks")
      .select("*, crm_leads(id, nombre, empresa)")
      .order("fecha", { ascending: true });

    if (asignado) q = q.eq("asignado_a", asignado);
    if (pendientes === "1") q = q.eq("completada", false);

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ tasks: data ?? [] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST /api/admin/crm/tasks
 */
export async function POST(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.titulo || !String(body.titulo).trim()) {
      return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
    }

    const db = adminClient();
    const { data, error } = await db
      .from("crm_tasks")
      .insert({
        lead_id:    body.lead_id || null,
        titulo:     String(body.titulo).trim(),
        tipo:       body.tipo ?? null,
        asignado_a: body.asignado_a ?? null,
        fecha:      body.fecha || null,
        notas:      body.notas ?? null,
      })
      .select("*, crm_leads(id, nombre, empresa)")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ task: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
