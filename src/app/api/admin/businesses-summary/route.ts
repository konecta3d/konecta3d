import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";

/**
 * GET /api/admin/businesses-summary
 * Resumen de salud por negocio (leads y visitas) para la lista del admin.
 * Service role. Devuelve { summary: { [businessId]: { leads, views } } }.
 */
export async function GET(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const [{ data: leadRows }, { data: viewRows }] = await Promise.all([
    db.from("leads").select("business_id"),
    db.from("analytics_events").select("business_id").eq("event_type", "page_view"),
  ]);

  const summary: Record<string, { leads: number; views: number }> = {};
  const bump = (bid: string | null, key: "leads" | "views") => {
    if (!bid) return;
    if (!summary[bid]) summary[bid] = { leads: 0, views: 0 };
    summary[bid][key]++;
  };
  for (const r of (leadRows ?? []) as { business_id: string | null }[]) bump(r.business_id, "leads");
  for (const r of (viewRows ?? []) as { business_id: string | null }[]) bump(r.business_id, "views");

  return NextResponse.json({ summary });
}
