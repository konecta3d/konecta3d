/**
 * POST /api/admin/update-business
 * Actualiza cualquier campo de un negocio. Solo accesible por admins.
 * Los campos "core" siempre existen en la DB.
 * Los campos "optional" se añaden con la migración SQL de setup-db.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminSession } from "@/lib/auth-helpers";

// Todas las columnas conocidas de businesses
const CORE_FIELDS = [
  "name", "sector", "contact_email", "phone", "slug",
  "module_lead_magnet", "module_vip_benefits", "module_whatsapp",
  "module_tools", "module_forms", "module_gpt",
  "module_ai_landing", "module_ai_recursos",
  "module_captacion",
];

// Columnas legacy / raramente usadas (se intentan pero no bloquean si fallan)
const OPTIONAL_FIELDS = [
  "profile_active", "landing_active",
  "multi_landing_enabled", "font_family",
];

export async function POST(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Construir update core (columnas garantizadas)
    const coreUpdate: Record<string, unknown> = {};
    for (const field of CORE_FIELDS) {
      if (fields[field] !== undefined) coreUpdate[field] = fields[field];
    }

    // Normalizar el email a minúsculas: debe coincidir con el email de Supabase
    // Auth (que siempre es minúsculas) o las consultas por contact_email fallan.
    if (typeof coreUpdate.contact_email === "string") {
      coreUpdate.contact_email = coreUpdate.contact_email.trim().toLowerCase();
    }

    // Construir update opcional (columnas post-migración)
    const optionalUpdate: Record<string, unknown> = {};
    for (const field of OPTIONAL_FIELDS) {
      if (fields[field] !== undefined) optionalUpdate[field] = fields[field];
    }

    // Ejecutar update core si hay campos
    if (Object.keys(coreUpdate).length > 0) {
      const { error } = await supabaseAdmin
        .from("businesses")
        .update(coreUpdate)
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Ejecutar update opcional (best-effort: si la columna no existe, se ignora el error)
    let optionalError: string | null = null;
    if (Object.keys(optionalUpdate).length > 0) {
      const { error } = await supabaseAdmin
        .from("businesses")
        .update(optionalUpdate)
        .eq("id", id);
      if (error) {
        // Solo reportar si NO es un error de columna inexistente
        if (!error.message.includes("does not exist") && !error.message.includes("column")) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        optionalError = "Algunas columnas requieren migración SQL. Ejecuta el SQL en Supabase.";
      }
    }

    return NextResponse.json({ ok: true, warning: optionalError });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
