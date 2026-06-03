import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";
import { DEFAULT_LAUNCH_FUNNEL } from "@/lib/crm/launch-funnel";

const KEY = "crm_launch_funnel";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** GET — embudo de lanzamiento guardado o el de por defecto. Solo admin. */
export async function GET(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const db = adminClient();
    const { data } = await db.from("settings").select("value").eq("key", KEY).single();
    if (data?.value) {
      const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
      // Normalizar: garantizar que cada etapa tiene todos los arrays.
      // Protege frente a funnels guardados antes de añadir campos nuevos
      // (p. ej. tiposInsight), que de otro modo romperían el render.
      const stages = Array.isArray(parsed?.stages) ? parsed.stages : DEFAULT_LAUNCH_FUNNEL.stages;
      const normalized = {
        stages: stages.map((s: Record<string, unknown>) => {
          const def = DEFAULT_LAUNCH_FUNNEL.stages.find(d => d.id === s.id);
          return {
            ...s,
            objetivos:    Array.isArray(s.objetivos) ? s.objetivos : [],
            mensajes:     Array.isArray(s.mensajes) ? s.mensajes : [],
            documentos:   Array.isArray(s.documentos) ? s.documentos : [],
            tiposInsight: Array.isArray(s.tiposInsight) ? s.tiposInsight : (def?.tiposInsight ?? []),
          };
        }),
      };
      return NextResponse.json({ funnel: normalized });
    }
    return NextResponse.json({ funnel: DEFAULT_LAUNCH_FUNNEL });
  } catch {
    return NextResponse.json({ funnel: DEFAULT_LAUNCH_FUNNEL });
  }
}

/** POST — guarda el embudo completo. Solo admin. */
export async function POST(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { funnel } = await req.json();
    const db = adminClient();
    const { error } = await db.from("settings").upsert({ key: KEY, value: funnel }, { onConflict: "key" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** DELETE — restaura a valores por defecto. Solo admin. */
export async function DELETE(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const db = adminClient();
    await db.from("settings").delete().eq("key", KEY);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
