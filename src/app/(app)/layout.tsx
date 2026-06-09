"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import MobileTitle from "@/components/MobileTitle";
import HelpDrawer from "@/components/HelpDrawer";
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

// Perfil de Negocio
const negocioLinks: SidebarLink[] = [
  { label: "Perfil", href: "/negocio/perfil", category: "Mi Negocio" },
  { label: "Herramientas", href: "/negocio/herramientas", category: "Mi Negocio", module: "module_tools" },
  { label: "Clientes", href: "/negocio/clientes", category: "Mi Negocio" },
  { label: "Estadísticas", href: "/negocio/estadisticas", category: "Mi Negocio" },
];

// Perfil de Fidelización
const fidelizacionLinks: SidebarLink[] = [
  // Contexto aparece primero → debajo del Dashboard y encima de Herramientas
  { label: "Contexto del negocio", href: "/mi-contexto", category: "Contexto" },
  { label: "Página de bienvenida", href: "/landing/new", category: "Herramientas", nameKey: "landing" },
  { label: "Imán de clientes", href: "/lead-magnet", category: "Herramientas", nameKey: "leadMagnet", module: "module_lead_magnet" },
  { label: "Beneficios VIP", href: "/vip-benefits", category: "Herramientas", nameKey: "vipBenefits", module: "module_vip_benefits" },
  { label: "Formularios", href: "/formularios", category: "Herramientas", nameKey: "forms", module: "module_forms" },
  { label: "Asistente IA", href: "/gpt-fidelizacion", category: "Avanzado", module: "module_gpt" },
];

// Perfil de Captación
const captacionLinks: SidebarLink[] = [
  // "Inicio" se renderiza como botón destacado en Sidebar.tsx (igual que Dashboard en Fidelización)
  { label: "Contexto del negocio", href: "/captacion/contexto", category: "Captación" },
  { label: "Campañas", href: "/captacion/campanas", category: "Captación" },
  { label: "Formularios", href: "/captacion/formularios", category: "Captación" },
  { label: "Imanes de clientes", href: "/captacion/lead-magnets", category: "Captación" },
  // Recorrido del Cliente: oculto si module_recorrido === false
  { label: "Recorrido del cliente", href: "/captacion/recorrido", category: "Captación", module: "module_recorrido" },
];


const adminLinks: SidebarLink[] = [
  { label: "Panel de control", href: "/admin/dashboard", category: "Panel Admin" },
  { label: "Negocios", href: "/admin/configuracion", category: "Panel Admin" },
  { label: "Módulos", href: "/admin/modulos", category: "Panel Admin" },
  { label: "Configuración", href: "/admin/settings", category: "Panel Admin" },
  { label: "Actividad", href: "/admin/actividad", category: "Panel Admin" },
  { label: "Cliente ideal", href: "/admin/crm/cliente-ideal", category: "Estrategia" },
  { label: "Embudo de lanzamiento", href: "/admin/crm/embudo", category: "Estrategia" },
  { label: "Diseñador de recorridos", href: "/admin/crm/recorridos", category: "Estrategia" },
  { label: "Recorrido del cliente", href: "/admin/crm/recorrido-cliente", category: "Estrategia" },
  { label: "Seguimiento de clientes", href: "/admin/crm/seguimiento", category: "Estrategia" },
  { label: "Panel de lanzamiento", href: "/admin/crm/panel-lanzamiento", category: "Estrategia" },
  { label: "Pipeline de ventas", href: "/admin/crm/pipeline", category: "CRM Comercial" },
  { label: "Agenda", href: "/admin/crm/agenda", category: "CRM Comercial" },
  { label: "Tareas", href: "/admin/crm/tareas", category: "CRM Comercial" },
  { label: "Métricas", href: "/admin/crm/metricas", category: "CRM Comercial" },
  { label: "Recursos y guiones", href: "/admin/crm/recursos", category: "CRM Comercial" },
  { label: "Guía de Personalización", href: "/admin/guia-personalizacion", category: "Contenido" },
  { label: "Onboarding", href: "/admin/onboarding", category: "Contenido" },
  { label: "Página de acceso", href: "/admin/login-page", category: "Contenido" },
  { label: "Landings de presentación", href: "/admin/landings", category: "Contenido" },
  { label: "Voz y copy (IA)", href: "/admin/landings/voz", category: "Contenido" },
  { label: "Ayuda contextual", href: "/admin/ayuda-contenido", category: "Contenido" },
];

const DEFAULT_MODULES: Record<string, boolean> = {
  module_vip_benefits: false,
  module_lead_magnet: true,
  module_whatsapp: true,
  module_tools: true,
  module_forms: true,   // visible por defecto hasta que DB confirme lo contrario
  module_gpt: false,
  module_captacion: false,
  module_recorrido: false,
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminMode = pathname.startsWith("/admin");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [modules, setModules] = useState<Record<string, boolean>>(DEFAULT_MODULES);
  const [profileActive, setProfileActive] = useState<boolean | null>(null);
  const [customNames, setCustomNames] = useState<Record<string, string>>({});
  const [contextIncomplete, setContextIncomplete] = useState(false);
  const [maintenanceBanner, setMaintenanceBanner] = useState<{ active: boolean; message: string } | null>(null);
  const [helpDrawerEnabled, setHelpDrawerEnabled] = useState(true);

  // ── Tema claro/oscuro ────────────────────────────────────────────────────
  const themeKey = isAdminMode ? "konecta-theme-admin" : "konecta-theme-business";
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(themeKey);
    const isDark = saved ? saved === "dark" : false;
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

    const loadBanner = async () => {
      try {
        const { data } = await supabase.from("settings").select("value").eq("key", "maintenance_banner").single();
        if (data?.value) {
          const banner = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
          setMaintenanceBanner(banner);
        }
      } catch {
        // silencioso
      }
    };

    const loadHelpDrawer = async () => {
      try {
        const { data } = await supabase.from("settings").select("value").eq("key", "help_drawer_enabled").single();
        if (data?.value) {
          const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
          setHelpDrawerEnabled(parsed.enabled ?? true);
        }
      } catch {
        // silencioso — por defecto habilitado
      }
    };

    loadNames();
    if (!isAdminMode) {
      loadBanner();
      loadHelpDrawer();
    }

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
          .select("profile_active, module_tools, module_forms, module_gpt, module_captacion, module_recorrido")
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
          module_recorrido: (accessData as Record<string, unknown>)?.module_recorrido as boolean ?? false,
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
  const isNegocioMode   = pathname.startsWith("/negocio");
  const baseLinks = isAdminMode
    ? adminLinks
    : isCaptacionMode
    ? captacionLinks
    : isNegocioMode
    ? negocioLinks
    : fidelizacionLinks;

  const links = baseLinks
    .filter((l) => {
      if (!isAdminMode && l.module && modules[l.module] === false) {
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

              {/* Acceso rápido a otros perfiles (móvil) */}
              {!isAdminMode && (
                <div className="space-y-1.5 pb-1">
                  <p className="text-[10px] uppercase tracking-widest px-1 mb-1 text-[var(--foreground)]/40">Cambiar a</p>
                  {isCaptacionMode && (
                    <>
                      <Link href="/mi-negocio/dashboard" onClick={() => setMobileMenuOpen(false)}
                        className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold"
                        style={{ background: "rgba(57,161,169,0.14)", color: "rgba(57,161,169,1)", border: "1px solid rgba(57,161,169,0.4)" }}>
                        <span>Fidelización</span><span>→</span>
                      </Link>
                      <Link href="/negocio/perfil" onClick={() => setMobileMenuOpen(false)}
                        className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold"
                        style={{ background: "rgba(197,160,98,0.14)", color: "rgba(170,130,60,1)", border: "1px solid rgba(197,160,98,0.4)" }}>
                        <span>Mi Negocio</span><span>→</span>
                      </Link>
                    </>
                  )}
                  {isNegocioMode && (
                    <>
                      <Link href="/mi-negocio/dashboard" onClick={() => setMobileMenuOpen(false)}
                        className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold"
                        style={{ background: "rgba(57,161,169,0.14)", color: "rgba(57,161,169,1)", border: "1px solid rgba(57,161,169,0.4)" }}>
                        <span>Fidelización</span><span>→</span>
                      </Link>
                      <Link href="/captacion" onClick={() => setMobileMenuOpen(false)}
                        className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold"
                        style={{ background: "rgba(99,102,241,0.14)", color: "rgba(99,102,241,1)", border: "1px solid rgba(99,102,241,0.4)" }}>
                        <span>Captación</span><span>→</span>
                      </Link>
                    </>
                  )}
                  {!isCaptacionMode && !isNegocioMode && (
                    <>
                      <Link href="/captacion" onClick={() => setMobileMenuOpen(false)}
                        className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold"
                        style={{ background: "rgba(99,102,241,0.14)", color: "rgba(99,102,241,1)", border: "1px solid rgba(99,102,241,0.4)" }}>
                        <span>Captación</span><span>→</span>
                      </Link>
                      <Link href="/negocio/perfil" onClick={() => setMobileMenuOpen(false)}
                        className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold"
                        style={{ background: "rgba(197,160,98,0.14)", color: "rgba(170,130,60,1)", border: "1px solid rgba(197,160,98,0.4)" }}>
                        <span>Mi Negocio</span><span>→</span>
                      </Link>
                    </>
                  )}
                </div>
              )}

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
          {/* ── Banner de mantenimiento / avisos ── */}
          {!isAdminMode && maintenanceBanner?.active && maintenanceBanner.message && (
            <div className="flex items-start gap-3 px-4 py-3 text-sm font-medium"
              style={{ background: "rgba(234,179,8,0.15)", borderBottom: "1px solid rgba(234,179,8,0.3)", color: "#fbbf24" }}>
              <span className="flex-shrink-0 mt-0.5">⚠️</span>
              <span>{maintenanceBanner.message}</span>
            </div>
          )}
          <main className="p-4 md:p-8">{children}</main>
        </div>
      </div>

      {/* ── Drawer de ayuda contextual ── */}
      <HelpDrawer enabled={helpDrawerEnabled} isAdmin={isAdminMode} />
    </div>
  );
}
