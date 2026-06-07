import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";

/**
 * GET /api/admin/business-stats?id=<businessId>
 * Estadísticas y estado de UN negocio, para el panel admin. Service role.
 */
export async function GET(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const now = Date.now();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d7 = new Date(now - 7 * 86400000).toISOString();
  const d30 = new Date(now - 30 * 86400000).toISOString();

  const pv = () => db.from("analytics_events").select("id", { count: "exact", head: true }).eq("business_id", id).eq("event_type", "page_view");

  const [
    bizRes,
    { count: viewsToday },
    { count: viewsWeek },
    { count: viewsMonth },
    { count: viewsTotal },
    { count: clicks30d },
    { count: leadsTotal },
    { count: leads30d },
    { data: lastEvent },
  ] = await Promise.all([
    db.from("businesses").select("id, name, sector, slug, contact_email, last_login, created_at, profile_active, module_lead_magnet, module_vip_benefits, module_whatsapp").eq("id", id).single(),
    pv().gte("created_at", today.toISOString()),
    pv().gte("created_at", d7),
    pv().gte("created_at", d30),
    pv(),
    db.from("analytics_events").select("id", { count: "exact", head: true }).eq("business_id", id).neq("event_type", "page_view").gte("created_at", d30),
    db.from("leads").select("id", { count: "exact", head: true }).eq("business_id", id),
    db.from("leads").select("id", { count: "exact", head: true }).eq("business_id", id).gte("created_at", d30),
    db.from("analytics_events").select("created_at").eq("business_id", id).order("created_at", { ascending: false }).limit(1),
  ]);

  const biz = bizRes.data;
  if (!biz) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });

  const vMonth = viewsMonth ?? 0;
  const l30 = leads30d ?? 0;
  const conversion = vMonth > 0 ? Math.round((l30 / vMonth) * 1000) / 10 : 0;
  const onboardingDone = !!biz.sector && !!biz.slug;

  return NextResponse.json({
    business: {
      id: biz.id, name: biz.name, sector: biz.sector, slug: biz.slug,
      contact_email: biz.contact_email, last_login: biz.last_login, created_at: biz.created_at,
      profile_active: biz.profile_active ?? true,
      modules: { lead_magnet: biz.module_lead_magnet, vip: biz.module_vip_benefits, whatsapp: biz.module_whatsapp },
    },
    stats: {
      viewsToday: viewsToday ?? 0,
      viewsWeek: viewsWeek ?? 0,
      viewsMonth: vMonth,
      viewsTotal: viewsTotal ?? 0,
      clicks30d: clicks30d ?? 0,
      leadsTotal: leadsTotal ?? 0,
      leads30d: l30,
      conversion,
      lastActivity: lastEvent?.[0]?.created_at ?? null,
      onboardingDone,
      landingPublished: !!biz.slug,
    },
  });
}
