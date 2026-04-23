import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Verify admin session via Authorization header
    const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: userData } = await anonClient.auth.getUser(token);
    const adminEmail = (userData?.user?.email || "").toLowerCase();

    if (!adminEmail || adminEmail !== "info@konecta3d.com") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
const { email, businessId, newPassword } = body;

    if (!email?.trim()) {
      return NextResponse.json({ error: "El email es obligatorio" }, { status: 400 });
    }
    if (!newPassword?.trim()) {
      return NextResponse.json({ error: "La contraseña es obligatoria" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Buscar usuario por email (compatibilidad SDK)
    const { data: listData, error: userError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    const targetUser = listData?.users?.find(
      (u) => (u.email || "").toLowerCase() === email.toLowerCase()
    );

    if (targetUser) {
      // User exists, update password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        targetUser.id,
        { password: newPassword }
      );

      if (updateError) {
        return NextResponse.json({ error: "Error al actualizar contraseña: " + updateError.message }, { status: 500 });
      }

// Nota: la contraseña NO se persiste en la base de datos por seguridad.

      return NextResponse.json({
        success: true,
        message: "Contraseña actualizada correctamente",
        isNewUser: false
      });
    } else {
      // User doesn't exist, create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: newPassword,
        email_confirm: true,
      });

      if (createError) {
        return NextResponse.json({ error: "Error al crear usuario: " + createError.message }, { status: 500 });
      }

// Nota: la contraseña NO se persiste en la base de datos por seguridad.
      return NextResponse.json({
        success: true,
        message: "Usuario creado con contraseña",
        isNewUser: true
      });
    }

  } catch (err: any) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: err.message || "Error desconocido" }, { status: 500 });
  }
}
