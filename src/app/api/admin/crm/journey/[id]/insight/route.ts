import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** POST — añade un insight a un negocio en seguimiento. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;

  try {
    const body = await req.json();
    if (!body.tipo) return NextResponse.json({ error: "tipo es obligatorio" }, { status: 400 });
    const db = adminClient();
    const { data, error } = await db
      .from("crm_journey_insights")
      .insert({
        journey_id: id,
        etapa_id: body.etapa_id ?? null,
        tipo: body.tipo,
        contenido: body.contenido ?? null,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ insight: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** DELETE — borra un insight (?insightId=...). */
export async function DELETE(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const insightId = searchParams.get("insightId");
  if (!insightId) return NextResponse.json({ error: "insightId requerido" }, { status: 400 });

  try {
    const db = adminClient();
    const { error } = await db.from("crm_journey_insights").delete().eq("id", insightId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
