/**
 * POST /api/admin/setup-db
 * Devuelve el SQL necesario para añadir las columnas faltantes en la tabla businesses.
 * El admin debe ejecutarlo manualmente en el SQL Editor de Supabase.
 * También comprueba qué columnas existen actualmente.
 */
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";

const REQUIRED_COLUMNS = [
  { name: "profile_active",       sql: "BOOLEAN DEFAULT TRUE" },
  { name: "landing_active",       sql: "BOOLEAN DEFAULT TRUE" },
  { name: "module_tools",         sql: "BOOLEAN DEFAULT TRUE" },
  { name: "module_forms",         sql: "BOOLEAN DEFAULT FALSE" },
  { name: "module_gpt",           sql: "BOOLEAN DEFAULT FALSE" },
  { name: "module_ai_landing",    sql: "BOOLEAN DEFAULT FALSE" },
  { name: "module_ai_recursos",   sql: "BOOLEAN DEFAULT FALSE" },
  { name: "multi_landing_enabled",sql: "BOOLEAN DEFAULT FALSE" },
  { name: "font_family",          sql: "TEXT" },
];

export async function GET(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Detectar qué columnas faltan probando un SELECT
  const missing: string[] = [];
  for (const col of REQUIRED_COLUMNS) {
    const { error } = await supabaseAdmin
      .from("businesses")
      .select(col.name)
      .limit(1);
    if (error?.message?.includes("does not exist") || error?.message?.includes("column")) {
      missing.push(col.name);
    }
  }

  const migrationSQL = missing.length > 0
    ? `-- Ejecuta este SQL en Supabase Dashboard → SQL Editor\n` +
      missing
        .map(name => {
          const col = REQUIRED_COLUMNS.find(c => c.name === name)!;
          return `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS ${col.name} ${col.sql};`;
        })
        .join("\n")
    : null;

  return NextResponse.json({
    ok: true,
    missingColumns: missing,
    needsMigration: missing.length > 0,
    migrationSQL,
  });
}
