"use client";

import React, { useEffect } from "react";

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Aplica el tema guardado (o claro por defecto) en cuanto se monta.
  // Esta ruta (/business/*) no pasa por (app)/layout.tsx, así que
  // el tema hay que inicializarlo aquí.
  useEffect(() => {
    const saved = localStorage.getItem("konecta-theme-business");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      // Sin preferencia guardada → modo claro
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex min-h-screen">
        <div className="flex-1">
          <main className="p-4 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
