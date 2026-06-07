import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";
import { DEFAULT_AI_BRAIN } from "@/lib/landing/ai-brain";

const KEY = "landing_ai_brain";

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

/** GET — cerebro (voz/posicionamiento/ejemplos) del generador de landings. Solo admin. */
export async function GET(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const db = adminClient();
    const { data } = await db.from("settings").select("value").eq("key", KEY).single();
    if (!data?.value) return NextResponse.json({ brain: DEFAULT_AI_BRAIN });
    const saved = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
    return NextResponse.json({ brain: { ...DEFAULT_AI_BRAIN, ...saved } });
  } catch {
    return NextResponse.json({ brain: DEFAULT_AI_BRAIN });
  }
}

/** PUT — guarda el cerebro. Solo admin. */
export async function PUT(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const { brain } = await req.json();
    const db = adminClient();
    const { error } = await db.from("settings").upsert({ key: KEY, value: brain }, { onConflict: "key" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** DELETE — restaura los valores por defecto. */
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
