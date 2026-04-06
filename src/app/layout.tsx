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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            try {
              let t = localStorage.getItem('konecta-theme');
              // Default to dark mode if not set
              if (!t) {
                t = 'dark';
                localStorage.setItem('konecta-theme', 'dark');
              }
              if (t === 'dark') document.documentElement.classList.add('dark');

              const light = JSON.parse(localStorage.getItem('konecta-theme-light') || 'null');
              const dark = JSON.parse(localStorage.getItem('konecta-theme-dark') || 'null');
              const current = t === 'dark' ? dark : light;
              if (current) {
                document.documentElement.style.setProperty('--background', current.background);
                document.documentElement.style.setProperty('--card', current.card);
                document.documentElement.style.setProperty('--foreground', current.foreground);
                document.documentElement.style.setProperty('--brand-4', current.button);
                document.documentElement.style.setProperty('--brand-1', current.muted);
                document.documentElement.style.setProperty('--brightness', current.brightness + '%');
              }

              const titleColor = localStorage.getItem('konecta-sidebar-title-color');
              const titleSize = localStorage.getItem('konecta-sidebar-title-size');
              if (titleColor) document.documentElement.style.setProperty('--sidebar-title-color', titleColor);
              if (titleSize) document.documentElement.style.setProperty('--sidebar-title-size', titleSize);
            } catch (e) {}
          `}
        </Script>
      </head>
      <body className={`${outfit.variable} antialiased`}>{children}</body>
    </html>
  );
}
