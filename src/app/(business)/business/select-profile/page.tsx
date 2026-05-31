"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ─── Colores por perfil ────────────────────────────────────────────────────────
// Valores distintos para modo claro y oscuro para garantizar contraste en ambos.

const PROFILES = {
  negocio: {
    label: "Perfil de Negocio",
    desc: "Datos, clientes, estadísticas y herramientas globales de tu negocio",
    tags: ["Perfil", "Estadísticas", "Clientes", "Herramientas"],
    // Colores base
    hex:          "#C5A059",
    // Modo claro
    lightBg:      "rgba(197,160,89,0.12)",
    lightBgEnd:   "rgba(197,160,89,0.06)",
    lightBorder:  "rgba(160,120,40,0.55)",
    lightTagBg:   "rgba(197,160,89,0.18)",
    lightTagText: "#7a5a10",
    // Modo oscuro
    darkBg:       "rgba(197,160,89,0.14)",
    darkBgEnd:    "rgba(197,160,89,0.05)",
    darkBorder:   "rgba(197,160,89,0.40)",
    darkTagBg:    "rgba(197,160,89,0.15)",
    darkTagText:  "rgba(197,160,89,0.95)",
  },
  fidelizacion: {
    label: "Fidelización",
    desc: "Fideliza clientes, genera recursos de valor y aumenta la recurrencia",
    tags: ["Landing", "Recurso de Valor", "Formularios", "VIP"],
    hex:          "#39a1a9",
    lightBg:      "rgba(57,161,169,0.12)",
    lightBgEnd:   "rgba(57,161,169,0.05)",
    lightBorder:  "rgba(30,120,130,0.50)",
    lightTagBg:   "rgba(57,161,169,0.15)",
    lightTagText: "#0e6570",
    darkBg:       "rgba(57,161,169,0.12)",
    darkBgEnd:    "rgba(57,161,169,0.03)",
    darkBorder:   "rgba(57,161,169,0.35)",
    darkTagBg:    "rgba(57,161,169,0.14)",
    darkTagText:  "rgba(57,161,169,0.95)",
  },
  captacion: {
    label: "Captación",
    desc: "Crea campañas, capta leads en eventos y conviértelos en clientes",
    tags: ["Campañas", "Formularios", "Lead Magnets", "Recorrido"],
    hex:          "#6366f1",
    lightBg:      "rgba(99,102,241,0.11)",
    lightBgEnd:   "rgba(99,102,241,0.05)",
    lightBorder:  "rgba(80,82,200,0.50)",
    lightTagBg:   "rgba(99,102,241,0.14)",
    lightTagText: "#3638b0",
    darkBg:       "rgba(99,102,241,0.12)",
    darkBgEnd:    "rgba(99,102,241,0.04)",
    darkBorder:   "rgba(99,102,241,0.35)",
    darkTagBg:    "rgba(99,102,241,0.14)",
    darkTagText:  "rgba(147,149,255,0.95)",
  },
} as const;

type ProfileKey = keyof typeof PROFILES;

// ─── SVG icons ────────────────────────────────────────────────────────────────

function IconNegocio({ color }: { color: string }) {
  return (
    <svg className="w-6 h-6" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}
function IconFidelizacion({ color }: { color: string }) {
  return (
    <svg className="w-5 h-5" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}
function IconCaptacion({ color }: { color: string }) {
  return (
    <svg className="w-5 h-5" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconArrow({ color }: { color: string }) {
  return (
    <svg className="w-4 h-4 flex-shrink-0 transition-colors" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

function SelectProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [businessId, setBusinessId] = useState("");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Detectar modo oscuro activo
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    const load = async () => {
      const paramId = searchParams.get("businessId");
      if (paramId) { setBusinessId(paramId); return; }
      const { data: sessionData } = await supabase.auth.getSession();
      const userEmail = sessionData?.session?.user?.email || "";
      if (!userEmail) { setBusinessId(""); return; }
      const { data: biz } = await supabase
        .from("businesses").select("id").eq("contact_email", userEmail).single();
      setBusinessId(biz?.id || "");
    };
    load();
  }, [searchParams]);

  const selectProfile = async (profile: ProfileKey) => {
    if (!businessId) return;
    localStorage.setItem("konecta-business-id", businessId);
    if (searchParams.get("fromAdmin")) localStorage.setItem("konecta-from-admin-business", "true");
    if (profile === "captacion")    router.push("/captacion");
    else if (profile === "negocio") router.push("/negocio/perfil");
    else                            router.push("/mi-negocio/dashboard");
  };

  // Función que devuelve los colores correctos según el modo
  const c = (p: ProfileKey) => {
    const profile = PROFILES[p];
    return isDark ? {
      bg:      `linear-gradient(135deg, ${profile.darkBg} 0%, ${profile.darkBgEnd} 100%)`,
      border:  profile.darkBorder,
      tagBg:   profile.darkTagBg,
      tagText: profile.darkTagText,
      icon:    profile.hex,
      iconBg:  profile.darkTagBg,
      arrow:   "rgba(255,255,255,0.25)",
    } : {
      bg:      `linear-gradient(135deg, ${profile.lightBg} 0%, ${profile.lightBgEnd} 100%)`,
      border:  profile.lightBorder,
      tagBg:   profile.lightTagBg,
      tagText: profile.lightTagText,
      icon:    profile.hex,
      iconBg:  profile.lightTagBg,
      arrow:   "rgba(0,0,0,0.25)",
    };
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl space-y-6">

        {/* Título */}
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Selecciona tu perfil</h1>
          <p className="text-sm text-[var(--foreground)]/60 mt-1">
            Elige el área con la que quieres trabajar hoy
          </p>
        </div>

        {/* Card superior: Perfil de Negocio */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => selectProfile("negocio")}
            className="group w-full max-w-sm rounded-2xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.99]"
            style={{ background: c("negocio").bg, borderColor: c("negocio").border }}
          >
            <div className="p-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                style={{ background: c("negocio").iconBg }}>
                <IconNegocio color={c("negocio").icon} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[var(--foreground)]">Perfil de Negocio</h2>
                  <p className="text-sm text-[var(--foreground)]/60 mt-1">
                    {PROFILES.negocio.desc}
                  </p>
                </div>
                <IconArrow color={c("negocio").arrow} />
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {PROFILES.negocio.tags.map(tag => (
                  <span key={tag} className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: c("negocio").tagBg, color: c("negocio").tagText }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </button>
        </div>

        {/* Separador */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          <span className="text-xs text-[var(--foreground)]/40 uppercase tracking-widest">Estrategia</span>
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>

        {/* Cards inferiores: Fidelización + Captación */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Fidelización */}
          <button
            type="button"
            onClick={() => selectProfile("fidelizacion")}
            className="group rounded-xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.99]"
            style={{ background: c("fidelizacion").bg, borderColor: c("fidelizacion").border }}
          >
            <div className="p-5">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
                style={{ background: c("fidelizacion").iconBg }}>
                <IconFidelizacion color={c("fidelizacion").icon} />
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-bold text-[var(--foreground)]">Fidelización</h2>
                  <p className="text-xs text-[var(--foreground)]/60 mt-1">{PROFILES.fidelizacion.desc}</p>
                </div>
                <IconArrow color={c("fidelizacion").arrow} />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {PROFILES.fidelizacion.tags.map(tag => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: c("fidelizacion").tagBg, color: c("fidelizacion").tagText }}>
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
            className="group rounded-xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.99]"
            style={{ background: c("captacion").bg, borderColor: c("captacion").border }}
          >
            <div className="p-5">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
                style={{ background: c("captacion").iconBg }}>
                <IconCaptacion color={c("captacion").icon} />
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-bold text-[var(--foreground)]">Captación</h2>
                  <p className="text-xs text-[var(--foreground)]/60 mt-1">{PROFILES.captacion.desc}</p>
                </div>
                <IconArrow color={c("captacion").arrow} />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {PROFILES.captacion.tags.map(tag => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: c("captacion").tagBg, color: c("captacion").tagText }}>
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center text-sm text-[var(--foreground)]/50">
        Cargando...
      </div>
    }>
      <SelectProfileContent />
    </Suspense>
  );
}
