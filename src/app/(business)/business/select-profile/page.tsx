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

  const selectProfile = async (profile: "negocio" | "fidelizacion" | "captacion") => {
    if (!businessId) return;
    if (typeof window !== "undefined") {
      localStorage.setItem("konecta-business-id", businessId);
      const fromAdmin = searchParams.get("fromAdmin");
      if (fromAdmin) localStorage.setItem("konecta-from-admin-business", "true");
    }
    if (profile === "captacion") {
      router.push("/captacion");
    } else if (profile === "negocio") {
      router.push("/negocio/perfil");
    } else {
      router.push("/mi-negocio/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl space-y-6">

        {/* Título */}
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold text-white">Selecciona tu perfil</h1>
          <p className="text-sm text-white/60 mt-1">
            Elige el área con la que quieres trabajar hoy
          </p>
        </div>

        {/* Card superior: Perfil de Negocio */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => selectProfile("negocio")}
            className="group w-full max-w-sm rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-[0.99]"
            style={{
              background: "linear-gradient(135deg, rgba(197,160,98,0.12) 0%, rgba(197,160,98,0.04) 100%)",
              borderColor: "rgba(197,160,98,0.4)",
            }}
          >
            <div className="p-6">
              {/* Icono */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                style={{ background: "rgba(197,160,98,0.15)" }}
              >
                <svg className="w-6 h-6" style={{ color: "#C5A059" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Perfil de Negocio</h2>
                  <p className="text-sm text-white/60 mt-1">
                    Datos, clientes, estadísticas y herramientas globales de tu negocio
                  </p>
                </div>
                <svg className="w-5 h-5 text-white/30 group-hover:text-[#C5A059] transition-colors ml-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* Secciones rápidas */}
              <div className="flex flex-wrap gap-2 mt-4">
                {["Perfil", "Estadísticas", "Clientes", "Herramientas"].map(tag => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(197,160,98,0.12)", color: "rgba(197,160,98,0.9)" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </button>
        </div>

        {/* Separador */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
          <span className="text-xs text-white/30 uppercase tracking-widest">Estrategia</span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
        </div>

        {/* Cards inferiores: Fidelización + Captación */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Fidelización */}
          <button
            type="button"
            onClick={() => selectProfile("fidelizacion")}
            className="group rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.99]"
            style={{
              background: "linear-gradient(135deg, rgba(57,161,169,0.1) 0%, rgba(57,161,169,0.03) 100%)",
              borderColor: "rgba(57,161,169,0.3)",
            }}
          >
            <div className="p-5">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
                style={{ background: "rgba(57,161,169,0.15)" }}
              >
                <svg className="w-5 h-5" style={{ color: "#39a1a9" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Fidelización</h2>
                  <p className="text-xs text-white/60 mt-1">
                    Fideliza clientes, genera recursos de valor y aumenta la recurrencia
                  </p>
                </div>
                <svg className="w-4 h-4 text-white/30 group-hover:text-[#39a1a9] transition-colors ml-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {["Landing", "Recurso de Valor", "Formularios", "VIP"].map(tag => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(57,161,169,0.12)", color: "rgba(57,161,169,0.9)" }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </button>

          {/* Captación */}
          <button
            type="button"
            onClick={() => selectProfile("captacion")}
            className="group rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.99]"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(99,102,241,0.03) 100%)",
              borderColor: "rgba(99,102,241,0.3)",
            }}
          >
            <div className="p-5">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
                style={{ background: "rgba(99,102,241,0.15)" }}
              >
                <svg className="w-5 h-5" style={{ color: "#818cf8" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Captación</h2>
                  <p className="text-xs text-white/60 mt-1">
                    Crea campañas, capta leads en eventos y conviértelos en clientes
                  </p>
                </div>
                <svg className="w-4 h-4 text-white/30 group-hover:text-[#818cf8] transition-colors ml-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {["Campañas", "Formularios", "Lead Magnets", "Recorrido"].map(tag => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(99,102,241,0.12)", color: "rgba(147,149,255,0.9)" }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SelectProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-white/50">Cargando...</div>}>
      <SelectProfileContent />
    </Suspense>
  );
}
