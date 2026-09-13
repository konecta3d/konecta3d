"use client";

/**
 * Barra de "modo desarrollador": cuando el admin entra en un negocio, se ve en
 * todas las pantallas del panel qué negocio está editando y un botón para salir.
 */

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getImpersonatedBusinessId, clearImpersonation } from "@/lib/active-business";

export default function ImpersonationBanner() {
  const [bizId, setBizId] = useState<string | null>(null);
  const [name, setName] = useState<string>("");

  useEffect(() => {
    const id = getImpersonatedBusinessId();
    setBizId(id);
    if (!id) return;
    supabase.from("businesses").select("name").eq("id", id).maybeSingle().then(({ data }) => {
      if (data?.name) setName(data.name);
    });
  }, []);

  if (!bizId) return null;

  const exit = () => {
    clearImpersonation();
    window.location.href = "/admin/businesses";
  };

  return (
    <div
      className="w-full flex items-center justify-between gap-3 px-4 py-2 text-xs font-medium"
      style={{ background: "rgba(99,102,241,0.15)", borderBottom: "1px solid rgba(99,102,241,0.35)", color: "#6366f1" }}
    >
      <span className="flex items-center gap-2 min-w-0">
        <span className="flex-shrink-0">🛠️</span>
        <span className="truncate">
          Modo desarrollador — estás editando como <b>{name || "este negocio"}</b>. Los cambios se guardan en su cuenta.
        </span>
      </span>
      <button
        type="button"
        onClick={exit}
        className="flex-shrink-0 px-3 py-1 rounded-lg font-semibold"
        style={{ background: "#6366f1", color: "#fff" }}
      >
        Salir
      </button>
    </div>
  );
}
