import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";

export async function POST(req: Request) {
  try {
    // Verify admin authentication
    const { isAdmin, userId } = await verifyAdminSession(req);
    if (!isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { email, newPassword } = body;

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

    // Use getUserByEmail instead of listing all users
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserByEmail(email);

    if (userData?.user) {
      // User exists, update password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userData.user.id,
        { password: newPassword }
      );

      if (updateError) {
        return NextResponse.json({ error: "Error al actualizar contraseña: " + updateError.message }, { status: 500 });
      }

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
