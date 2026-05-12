/**
 * DELETE /api/admin/delete-business
 * Elimina un negocio y su usuario de Supabase Auth.
 * Solo accesible por admins.
 */
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";

export async function DELETE(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Obtener el user_id del negocio antes de borrarlo
  const { data: biz } = await supabaseAdmin
    .from("businesses")
    .select("user_id, contact_email")
    .eq("id", id)
    .single();

  // Eliminar el negocio (CASCADE borra datos relacionados si están configurados)
  const { error: bizError } = await supabaseAdmin
    .from("businesses")
    .delete()
    .eq("id", id);

  if (bizError) {
    return NextResponse.json({ error: bizError.message }, { status: 500 });
  }

  // Intentar eliminar el usuario de Auth si existe
  if (biz?.user_id) {
    await supabaseAdmin.auth.admin.deleteUser(biz.user_id);
  }

  return NextResponse.json({ ok: true });
}
