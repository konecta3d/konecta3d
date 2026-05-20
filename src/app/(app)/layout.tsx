"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import MobileTitle from "@/components/MobileTitle";
import Sidebar from "@/components/Sidebar";
import SidebarTitle from "@/components/SidebarTitle";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface SidebarLink {
  label: string;
  href: string;
  category?: string;
  nameKey?: string;
  module?: string;
  badge?: boolean;
}

// Perfil de Fidelización
const fidelizacionLinks: SidebarLink[] = [
  { label: "Perfil", href: "/mi-negocio/perfil", category: "Mi Negocio" },
  { label: "Clientes", href: "/mi-negocio/cliente-ideal", category: "Mi Negocio" },
  { label: "Catálogo P/S", href: "/mi-negocio/catalogo", category: "Mi Negocio" },
  { label: "Estadísticas", href: "/mi-negocio/estadisticas", category: "Mi Negocio" },
  { label: "Landing", href: "/landing/new", category: "Generadores", nameKey: "landing" },
  { label: "Recurso de Valor", href: "/lead-magnet", category: "Generadores", nameKey: "leadMagnet", module: "module_lead_magnet" },
  { label: "Beneficios VIP", href: "/vip-benefits", category: "Generadores", nameKey: "vipBenefits", module: "module_vip_benefits" },
  { label: "Formularios", href: "/formularios", category: "Generadores", nameKey: "forms", module: "module_forms" },
  { label: "Herramientas del negocio", href: "/acciones", category: "Herramientas del negocio", module: "module_tools" },
  { label: "Mi Contexto", href: "/mi-contexto", category: "Mi Negocio" },
  { label: "GPT Externo", href: "/gpt-fidelizacion", category: "GPT", module: "module_gpt" },
  { label: "← Cambiar perfil", href: "/business/select-profile", category: "" },
];

// Perfil de Captación
const captacionLinks: SidebarLink[] = [
  { label: "Inicio", href: "/captacion", category: "Captación" },
  { label: "Contexto", href: "/captacion/contexto", category: "Captación" },
  { label: "Campañas", href: "/captacion/campanas", category: "Captación" },
  { label: "Formularios", href: "/captacion/formularios", category: "Captación" },
  { label: "Lead Magnets", href: "/captacion/lead-magnets", category: "Captación" },
  { label: "Recorrido del Cliente", href: "/captacion/recorrido", category: "Captación" },
  { label: "Clientes", href: "/captacion/clientes", category: "Captación" },
  { label: "← Cambiar perfil", href: "/business/select-profile", category: "" },
];


const adminLinks: SidebarLink[] = [
  { label: "Panel de control", href: "/admin/dashboard", category: "Panel Admin" },
  { label: "Negocios", href: "/admin/configuracion", category: "Panel Admin" },
  { label: "Módulos", href: "/admin/modulos", category: "Panel Admin" },
  { label: "Configuración", href: "/admin/settings", category: "Panel Admin" },
  { label: "Actividad", href: "/admin/actividad", category: "Panel Admin" },
  { label: "Guía de Personalización", href: "/admin/guia-personalizacion", category: "Contenido" },
];

const DEFAULT_MODULES: Record<string, boolean> = {
  module_vip_benefits: false,
  module_lead_magnet: true,
  module_whatsapp: true,
  module_tools: true,
  module_forms: false,
  module_gpt: false,
  module_captacion: false,
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminMode = pathname.startsWith("/admin");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [modules, setModules] = useState<Record<string, boolean>>(DEFAULT_MODULES);
  const [profileActive, setProfileActive] = useState<boolean | null>(null);
  const [customNames, setCustomNames] = useState<Record<string, string>>({});
  const [contextIncomplete, setContextIncomplete] = useState(false);

  // ── Tema claro/oscuro ────────────────────────────────────────────────────
  const themeKey = isAdminMode ? "konecta-theme-admin" : "konecta-theme-business";
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(themeKey);
    const isDark = saved ? saved === "dark" : true;
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [themeKey]);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem(themeKey, next ? "dark" : "light");
    if (next) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };
  // ────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const loadNames = async () => {
      try {
        const { data } = await supabase.from("settings").select("value").eq("key", "names").single();
        if (data?.value) {
          const names = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
          setCustomNames(names);
        }
      } catch {
        // silencioso
      }
    };
    loadNames();

    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent<Record<string, string>>).detail;
      if (detail) setCustomNames(detail);
    };

    window.addEventListener("konecta-sidebar-names-update", handleUpdate as EventListener);
    return () => window.removeEventListener("konecta-sidebar-names-update", handleUpdate as EventListener);
  }, []);

  useEffect(() => {
    if (isAdminMode) return;

    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userEmail = sessionData?.session?.user?.email;
      if (!userEmail) return;

      // Usar select("*") para no fallar si hay columnas opcionales no migradas
      const { data, error } = await supabase
        .from("businesses")
        .select("module_vip_benefits, module_lead_magnet, module_whatsapp")
        .eq("contact_email", userEmail)
        .single();

      if (error) {
        console.warn("Error cargando módulos:", error.message);
        return;
      }

      if (data) {
        // profile_active: se lee de forma separada (columna opcional post-migración)
        const { data: accessData } = await supabase
          .from("businesses")
          .select("profile_active, module_tools, module_forms, module_gpt, module_captacion")
          .eq("contact_email", userEmail)
          .single();

        setProfileActive((accessData as Record<string, unknown>)?.profile_active as boolean ?? true);
        setModules({
          module_vip_benefits: data.module_vip_benefits ?? true,
          module_lead_magnet: data.module_lead_magnet ?? true,
          module_whatsapp: data.module_whatsapp ?? true,
          module_tools: (accessData as Record<string, unknown>)?.module_tools as boolean ?? true,
          module_forms: (accessData as Record<string, unknown>)?.module_forms as boolean ?? false,
          module_gpt: (accessData as Record<string, unknown>)?.module_gpt as boolean ?? false,
          module_captacion: (accessData as Record<string, unknown>)?.module_captacion as boolean ?? false,
        });

        // Comprobar si el contexto está incompleto para mostrar badge en sidebar
        const bizId = (await supabase.from("businesses").select("id").eq("contact_email", userEmail).single()).data?.id;
        if (bizId) {
          const [qRes, aRes] = await Promise.all([
            supabase.from("gpt_context_questions").select("id"),
            supabase.from("gpt_context_answers").select("question_id, answer_text").eq("business_id", bizId),
          ]);
          const total = qRes.data?.length || 0;
          const answered = (aRes.data || []).filter((a) => (a.answer_text || "").trim().length > 0).length;
          setContextIncomplete(total > 0 && answered < total);
        }
      }
    };

    load();
  }, [isAdminMode]);

  const isCaptacionMode = pathname.startsWith("/captacion");
  const baseLinks = isAdminMode ? adminLinks : isCaptacionMode ? captacionLinks : fidelizacionLinks;

  const links = baseLinks
    .filter((l) => {
      if (!isAdminMode && !isCaptacionMode && l.module && modules[l.module] === false) {
        return false;
      }
      return true;
    })
    .map((l) => ({
      ...l,
      badge: l.href === "/mi-contexto" && contextIncomplete ? true : l.badge,
    }));

  // Bloquear panel del negocio si profile_active === false (solo para clientes, no admin)
  if (!isAdminMode && profileActive === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] text-[var(--foreground)] px-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-xl font-bold mb-2">Cuenta pausada</h1>
          <p className="text-[var(--foreground)]/60 text-sm mb-4">
            El acceso a tu panel está temporalmente suspendido. Por favor, contacta con Konecta3D para regularizar tu cuenta.
          </p>
          <a
            href="https://wa.me/34623759451"
            className="inline-block px-5 py-2 rounded-lg bg-[var(--brand-4)] text-black text-sm font-medium hover:opacity-90"
          >
            Contactar con soporte
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Drawer móvil */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-64 max-w-[80%] bg-[var(--card)] border-r border-[var(--border)] p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <MobileTitle />
              <button
                type="button"
                className="text-xs px-2 py-1 rounded border border-[var(--border)]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cerrar
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto space-y-1 text-sm">
              {links.map(link => {
                const label = (link.nameKey && customNames[link.nameKey]) || link.label;
                const linkPathname = link.href.split("?")[0];
                const isActive = pathname === linkPathname;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                      isActive
                        ? "bg-[var(--brand-1)] text-white font-semibold"
                        : "text-[var(--foreground)] hover:bg-[var(--brand-1)]/10"
                    }`}
                  >
                    {label}
                    {link.badge && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Pie del drawer móvil */}
            <div className="pt-3 border-t border-[var(--border)] space-y-2">
              <button
                type="button"
                onClick={() => { toggleTheme(); }}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm transition-colors hover:bg-[var(--brand-1)]/10"
                style={{ color: "var(--foreground)" }}
              >
                {darkMode ? <><span>☀</span> Modo claro</> : <><span>🌙</span> Modo oscuro</>}
              </button>
              {isAdminMode && (
                <button
                  type="button"
                  onClick={async () => {
                    const { supabase: sb } = await import("@/lib/supabase");
                    await sb.auth.signOut();
                    localStorage.removeItem("konecta-role");
                    window.location.href = "/login";
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Cerrar sesión
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex min-h-screen">
        <Sidebar
          links={links}
          title={isAdminMode ? <SidebarTitle /> : undefined}
          darkMode={darkMode}
          onToggleTheme={toggleTheme}
        />
        <div className="flex-1 min-w-0 overflow-x-hidden">
          {/* Header móvil */}
          <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--card)] px-4 py-3 md:hidden">
            <div className="flex items-center justify-between gap-2">
              <MobileTitle />
              <div className="flex items-center gap-2">
                {/* Toggle tema (móvil) */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="rounded-lg border border-[var(--border)] px-2 py-2 text-base leading-none transition-colors hover:bg-[var(--brand-1)]/10"
                  title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                  style={{ color: "var(--foreground)" }}
                >
                  {darkMode ? "☀" : "🌙"}
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  Menú
                </button>
              </div>
            </div>
          </header>
          <main className="p-4 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
