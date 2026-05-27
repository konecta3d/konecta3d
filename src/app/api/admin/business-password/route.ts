import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";

// POST /api/admin/business-password
// Body: { businessId, password }
// Guarda la contraseña en last_onboarding_password para que el editor
// pueda mostrarla al seleccionar el negocio.
// NO modifica Supabase Auth — solo actualiza el campo de referencia.
export async function POST(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { businessId, password } = await req.json();

    if (!businessId) {
      return NextResponse.json({ error: "Falta businessId" }, { status: 400 });
    }
    if (!password || password.length < 1) {
      return NextResponse.json({ error: "Falta contraseña" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin
      .from("businesses")
      .update({ last_onboarding_password: password })
      .eq("id", businessId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
