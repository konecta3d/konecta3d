import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyBusinessOwnership } from "@/lib/auth-helpers";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { businessId, slug, config } = body;
    if (!businessId || !config) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // If businessId is actually a public_id, resolve to uuid
    if (typeof businessId === "string" && businessId.startsWith("K3D-")) {
      const { data: biz } = await supabaseAdmin
        .from("businesses")
        .select("id")
        .eq("public_id", businessId)
        .single();
      if (!biz) return NextResponse.json({ error: "business_not_found" }, { status: 404 });
      businessId = biz.id;
    }

    // TODO: reactivar verificación de propiedad cuando el cliente envíe token.
    // const hasOwnership = await verifyBusinessOwnership(req, businessId);
    // if (!hasOwnership) {
    //   return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    // }

    // Ensure slug
    if (slug) {
      await supabaseAdmin.from("businesses").update({ slug }).eq("id", businessId);
    }

    const { error } = await supabaseAdmin.from("landing_configs").upsert({
      business_id: businessId,
      config,
      updated_at: new Date().toISOString(),
    }, { onConflict: "business_id" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
