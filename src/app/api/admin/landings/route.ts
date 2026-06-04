import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quitar acentos
    .replace(/[^a-z0-9]+/g, "-")       // no alfanumérico → guion
    .replace(/^-+|-+$/g, "")           // recortar guiones extremos
    .slice(0, 60) || "landing";
}

/** GET — lista todas las landings de presentación. Solo admin. */
export async function GET(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const db = adminClient();
    const { data, error } = await db
      .from("landing_pages")
      .select("id, slug, name, published, created_at, updated_at")
      .order("updated_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ landings: data ?? [] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** POST — crea una nueva landing. Solo admin. */
export async function POST(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const name = (body.name || "").trim();
    if (!name) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });

    const db = adminClient();
    const base = slugify(body.slug || name);

    // Garantizar slug único: si existe, añadir sufijo numérico.
    let slug = base;
    for (let i = 2; i <= 50; i++) {
      const { data: existing } = await db
        .from("landing_pages").select("id").eq("slug", slug).maybeSingle();
      if (!existing) break;
      slug = `${base}-${i}`;
    }

    const { data, error } = await db
      .from("landing_pages")
      .insert({
        name,
        slug,
        html: typeof body.html === "string" ? body.html : "",
        published: body.published !== false,
      })
      .select("id, slug, name, published, created_at, updated_at")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ landing: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
