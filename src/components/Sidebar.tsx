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
    badge?: boolean;
}

interface SidebarProps {
    links: SidebarLink[];
    title?: React.ReactNode;
    darkMode?: boolean;
    onToggleTheme?: () => void;
}

export default function Sidebar({ links, title, darkMode: darkModeProp, onToggleTheme: onToggleThemeProp }: SidebarProps) {
    const pathname = usePathname();
    const [customNames, setCustomNames] = React.useState<Record<string, string>>({});
    const [modules, setModules] = React.useState<Record<string, boolean>>({});

    const isAdminMode     = pathname.startsWith("/admin");
    const isCaptacionMode = pathname.startsWith("/captacion");
    const isNegocioMode   = pathname.startsWith("/negocio");
    const isFidelizacionMode = !isAdminMode && !isCaptacionMode && !isNegocioMode;
    const showBusinessSidebar = !isAdminMode;

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const [fromAdminBusiness, setFromAdminBusiness] = useState(false);

    // ── Tema ────────────────────────────────────────────────────────────────
    const themeKey = isAdminMode ? "konecta-theme-admin" : "konecta-theme-business";
    const [internalDarkMode, setInternalDarkMode] = useState(false);
    const darkMode = darkModeProp !== undefined ? darkModeProp : internalDarkMode;

    React.useEffect(() => {
        if (darkModeProp !== undefined) return;
        const saved = typeof window !== "undefined" ? localStorage.getItem(themeKey) : null;
        const isDark = saved ? saved === "dark" : false;
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
                .select("module_vip_benefits,module_lead_magnet,module_whatsapp")
                .eq("id", biz.id)
                .single();
            const { data: optData } = await supabase
                .from("businesses")
                .select("module_tools,module_forms,module_gpt,module_recorrido")
                .eq("id", biz.id)
                .single();
            if (data) {
                setModules({
                    module_vip_benefits: data.module_vip_benefits ?? true,
                    module_lead_magnet: data.module_lead_magnet ?? true,
                    module_whatsapp: data.module_whatsapp ?? true,
                    module_tools: (optData as Record<string, unknown>)?.module_tools as boolean ?? true,
                    module_forms: (optData as Record<string, unknown>)?.module_forms as boolean ?? false,
                    module_gpt: (optData as Record<string, unknown>)?.module_gpt as boolean ?? false,
                    module_recorrido: (optData as Record<string, unknown>)?.module_recorrido as boolean ?? false,
                });
            }
        };
        if (showBusinessSidebar) load();
    }, [pathname, showBusinessSidebar]);

    // Cargar nombres personalizados
    React.useEffect(() => {
        const loadNames = async () => {
            const { data } = await supabase.from("settings").select("value").eq("key", "names").single();
            if (data?.value) {
                const names = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
                setCustomNames(names);
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

    // Filtrar links por módulo
    const filteredLinks = links.filter((l) => {
        if (showBusinessSidebar && l.module && modules[l.module] === false) return false;
        return true;
    });

    // Agrupar por categoría
    const categories: Record<string, SidebarLink[]> = {};
    filteredLinks.forEach((link) => {
        if (link.category) {
            if (!categories[link.category]) categories[link.category] = [];
            categories[link.category].push(link);
        }
    });

    // Categoría activa (para abrir por defecto la sección correcta)
    const activeCategory = React.useMemo(() => {
        const active = filteredLinks.find(l => {
            const lp = l.href.split("?")[0];
            return pathname === lp || pathname.startsWith(lp + "/");
        });
        return active?.category ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    // Estado colapsable con persistencia en localStorage
    const [openSections, setOpenSections] = React.useState<Record<string, boolean>>(() => {
        if (typeof window === "undefined") return {};
        try {
            const saved = localStorage.getItem("konecta-sidebar-sections");
            return saved ? JSON.parse(saved) : {};
        } catch { return {}; }
    });

    const isSectionOpen = (cat: string) => {
        if (openSections[cat] !== undefined) return openSections[cat];
        if (isAdminMode) return cat === activeCategory; // Admin: solo la activa abierta por defecto
        return true; // Negocio: todas abiertas por defecto
    };

    const toggleSection = (cat: string) => {
        const next = { ...openSections, [cat]: !isSectionOpen(cat) };
        setOpenSections(next);
        localStorage.setItem("konecta-sidebar-sections", JSON.stringify(next));
    };

    // Auto-abrir la sección activa al navegar (por si estaba colapsada)
    React.useEffect(() => {
        if (!activeCategory) return;
        setOpenSections(prev => {
            if (prev[activeCategory] !== false) return prev;
            const next = { ...prev, [activeCategory]: true };
            localStorage.setItem("konecta-sidebar-sections", JSON.stringify(next));
            return next;
        });
    }, [activeCategory]);

    const renderLink = (link: SidebarLink) => {
        const linkPathname = link.href.split("?")[0];
        const isActive = pathname === linkPathname;
        const label = (link.nameKey && customNames[link.nameKey]) || link.label;
        const baseClasses = "block rounded-lg px-3 py-2 text-sm transition-colors font-medium";
        const activeClasses = darkMode ? "bg-white/10 text-white" : "bg-[var(--brand-1)] text-white";
        const inactiveClasses = darkMode ? "text-white/70 hover:bg-white/5 hover:text-white" : "text-[var(--brand-1)] hover:bg-[var(--brand-1)]/10";
        return (
            <Link
                key={link.href}
                href={link.href}
                className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} flex items-center justify-between`}
            >
                <span>{label}</span>
                {link.badge && <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 ml-2" />}
            </Link>
        );
    };

    const [businessName, setBusinessName] = useState<string | null>(null);
    useEffect(() => {
        const loadName = async () => {
            try {
                const { data: sessionData } = await supabase.auth.getSession();
                const userEmail = sessionData?.session?.user?.email;
                if (!userEmail) return;
                const { data } = await supabase
                    .from("businesses")
                    .select("name")
                    .eq("contact_email", userEmail)
                    .single();
                if (data?.name) setBusinessName(data.name);
            } catch { /* silencioso */ }
        };
        if (!isAdminMode) loadName();
    }, [pathname, isAdminMode]);

    // ── Botones de acceso rápido a otros perfiles ──────────────────────────
    const QuickProfileButtons = ({ compact = false }: { compact?: boolean }) => {
        if (!showBusinessSidebar) return null;

        const btnBase = compact
            ? "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-all hover:opacity-95 hover:scale-[1.03]"
            : "w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all hover:opacity-95 hover:scale-[1.02]";

        if (isFidelizacionMode) return (
            <>
                <Link href="/captacion" className={btnBase}
                    style={{ background: "#4f46e5", color: "#ffffff", border: "1px solid rgba(255,255,255,0.28)", boxShadow: "0 2px 10px rgba(79,70,229,0.5)" }}>
                    <span>Captación</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
                <Link href="/negocio/perfil" className={btnBase}
                    style={{ background: "#c5a059", color: "#1a1208", border: "1px solid rgba(0,0,0,0.2)", boxShadow: "0 2px 10px rgba(197,160,98,0.5)" }}>
                    <span>Mi Negocio</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            </>
        );

        if (isCaptacionMode) return (
            <>
                <Link href="/mi-negocio/dashboard" className={btnBase}
                    style={{ background: "#1a7e78", color: "#ffffff", border: "1px solid rgba(255,255,255,0.28)", boxShadow: "0 2px 10px rgba(26,126,120,0.5)" }}>
                    <span>Fidelización</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
                <Link href="/negocio/perfil" className={btnBase}
                    style={{ background: "#c5a059", color: "#1a1208", border: "1px solid rgba(0,0,0,0.2)", boxShadow: "0 2px 10px rgba(197,160,98,0.5)" }}>
                    <span>Mi Negocio</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            </>
        );

        if (isNegocioMode) return (
            <>
                <Link href="/mi-negocio/dashboard" className={btnBase}
                    style={{ background: "#1a7e78", color: "#ffffff", border: "1px solid rgba(255,255,255,0.28)", boxShadow: "0 2px 10px rgba(26,126,120,0.5)" }}>
                    <span>Fidelización</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
                <Link href="/captacion" className={btnBase}
                    style={{ background: "#4f46e5", color: "#ffffff", border: "1px solid rgba(255,255,255,0.28)", boxShadow: "0 2px 10px rgba(79,70,229,0.5)" }}>
                    <span>Captación</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            </>
        );

        return null;
    };

    return (
        <>
        <aside className="hidden w-72 border-r border-[var(--border)] bg-[var(--card)] p-6 md:flex md:flex-col">
            {title ? title : <SidebarTitle />}

            {/* ── Etiqueta del perfil activo ── */}
            {!isAdminMode && (
                <div className="mb-1 text-[10px] uppercase tracking-widest font-bold px-0.5"
                    style={{
                        color: isCaptacionMode
                            ? "rgba(147,149,255,0.75)"
                            : isNegocioMode
                            ? "rgba(197,160,98,0.75)"
                            : "rgba(57,161,169,0.75)"
                    }}>
                    {isCaptacionMode ? "Captación" : isNegocioMode ? "Mi Negocio" : "Fidelización"}
                </div>
            )}

            {!isAdminMode && businessName && (
                <div className="mb-4 font-semibold"
                    style={{ fontSize: "var(--sidebar-title-size)", color: "var(--foreground)" }}>
                    {businessName}
                </div>
            )}

            {/* Conmutador de perfiles — dentro del sidebar */}
            {showBusinessSidebar && (
                <div className="mb-5 space-y-1.5">
                    <p className="text-[10px] uppercase tracking-widest font-semibold px-0.5 mb-2"
                        style={{ color: "var(--foreground)", opacity: 0.4 }}>
                        Cambiar a
                    </p>
                    <QuickProfileButtons />
                </div>
            )}

            {/* Botón Dashboard — solo en modo fidelización */}
            {showBusinessSidebar && isFidelizacionMode && (
                <Link
                    href="/mi-negocio/dashboard"
                    className={`flex items-center gap-2 mb-4 w-full px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                        pathname === "/mi-negocio/dashboard"
                            ? "bg-[var(--brand-4)] text-black"
                            : "bg-[var(--brand-3)]/15 text-[var(--brand-3)] hover:bg-[var(--brand-3)]/25"
                    }`}
                >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Dashboard
                </Link>
            )}

            {/* Botón Inicio — solo en modo captación (mismo estilo que Dashboard) */}
            {showBusinessSidebar && isCaptacionMode && (
                <Link
                    href="/captacion"
                    className={`flex items-center gap-2 mb-4 w-full px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                        pathname === "/captacion"
                            ? "bg-[var(--brand-4)] text-black"
                            : "bg-[var(--brand-3)]/15 text-[var(--brand-3)] hover:bg-[var(--brand-3)]/25"
                    }`}
                >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Inicio
                </Link>
            )}

            <nav className="flex-1 space-y-1 text-sm overflow-y-auto">
                {Object.entries(categories).map(([category, catLinks]) => {
                    const hideLabel = isFidelizacionMode && category === "Generadores";
                    const open = isSectionOpen(category);
                    return (
                        <div key={category}>
                            {hideLabel ? (
                                // Sin encabezado colapsable — mostrar links directamente
                                <div className="space-y-1 mt-4">{catLinks.map(renderLink)}</div>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => toggleSection(category)}
                                        className="w-full flex items-center justify-between mt-5 mb-1 px-3 py-1 rounded-lg hover:bg-[var(--border)]/40 transition-colors"
                                    >
                                        <span className="text-[11px] uppercase tracking-wide font-semibold text-[var(--brand-1)]">
                                            {category}
                                        </span>
                                        <svg
                                            className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                                            style={{ color: "var(--brand-1)", opacity: 0.6 }}
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {open && (
                                        <div className="space-y-1">{catLinks.map(renderLink)}</div>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* ── Pie del sidebar Admin ── */}
            {isAdminMode && (
                <div className="mt-6 pt-4 border-t border-[var(--border)] space-y-2">
                    <button type="button" onClick={toggleTheme}
                        className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-center flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
                        style={{ color: "var(--foreground)" }}>
                        {darkMode ? <><span>☀</span> Modo claro</> : <><span>🌙</span> Modo oscuro</>}
                    </button>
                    <button type="button"
                        onClick={async () => {
                            await supabase.auth.signOut();
                            if (typeof window !== "undefined") {
                                localStorage.removeItem("konecta-role");
                                window.location.href = "/login";
                            }
                        }}
                        className="w-full rounded-lg border border-red-500/40 px-3 py-2 text-sm text-center flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Cerrar sesión
                    </button>
                </div>
            )}

            {/* ── Pie del sidebar Business ── */}
            {showBusinessSidebar && mounted && (
                <div className="mt-6 pt-4 border-t border-[var(--border)] space-y-2">
                    {/* Volver al panel admin (solo si accedió desde admin) */}
                    {fromAdminBusiness && (
                        <button type="button"
                            onClick={() => {
                                if (typeof window !== "undefined") {
                                    localStorage.removeItem("konecta-from-admin-business");
                                    window.location.href = "/admin/dashboard";
                                }
                            }}
                            className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-center hover:bg-white/5 transition-colors"
                            style={{ color: "var(--foreground)" }}>
                            ← Panel admin
                        </button>
                    )}

                    {/* Toggle modo claro/oscuro */}
                    <button type="button" onClick={toggleTheme}
                        className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-center flex items-center justify-center gap-2 hover:bg-[var(--brand-1)]/10 transition-colors"
                        style={{ color: "var(--foreground)" }}>
                        {darkMode ? <><span>☀</span> Modo claro</> : <><span>🌙</span> Modo oscuro</>}
                    </button>

                    {/* Cerrar sesión */}
                    <button type="button"
                        onClick={async () => {
                            await supabase.auth.signOut();
                            if (typeof window !== "undefined") {
                                localStorage.removeItem("konecta-role");
                                localStorage.removeItem("konecta-business-id");
                                localStorage.removeItem("konecta-from-admin-business");
                                window.location.href = "/business/login";
                            }
                        }}
                        className="w-full rounded-lg border border-red-500/30 px-3 py-2 text-sm text-center text-red-500 hover:bg-red-500/10 transition-colors">
                        Cerrar sesión
                    </button>
                </div>
            )}
        </aside>
        </>
    );
}
