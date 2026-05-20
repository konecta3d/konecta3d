"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { CaptacionLead } from "@/types/captacion";
import ErrorBanner from "@/components/ui/ErrorBanner";

interface BusinessData {
  id: string;
  name: string;
  logo_url: string | null;
  contact_email: string;
  phone: string | null;
  description?: string | null; // columna opcional — puede no existir en el schema
}

interface ActiveCampaignInfo {
  id: string;
  name: string;
  slug: string;
  keychains_distributed: number;
}

interface CaptacionCounts {
  campaigns: number;
  activeCampaign: ActiveCampaignInfo | null;
  forms: number;
  leadMagnets: number;
  leads: number;
}

// ─── Semáforo ────────────────────────────────────────────────────────────────

type TrafficLight = "green" | "yellow" | "red";

function trafficLight(condition: { green: boolean; yellow: boolean }): TrafficLight {
  if (condition.green) return "green";
  if (condition.yellow) return "yellow";
  return "red";
}

const LIGHT_CLASSES: Record<TrafficLight, string> = {
  green: "bg-green-500/15 text-green-400 border-green-500/20",
  yellow: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  red: "bg-red-500/15 text-red-400 border-red-500/20",
};

const LIGHT_DOT: Record<TrafficLight, string> = {
  green: "bg-green-400",
  yellow: "bg-yellow-400",
  red: "bg-red-400",
};

// ─── Componente métrica ───────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  light,
  action,
  actionHref,
}: {
  label: string;
  value: string | number;
  sub?: string;
  light?: TrafficLight;
  action?: string;
  actionHref?: string;
}) {
  return (
    <div
      className={`rounded-xl border p-4 flex flex-col gap-1 ${
        light ? LIGHT_CLASSES[light] : "border-[var(--border)] bg-[var(--card)]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide opacity-60">{label}</span>
        {light && (
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${LIGHT_DOT[light]}`} />
        )}
      </div>
      <span className="text-2xl font-bold leading-none">{value}</span>
      {sub && <span className="text-xs opacity-60">{sub}</span>}
      {action && actionHref && (
        <Link
          href={actionHref}
          className="text-xs underline underline-offset-2 mt-1 opacity-80 hover:opacity-100 transition-opacity"
        >
          {action} →
        </Link>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CaptacionPage() {
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [counts, setCounts] = useState<CaptacionCounts>({
    campaigns: 0,
    activeCampaign: null,
    forms: 0,
    leadMagnets: 0,
    leads: 0,
  });
  const [allLeads, setAllLeads] = useState<CaptacionLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);

    const load = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        const email = sessionData?.session?.user?.email;
        if (!email || !token) { setLoading(false); return; }

        // Nota: 'description' no existe en el schema de businesses, se omite
        const { data: biz, error: bizError } = await supabase
          .from("businesses")
          .select("id, name, logo_url, contact_email, phone")
          .eq("contact_email", email)
          .single();

        if (bizError || !biz) {
          setLoadError("No se encontró tu negocio. Contacta con el administrador.");
          setLoading(false);
          return;
        }
        setBusiness(biz as BusinessData);

        const headers = { Authorization: `Bearer ${token}` };
        const qs = `businessId=${biz.id}`;

        const [campRes, formsRes, lmRes, leadsRes] = await Promise.all([
          fetch(`/api/captacion/campaigns?${qs}`, { headers }),
          fetch(`/api/captacion/forms?${qs}`, { headers }),
          fetch(`/api/captacion/lead-magnets?${qs}`, { headers }),
          fetch(`/api/captacion/leads?${qs}`, { headers }),
        ]);

        // Diagnóstico detallado: identificar qué API falló
        const failedApis: string[] = [];
        if (!campRes.ok)  failedApis.push(`campañas (${campRes.status})`);
        if (!leadsRes.ok) failedApis.push(`leads (${leadsRes.status})`);
        if (!formsRes.ok) failedApis.push(`formularios (${formsRes.status})`);
        if (!lmRes.ok)    failedApis.push(`lead magnets (${lmRes.status})`);

        if (failedApis.length > 0) {
          const is500 = [campRes, leadsRes, formsRes, lmRes].some(r => !r.ok && r.status >= 500);
          const msg = is500
            ? "Las tablas de Captación no están creadas en la base de datos. Ejecuta la migración de Captación en Supabase."
            : `Error al cargar datos: ${failedApis.join(", ")}. Recarga la página.`;
          throw new Error(msg);
        }

        const [campData, formsData, lmData, leadsData] = await Promise.all([
          campRes.json(), formsRes.json(), lmRes.json(), leadsRes.json(),
        ]);

        const campaigns = campData.campaigns || [];
        const leads: CaptacionLead[] = leadsData.leads || [];
        const active = campaigns.find((c: { status: string }) => c.status === "active") || null;

        setAllLeads(leads);
        setCounts({
          campaigns: campaigns.length,
          activeCampaign: active ? {
            id: active.id,
            name: active.name,
            slug: active.slug,
            keychains_distributed: active.keychains_distributed || 0,
          } : null,
          forms: (formsData.forms || []).length,
          leadMagnets: (lmData.leadMagnets || []).length,
          leads: leads.length,
        });
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Error al cargar el panel de Captación.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-1)] mx-auto mb-4" />
          <p className="text-sm text-[var(--foreground)]/50">Cargando...</p>
        </div>
      </div>
    );
  }

  // ── Cálculos de métricas ───────────────────────────────────────────────────

  const activeCampaignLeads = counts.activeCampaign
    ? allLeads.filter((l) => l.campaign_id === counts.activeCampaign!.id)
    : [];

  const uncontacted = activeCampaignLeads.filter((l) => l.status === "new");
  const contacted = activeCampaignLeads.filter((l) => l.status !== "new" && l.status !== "discarded");
  const delivered = activeCampaignLeads.filter((l) => l.lead_magnet_delivered);

  const now = Date.now();
  const oldUncontacted = uncontacted.filter(
    (l) => now - new Date(l.created_at).getTime() > 48 * 60 * 60 * 1000
  );

  const thisWeek = allLeads.filter(
    (l) => now - new Date(l.created_at).getTime() < 7 * 24 * 60 * 60 * 1000
  );

  const deliveryRate =
    activeCampaignLeads.length > 0
      ? Math.round((delivered.length / activeCampaignLeads.length) * 100)
      : null;

  const followUpRate =
    activeCampaignLeads.length > 0
      ? Math.round((contacted.length / activeCampaignLeads.length) * 100)
      : null;

  const kc = counts.activeCampaign?.keychains_distributed ?? 0;
  const conversionRate =
    kc > 0
      ? Math.round((activeCampaignLeads.length / kc) * 100)
      : null;

  // Semáforos
  const uncontactedLight = trafficLight({
    green: uncontacted.length <= 2 && oldUncontacted.length === 0,
    yellow: uncontacted.length <= 5 && oldUncontacted.length === 0,
  });

  const deliveryLight = deliveryRate !== null
    ? trafficLight({ green: deliveryRate >= 80, yellow: deliveryRate >= 50 })
    : undefined;

  const followUpLight = followUpRate !== null
    ? trafficLight({ green: followUpRate >= 70, yellow: followUpRate >= 40 })
    : undefined;

  // Acción recomendada
  const hasUrgentAction = uncontactedLight === "red" || (uncontactedLight === "yellow" && uncontacted.length > 3);
  const urgentMessage = oldUncontacted.length > 0
    ? `${oldUncontacted.length} lead${oldUncontacted.length > 1 ? "s" : ""} sin contactar desde hace más de 48h`
    : uncontacted.length > 3
    ? `${uncontacted.length} leads sin contactar todavía`
    : null;

  const sections = [
    {
      key: "campaigns",
      label: "Campañas",
      description: "Gestiona tus campañas de captación activas e inactivas.",
      href: "/captacion/campanas",
      count: counts.campaigns,
      countLabel: "campaña",
      countLabelPlural: "campañas",
      color: "var(--brand-1)",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
    },
    {
      key: "forms",
      label: "Formularios",
      description: "Crea y edita formularios de captación para tus eventos.",
      href: "/captacion/formularios",
      count: counts.forms,
      countLabel: "formulario",
      countLabelPlural: "formularios",
      color: "var(--brand-3)",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      key: "lead_magnets",
      label: "Lead Magnets",
      description: "PDFs, enlaces y códigos para atraer y captar nuevos clientes.",
      href: "/captacion/lead-magnets",
      count: counts.leadMagnets,
      countLabel: "recurso",
      countLabelPlural: "recursos",
      color: "var(--brand-4)",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      key: "leads",
      label: "Clientes captados",
      description: "Leads recogidos en tus campañas, con estado y notas.",
      href: "/captacion/clientes",
      count: counts.leads,
      countLabel: "lead",
      countLabelPlural: "leads",
      color: "var(--brand-3)",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      <ErrorBanner message={loadError} onDismiss={() => setLoadError(null)} />

      {/* ── Tarjeta identidad del negocio ── */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-xl border-2 border-[var(--border)] flex items-center justify-center overflow-hidden bg-[var(--background)] flex-shrink-0">
            {business?.logo_url ? (
              <img src={business.logo_url} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <span className="text-2xl font-bold" style={{ color: "var(--brand-1)" }}>
                {business?.name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{business?.name || "Mi Negocio"}</h1>
            {business?.description && (
              <p className="text-sm mt-0.5 line-clamp-1 text-[var(--foreground)]/60">{business.description}</p>
            )}
          </div>
          <Link
            href="/captacion/campanas"
            className="px-4 py-2 rounded-lg text-sm font-semibold flex-shrink-0"
            style={{ background: "var(--brand-1)", color: "white" }}
          >
            + Nueva campaña
          </Link>
        </div>
      </div>

      {/* ── Banner campaña activa ── */}
      {counts.activeCampaign && (
        <div className="rounded-xl p-5 border-2"
          style={{ background: "rgba(57,161,169,0.07)", borderColor: "var(--brand-1)" }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--brand-1)" }}>
                  Campaña activa
                </span>
              </div>
              <h2 className="text-lg font-bold">{counts.activeCampaign.name}</h2>
              <p className="text-sm text-[var(--foreground)]/60 mt-0.5">
                {activeCampaignLeads.length} lead{activeCampaignLeads.length !== 1 ? "s" : ""} capturado{activeCampaignLeads.length !== 1 ? "s" : ""}
              </p>
              <p className="text-xs mt-1.5 font-mono text-[var(--foreground)]/40">
                {origin}/c/{counts.activeCampaign.slug}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link
                href={`/captacion/clientes?campaignId=${counts.activeCampaign.id}`}
                className="px-3 py-2 rounded-lg text-sm font-medium border"
                style={{ borderColor: "var(--brand-1)", color: "var(--brand-1)" }}>
                Ver leads
              </Link>
              <Link
                href="/captacion/campanas"
                className="px-3 py-2 rounded-lg text-sm font-medium"
                style={{ background: "var(--brand-1)", color: "white" }}>
                Gestionar
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Métricas de campaña activa ── */}
      {counts.activeCampaign && activeCampaignLeads.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--brand-1)" }}>
            Métricas en tiempo real
          </h2>

          {/* Acción urgente */}
          {hasUrgentAction && urgentMessage && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse flex-shrink-0" />
                <span className="text-sm font-medium text-red-400">{urgentMessage}</span>
              </div>
              <Link
                href="/captacion/clientes"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 text-red-400 border border-red-500/30 hover:bg-red-500/15 transition-colors"
              >
                Contactar ahora →
              </Link>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              label="Leads captados"
              value={activeCampaignLeads.length}
              sub={`+${thisWeek.length} esta semana`}
            />
            <MetricCard
              label="Sin contactar"
              value={uncontacted.length}
              sub={oldUncontacted.length > 0 ? `${oldUncontacted.length} llevan +48h` : "Al día"}
              light={uncontactedLight}
              action={uncontacted.length > 0 ? "Ver lista" : undefined}
              actionHref="/captacion/clientes"
            />
            {followUpRate !== null && (
              <MetricCard
                label="Seguimiento"
                value={`${followUpRate}%`}
                sub={`${contacted.length} de ${activeCampaignLeads.length} contactados`}
                light={followUpLight}
              />
            )}
            {deliveryRate !== null && (
              <MetricCard
                label="Lead magnet"
                value={`${deliveryRate}%`}
                sub="entregado"
                light={deliveryLight}
              />
            )}
            {conversionRate !== null && kc > 0 && (
              <MetricCard
                label="Conversión"
                value={`${conversionRate}%`}
                sub={`${activeCampaignLeads.length}/${kc} llaveros`}
                light={trafficLight({ green: conversionRate >= 25, yellow: conversionRate >= 10 })}
              />
            )}
          </div>

          {/* Leyenda semáforo */}
          <div className="flex items-center gap-4 text-xs text-[var(--foreground)]/30 pl-1">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400" />Bien</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />Revisar</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />Actuar</span>
          </div>
        </div>
      )}

      {/* ── Secciones del perfil ── */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--brand-1)" }}>
          Perfil de Captación
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sections.map((s) => (
            <Link
              key={s.key}
              href={s.href}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 flex items-center gap-3 hover:border-[var(--brand-1)]/40 transition-colors group"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${s.color}22`, color: s.color }}
              >
                {s.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm">{s.label}</div>
                <div className="text-xs mt-0.5 text-[var(--foreground)]/50">{s.description}</div>
              </div>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ background: `${s.color}22`, color: s.color }}
              >
                {s.count} {s.count === 1 ? s.countLabel : s.countLabelPlural}
              </span>
              <svg className="w-4 h-4 flex-shrink-0 opacity-30 group-hover:opacity-70 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
