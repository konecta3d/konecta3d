import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** PUT /api/admin/crm/resources/[id] */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
    const db = adminClient();
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const k of ["nombre", "categoria", "para_perfil", "etapa_proceso", "usado_por", "contenido", "version"]) {
      if (k in body) update[k] = body[k] === "" ? null : body[k];
    }
    const { data, error } = await db.from("crm_resources").update(update).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ resource: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** DELETE /api/admin/crm/resources/[id] */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  try {
    const db = adminClient();
    const { error } = await db.from("crm_resources").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
