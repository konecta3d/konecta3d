/**
 * GET /api/admin/check-columns
 * Comprueba qué columnas de módulos existen en la tabla businesses.
 * Devuelve { columns: Record<string, boolean> } — true = existe.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminSession } from "@/lib/auth-helpers";

const MODULE_COLUMNS = [
  "module_lead_magnet",
  "module_vip_benefits",
  "module_whatsapp",
  "module_tools",
  "module_forms",
  "module_gpt",
  "module_ai_landing",
  "module_ai_recursos",
  "module_captacion",
];

export async function GET(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const results: Record<string, boolean> = {};

  await Promise.all(
    MODULE_COLUMNS.map(async (col) => {
      const { error } = await db
        .from("businesses")
        .select(col)
        .limit(0);
      // Si la columna no existe, Supabase devuelve un error con "does not exist"
      results[col] = !error || (!error.message.includes("does not exist") && !error.message.includes("column"));
    })
  );

  return NextResponse.json({ columns: results });
}
