import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";
import { HELP_CONTENT } from "@/lib/help-content";

const KEY = "help_content";

/**
 * GET /api/admin/help-content
 * Público — devuelve el contenido personalizado si existe,
 * o el contenido por defecto si no hay nada guardado.
 */
export async function GET() {
  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data } = await db
      .from("settings")
      .select("value")
      .eq("key", KEY)
      .single();

    if (data?.value) {
      const parsed =
        typeof data.value === "string" ? JSON.parse(data.value) : data.value;
      // Fusiona con los defaults para que secciones nuevas aparezcan aunque
      // no estén en el contenido guardado.
      return NextResponse.json({ content: { ...HELP_CONTENT, ...parsed } });
    }

    return NextResponse.json({ content: HELP_CONTENT });
  } catch {
    return NextResponse.json({ content: HELP_CONTENT });
  }
}

/**
 * POST /api/admin/help-content
 * Solo admin — guarda el contenido personalizado completo.
 */
export async function POST(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { content } = await req.json();

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await db
      .from("settings")
      .upsert({ key: KEY, value: content }, { onConflict: "key" });

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/help-content
 * Solo admin — restaura el contenido a los valores por defecto
 * eliminando la entrada de la base de datos.
 */
export async function DELETE(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await db.from("settings").delete().eq("key", KEY);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
