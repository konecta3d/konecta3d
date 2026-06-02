import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * POST /api/auth/resolve-identifier
 * Resuelve un identificador de negocio (K3D-id, teléfono o slug) al email
 * de acceso. Necesario porque la RLS de businesses bloquea las lecturas sin
 * sesión, y el login necesita resolver el email ANTES de autenticar.
 * Usa service role (server-side) para saltarse la RLS de forma controlada:
 * solo devuelve el email, nada más.
 */
export async function POST(req: Request) {
  try {
    const { identifier } = await req.json();
    const id = (identifier || "").trim();
    if (!id) return NextResponse.json({ email: null });

    // Si ya es un email, devolverlo normalizado (no requiere lookup)
    if (id.includes("@")) {
      return NextResponse.json({ email: id.toLowerCase() });
    }

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let email: string | null = null;

    if (id.startsWith("K3D-")) {
      const { data } = await db
        .from("businesses").select("contact_email").eq("public_id", id).maybeSingle();
      email = data?.contact_email ?? null;
    } else if (/^\+?[\d\s-]{9,}$/.test(id.replace(/\s/g, ""))) {
      const { data } = await db
        .from("businesses").select("contact_email").eq("phone", id.replace(/\s/g, "")).maybeSingle();
      email = data?.contact_email ?? null;
    } else {
      const slug = id.toLowerCase().replace(/\s+/g, "-");
      const { data } = await db
        .from("businesses").select("contact_email").eq("slug", slug).maybeSingle();
      email = data?.contact_email ?? null;
    }

    return NextResponse.json({ email: email ? email.toLowerCase() : null });
  } catch {
    return NextResponse.json({ email: null });
  }
}
