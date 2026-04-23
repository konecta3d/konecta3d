"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function SelectProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [businessId, setBusinessId] = useState("");

  useEffect(() => {
  const load = async () => {
    const paramId = searchParams.get("businessId");
    const fromAdmin = searchParams.get("fromAdmin");
    if (paramId) {
      setBusinessId(paramId);
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const userEmail = sessionData?.session?.user?.email || "";
    if (!userEmail) { setBusinessId(""); return; }
    const { data: biz } = await supabase
      .from("businesses")
      .select("id")
      .eq("contact_email", userEmail)
      .single();
    const id = biz?.id || "";
    setBusinessId(id);
  };
  load();
}, [searchParams]);

  const selectProfile = async (profile: "fidelizacion" | "captacion") => {
    if (!businessId) return;

    await supabase
      .from("businesses")
      .update({ active_profile: profile })
      .eq("id", businessId);

    if (profile === "fidelizacion") {
      router.push(`/dashboard?businessId=${businessId}`);
      return;
    }

    router.push(`/dashboard?businessId=${businessId}`);
  };
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Selecciona tu perfil</h1>
          <p className="text-sm text-white">
            Elige el tipo de estrategia con la que quieres trabajar hoy
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fidelización */}
          <button
            type="button"
            onClick={() => selectProfile("fidelizacion")}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 hover:bg-white/5 transition-colors text-left"
          >
            <div className="h-40 rounded-lg bg-[var(--background)] mb-4 flex items-center justify-center text-white text-sm">
              Imagen de fidelización
            </div>
            <h2 className="text-xl font-semibold">Fidelización</h2>
            <p className="text-sm text-white mt-2">
              Mejora la experiencia post-compra, fideliza clientes y aumenta la recurrencia.
            </p>
          </button>

          {/* Captación */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 opacity-70">
            <div className="h-40 rounded-lg bg-[var(--background)] mb-4 flex items-center justify-center text-white text-sm">
              Próxima apertura
            </div>
            <h2 className="text-xl font-semibold">Captación</h2>
            <p className="text-sm text-white mt-2">
              Aún en desarrollo. Próxima apertura.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SelectProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm">Cargando...</div>}>
      <SelectProfileContent />
    </Suspense>
  );
}
