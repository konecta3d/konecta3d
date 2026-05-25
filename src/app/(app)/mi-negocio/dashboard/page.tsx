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

interface ModuleCounts {
  landings: number;
  leadMagnets: number;
  benefits: number;
  leads: number;
  forms: number;
}

export default function DashboardPage() {
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [counts, setCounts] = useState<ModuleCounts>({ landings: 0, leadMagnets: 0, benefits: 0, leads: 0, forms: 0 });
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

      // Consultar todos los módulos en paralelo
      const [landingsRes, leadsRes, leadMagnetsRes, benefitsRes, formsRes] = await Promise.all([
        supabase.from("landing_configs").select("id", { count: "exact", head: true }).eq("business_id", biz.id).then(r => ({ count: r.count })),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("business_id", biz.id).then(r => ({ count: r.count })),
        biz.module_lead_magnet !== false
          ? supabase.from("lead_magnets").select("id", { count: "exact", head: true }).eq("business_id", biz.id).eq("active", true).then(r => ({ count: r.count }))
          : Promise.resolve({ count: 0 }),
        biz.module_vip_benefits !== false
          ? supabase.from("benefits").select("id", { count: "exact", head: true }).eq("business_id", biz.id).eq("active", true).then(r => ({ count: r.count }))
          : Promise.resolve({ count: 0 }),
        biz.module_forms !== false
          ? supabase.from("fidelizacion_forms").select("id", { count: "exact", head: true }).eq("business_id", biz.id).then(r => ({ count: r.count }))
          : Promise.resolve({ count: 0 }),
      ]);

      setCounts({
        landings: landingsRes.count || 0,
        leads: leadsRes.count || 0,
        leadMagnets: leadMagnetsRes.count || 0,
        benefits: benefitsRes.count || 0,
        forms: formsRes.count || 0,
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

  // Módulos generadores — se muestran solo si están activos
  const generadores = [
    {
      key: "landing",
      label: "Landing",
      description: "Tu página pública con datos de contacto y servicios.",
      href: "/landing/new",
      enabled: true,
      count: counts.landings,
      countLabel: "creada",
      countLabelPlural: "creadas",
      color: "var(--brand-3)",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
    },
    {
      key: "lead_magnet",
      label: "Recurso de Valor",
      description: "Guías y checklists para atraer y fidelizar clientes.",
      href: "/lead-magnet",
      enabled: business?.module_lead_magnet !== false,
      count: counts.leadMagnets,
      countLabel: "activo",
      countLabelPlural: "activos",
      color: "var(--brand-4)",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      key: "vip_benefits",
      label: "Beneficios VIP",
      description: "Beneficios exclusivos para tus mejores clientes.",
      href: "/vip-benefits",
      enabled: business?.module_vip_benefits !== false,
      count: counts.benefits,
      countLabel: "activo",
      countLabelPlural: "activos",
      color: "#a855f7",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
    },
    {
      key: "forms",
      label: "Formularios",
      description: "Crea formularios de feedback y satisfacción.",
      href: "/formularios",
      enabled: business?.module_forms !== false,
      count: counts.forms,
      countLabel: "formulario",
      countLabelPlural: "formularios",
      color: "var(--brand-3)",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      key: "tools",
      label: "Herramientas",
      description: "Acciones rápidas, WhatsApp y recursos del negocio.",
      href: "/acciones",
      enabled: business?.module_tools !== false,
      count: null,
      countLabel: "",
      countLabelPlural: "",
      color: "var(--brand-3)",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ].filter((m) => m.enabled);

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Tarjeta de identidad del negocio */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
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
              <p className="text-sm mt-1 line-clamp-2" style={{ color: "var(--foreground)", opacity: 0.7 }}>
                {business.description}
              </p>
            )}
            <div className="flex flex-wrap gap-3 mt-2 text-xs" style={{ color: "var(--foreground)", opacity: 0.55 }}>
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

      </div>

      {/* Generadores — solo módulos activos */}
      {generadores.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-1)] mb-3">Generadores</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {generadores.map((mod) => (
              <Link
                key={mod.key}
                href={mod.href}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 flex items-center gap-3 hover:border-[var(--brand-3)] transition-colors group"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${mod.color}22`, color: mod.color }}
                >
                  {mod.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm">{mod.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--foreground)", opacity: 0.55 }}>{mod.description}</div>
                </div>
                {mod.count !== null && (
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: `${mod.color}22`, color: mod.color }}
                  >
                    {mod.count} {mod.count === 1 ? mod.countLabel : mod.countLabelPlural}
                  </span>
                )}
                <svg className="w-4 h-4 flex-shrink-0 opacity-30 group-hover:opacity-70 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
