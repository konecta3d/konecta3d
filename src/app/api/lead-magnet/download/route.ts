import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/lead-magnet/download?id=<leadMagnetId>
 *
 * Endpoint público — no requiere autenticación.
 * Redirige al pdf_url almacenado del recurso de valor.
 * Usado por la landing pública cuando un CTA tiene un leadMagnetId asociado.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Falta el parámetro id", { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: lm, error } = await supabase
    .from("lead_magnets")
    .select("id, title, pdf_url, active")
    .eq("id", id)
    .single();

  if (error || !lm) {
    return new Response("Recurso no encontrado", { status: 404 });
  }

  if (!lm.active) {
    return new Response("Recurso no disponible", { status: 410 });
  }

  if (!lm.pdf_url) {
    return new Response("Este recurso aún no tiene PDF generado", { status: 404 });
  }

  // Redirigir al PDF con cabecera de descarga
  return Response.redirect(lm.pdf_url, 302);
}
