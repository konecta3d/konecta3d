import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminSession } from "@/lib/auth-helpers";

export async function POST(req: Request) {
  try {
    const { isAdmin, userId: adminId } = await verifyAdminSession(req);
    if (!isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, password } = body;
    if (!userId || !password) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Only admin can update other users, or user can update themselves
    if (userId !== adminId) {
      // Verify target user is a business owner
      const { data: business } = await supabaseAdmin
        .from("businesses")
        .select("user_id")
        .eq("user_id", userId)
        .single();

      if (!business) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
      }
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
