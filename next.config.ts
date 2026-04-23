import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Paquetes que NO deben ser empaquetados por webpack — necesario para Puppeteer y Chromium en Vercel
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium-min"],

  images: {
    remotePatterns: [
      {
        // Supabase Storage — permite cargar imágenes de landing-assets, logos, etc.
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // Supabase Storage con dominio personalizado (por si se configura después)
        protocol: "https",
        hostname: "*.supabase.com",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
