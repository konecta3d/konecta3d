"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Tab = "plataforma" | "clientes";

type PlatformStats = {
  benefitsActive: number;
  clientsTotal: number;
  productsTotal: number;
  leadsLast7d: number;
  leadsLast30d: number;
};

type CtaClick = {
  cta: string;
  count: number;
  label: string;
};

type BehaviorStats = {
  viewsToday: number;
  viewsWeek: number;
  viewsMonth: number;
  ctaClicks: CtaClick[];
  totalClicks: number;
  pdfDownloads: number;
  conversionRate: number;  // leads_30d / views_30d * 100
  bounceRate: number;      // visitas sin clic / visitas * 100
};

// ── Componentes auxiliares ────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  description,
  color = "var(--brand-1)",
  badge,
  disabled,
}: {
  title: string;
  value: string | number;
  description?: string;
  color?: string;
  badge?: string;
  disabled?: boolean;
}) {
  return (
    <div className={`rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 relative ${disabled ? "opacity-50" : ""}`}>
      {badge && (
        <span className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/50">
          {badge}
        </span>
      )}
      <p className="text-xs text-[var(--foreground)]/60 mb-1">{title}</p>
      <p className="text-3xl font-bold" style={{ color }}>{value}</p>
      {description && <p className="text-xs text-[var(--foreground)]/50 mt-1">{description}</p>}
    </div>
  );
}

function CtaBar({ cta, max }: { cta: CtaClick; max: number }) {
  const pct = max > 0 ? (cta.count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[var(--foreground)]/60 w-24 shrink-0 truncate">{cta.label}</span>
      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--brand-1)] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold w-10 text-right">{cta.count}</span>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function EstadisticasPage() {
  const [tab, setTab] = useState<Tab>("plataforma");
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState<PlatformStats>({
    benefitsActive: 0,
    clientsTotal: 0,
    productsTotal: 0,
    leadsLast7d: 0,
    leadsLast30d: 0,
  });
  const [behavior, setBehavior] = useState<BehaviorStats>({
    viewsToday: 0,
    viewsWeek: 0,
    viewsMonth: 0,
    ctaClicks: [],
    totalClicks: 0,
    pdfDownloads: 0,
    conversionRate: 0,
    bounceRate: 0,
  });

  useEffect(() => {
    const load = async () => {
      // Resolver businessId desde sesión
      const { data: sessionData } = await supabase.auth.getSession();
      const userEmail = sessionData.session?.user?.email || "";
      if (!userEmail) { setLoading(false); return; }
      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("contact_email", userEmail)
        .single();
      const bid = biz?.id || "";
      if (!bid) { setLoading(false); return; }

      // ── Métricas de plataforma ─────────────────────────────────────────────
      const now = new Date();
      const since7d = new Date(now); since7d.setDate(now.getDate() - 7);
      const since30d = new Date(now); since30d.setDate(now.getDate() - 30);

      const [
        { count: benefits },
        { count: clients },
        { count: products },
        { count: leads7d },
        { count: leads30d },
      ] = await Promise.all([
        supabase.from("benefits").select("*", { count: "exact", head: true }).eq("business_id", bid).eq("active", true),
        supabase.from("clients").select("*", { count: "exact", head: true }).eq("business_id", bid),
        supabase.from("products_services").select("*", { count: "exact", head: true }).eq("business_id", bid).eq("active", true),
        supabase.from("clients").select("*", { count: "exact", head: true }).eq("business_id", bid).gte("created_at", since7d.toISOString()),
        supabase.from("clients").select("*", { count: "exact", head: true }).eq("business_id", bid).gte("created_at", since30d.toISOString()),
      ]);

      setPlatform({
        benefitsActive: benefits || 0,
        clientsTotal: clients || 0,
        productsTotal: products || 0,
        leadsLast7d: leads7d || 0,
        leadsLast30d: leads30d || 0,
      });

      // ── Métricas de comportamiento ─────────────────────────────────────────
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const since1d = today.toISOString();

      const [
        { count: viewsToday },
        { count: viewsWeek },
        { count: viewsMonth },
        { data: analyticsRaw },
      ] = await Promise.all([
        supabase.from("analytics_events").select("*", { count: "exact", head: true }).eq("business_id", bid).eq("event_type", "page_view").gte("created_at", since1d),
        supabase.from("analytics_events").select("*", { count: "exact", head: true }).eq("business_id", bid).eq("event_type", "page_view").gte("created_at", since7d.toISOString()),
        supabase.from("analytics_events").select("*", { count: "exact", head: true }).eq("business_id", bid).eq("event_type", "page_view").gte("created_at", since30d.toISOString()),
        supabase.from("analytics_events").select("event_type, metadata, created_at").eq("business_id", bid).gte("created_at", since30d.toISOString()),
      ]);

      const events = analyticsRaw || [];

      // Clics por CTA (solo cta_number 1, 2, 3)
      const ctaMap: Record<string, number> = { "1": 0, "2": 0, "3": 0 };
      let pdfDownloads = 0;
      const daysWithClickSet = new Set<string>();

      for (const ev of events) {
        if (ev.event_type === "cta_click") {
          const num = String(ev.metadata?.cta_number ?? "");
          if (num in ctaMap) ctaMap[num]++;
          const day = ev.created_at.slice(0, 10);
          daysWithClickSet.add(day);
        }
        if (ev.event_type === "pdf_download") pdfDownloads++;
      }

      // Reconstruir labels de CTA desde la landing config
      const { data: landingRow } = await supabase
        .from("landing_configs")
        .select("config")
        .eq("business_id", bid)
        .single();

      let cfg: Record<string, string> = {};
      if (landingRow?.config) {
        const raw = landingRow.config;
        const resolved = raw.versions
          ? (raw.versions[raw.published || "A"] || raw.versions["A"] || {})
          : raw;
        cfg = resolved;
      }

      const ctaClicks: CtaClick[] = [
        { cta: "1", count: ctaMap["1"], label: cfg.cta1Text || "CTA 1" },
        { cta: "2", count: ctaMap["2"], label: cfg.cta2Text || "CTA 2" },
        { cta: "3", count: ctaMap["3"], label: cfg.cta3Text || "CTA 3" },
      ];
      const totalClicks = ctaClicks.reduce((s, c) => s + c.count, 0);

      // Tasa de conversión: leads_30d / views_month * 100
      const vMonth = viewsMonth || 0;
      const conversionRate = vMonth > 0 ? Math.round(((leads30d || 0) / vMonth) * 100 * 10) / 10 : 0;

      // Rebote implícito: días con visita pero sin ningún clic / días con visita
      // Usamos días como unidad para no contar múltiples visitas del mismo usuario
      const daysWithViewSet = new Set(
        events.filter(e => e.event_type === "page_view").map(e => e.created_at.slice(0, 10))
      );
      const bounceDays = [...daysWithViewSet].filter(d => !daysWithClickSet.has(d)).length;
      const bounceRate = daysWithViewSet.size > 0 ? Math.round((bounceDays / daysWithViewSet.size) * 100) : 0;

      setBehavior({
        viewsToday: viewsToday || 0,
        viewsWeek: viewsWeek || 0,
        viewsMonth: viewsMonth || 0,
        ctaClicks,
        totalClicks,
        pdfDownloads,
        conversionRate,
        bounceRate,
      });

      setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--brand-1)]" />
      </div>
    );
  }

  const maxClicks = Math.max(...behavior.ctaClicks.map(c => c.count), 1);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Cabecera */}
      <div>
        <h1 className="text-2xl font-bold">Estadísticas</h1>
        <p className="text-sm text-[var(--foreground)]/60 mt-1">
          Datos actualizados en tiempo real
        </p>
      </div>

      {/* Pestañas */}
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--background)] border border-[var(--border)] w-fit">
        {(["plataforma", "clientes"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t
                ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--foreground)]/50 hover:text-[var(--foreground)]/80"
            }`}
          >
            {t === "plataforma" ? "Plataforma" : "Comportamiento"}
          </button>
        ))}
      </div>

      {/* ── TAB: Plataforma ───────────────────────────────────────────────── */}
      {tab === "plataforma" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              title="Beneficios activos"
              value={platform.benefitsActive}
              description="Beneficios que tus clientes pueden usar"
              color="var(--brand-4)"
            />
            <StatCard
              title="Clientes registrados"
              value={platform.clientsTotal}
              description="Total en tu base de datos"
              color="var(--brand-3)"
            />
            <StatCard
              title="Productos / Servicios"
              value={platform.productsTotal}
              description="Dados de alta en el catálogo"
              color="var(--brand-2)"
            />
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h2 className="text-sm font-semibold mb-4">Nuevos clientes capturados</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-[var(--foreground)]/60">Últimos 7 días</p>
                <p className="text-3xl font-bold text-green-500 mt-1">{platform.leadsLast7d}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--foreground)]/60">Últimos 30 días</p>
                <p className="text-3xl font-bold text-green-400 mt-1">{platform.leadsLast30d}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Comportamiento ───────────────────────────────────────────── */}
      {tab === "clientes" && (
        <div className="space-y-4">

          {/* Visitas a la landing */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h2 className="text-sm font-semibold mb-4">Visitas a la landing</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-[var(--foreground)]/50 mb-1">Hoy</p>
                <p className="text-3xl font-bold text-[var(--brand-1)]">{behavior.viewsToday}</p>
              </div>
              <div className="text-center border-x border-[var(--border)]">
                <p className="text-[10px] uppercase tracking-wider text-[var(--foreground)]/50 mb-1">Esta semana</p>
                <p className="text-3xl font-bold text-[var(--brand-1)]">{behavior.viewsWeek}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-[var(--foreground)]/50 mb-1">Este mes</p>
                <p className="text-3xl font-bold text-[var(--brand-1)]">{behavior.viewsMonth}</p>
              </div>
            </div>
          </div>

          {/* CTAs + Conversión + Rebote */}
          <div className="grid gap-4 sm:grid-cols-2">

            {/* CTAs más pulsados */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold">CTAs más pulsados</h2>
                <span className="text-xs text-[var(--foreground)]/50">{behavior.totalClicks} total</span>
              </div>
              {behavior.totalClicks === 0 ? (
                <p className="text-xs text-[var(--foreground)]/40 text-center py-4">
                  Sin clics registrados aún
                </p>
              ) : (
                <div className="space-y-3">
                  {behavior.ctaClicks
                    .sort((a, b) => b.count - a.count)
                    .map((cta) => (
                      <CtaBar key={cta.cta} cta={cta} max={maxClicks} />
                    ))}
                </div>
              )}
            </div>

            {/* Conversión + Rebote + PDF */}
            <div className="space-y-4">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                <p className="text-xs text-[var(--foreground)]/60 mb-1">Tasa de conversión</p>
                <p className="text-3xl font-bold text-green-500">{behavior.conversionRate}%</p>
                <p className="text-xs text-[var(--foreground)]/40 mt-1">
                  leads captados / visitas (últimos 30 días)
                </p>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                <p className="text-xs text-[var(--foreground)]/60 mb-1">Rebote implícito</p>
                <p className="text-3xl font-bold text-orange-400">{behavior.bounceRate}%</p>
                <p className="text-xs text-[var(--foreground)]/40 mt-1">
                  días con visitas sin ningún clic
                </p>
              </div>
            </div>
          </div>

          {/* Descargas PDF */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <p className="text-xs text-[var(--foreground)]/60 mb-1">Descargas de Recursos de Valor</p>
              <p className="text-3xl font-bold text-[var(--brand-4)]">{behavior.pdfDownloads}</p>
              <p className="text-xs text-[var(--foreground)]/40 mt-1">últimos 30 días</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 opacity-40">
              <p className="text-xs text-[var(--foreground)]/60 mb-1">Descargas de Beneficios VIP</p>
              <p className="text-3xl font-bold text-blue-400">—</p>
              <p className="text-xs text-[var(--foreground)]/40 mt-1">próximamente</p>
            </div>
          </div>

          {/* Formularios — inactivo */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 opacity-40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--foreground)]/60 mb-1">Formularios completados</p>
                <p className="text-3xl font-bold">—</p>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/50">
                Próximamente
              </span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
