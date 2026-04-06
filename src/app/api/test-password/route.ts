import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";

export async function POST(req: Request) {
  // Verify admin authentication
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const email = body.email;
  const password = body.password;

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Use getUserByEmail instead of listing all users
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserByEmail(email);

    if (userData?.user) {
      const newPassword = password || "Test1234!";
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userData.user.id,
        { password: newPassword }
      );

      if (updateError) {
        return NextResponse.json({ error: "Update error: " + updateError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Password updated for " + email,
        userId: userData.user.id
      });
    } else {
      const newPassword = password || "Test1234!";
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: newPassword,
        email_confirm: true,
      });

      if (createError) {
        return NextResponse.json({ error: "Create error: " + createError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "User created with password",
        userId: newUser?.user?.id
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
