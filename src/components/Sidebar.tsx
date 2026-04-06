"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import SidebarTitle from "./SidebarTitle";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface SidebarLink {
    label: string;
    href: string;
    category?: string;
    nameKey?: string;
    module?: string;
}

interface SidebarProps {
    links: SidebarLink[];
    title?: React.ReactNode;
}

export default function Sidebar({ links, title }: SidebarProps) {
    const pathname = usePathname();
    const [customNames, setCustomNames] = React.useState<Record<string, string>>({});
    const [modules, setModules] = React.useState<Record<string, boolean>>({});

    // Detect admin mode
    const isAdminMode = pathname.startsWith("/admin");
    const isBusinessMode = pathname.startsWith("/business");
    const showBusinessSidebar = !isAdminMode;

    // Hydration ready state
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    // Cargar módulos del negocio
    React.useEffect(() => {
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
        if (showBusinessSidebar) loadModules();
    }, [pathname, showBusinessSidebar]);

    // Cargar nombres personalizados
    React.useEffect(() => {
        const saved = localStorage.getItem("konecta-sidebar-names");
        if (saved) setCustomNames(JSON.parse(saved));

        const handleUpdate = (e: Event) => {
            const detail = (e as CustomEvent<Record<string, string>>).detail;
            if (detail) setCustomNames(detail);
        };

        window.addEventListener("konecta-sidebar-names-update", handleUpdate as EventListener);
        return () => window.removeEventListener("konecta-sidebar-names-update", handleUpdate as EventListener);
    }, []);

    // Filtrar links
    const filteredLinks = links.filter((l) => {
        // En modo negocio, filtrar módulos desactivados
        if (showBusinessSidebar && l.module && modules[l.module] === false) {
            return false;
        }
        return true;
    });

    // Group links by category
    const categories: Record<string, SidebarLink[]> = {};
    const noCategory: SidebarLink[] = [];

    filteredLinks.forEach((link) => {
        if (link.category) {
            if (!categories[link.category]) categories[link.category] = [];
            categories[link.category].push(link);
        } else {
            noCategory.push(link);
        }
    });

    const [darkMode, setDarkMode] = useState(true);
    const [fromAdminBusiness, setFromAdminBusiness] = useState(false);

    // Clave de almacenamiento distinta para admin y negocio
    const themeStorageKey = isAdminMode ? "konecta-theme-admin" : "konecta-theme-business";

    const renderLink = (link: SidebarLink) => {
        const linkPathname = link.href.split('?')[0];
        const isActive = pathname === linkPathname;
        const label = (link.nameKey && customNames[link.nameKey]) || link.label;

        const baseClasses = "block rounded-lg px-3 py-2 text-sm transition-colors";

        // En modo oscuro mantenemos el estilo anterior, en modo claro usamos brand-4
        const activeClasses = darkMode
            ? "bg-white/10 text-white font-medium"
            : "bg-[var(--brand-4)] text-black font-semibold";

        const inactiveClasses = darkMode
            ? "hover:bg-white/5 text-gray-300"
            : "text-gray-700 hover:bg-black/5";

        return (
            <Link
                key={link.href}
                href={link.href}
                className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
            >
                {label}
            </Link>
        );
    };

    React.useEffect(() => {
        const saved = typeof window !== "undefined" ? localStorage.getItem(themeStorageKey) : null;
        // Por defecto, modo oscuro si no hay preferencia guardada
        const isDark = saved ? saved === "dark" : true;
        setDarkMode(isDark);
        if (isDark) document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");

        if (!isAdminMode && typeof window !== "undefined") {
            const fromAdmin = localStorage.getItem("konecta-from-admin-business") === "true";
            setFromAdminBusiness(fromAdmin);
        }
    }, [themeStorageKey, isAdminMode]);

    const toggleTheme = () => {
        const next = !darkMode;
        setDarkMode(next);
        if (next) {
            document.documentElement.classList.add("dark");
            localStorage.setItem(themeStorageKey, "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem(themeStorageKey, "light");
        }
    };

    const [businessName, setBusinessName] = useState<string | null>(null);

    // Cargar nombre del negocio para mostrarlo bajo el título cuando estamos en modo negocio
    useEffect(() => {
        const loadName = async () => {
            try {
                const businessId = localStorage.getItem("konecta-business-id");
                if (!businessId) return;
                const { data } = await supabase
                    .from("businesses")
                    .select("name")
                    .eq("id", businessId)
                    .single();
                if (data?.name) setBusinessName(data.name);
            } catch (e) {
                // silencioso
            }
        };
        if (!isAdminMode) {
            loadName();
        }
    }, [pathname, isAdminMode]);

    return (
        <aside className="hidden w-72 border-r border-[var(--border)] bg-[var(--card)] p-6 md:block">
            {title ? title : <SidebarTitle />}
            {!isAdminMode && businessName && (
                <div
                    className="mb-6 font-semibold"
                    style={{ fontSize: "var(--sidebar-title-size)", color: "var(--foreground)" }}
                >
                    {businessName}
                </div>
            )}

            <nav className="space-y-4 text-sm">
                {Object.entries(categories).map(([category, catLinks]) => (
                    <div key={category} className="space-y-1">
                        <div className="mt-6 mb-2 text-xs uppercase tracking-wide text-[var(--brand-1)] px-3">
                            {category}
                        </div>
                        {catLinks.map(renderLink)}
                    </div>
                ))}
            </nav>

            {showBusinessSidebar && (
                <div className="mt-6 pt-4 border-t border-[var(--border)] text-sm space-y-3">
                    {fromAdminBusiness && (
                        <button
                            type="button"
                            onClick={() => {
                                if (typeof window !== "undefined") {
                                    localStorage.removeItem("konecta-from-admin-business");
                                    window.location.href = "/admin/dashboard";
                                }
                            }}
                            className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-center"
                        >
                            Volver al panel admin
                        </button>
                    )}
                    <button type="button" onClick={toggleTheme} className="w-full rounded-lg border border-[var(--border)] px-3 py-2">
                        {darkMode ? "Modo claro" : "Modo oscuro"}
                    </button>
                    <button
                        type="button"
                        onClick={async () => {
                            await supabase.auth.signOut();
                            if (typeof window !== "undefined") {
                                localStorage.removeItem("konecta-role");
                                localStorage.removeItem("konecta-business-id");
                                localStorage.removeItem("konecta-from-admin-business");
                                window.location.href = "/business/login";
                            }
                        }}
                        className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-center"
                    >
                        Cerrar sesión
                    </button>
                    {/* Mostrar enlaces sin categoría (Ayuda) */}
                    {noCategory.map(renderLink)}
                </div>
            )}
        </aside>
    );
}
