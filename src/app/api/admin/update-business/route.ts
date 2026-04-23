import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyBusinessOwnership } from "@/lib/auth-helpers";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, multi_landing_enabled, module_vip_benefits, module_lead_magnet, module_whatsapp, module_tools, module_forms } = body;
    if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

    // Verify ownership
    const hasOwnership = await verifyBusinessOwnership(req, id);
    if (!hasOwnership) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Construir objeto de actualización solo con campos presentes
    const updateData: Record<string, unknown> = {};
    if (multi_landing_enabled !== undefined) updateData.multi_landing_enabled = multi_landing_enabled;
    if (module_vip_benefits !== undefined) updateData.module_vip_benefits = module_vip_benefits;
    if (module_lead_magnet !== undefined) updateData.module_lead_magnet = module_lead_magnet;
    if (module_whatsapp !== undefined) updateData.module_whatsapp = module_whatsapp;
    if (module_tools !== undefined) updateData.module_tools = module_tools;
    if (module_forms !== undefined) updateData.module_forms = module_forms;

    const { error } = await supabaseAdmin
      .from("businesses")
      .update(updateData)
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
