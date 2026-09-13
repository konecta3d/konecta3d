import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";
import { DEFAULT_GUIDED_PATH } from "@/lib/guided-path";

const KEY = "guided_path";

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

/** GET — público: devuelve la ruta guiada guardada, o la de por defecto. */
export async function GET() {
  try {
    const { data } = await db().from("settings").select("value").eq("key", KEY).maybeSingle();
    if (data?.value) {
      const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
      return NextResponse.json({ config: { ...DEFAULT_GUIDED_PATH, ...parsed } });
    }
    return NextResponse.json({ config: DEFAULT_GUIDED_PATH });
  } catch {
    return NextResponse.json({ config: DEFAULT_GUIDED_PATH });
  }
}

/** POST — solo admin: guarda la ruta guiada completa. */
export async function POST(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let config: unknown;
  try {
    ({ config } = await req.json());
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const { error } = await db().from("settings").upsert({ key: KEY, value: config }, { onConflict: "key" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
