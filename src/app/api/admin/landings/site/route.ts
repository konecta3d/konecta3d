import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";
import { DEFAULT_SITE } from "@/lib/landing/site";

const KEY = "landing_site_config";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** GET — config compartida del sitio (cabecera/pie/menú). Solo admin. */
export async function GET(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const db = adminClient();
    const { data } = await db.from("settings").select("value").eq("key", KEY).single();
    if (!data?.value) return NextResponse.json({ site: DEFAULT_SITE });
    const saved = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
    return NextResponse.json({ site: { ...DEFAULT_SITE, ...saved } });
  } catch {
    return NextResponse.json({ site: DEFAULT_SITE });
  }
}

/** PUT — guarda la config del sitio. Solo admin. */
export async function PUT(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const { site } = await req.json();
    const db = adminClient();
    const { error } = await db.from("settings").upsert({ key: KEY, value: site }, { onConflict: "key" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
