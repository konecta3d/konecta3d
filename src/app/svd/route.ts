import { SVD_HTML } from "./pagina";

/**
 * GET /svd
 * Herramienta pública «Monta tu SVD» (Sistema de Ventas Definitivo + encuesta PERE).
 * Sin autenticación: se enlaza desde un recurso de valor / llavero.
 * La página se genera desde content/herramientas/svd/index.html (scripts/svd-generar.mjs).
 */
export const dynamic = "force-static";

export function GET(): Response {
  return new Response(SVD_HTML, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
