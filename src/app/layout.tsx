import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://app.konecta3d.com"),
  title: {
    default: "Konecta3D — Presencia digital y captación de leads para negocios locales",
    template: "%s | Konecta3D",
  },
  description:
    "Konecta3D convierte cada contacto en un cliente: presencia digital, captación de leads y fidelización para negocios locales, activado con un llavero NFC.",
  keywords: [
    "Konecta3D",
    "llavero NFC",
    "captación de leads",
    "presencia digital",
    "negocios locales",
    "marketing para ferias",
    "fidelización de clientes",
  ],
  applicationName: "Konecta3D",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://app.konecta3d.com",
    siteName: "Konecta3D",
    title: "Konecta3D — Presencia digital y captación de leads",
    description:
      "Convierte cada contacto en un cliente. Presencia digital, captación de leads y fidelización para negocios locales, activado con un llavero NFC.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.ico",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            try {
              // Leer preferencia guardada — las mismas claves que usa layout.tsx
              // Prioridad: business > admin. Defecto: modo claro.
              var bizTheme   = localStorage.getItem('konecta-theme-business');
              var adminTheme = localStorage.getItem('konecta-theme-admin');
              var saved = bizTheme || adminTheme;

              if (saved === 'dark') {
                document.documentElement.classList.add('dark');
              }
              // Si no hay preferencia guardada → modo claro (sin clase dark)

              var titleColor = localStorage.getItem('konecta-sidebar-title-color');
              var titleSize  = localStorage.getItem('konecta-sidebar-title-size');
              if (titleColor) document.documentElement.style.setProperty('--sidebar-title-color', titleColor);
              if (titleSize)  document.documentElement.style.setProperty('--sidebar-title-size', titleSize);
            } catch (e) {}
          `}
        </Script>
      </head>
      <body className={`${outfit.variable} antialiased`}>{children}</body>
    </html>
  );
}
