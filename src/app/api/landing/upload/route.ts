import { createClient } from "@supabase/supabase-js";
import { verifyBusinessOwnership } from "@/lib/auth-helpers";

export async function POST(req: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const businessId = String(form.get("businessId") || "");

    if (!file) {
      return Response.json({ error: "Falta archivo" }, { status: 400 });
    }

    if (!businessId) {
      return Response.json({ error: "Falta businessId" }, { status: 400 });
    }

    // TODO: reactivar verificación de propiedad cuando pasemos token desde el cliente.
    // const hasOwnership = await verifyBusinessOwnership(req, businessId);
    // if (!hasOwnership) {
    //   return Response.json({ error: "No autorizado" }, { status: 403 });
    // }

    // Convertir archivo a base64 (para backwards compatibility)
    // TODO: Migrar a Supabase Storage en próxima fase
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const mimeType = file.type || "image/png";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Guardar directamente en la tabla businesses
    const { error: updateError } = await supabaseAdmin
      .from("businesses")
      .update({ logo_url: dataUrl })
      .eq("id", businessId);

    if (updateError) {
      console.error("Error guardando logo:", updateError);
      return Response.json({ error: "Error al guardar: " + updateError.message }, { status: 500 });
    }

    return Response.json({ url: dataUrl });

  } catch (e: any) {
    console.error("Upload error:", e);
    return Response.json({ error: e?.message || "Error desconocido" }, { status: 500 });
  }
}
