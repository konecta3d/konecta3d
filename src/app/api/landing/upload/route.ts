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
    const kind = String(form.get("kind") || "logo"); // "logo" | "bg" | etc.

    if (!file) {
      return Response.json({ error: "Falta archivo" }, { status: 400 });
    }
    if (!businessId) {
      return Response.json({ error: "Falta businessId" }, { status: 400 });
    }

    // Verificar propiedad del negocio
    const hasOwnership = await verifyBusinessOwnership(req, businessId);
    if (!hasOwnership) {
      return Response.json({ error: "No autorizado" }, { status: 403 });
    }

    // Validar tipo y tamaño de archivo
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ error: "Tipo de archivo no permitido. Usa JPG, PNG, WebP o SVG." }, { status: 400 });
    }
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      return Response.json({ error: "Archivo demasiado grande. Máximo 5MB." }, { status: 400 });
    }

    // Subir a Supabase Storage (bucket: landing-assets)
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const filename = `${kind}/${businessId}/${Date.now()}.${ext}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("landing-assets")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Error subiendo a Storage:", uploadError);
      return Response.json({ error: "Error al subir imagen: " + uploadError.message }, { status: 500 });
    }

    const { data } = supabaseAdmin.storage.from("landing-assets").getPublicUrl(filename);
    const publicUrl = data.publicUrl;

    // Si es un logo, actualizar también la tabla businesses
    if (kind === "logo") {
      await supabaseAdmin
        .from("businesses")
        .update({ logo_url: publicUrl })
        .eq("id", businessId);
    }

    return Response.json({ url: publicUrl });

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    console.error("Upload error:", e);
    return Response.json({ error: msg }, { status: 500 });
  }
}
