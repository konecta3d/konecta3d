import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** GET — una landing completa (incluye el HTML) para editar. Solo admin. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;

  try {
    const db = adminClient();
    const { data, error } = await db
      .from("landing_pages")
      .select("id, slug, name, html, published, created_at, updated_at")
      .eq("id", id)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ landing: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** PUT — actualiza nombre, html, slug o estado. Solo admin. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;

  try {
    const body = await req.json();
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.name === "string") patch.name = body.name.trim();
    if (typeof body.html === "string") patch.html = body.html;
    if (typeof body.published === "boolean") patch.published = body.published;

    const db = adminClient();

    // Cambio de slug opcional: validar unicidad.
    if (typeof body.slug === "string" && body.slug.trim()) {
      const newSlug = body.slug
        .toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
      if (newSlug) {
        const { data: clash } = await db
          .from("landing_pages").select("id").eq("slug", newSlug).neq("id", id).maybeSingle();
        if (clash) return NextResponse.json({ error: "Ese enlace (slug) ya está en uso" }, { status: 409 });
        patch.slug = newSlug;
      }
    }

    const { data, error } = await db
      .from("landing_pages")
      .update(patch)
      .eq("id", id)
      .select("id, slug, name, published, created_at, updated_at")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ landing: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** DELETE — elimina una landing. Solo admin. */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;

  try {
    const db = adminClient();
    const { error } = await db.from("landing_pages").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
