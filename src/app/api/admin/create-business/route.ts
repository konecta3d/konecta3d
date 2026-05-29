import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { verifyAdminSession } from "@/lib/auth-helpers";

export async function POST(req: Request) {
  // Solo admins pueden crear negocios
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, email, phone, sector, password, module_vip_benefits, module_lead_magnet, module_whatsapp } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: "El email es obligatorio" }, { status: 400 });
    }
    // Si no se envía password, se genera uno automáticamente
    const finalPassword = password?.trim() && password.trim().length >= 6
      ? password.trim()
      : "K3D-" + randomBytes(6).toString("base64url").slice(0, 10).toUpperCase();

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Normalizar slug: quitar acentos, convertir espacios y chars especiales a guiones
    const baseSlug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")   // eliminar diacríticos
      .replace(/[^a-z0-9\s-]/g, "")      // solo alfanumérico
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    // Garantizar unicidad: si ya existe, añadir sufijo numérico
    let slug = baseSlug;
    let suffix = 2;
    while (true) {
      const { data: existing } = await supabaseAdmin
        .from("businesses")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!existing) break;
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    const publicId = "K3D-" + randomBytes(4).toString("hex").toUpperCase();

    // Buscar si ya existe un usuario con ese email (Supabase JS v2 no tiene getUserByEmail)
    let userId: string | null = null;
    let isNewUser = false;

    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (listError) {
      return NextResponse.json(
        { error: "Error al listar usuarios: " + listError.message },
        { status: 500 },
      );
    }

    const existingUser =
      listData?.users?.find(
        (u) => u.email && u.email.toLowerCase() === email.toLowerCase(),
      ) ?? null;

    if (existingUser) {
      userId = existingUser.id;
      isNewUser = false;
    } else {
      // Crear nuevo usuario
      const { data: authData, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password: finalPassword,
          email_confirm: true,
        });

      if (createError) {
        return NextResponse.json(
          { error: "Error al crear usuario: " + createError.message },
          { status: 500 },
        );
      }

      userId = authData?.user?.id || null;
      isNewUser = true;
    }

    // Create business
    const businessData: Record<string, unknown> = {
      name: name,
      sector: sector || "",
      slug: slug,
      public_id: publicId,
      contact_email: email,
      phone: phone || "",
      module_vip_benefits: module_vip_benefits ?? false,
      module_lead_magnet: module_lead_magnet ?? true,
      module_whatsapp: module_whatsapp ?? true,
    };

    if (userId) {
      businessData.user_id = userId;
    }

    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .insert(businessData)
      .select()
      .single();

    if (businessError) {
      return NextResponse.json({ error: "Error al crear negocio: " + businessError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      business,
      publicId,
      password: isNewUser ? finalPassword : null,
      message: isNewUser
        ? `Negocio creado correctamente`
        : "Negocio creado (usuario ya existía en Auth)",
    });

  } catch (err: any) {
    console.error("Create business error:", err);
    return NextResponse.json({ error: err.message || "Error desconocido" }, { status: 500 });
  }
}
