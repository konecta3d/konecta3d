import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * GET /r/[id]
 * Ruta pública de redirección para Lead Magnets de captación.
 * - PDF  → redirige a file_url (Supabase Storage)
 * - URL  → redirige a external_url
 * Sin autenticación: el negocio puede compartir este enlace externamente.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: lm, error } = await supabase
    .from("captacion_lead_magnets")
    .select("type, file_url, external_url, status, title")
    .eq("id", id)
    .single();

  if (error || !lm || lm.status === "archived") {
    return new NextResponse(
      `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Recurso no encontrado</title>
      <style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0b;color:#fff}
      .box{text-align:center;padding:2rem}.h1{font-size:2rem;font-weight:900;margin-bottom:1rem}
      .p{color:rgba(255,255,255,0.5);font-size:1rem}</style></head>
      <body><div class="box"><div class="h1">404</div><p class="p">Este recurso no está disponible.</p></div></body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const destination = lm.type === "pdf" ? lm.file_url : lm.external_url;

  if (!destination) {
    return new NextResponse(
      `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Recurso no disponible</title>
      <style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0b;color:#fff}
      .box{text-align:center;padding:2rem}.h1{font-size:1.5rem;font-weight:700;margin-bottom:0.75rem}
      .p{color:rgba(255,255,255,0.5);font-size:0.9rem}</style></head>
      <body><div class="box"><div class="h1">Recurso no disponible aún</div>
      <p class="p">El negocio está preparando este recurso. Vuelve en breve.</p></div></body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // Asegurar protocolo en URLs externas
  let finalUrl = destination;
  if (lm.type === "url" && !destination.startsWith("http://") && !destination.startsWith("https://")) {
    finalUrl = "https://" + destination;
  }

  return NextResponse.redirect(finalUrl, { status: 302 });
}
