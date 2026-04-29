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
    /** Estado del tema controlado desde el layout */
    darkMode?: boolean;
    /** Callback para cambiar el tema desde el layout */
    onToggleTheme?: () => void;
}

export default function Sidebar({ links, title, darkMode: darkModeProp, onToggleTheme: onToggleThemeProp }: SidebarProps) {
    const pathname = usePathname();
    const [customNames, setCustomNames] = React.useState<Record<string, string>>({});
    const [modules, setModules] = React.useState<Record<string, boolean>>({});

    const isAdminMode = pathname.startsWith("/admin");
    const showBusinessSidebar = !isAdminMode;

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const [fromAdminBusiness, setFromAdminBusiness] = useState(false);

    // ── Tema: controlado externamente si se pasan props, interno como fallback ──
    const themeKey = isAdminMode ? "konecta-theme-admin" : "konecta-theme-business";
    const [internalDarkMode, setInternalDarkMode] = useState(true);

    // Si el layout pasa darkMode como prop, úsalo; si no, usa el estado interno
    const darkMode = darkModeProp !== undefined ? darkModeProp : internalDarkMode;

    // Cargar tema solo cuando no viene controlado externamente
    React.useEffect(() => {
        if (darkModeProp !== undefined) return;
        const saved = typeof window !== "undefined" ? localStorage.getItem(themeKey) : null;
        const isDark = saved ? saved === "dark" : true;
        setInternalDarkMode(isDark);
        if (isDark) document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");

        if (!isAdminMode && typeof window !== "undefined") {
            const fromAdmin = localStorage.getItem("konecta-from-admin-business") === "true";
            setFromAdminBusiness(fromAdmin);
        }
    }, [themeKey, isAdminMode, darkModeProp]);

    const internalToggleTheme = () => {
        const next = !internalDarkMode;
        setInternalDarkMode(next);
        localStorage.setItem(themeKey, next ? "dark" : "light");
        if (next) document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
    };

    const toggleTheme = onToggleThemeProp ?? internalToggleTheme;
    // ────────────────────────────────────────────────────────────────────────

    // Cargar módulos del negocio
    useEffect(() => {
        const load = async () => {
            const { data: sessionData } = await supabase.auth.getSession();
            const userEmail = sessionData?.session?.user?.email || "";
            if (!userEmail) return;
            const { data: biz } = await supabase
                .from("businesses")
                .select("id")
                .eq("contact_email", userEmail)
                .single();
            if (!biz?.id) return;
            const { data } = await supabase
                .from("businesses")
                .select("module_vip_benefits,module_lead_magnet,module_whatsapp,module_tools,module_forms")
                .eq("id", biz.id)
                .single();
            if (data) {
                setModules({
                    module_vip_benefits: data.module_vip_benefits ?? true,
                    module_lead_magnet: data.module_lead_magnet ?? true,
                    module_whatsapp: data.module_whatsapp ?? true,
                    module_tools: data.module_tools ?? true,
                    module_forms: data.module_forms ?? true,
                });
            } else {
                setModules({ module_vip_benefits: true, module_lead_magnet: true, module_whatsapp: true, module_tools: true, module_forms: true });
            }
        };
        if (showBusinessSidebar) load();
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
        if (showBusinessSidebar && l.module && modules[l.module] === false) {
            return false;
        }
        return true;
    });

    // Agrupar por categoría
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

    const renderLink = (link: SidebarLink) => {
        const linkPathname = link.href.split('?')[0];
        const isActive = pathname === linkPathname;
        const label = (link.nameKey && customNames[link.nameKey]) || link.label;

        const baseClasses = "block rounded-lg px-3 py-2 text-sm transition-colors font-medium";
        const activeClasses = darkMode
            ? "bg-white/10 text-white"
            : "bg-[var(--brand-1)] text-white";
        const inactiveClasses = darkMode
            ? "text-white/70 hover:bg-white/5 hover:text-white"
            : "text-[var(--brand-1)] hover:bg-[var(--brand-1)]/10";

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

    const [businessName, setBusinessName] = useState<string | null>(null);

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

            {/* Botón Dashboard — solo en modo negocio */}
            {showBusinessSidebar && (
                <Link
                    href="/mi-negocio/estadisticas"
                    className={`flex items-center gap-2 mb-4 w-full px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                        pathname === "/mi-negocio/estadisticas"
                            ? "bg-[var(--brand-4)] text-black"
                            : "bg-[var(--brand-3)]/15 text-[var(--brand-3)] hover:bg-[var(--brand-3)]/25"
                    }`}
                >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Dashboard
                </Link>
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

                    {/* Toggle modo claro / oscuro */}
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-center flex items-center justify-center gap-2 hover:bg-[var(--brand-1)]/10 transition-colors"
                        style={{ color: "var(--foreground)" }}
                    >
                        {darkMode ? (
                            <><span>☀</span> Modo claro</>
                        ) : (
                            <><span>🌙</span> Modo oscuro</>
                        )}
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
                        style={{ color: "var(--foreground)" }}
                    >
                        Cerrar sesión
                    </button>

                    {noCategory.map(renderLink)}
                </div>
            )}
        </aside>
    );
}
