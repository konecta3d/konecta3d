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

  // ── Progreso: contexto, piezas creadas y documentos (todo service-role) ──────
  const [
    qCountRes, fidAnswersRes, capCtxRes,
    { count: landingsCount }, lmRes, { count: benefitsCount },
    { count: capCampaignsCount }, { count: capFormsCount }, capLmRes,
  ] = await Promise.all([
    db.from("gpt_context_questions").select("id", { count: "exact", head: true }),
    db.from("gpt_context_answers").select("answer_text").eq("business_id", id),
    db.from("settings").select("value").eq("key", `captacion_context_${id}`).maybeSingle(),
    db.from("landing_configs").select("id", { count: "exact", head: true }).eq("business_id", id),
    db.from("lead_magnets").select("id, title, pdf_url, active").eq("business_id", id).order("created_at", { ascending: false }),
    db.from("benefits").select("id", { count: "exact", head: true }).eq("business_id", id),
    db.from("captacion_campaigns").select("id", { count: "exact", head: true }).eq("business_id", id),
    db.from("captacion_forms").select("id", { count: "exact", head: true }).eq("business_id", id),
    db.from("captacion_lead_magnets").select("id, title, file_url").eq("business_id", id).order("created_at", { ascending: false }),
  ]);

  const totalQ = qCountRes.count || 0;
  const answeredQ = (fidAnswersRes.data || []).filter((a) => (a.answer_text || "").trim().length > 0).length;
  const capCtxVal = (capCtxRes.data?.value as Record<string, unknown>) || {};
  const capFilled = Object.values(capCtxVal).filter(
    (v) => v && typeof v === "object" && Object.keys(v as object).length > 0
  ).length;
  const fidRecursos = (lmRes.data || []) as { title: string; pdf_url: string | null; active: boolean }[];
  const capRecursos = (capLmRes.data || []) as { title: string; file_url: string | null }[];

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
    progress: {
      contextoFidelizacion: { answered: answeredQ, total: totalQ },
      contextoCaptacion: { filled: capFilled, total: 6 },
      landings: landingsCount ?? 0,
      recursos: fidRecursos.length,
      beneficios: benefitsCount ?? 0,
      campanas: capCampaignsCount ?? 0,
      formularios: capFormsCount ?? 0,
      recursosCaptacion: capRecursos.length,
    },
    documents: {
      fidelizacion: fidRecursos.map((l) => ({ title: l.title, url: l.pdf_url, active: l.active })),
      captacion: capRecursos.map((l) => ({ title: l.title, url: l.file_url })),
    },
  });
}
