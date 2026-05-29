import { createClient } from "@supabase/supabase-js";
import { verifyAdminSession } from "@/lib/auth-helpers";

/**
 * POST /api/admin/upload
 * Sube una imagen al bucket landing-assets desde el panel admin.
 * FormData: { file, kind }  — kind: "onboarding-hero" | "onboarding-logo" | etc.
 */
export async function POST(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const kind = String(form.get("kind") || "onboarding");

    if (!file) {
      return Response.json({ error: "Falta archivo" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ error: "Tipo no permitido. Usa JPG, PNG, WebP o SVG." }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return Response.json({ error: "Archivo demasiado grande. Máximo 5 MB." }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const filename = `${kind}/${Date.now()}.${ext}`;
    const bytes = await file.arrayBuffer();

    const { error: uploadError } = await supabaseAdmin.storage
      .from("landing-assets")
      .upload(filename, Buffer.from(bytes), { contentType: file.type, upsert: true });

    if (uploadError) {
      return Response.json({ error: "Error al subir: " + uploadError.message }, { status: 500 });
    }

    const { data } = supabaseAdmin.storage.from("landing-assets").getPublicUrl(filename);
    return Response.json({ url: data.publicUrl });

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return Response.json({ error: msg }, { status: 500 });
  }
}
