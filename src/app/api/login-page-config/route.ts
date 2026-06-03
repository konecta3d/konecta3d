import { NextResponse } from "next/server";
import { getLoginPageConfig } from "@/lib/login-page-config.server";

/**
 * GET /api/login-page-config
 * Pública — no requiere auth. Devuelve la config de la página de login.
 * (La página raíz ya la carga server-side; este endpoint queda para el
 * editor/preview del admin.)
 */
export async function GET() {
  const config = await getLoginPageConfig();
  return NextResponse.json({ config });
}
