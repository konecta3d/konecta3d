"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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
}

const businessLinks: SidebarLink[] = [
  { label: "Perfil", href: "/mi-negocio/perfil", category: "Mi Negocio" },
  { label: "Clientes", href: "/mi-negocio/cliente-ideal", category: "Mi Negocio" },
  { label: "Catálogo P/S", href: "/mi-negocio/catalogo", category: "Mi Negocio" },
  { label: "Historial", href: "/mi-negocio/historial", category: "Mi Negocio" },
  { label: "Estadísticas", href: "/mi-negocio/estadisticas", category: "Mi Negocio" },
  { label: "Landing", href: "/landing/new", category: "Generadores", nameKey: "landing" },
  { label: "Lead Magnet", href: "/lead-magnet", category: "Generadores", nameKey: "leadMagnet", module: "module_lead_magnet" },
  { label: "Beneficios VIP", href: "/vip-benefits", category: "Generadores", nameKey: "vipBenefits", module: "module_vip_benefits" },
  { label: "Herramientas del negocio", href: "/acciones", category: "Herramientas del negocio", module: "module_tools" },
];

const adminLinks: SidebarLink[] = [
  { label: "Panel de control", href: "/admin/dashboard", category: "Panel Admin" },
  { label: "Negocios", href: "/admin/configuracion", category: "Panel Admin" },
  { label: "Módulos", href: "/admin/modulos", category: "Panel Admin" },
  { label: "Configuración", href: "/admin/settings", category: "Panel Admin" },
  { label: "Actividad", href: "/admin/actividad", category: "Panel Admin" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminMode = pathname.startsWith("/admin");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [modules, setModules] = useState<Record<string, boolean>>({});
  const [customNames, setCustomNames] = useState<Record<string, string>>({});

  useEffect(() => {
    // Cargar nombres personalizados
    const saved = localStorage.getItem("konecta-sidebar-names");
    if (saved) setCustomNames(JSON.parse(saved));

    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent<Record<string, string>>).detail;
      if (detail) setCustomNames(detail);
    };

    window.addEventListener("konecta-sidebar-names-update", handleUpdate as EventListener);
    return () => window.removeEventListener("konecta-sidebar-names-update", handleUpdate as EventListener);
  }, []);

  useEffect(() => {
    if (!isAdminMode) {
      const loadModules = async () => {
        const businessId = localStorage.getItem("konecta-business-id");
        if (!businessId) {
          setModules({ module_vip_benefits: true, module_lead_magnet: true, module_whatsapp: true, module_tools: true });
          return;
        }
        const { data } = await supabase
          .from("businesses")
          .select("module_vip_benefits,module_lead_magnet,module_whatsapp,module_tools")
          .eq("id", businessId)
          .single();

        if (data) {
          setModules({
            module_vip_benefits: data.module_vip_benefits ?? true,
            module_lead_magnet: data.module_lead_magnet ?? true,
            module_whatsapp: data.module_whatsapp ?? true,
            module_tools: data.module_tools ?? true,
          });
        }
      };
      loadModules();
    }
  }, [isAdminMode]);

  const baseLinks = isAdminMode ? adminLinks : businessLinks;

  // Filtrar links al igual que en el Sidebar
  const links = baseLinks.filter((l) => {
    if (!isAdminMode && l.module && modules[l.module] === false) {
      return false;
    }
    return true;
  });

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
                    className={`block rounded-lg px-3 py-2 ${
                      isActive
                        ? "bg-[var(--brand-4)] text-black font-semibold"
                        : "text-slate-200 hover:bg-white/5"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <div className="flex min-h-screen">
        <Sidebar links={links} title={isAdminMode ? <SidebarTitle /> : undefined} />
        <div className="flex-1">
          <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--card)] px-4 py-3 md:hidden">
            <div className="flex items-center justify-between">
              <MobileTitle />
              <button
                type="button"
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold"
                onClick={() => setMobileMenuOpen(true)}
              >
                Menú
              </button>
            </div>
          </header>
          <main className="p-4 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
