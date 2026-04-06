import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, sector, module_vip_benefits, module_lead_magnet, module_whatsapp } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: "El email es obligatorio" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const slug = name.toLowerCase().replace(/\s+/g, "-");
    const publicId = "K3D-" + randomBytes(4).toString("hex").toUpperCase();
    const tempPassword = "K3D-" + randomBytes(6).toString("base64").slice(0, 10).toUpperCase();

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
          password: tempPassword,
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
    const businessData = {
      name: name,
      sector: sector || "",
      slug: slug,
      public_id: publicId,
      contact_email: email,
      phone: phone || "",
      module_vip_benefits: module_vip_benefits ?? true,
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
      publicId: publicId,
      message: isNewUser
        ? `Negocio creado. Las credenciales fueron enviadas al email ${email}`
        : "Negocio creado (usuario existente)"
    });

  } catch (err: any) {
    console.error("Create business error:", err);
    return NextResponse.json({ error: err.message || "Error desconocido" }, { status: 500 });
  }
}
