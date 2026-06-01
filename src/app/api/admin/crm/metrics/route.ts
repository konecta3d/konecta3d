import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";
import { STAGES } from "@/lib/crm/stages";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const CERRADOS = ["ganado", "perdido", "cliente_activo", "cliente_recurrente"];

/**
 * GET /api/admin/crm/metrics
 * Calcula métricas en vivo del pipeline desde la base de datos.
 */
export async function GET(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const db = adminClient();

    const { data: leads } = await db.from("crm_leads").select("*");
    const { data: history } = await db.from("crm_stage_history").select("stage, duration_hours").not("duration_hours", "is", null);

    const all = leads ?? [];
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Conteo por etapa
    const porEtapa: Record<string, number> = {};
    for (const s of STAGES) porEtapa[s.key] = 0;
    for (const l of all) porEtapa[l.etapa] = (porEtapa[l.etapa] || 0) + 1;

    // Conteo por perfil
    const porPerfil: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, sin: 0 };
    for (const l of all) {
      const p = l.perfil && ["A", "B", "C", "D"].includes(l.perfil) ? l.perfil : "sin";
      porPerfil[p]++;
    }

    // Pipeline activo (no cerrados)
    const activos = all.filter(l => !CERRADOS.includes(l.etapa));
    const revenuePipeline = activos.reduce((s, l) => s + (Number(l.revenue_estimado) || 0), 0);

    // Ganados / clientes
    const ganados = all.filter(l => ["ganado", "cliente_activo", "cliente_recurrente"].includes(l.etapa));
    const revenueGanado = ganados.reduce((s, l) => s + (Number(l.revenue_estimado) || 0), 0);
    const perdidos = all.filter(l => l.etapa === "perdido");

    // Tasa de conversión global (ganados / (ganados + perdidos))
    const cerradosTotal = ganados.length + perdidos.length;
    const tasaConversion = cerradosTotal > 0 ? (ganados.length / cerradosTotal) * 100 : 0;

    // Nuevos esta semana / mes
    const nuevosSemana = all.filter(l => new Date(l.fecha_entrada).getTime() >= weekAgo).length;
    const nuevosMes = all.filter(l => new Date(l.fecha_entrada).getTime() >= monthAgo).length;

    // Tiempo medio por etapa (de history con duración)
    const tiemposPorEtapa: Record<string, { total: number; count: number }> = {};
    for (const h of history ?? []) {
      if (!tiemposPorEtapa[h.stage]) tiemposPorEtapa[h.stage] = { total: 0, count: 0 };
      tiemposPorEtapa[h.stage].total += Number(h.duration_hours) || 0;
      tiemposPorEtapa[h.stage].count++;
    }
    const tiempoMedioEtapa: Record<string, number> = {};
    for (const [stage, v] of Object.entries(tiemposPorEtapa)) {
      tiempoMedioEtapa[stage] = v.count > 0 ? v.total / v.count / 24 : 0; // en días
    }

    return NextResponse.json({
      total: all.length,
      activos: activos.length,
      porEtapa,
      porPerfil,
      revenuePipeline,
      revenueGanado,
      ganados: ganados.length,
      perdidos: perdidos.length,
      tasaConversion: Math.round(tasaConversion),
      nuevosSemana,
      nuevosMes,
      tiempoMedioEtapa,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
