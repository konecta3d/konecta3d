import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";

const SETTINGS_KEY = "help_drawer_enabled";

/**
 * GET /api/admin/help-drawer
 * Devuelve si el botón de ayuda está habilitado para los negocios.
 * Público — lo lee el layout en cada carga.
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
      .eq("key", SETTINGS_KEY)
      .single();

    if (!data?.value) return NextResponse.json({ enabled: true });

    const parsed =
      typeof data.value === "string" ? JSON.parse(data.value) : data.value;

    return NextResponse.json({ enabled: parsed.enabled ?? true });
  } catch {
    // En caso de error, habilitado por defecto
    return NextResponse.json({ enabled: true });
  }
}

/**
 * POST /api/admin/help-drawer
 * Guarda si el botón de ayuda está habilitado o no.
 * Solo admin.
 */
export async function POST(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { enabled } = await req.json();

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await db
      .from("settings")
      .upsert(
        { key: SETTINGS_KEY, value: { enabled: Boolean(enabled) } },
        { onConflict: "key" }
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
