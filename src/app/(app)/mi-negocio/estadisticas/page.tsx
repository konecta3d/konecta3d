"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// ── Tipos ─────────────────────────────────────────────────────────────────────

type CtaClick        = { cta: string; count: number; label: string };
type LeadMagnetStat = { id: string; title: string; ctaClicks: number; downloads: number };
type MonthlyNPS     = { label: string; nps: number; count: number };

type BehaviorStats = {
  viewsToday: number; viewsWeek: number; viewsMonth: number;
  ctaClicks: CtaClick[]; totalClicks: number;
  pdfDownloads: number; conversionRate: number; bounceRate: number;
};

type ResourceStats = {
  leadMagnets: LeadMagnetStat[];
  totalCtaClicks: number;
  totalDownloads: number;
};

type FidelizacionStats = {
  totalResponses: number;
  nps: number | null;
  avgRating: number | null;
  responseRate: number;
  promotersPct: number;
  passivesPct: number;
  detractorsPct: number;
  monthlyNPS: MonthlyNPS[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function npsColor(nps: number | null): string {
  if (nps === null) return "var(--foreground)";
  if (nps >= 50)  return "#22c55e";
  if (nps >= 20)  return "var(--brand-1)";
  if (nps >= 0)   return "#f59e0b";
  return "#f87171";
}

const MONTH_LABELS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

// ── Componentes de visualización ──────────────────────────────────────────────

function BarRow({ label, count, max, color = "var(--brand-1)" }: {
  label: string; count: number; max: number; color?: string;
}) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[var(--foreground)]/60 w-28 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold w-8 text-right">{count}</span>
    </div>
  );
}

function NpsDistribution({ p, pa, d }: { p: number; pa: number; d: number }) {
  if (p + pa + d === 0) {
    return <p className="text-xs text-[var(--foreground)]/40 text-center py-2">Sin datos suficientes</p>;
  }
  return (
    <div className="space-y-2">
      <div className="flex h-4 rounded-full overflow-hidden gap-px">
        {d > 0 && <div style={{ width: `${d}%`, background: "#f87171" }} title={`Detractores ${d}%`} />}
        {pa > 0 && <div style={{ width: `${pa}%`, background: "#f59e0b" }} title={`Pasivos ${pa}%`} />}
        {p > 0 && <div style={{ width: `${p}%`, background: "#22c55e" }} title={`Promotores ${p}%`} />}
      </div>
      <div className="flex justify-between text-[10px] text-[var(--foreground)]/50">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"/>Detractores {d}%</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"/>Pasivos {pa}%</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"/>Promotores {p}%</span>
      </div>
    </div>
  );
}

function MiniNpsChart({ months }: { months: MonthlyNPS[] }) {
  if (months.length === 0) {
    return <p className="text-xs text-[var(--foreground)]/40 text-center py-4">Sin datos suficientes</p>;
  }
  const maxAbs = Math.max(...months.map(m => Math.abs(m.nps)), 10);
  return (
    <div className="flex items-end gap-2 h-24">
      {months.map((m, i) => {
        const heightPct = Math.abs(m.nps) / maxAbs * 100;
        const isPos = m.nps >= 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[9px] font-semibold" style={{ color: npsColor(m.nps) }}>
              {m.nps > 0 ? "+" : ""}{m.nps}
            </span>
            <div className="w-full flex items-end" style={{ height: "56px" }}>
              <div
                className="w-full rounded-t-sm transition-all"
                style={{
                  height: `${Math.max(heightPct, 4)}%`,
                  background: isPos ? "#22c55e" : "#f87171",
                  opacity: m.count === 0 ? 0.2 : 1,
                }}
              />
            </div>
            <span className="text-[9px] text-[var(--foreground)]/40 truncate w-full text-center">{m.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function EstadisticasPage() {
  const [loading, setLoading] = useState(true);
  const [behavior, setBehavior] = useState<BehaviorStats>({
    viewsToday: 0, viewsWeek: 0, viewsMonth: 0,
    ctaClicks: [], totalClicks: 0, pdfDownloads: 0, conversionRate: 0, bounceRate: 0,
  });
  const [resources, setResources] = useState<ResourceStats>({ leadMagnets: [], totalCtaClicks: 0, totalDownloads: 0 });
  const [fidelizacion, setFidelizacion] = useState<FidelizacionStats>({
    totalResponses: 0, nps: null, avgRating: null, responseRate: 0,
    promotersPct: 0, passivesPct: 0, detractorsPct: 0, monthlyNPS: [],
  });

  useEffect(() => {
    const load = async () => {
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

      // ── Rangos de fechas ────────────────────────────────────────────────────
      const now     = new Date();
      const since7d  = new Date(now); since7d.setDate(now.getDate() - 7);
      const since30d = new Date(now); since30d.setDate(now.getDate() - 30);
      const since6m  = new Date(now); since6m.setMonth(now.getMonth() - 6);
      const today    = new Date(now); today.setHours(0, 0, 0, 0);

      // ── Consultas en paralelo ───────────────────────────────────────────────
      const [
        { count: viewsToday },
        { count: viewsWeek },
        { count: viewsMonth },
        { count: leads30d },
        { count: clientsTotal },
        { data: analyticsRaw },
        { data: lmRows },
        { data: lmEventsRaw },
        { data: feedbackRaw },
        { data: landingRow },
      ] = await Promise.all([
        // 0 — visitas hoy
        supabase.from("analytics_events").select("*", { count: "exact", head: true })
          .eq("business_id", bid).eq("event_type", "page_view").gte("created_at", today.toISOString()),
        // 1 — visitas semana
        supabase.from("analytics_events").select("*", { count: "exact", head: true })
          .eq("business_id", bid).eq("event_type", "page_view").gte("created_at", since7d.toISOString()),
        // 2 — visitas mes
        supabase.from("analytics_events").select("*", { count: "exact", head: true })
          .eq("business_id", bid).eq("event_type", "page_view").gte("created_at", since30d.toISOString()),
        // 3 — leads 30d (conversión)
        supabase.from("clients").select("*", { count: "exact", head: true })
          .eq("business_id", bid).gte("created_at", since30d.toISOString()),
        // 4 — clientes totales (tasa de respuesta)
        supabase.from("clients").select("*", { count: "exact", head: true })
          .eq("business_id", bid),
        // 5 — todos los analytics del negocio (30d) para CTAs y rebote
        supabase.from("analytics_events")
          .select("event_type, metadata, created_at")
          .eq("business_id", bid).gte("created_at", since30d.toISOString()),
        // 6 — lead magnets activos
        supabase.from("lead_magnets")
          .select("id, title")
          .eq("business_id", bid)
          .eq("active", true)
          .order("created_at", { ascending: false }),
        // 7 — eventos de lead magnets (todos los históricos: resource_cta_click + pdf_download)
        supabase.from("analytics_events")
          .select("event_type, entity_id")
          .eq("business_id", bid)
          .eq("entity_type", "lead_magnet"),
        // 8 — feedback de fidelización (6 meses)
        supabase.from("fidelizacion_feedback")
          .select("nps_score, avg_rating, submitted_at")
          .eq("business_id", bid)
          .gte("submitted_at", since6m.toISOString())
          .order("submitted_at", { ascending: true }),
        // 9 — config de landing (labels de CTAs)
        supabase.from("landing_configs").select("config").eq("business_id", bid).single(),
      ]);

      // ── Behavior stats ──────────────────────────────────────────────────────
      const events = analyticsRaw || [];
      const ctaMap: Record<string, number> = { "1": 0, "2": 0, "3": 0 };
      let pdfDownloads = 0;
      const daysWithClickSet = new Set<string>();

      for (const ev of events) {
        if (ev.event_type === "cta_click") {
          const num = String(ev.metadata?.cta_number ?? "");
          if (num in ctaMap) ctaMap[num]++;
          daysWithClickSet.add(ev.created_at.slice(0, 10));
        }
        if (ev.event_type === "pdf_download") pdfDownloads++;
      }

      let cfg: Record<string, string> = {};
      if (landingRow?.config) {
        const raw = landingRow.config;
        cfg = raw.versions ? (raw.versions[raw.published || "A"] || raw.versions["A"] || {}) : raw;
      }

      const ctaClicks: CtaClick[] = [
        { cta: "1", count: ctaMap["1"], label: cfg.cta1Text || "CTA 1" },
        { cta: "2", count: ctaMap["2"], label: cfg.cta2Text || "CTA 2" },
        { cta: "3", count: ctaMap["3"], label: cfg.cta3Text || "CTA 3" },
      ];
      const totalCtaClicks = ctaClicks.reduce((s, c) => s + c.count, 0);
      const vMonth = viewsMonth || 0;
      const conversionRate = vMonth > 0 ? Math.round(((leads30d || 0) / vMonth) * 100 * 10) / 10 : 0;
      const daysWithViewSet = new Set(events.filter(e => e.event_type === "page_view").map(e => e.created_at.slice(0, 10)));
      const bounceDays = [...daysWithViewSet].filter(d => !daysWithClickSet.has(d)).length;
      const bounceRate = daysWithViewSet.size > 0 ? Math.round((bounceDays / daysWithViewSet.size) * 100) : 0;

      setBehavior({
        viewsToday: viewsToday || 0, viewsWeek: viewsWeek || 0, viewsMonth: vMonth,
        ctaClicks, totalClicks: totalCtaClicks, pdfDownloads, conversionRate, bounceRate,
      });

      // ── Resource stats (lead magnets reales) ────────────────────────────────
      const lmClickMap:    Record<string, number> = {};
      const lmDownloadMap: Record<string, number> = {};
      for (const ev of lmEventsRaw ?? []) {
        if (!ev.entity_id) continue;
        if (ev.event_type === "resource_cta_click") lmClickMap[ev.entity_id]    = (lmClickMap[ev.entity_id]    || 0) + 1;
        if (ev.event_type === "pdf_download")        lmDownloadMap[ev.entity_id] = (lmDownloadMap[ev.entity_id] || 0) + 1;
      }

      const leadMagnetStats: LeadMagnetStat[] = (lmRows ?? []).map(lm => ({
        id:        lm.id,
        title:     lm.title || "Sin título",
        ctaClicks: lmClickMap[lm.id]    || 0,
        downloads: lmDownloadMap[lm.id] || 0,
      })).sort((a, b) => (b.ctaClicks + b.downloads) - (a.ctaClicks + a.downloads));

      const totalResCtaClicks = leadMagnetStats.reduce((s, r) => s + r.ctaClicks, 0);
      const totalResDownloads = leadMagnetStats.reduce((s, r) => s + r.downloads, 0);
      setResources({ leadMagnets: leadMagnetStats, totalCtaClicks: totalResCtaClicks, totalDownloads: totalResDownloads });

      // ── Fidelización stats ──────────────────────────────────────────────────
      const feedback = feedbackRaw || [];
      const total = feedback.length;

      // NPS + distribución
      const withNps = feedback.filter(f => f.nps_score !== null);
      let promoters = 0, passives = 0, detractors = 0;
      for (const f of withNps) {
        if (f.nps_score >= 9) promoters++;
        else if (f.nps_score >= 7) passives++;
        else detractors++;
      }
      const npsTotal = withNps.length;
      const nps = npsTotal > 0
        ? Math.round(((promoters - detractors) / npsTotal) * 100)
        : null;
      const promotersPct  = npsTotal > 0 ? Math.round((promoters  / npsTotal) * 100) : 0;
      const passivesPct   = npsTotal > 0 ? Math.round((passives   / npsTotal) * 100) : 0;
      const detractorsPct = npsTotal > 0 ? Math.round((detractors / npsTotal) * 100) : 0;

      // Puntuación media (avg_rating)
      const withRating = feedback.filter(f => f.avg_rating !== null);
      const avgRating = withRating.length > 0
        ? Math.round((withRating.reduce((s, f) => s + f.avg_rating, 0) / withRating.length) * 10) / 10
        : null;

      // Tasa de respuesta
      const responseRate = (clientsTotal || 0) > 0
        ? Math.round((total / (clientsTotal as number)) * 100)
        : 0;

      // Tendencia NPS mensual (últimos 6 meses)
      const monthlyMap: Record<string, { promoters: number; detractors: number; total: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now);
        d.setMonth(now.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthlyMap[key] = { promoters: 0, detractors: 0, total: 0 };
      }
      for (const f of feedback) {
        if (f.nps_score === null) continue;
        const key = f.submitted_at.slice(0, 7); // "YYYY-MM"
        if (!(key in monthlyMap)) continue;
        monthlyMap[key].total++;
        if (f.nps_score >= 9) monthlyMap[key].promoters++;
        else if (f.nps_score <= 6) monthlyMap[key].detractors++;
      }
      const monthlyNPS: MonthlyNPS[] = Object.entries(monthlyMap).map(([key, { promoters: p, detractors: d, total: t }]) => {
        const [year, month] = key.split("-");
        const label = `${MONTH_LABELS[parseInt(month) - 1]} ${year.slice(2)}`;
        const npsVal = t > 0 ? Math.round(((p - d) / t) * 100) : 0;
        return { label, nps: npsVal, count: t };
      });

      setFidelizacion({ totalResponses: total, nps, avgRating, responseRate, promotersPct, passivesPct, detractorsPct, monthlyNPS });
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

  const maxCtaClicks = Math.max(...behavior.ctaClicks.map(c => c.count), 1);

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      {/* ── Cabecera ─────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold">Estadísticas</h1>
        <p className="text-sm text-[var(--foreground)]/60 mt-1">Comportamiento de tu landing · últimos 30 días</p>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* BLOQUE 1 — Visitas a la landing                                       */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/40">Landing</h2>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="text-sm font-semibold mb-4">Visitas</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Hoy", value: behavior.viewsToday },
              { label: "Esta semana", value: behavior.viewsWeek },
              { label: "Este mes", value: behavior.viewsMonth },
            ].map(({ label, value }, i) => (
              <div key={i} className={`text-center ${i === 1 ? "border-x border-[var(--border)]" : ""}`}>
                <p className="text-[10px] uppercase tracking-wider text-[var(--foreground)]/50 mb-1">{label}</p>
                <p className="text-3xl font-bold text-[var(--brand-1)]">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:gap-6">
          {/* CTAs más pulsados */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold">CTAs más pulsados</p>
              <span className="text-xs text-[var(--foreground)]/50">{behavior.totalClicks} total</span>
            </div>
            {behavior.totalClicks === 0 ? (
              <p className="text-xs text-[var(--foreground)]/40 text-center py-4">Sin clics registrados aún</p>
            ) : (
              <div className="space-y-3">
                {[...behavior.ctaClicks].sort((a, b) => b.count - a.count).map(cta => (
                  <BarRow key={cta.cta} label={cta.label} count={cta.count} max={maxCtaClicks} />
                ))}
              </div>
            )}
          </div>

          {/* Conversión + Rebote */}
          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <p className="text-xs text-[var(--foreground)]/60 mb-1">Tasa de conversión</p>
              <p className="text-3xl font-bold text-green-500">{behavior.conversionRate}%</p>
              <p className="text-xs text-[var(--foreground)]/40 mt-1">leads captados / visitas (30 días)</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <p className="text-xs text-[var(--foreground)]/60 mb-1">Rebote implícito</p>
              <p className="text-3xl font-bold text-orange-400">{behavior.bounceRate}%</p>
              <p className="text-xs text-[var(--foreground)]/40 mt-1">días con visitas sin ningún clic</p>
            </div>
          </div>
        </div>

        {/* Descargas */}
        <div className="grid gap-4 sm:grid-cols-2 xl:gap-6">
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
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* BLOQUE 2 — Recursos de Valor                                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/40">Recursos de Valor</h2>

        {/* Métricas rápidas */}
        <div className="grid gap-4 sm:grid-cols-3 xl:gap-6">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-xs text-[var(--foreground)]/60 mb-1">Recursos creados</p>
            <p className="text-3xl font-bold text-[var(--brand-1)]">{resources.leadMagnets.length}</p>
            <p className="text-xs text-[var(--foreground)]/40 mt-1">lead magnets activos</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-xs text-[var(--foreground)]/60 mb-1">Interés total (clics CTA)</p>
            <p className="text-3xl font-bold text-purple-400">{resources.totalCtaClicks}</p>
            <p className="text-xs text-[var(--foreground)]/40 mt-1">veces que se pulsó el botón</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-xs text-[var(--foreground)]/60 mb-1">Descargas totales</p>
            <p className="text-3xl font-bold" style={{ color: "var(--brand-4)" }}>{resources.totalDownloads}</p>
            <p className="text-xs text-[var(--foreground)]/40 mt-1">PDFs descargados</p>
          </div>
        </div>

        {/* Tabla de recursos con interacciones */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold">Interés por recurso</p>
            <span className="text-xs text-[var(--foreground)]/50">histórico completo</span>
          </div>
          {resources.leadMagnets.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-[var(--foreground)]/40">No tienes recursos de valor creados aún</p>
              <p className="text-[10px] text-[var(--foreground)]/25 mt-1">
                Crea un lead magnet y asígnalo a un CTA de tu landing para empezar a medir interacciones
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Cabecera */}
              <div className="flex items-center gap-3 pb-2 border-b border-[var(--border)]">
                <span className="text-[10px] uppercase tracking-wider text-[var(--foreground)]/40 flex-1">Recurso</span>
                <span className="text-[10px] uppercase tracking-wider text-[var(--foreground)]/40 w-20 text-right">Clics CTA</span>
                <span className="text-[10px] uppercase tracking-wider text-[var(--foreground)]/40 w-20 text-right">Descargas</span>
              </div>
              {resources.leadMagnets.map(lm => {
                const maxVal = Math.max(...resources.leadMagnets.map(r => r.ctaClicks + r.downloads), 1);
                const total = lm.ctaClicks + lm.downloads;
                const pct = (total / maxVal) * 100;
                return (
                  <div key={lm.id} className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[var(--foreground)]/80 flex-1 truncate font-medium">{lm.title}</span>
                      <span className="text-xs font-semibold w-20 text-right text-purple-400">{lm.ctaClicks}</span>
                      <span className="text-xs font-semibold w-20 text-right" style={{ color: "var(--brand-4)" }}>{lm.downloads}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, #a855f7 0%, var(--brand-4) 100%)`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              <p className="text-[10px] text-[var(--foreground)]/25 pt-2">
                Clics CTA = interés mostrado · Descargas = PDF abierto
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* BLOQUE 3 — Formularios de Fidelización                                */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/40">Formularios de Fidelización</h2>

        {/* KPIs principales */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:gap-6">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-xs text-[var(--foreground)]/60 mb-1">Respuestas totales</p>
            <p className="text-3xl font-bold text-[var(--brand-1)]">{fidelizacion.totalResponses}</p>
            <p className="text-xs text-[var(--foreground)]/40 mt-1">últimos 6 meses</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-xs text-[var(--foreground)]/60 mb-1">NPS real</p>
            <p className="text-3xl font-bold" style={{ color: npsColor(fidelizacion.nps) }}>
              {fidelizacion.nps !== null ? (fidelizacion.nps > 0 ? `+${fidelizacion.nps}` : fidelizacion.nps) : "—"}
            </p>
            <p className="text-xs text-[var(--foreground)]/40 mt-1">
              {fidelizacion.nps === null ? "sin datos NPS" :
               fidelizacion.nps >= 50 ? "Excelente" :
               fidelizacion.nps >= 20 ? "Bueno" :
               fidelizacion.nps >= 0  ? "Mejorable" : "Crítico"}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-xs text-[var(--foreground)]/60 mb-1">Puntuación media</p>
            <p className="text-3xl font-bold text-amber-400">
              {fidelizacion.avgRating !== null ? `${fidelizacion.avgRating}/10` : "—"}
            </p>
            <p className="text-xs text-[var(--foreground)]/40 mt-1">promedio de valoraciones</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-xs text-[var(--foreground)]/60 mb-1">Tasa de respuesta</p>
            <p className="text-3xl font-bold text-blue-400">{fidelizacion.responseRate}%</p>
            <p className="text-xs text-[var(--foreground)]/40 mt-1">respuestas / clientes totales</p>
          </div>
        </div>

        {/* Distribución + Tendencia */}
        <div className="grid gap-4 sm:grid-cols-2 xl:gap-6">
          {/* Distribución Promotor / Pasivo / Detractor */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-sm font-semibold mb-4">Distribución NPS</p>
            <NpsDistribution
              p={fidelizacion.promotersPct}
              pa={fidelizacion.passivesPct}
              d={fidelizacion.detractorsPct}
            />
            {fidelizacion.promotersPct + fidelizacion.passivesPct + fidelizacion.detractorsPct > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div>
                  <p className="text-lg font-bold text-red-400">{fidelizacion.detractorsPct}%</p>
                  <p className="text-[10px] text-[var(--foreground)]/40">Detractores<br/><span className="text-[9px]">0–6</span></p>
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-400">{fidelizacion.passivesPct}%</p>
                  <p className="text-[10px] text-[var(--foreground)]/40">Pasivos<br/><span className="text-[9px]">7–8</span></p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-500">{fidelizacion.promotersPct}%</p>
                  <p className="text-[10px] text-[var(--foreground)]/40">Promotores<br/><span className="text-[9px]">9–10</span></p>
                </div>
              </div>
            )}
          </div>

          {/* Tendencia NPS mensual */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold">Tendencia NPS</p>
              <span className="text-xs text-[var(--foreground)]/50">6 meses</span>
            </div>
            <MiniNpsChart months={fidelizacion.monthlyNPS} />
          </div>
        </div>
      </section>
    </div>
  );
}
