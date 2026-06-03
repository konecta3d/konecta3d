import type { MetadataRoute } from "next";

const BASE = "https://app.konecta3d.com";

/**
 * /robots.txt — Permite indexar la home pública y bloquea las áreas internas
 * (panel admin, panel de negocio, API). Apunta a /sitemap.xml.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api",
        "/login",
        "/business",
        "/negocio",
        "/mi-negocio",
        "/mi-contexto",
        "/captacion",
        "/dashboard",
        "/settings",
        "/formularios",
        "/acciones",
        "/lead-magnet",
        "/vip-benefits",
        "/landing",
        "/whatsapp-generator",
        "/gpt-fidelizacion",
        "/documents",
        "/test",
        "/debug",
      ],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
