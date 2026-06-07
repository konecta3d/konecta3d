import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";

/**
 * GET /api/admin/dashboard-stats
 * Devuelve estadísticas globales para el panel admin.
 * Usa service role para saltar RLS y leer todas las tablas.
 */
export async function GET(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalBusinesses },
    { count: activeBusinesses30d },
    { count: totalLeads },
    { count: leads30d },
    { count: totalLandings },
    { count: onboardingCompleted },
    { count: totalViews },
    { count: views30d },
    { data: recentBusinesses },
    { data: recentLeads },
    { data: journeyRows },
  ] = await Promise.all([
    db.from("businesses").select("id", { count: "exact", head: true }),
    db.from("businesses").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
    db.from("leads").select("id", { count: "exact", head: true }),
    db.from("leads").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
    db.from("landing_configs").select("id", { count: "exact", head: true }),
    db.from("businesses").select("id", { count: "exact", head: true }).not("sector", "is", null).not("slug", "is", null),
    db.from("analytics_events").select("id", { count: "exact", head: true }).eq("event_type", "page_view"),
    db.from("analytics_events").select("id", { count: "exact", head: true }).eq("event_type", "page_view").gte("created_at", thirtyDaysAgo),
    db.from("businesses").select("id, name, sector, created_at").order("created_at", { ascending: false }).limit(5),
    db.from("leads").select("id, name, email, created_at, businesses(name)").order("created_at", { ascending: false }).limit(5),
    db.from("crm_journey").select("etapa_actual"),
  ]);

  // Distribución de negocios por etapa del lanzamiento (CRM)
  const journeyByStage: Record<number, number> = {};
  for (const r of (journeyRows ?? []) as { etapa_actual: number }[]) {
    const e = r.etapa_actual || 1;
    journeyByStage[e] = (journeyByStage[e] || 0) + 1;
  }
  const tv = totalViews ?? 0;
  const conversionGlobal = tv > 0 ? Math.round(((totalLeads ?? 0) / tv) * 1000) / 10 : 0;

  return NextResponse.json({
    stats: {
      totalBusinesses: totalBusinesses ?? 0,
      activeBusinesses30d: activeBusinesses30d ?? 0,
      totalLeads: totalLeads ?? 0,
      leads30d: leads30d ?? 0,
      totalLandings: totalLandings ?? 0,
      onboardingCompleted: onboardingCompleted ?? 0,
      totalViews: tv,
      views30d: views30d ?? 0,
      conversionGlobal,
    },
    journeyByStage,
    recentBusinesses: recentBusinesses ?? [],
    recentLeads: (recentLeads ?? []).map((l: any) => ({
      ...l,
      business_name: (l.businesses as { name: string } | null)?.name ?? "",
    })),
  });
}
