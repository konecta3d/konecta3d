import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { DEFAULT_LOGIN_CONFIG } from "@/lib/login-page-config";

/**
 * GET /api/login-page-config
 * Pública — no requiere auth. Devuelve la config de la página de login.
 * La lee con service role para saltarse RLS en settings.
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
      .eq("key", "login_page_config")
      .single();

    if (!data?.value) {
      return NextResponse.json({ config: DEFAULT_LOGIN_CONFIG });
    }

    const saved =
      typeof data.value === "string" ? JSON.parse(data.value) : data.value;

    return NextResponse.json({
      config: { ...DEFAULT_LOGIN_CONFIG, ...saved },
    });
  } catch {
    return NextResponse.json({ config: DEFAULT_LOGIN_CONFIG });
  }
}
