import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";
import { DEFAULT_CLIENT_PROFILE } from "@/lib/crm/client-profile";

const KEY = "crm_client_profile";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** GET — devuelve el perfil guardado o el de por defecto. Solo admin. */
export async function GET(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const db = adminClient();
    const { data } = await db.from("settings").select("value").eq("key", KEY).single();
    if (data?.value) {
      const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
      return NextResponse.json({ profile: { ...DEFAULT_CLIENT_PROFILE, ...parsed } });
    }
    return NextResponse.json({ profile: DEFAULT_CLIENT_PROFILE });
  } catch {
    return NextResponse.json({ profile: DEFAULT_CLIENT_PROFILE });
  }
}

/** POST — guarda el perfil completo. Solo admin. */
export async function POST(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { profile } = await req.json();
    const db = adminClient();
    const { error } = await db.from("settings").upsert({ key: KEY, value: profile }, { onConflict: "key" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** DELETE — restaura a valores por defecto. Solo admin. */
export async function DELETE(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const db = adminClient();
    await db.from("settings").delete().eq("key", KEY);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
