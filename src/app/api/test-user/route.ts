import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Get user by email
    const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
    const user = usersList.users.find(u => u.email?.toLowerCase() === email?.toLowerCase());
    
    if (!user) {
      return NextResponse.json({ error: "User not found in Auth" }, { status: 404 });
    }

    // Get business by email
    const { data: business } = await supabaseAdmin
      .from("businesses")
      .select("id, name, contact_email, user_id, public_id")
      .eq("contact_email", email)
      .single();

    return NextResponse.json({ 
      user: { id: user.id, email: user.email },
      business: business
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
