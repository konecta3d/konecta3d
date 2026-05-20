import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";

export async function POST(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const { email, newPassword } = body;

    if (!email?.trim()) {
      return NextResponse.json({ error: "El email es obligatorio" }, { status: 400 });
    }
    if (!newPassword?.trim() || newPassword.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Buscar el userId en la tabla businesses por contact_email
    // (más fiable que iterar listUsers, que tiene límites de paginación)
    const { data: bizData } = await supabaseAdmin
      .from("businesses")
      .select("user_id")
      .ilike("contact_email", email)
      .single();

    const userId = bizData?.user_id as string | null | undefined;

    if (userId) {
      // Cambia la contraseña directamente por ID
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "Contraseña actualizada", isNewUser: false });
    }

    // Fallback: el negocio existe en auth pero no tiene user_id en businesses
    // Intentar listUsers para buscarlo
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
    const targetUser = (listData?.users ?? []).find(
      (u) => (u.email || "").toLowerCase() === email.toLowerCase()
    );

    if (targetUser) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(targetUser.id, {
        password: newPassword,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "Contraseña actualizada", isNewUser: false });
    }

    // El usuario no existe en Auth — crearlo
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: newPassword,
      email_confirm: true,
    });
    if (createError) return NextResponse.json({ error: createError.message }, { status: 500 });
    return NextResponse.json({ success: true, message: "Usuario creado con contraseña", isNewUser: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
