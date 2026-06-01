import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** GET /api/admin/crm/resources */
export async function GET(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const db = adminClient();
    const { data, error } = await db
      .from("crm_resources").select("*").order("categoria").order("nombre");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ resources: data ?? [] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** POST /api/admin/crm/resources */
export async function POST(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.nombre || !String(body.nombre).trim()) {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }
    const db = adminClient();
    const { data, error } = await db.from("crm_resources").insert({
      nombre:        String(body.nombre).trim(),
      categoria:     body.categoria ?? null,
      para_perfil:   body.para_perfil ?? null,
      etapa_proceso: body.etapa_proceso ?? null,
      usado_por:     body.usado_por ?? null,
      contenido:     body.contenido ?? null,
      version:       body.version ?? "1.0",
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ resource: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
