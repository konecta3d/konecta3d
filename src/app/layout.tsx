import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Konecta3D Platform",
  description: "Herramientas de fidelización post-compra",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.ico",
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
