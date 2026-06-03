import type { MetadataRoute } from "next";

const BASE = "https://app.konecta3d.com";

/**
 * /sitemap.xml — Páginas públicas que Google debe indexar.
 * Por ahora solo la home; añadir aquí futuras páginas públicas (marketing).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
