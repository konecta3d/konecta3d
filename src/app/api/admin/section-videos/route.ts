import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";

/**
 * Gestión de vídeos por sección (solo admin). Escritura con service role.
 * GET                                 -> { videos: [...] }  (todas las secciones)
 * POST { id?, section_key, title, video_url, sort_order?, enabled? } -> upsert
 * DELETE ?id=<id>                     -> elimina un vídeo
 */

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function GET(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data, error } = await db()
    .from("section_videos")
    .select("id, section_key, title, video_url, sort_order, enabled")
    .order("section_key")
    .order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ videos: data || [] });
}

export async function POST(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let body: {
    id?: string;
    section_key?: string;
    title?: string;
    video_url?: string;
    sort_order?: number;
    enabled?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const section_key = (body.section_key || "").trim();
  const title = (body.title || "").trim();
  const video_url = (body.video_url || "").trim();

  const supabase = db();

  if (body.id) {
    // Actualizar (puede cambiar cualquier campo, incluido enabled).
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.title !== undefined) patch.title = title;
    if (body.video_url !== undefined) patch.video_url = video_url;
    if (body.sort_order !== undefined) patch.sort_order = body.sort_order;
    if (body.enabled !== undefined) patch.enabled = body.enabled;
    const { data, error } = await supabase
      .from("section_videos")
      .update(patch)
      .eq("id", body.id)
      .select("id, section_key, title, video_url, sort_order, enabled")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ video: data });
  }

  // Crear
  if (!section_key || !title || !video_url) {
    return NextResponse.json({ error: "Faltan datos (sección, título y enlace)" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("section_videos")
    .insert({ section_key, title, video_url, sort_order: body.sort_order ?? 0, enabled: body.enabled ?? true })
    .select("id, section_key, title, video_url, sort_order, enabled")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ video: data });
}

export async function DELETE(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const { error } = await db().from("section_videos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
