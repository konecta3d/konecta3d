"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface BusinessData {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  phone: string | null;
  contact_email: string;
  description: string | null;
  module_lead_magnet: boolean;
  module_vip_benefits: boolean;
  module_whatsapp: boolean;
  module_tools: boolean;
  module_forms: boolean;
}

interface QuickStats {
  leads: number;
  leadMagnets: number;
  benefits: number;
  landings: number;
}

export default function DashboardPage() {
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [stats, setStats] = useState<QuickStats>({ leads: 0, leadMagnets: 0, benefits: 0, landings: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userEmail = sessionData?.session?.user?.email || "";
      if (!userEmail) { setLoading(false); return; }

      const { data: biz } = await supabase
        .from("businesses")
        .select("id, name, slug, logo_url, phone, contact_email, description, module_lead_magnet, module_vip_benefits, module_whatsapp, module_tools, module_forms")
        .eq("contact_email", userEmail)
        .single();

      if (!biz) { setLoading(false); return; }
      setBusiness(biz);

      const [leadsRes, leadMagnetsRes, benefitsRes, landingsRes] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("business_id", biz.id),
        supabase.from("lead_magnets").select("id", { count: "exact", head: true }).eq("business_id", biz.id).eq("active", true),
        supabase.from("benefits").select("id", { count: "exact", head: true }).eq("business_id", biz.id).eq("active", true),
        supabase.from("landing_configs").select("id", { count: "exact", head: true }).eq("business_id", biz.id),
      ]);

      setStats({
        leads: leadsRes.count || 0,
        leadMagnets: leadMagnetsRes.count || 0,
        benefits: benefitsRes.count || 0,
        landings: landingsRes.count || 0,
      });

      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-4)] mx-auto mb-4"></div>
          <p className="text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  const modules = [
    {
      key: "landing",
      label: "Landing",
      description: "Tu página pública con tus datos de contacto y servicios.",
      href: "/landing/new",
      enabled: true,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
      color: "var(--brand-3)",
    },
    {
      key: "lead_magnet",
      label: "Recurso de Valor",
      description: "Crea guías y checklists para atraer y fidelizar clientes.",
      href: "/lead-magnet",
      enabled: business?.module_lead_magnet !== false,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "var(--brand-4)",
    },
    {
      key: "vip_benefits",
      label: "Beneficios VIP",
      description: "Gestiona beneficios exclusivos para tus mejores clientes.",
      href: "/vip-benefits",
      enabled: business?.module_vip_benefits !== false,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      color: "#a855f7",
    },
    {
      key: "tools",
      label: "Herramientas",
      description: "Acciones rápidas, WhatsApp y otros recursos para tu negocio.",
      href: "/acciones",
      enabled: business?.module_tools !== false,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: "var(--brand-3)",
    },
  ];

  const enabledModules = modules.filter((m) => m.enabled);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header bienvenida */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Logo / inicial */}
          <div className="w-16 h-16 rounded-xl border-2 border-[var(--border)] flex items-center justify-center overflow-hidden bg-[var(--background)] flex-shrink-0">
            {business?.logo_url ? (
              <img src={business.logo_url} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <span className="text-2xl font-bold text-[var(--brand-1)]">
                {business?.name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold truncate">{business?.name || "Mi Negocio"}</h1>
            {business?.description && (
              <p className="text-sm mt-1 line-clamp-2" style={{ color: "var(--foreground)", opacity: 0.7 }}>{business.description}</p>
            )}
            <div className="flex flex-wrap gap-3 mt-2 text-xs" style={{ color: "var(--foreground)", opacity: 0.6 }}>
              {business?.contact_email && <span>{business.contact_email}</span>}
              {business?.phone && <span>{business.phone}</span>}
            </div>
          </div>
          <Link
            href="/mi-negocio/perfil"
            className="text-xs px-4 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--brand-1)]/10 transition-colors flex-shrink-0"
          >
            Editar perfil
          </Link>
        </div>

        {/* Landing pública */}
        {business?.slug && (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg bg-[var(--background)] border border-[var(--border)]">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[var(--brand-3)]">Tu landing pública</p>
              <p className="text-sm truncate" style={{ color: "var(--foreground)", opacity: 0.8 }}>
                konecta3d.com/l/{business.slug}
              </p>
            </div>
            <a
              href={`/l/${business.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg bg-[var(--brand-4)] text-black font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              Ver landing →
            </a>
          </div>
        )}
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Leads captados", value: stats.leads, color: "var(--brand-4)", href: "/mi-negocio/cliente-ideal" },
          { label: "Recursos de Valor", value: stats.leadMagnets, color: "var(--brand-3)", href: "/lead-magnet" },
          { label: "Beneficios VIP", value: stats.benefits, color: "#a855f7", href: "/vip-benefits" },
          { label: "Landings creadas", value: stats.landings, color: "var(--brand-3)", href: "/landing/new" },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-center hover:border-[var(--brand-3)] transition-colors group"
          >
            <div className="text-3xl font-bold group-hover:scale-105 transition-transform" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--foreground)", opacity: 0.6 }}>{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Acceso rápido a módulos */}
      <div>
        <h2 className="text-base font-semibold mb-3">Acceso rápido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {enabledModules.map((mod) => (
            <Link
              key={mod.key}
              href={mod.href}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 flex items-start gap-4 hover:border-[var(--brand-3)] transition-colors group"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform"
                style={{ background: `${mod.color}22`, color: mod.color }}
              >
                {mod.icon}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm">{mod.label}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--foreground)", opacity: 0.6 }}>{mod.description}</div>
              </div>
              <svg className="w-4 h-4 flex-shrink-0 ml-auto self-center opacity-40 group-hover:opacity-80 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

      {/* Accesos de perfil */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/mi-negocio/perfil"
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 flex items-center gap-3 hover:border-[var(--brand-3)] transition-colors group"
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--brand-1)22", color: "var(--brand-1)" }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-sm">Mi Perfil</div>
            <div className="text-xs" style={{ color: "var(--foreground)", opacity: 0.6 }}>Datos del negocio y logo</div>
          </div>
          <svg className="w-4 h-4 flex-shrink-0 ml-auto opacity-40 group-hover:opacity-80 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link
          href="/mi-negocio/estadisticas"
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 flex items-center gap-3 hover:border-[var(--brand-3)] transition-colors group"
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--brand-3)22", color: "var(--brand-3)" }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-sm">Estadísticas</div>
            <div className="text-xs" style={{ color: "var(--foreground)", opacity: 0.6 }}>Clientes, beneficios y actividad</div>
          </div>
          <svg className="w-4 h-4 flex-shrink-0 ml-auto opacity-40 group-hover:opacity-80 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
