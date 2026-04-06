import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

export async function POST(req: Request) {
  try {
    // Verify user is authenticated
    const session = await getAuthenticatedUser(req);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword?.trim()) {
      return NextResponse.json({ error: "La contraseña actual es obligatoria" }, { status: 400 });
    }
    if (!newPassword?.trim()) {
      return NextResponse.json({ error: "La nueva contraseña es obligatoria" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    // Create client with user's token to verify current password
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    userClient.auth.setSession({ access_token: token, refresh_token: "" });

    // First verify the current password by trying to sign in
    const { data: userData, error: signInError } = await userClient.auth.getUser();
    if (signInError || !userData?.user) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }

    // Verify current password by attempting sign in with the old password
    const { error: verifyError } = await userClient.auth.signInWithPassword({
      email: userData.user.email || "",
      password: currentPassword,
    });

    if (verifyError) {
      return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 401 });
    }

    // Now update to the new password using admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userData.user.id,
      { password: newPassword }
    );

    if (updateError) {
      return NextResponse.json({ error: "Error al cambiar contraseña: " + updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Contraseña cambiada correctamente"
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error desconocido" }, { status: 500 });
  }
}
