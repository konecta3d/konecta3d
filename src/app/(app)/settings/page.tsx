"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("konecta-theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setDark(true);
    }
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("konecta-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("konecta-theme", "light");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Configuración</h1>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-base font-semibold">Modo visual</h2>
        <p className="mt-1 text-sm text-[var(--brand-1)]">
          Cambia entre modo claro y oscuro.
        </p>
        <button
          onClick={toggle}
          className="mt-4 rounded-lg border border-[var(--border)] px-4 py-2"
        >
          {dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        </button>
      </div>
    </div>
  );
}
