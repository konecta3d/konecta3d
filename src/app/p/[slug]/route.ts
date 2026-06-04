import { createClient } from "@supabase/supabase-js";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * GET /p/[slug]
 * Sirve una landing de presentación como HTML autónomo (el código tal cual lo
 * guardó el admin). No pasa por el layout de la app: control total del diseño.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const db = adminClient();
    const { data } = await db
      .from("landing_pages")
      .select("html, published")
      .eq("slug", slug)
      .single();

    if (!data || !data.published || !data.html) {
      return new Response(notFoundHtml(), {
        status: 404,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    return new Response(data.html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        // Cache breve en el edge; permite actualizar el contenido sin esperar.
        "cache-control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch {
    return new Response(notFoundHtml(), {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
}

function notFoundHtml() {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Página no encontrada</title>
<style>body{margin:0;font-family:system-ui,sans-serif;background:#0a2422;color:#fff;
min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px}
h1{font-size:22px;margin:0 0 8px}p{color:rgba(255,255,255,.6);font-size:14px;margin:0}</style>
</head><body><div><h1>Página no encontrada</h1><p>Este enlace no existe o ya no está disponible.</p></div></body></html>`;
}
