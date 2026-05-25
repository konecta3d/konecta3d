import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";
import { launchBrowser } from "@/lib/pdf-browser";
import { buildOnboardingHtml, OnboardingTemplate } from "@/lib/onboarding-html";

export const maxDuration = 60;

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/onboarding-pdf
// Body: { businessId, newPassword }
// 1. Verifica sesión admin
// 2. Lee datos del negocio
// 3. Lee template personalizado de settings (si existe)
// 4. Resetea la contraseña en Supabase Auth
// 5. Genera PDF con Puppeteer usando el template
// 6. Devuelve el PDF como descarga
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { businessId, newPassword } = body;

    if (!businessId) {
      return NextResponse.json({ error: "Falta businessId" }, { status: 400 });
    }
    if (!newPassword?.trim() || newPassword.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Leer datos del negocio
    const { data: business, error: bizError } = await supabaseAdmin
      .from("businesses")
      .select("name, contact_email, user_id")
      .eq("id", businessId)
      .single();

    if (bizError || !business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }
    if (!business.contact_email) {
      return NextResponse.json(
        { error: "El negocio no tiene email registrado" },
        { status: 400 }
      );
    }

    // 2. Leer template personalizado de settings (si no existe, buildOnboardingHtml usa el default)
    let template: OnboardingTemplate = {};
    const { data: tplData } = await supabaseAdmin
      .from("settings")
      .select("value")
      .eq("key", "onboarding_template")
      .single();
    if (tplData?.value) {
      try {
        template =
          typeof tplData.value === "string"
            ? JSON.parse(tplData.value)
            : tplData.value;
      } catch {
        // si el JSON está corrupto, usamos el default
      }
    }

    // 3. Resetear contraseña real en Supabase Auth
    let userId = business.user_id as string | null;

    if (!userId) {
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
      const found = (listData?.users ?? []).find(
        (u) => (u.email || "").toLowerCase() === business.contact_email!.toLowerCase()
      );
      userId = found?.id ?? null;
    }

    if (userId) {
      const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });
      if (pwError) {
        return NextResponse.json({ error: pwError.message }, { status: 500 });
      }
    } else {
      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: business.contact_email,
        password: newPassword,
        email_confirm: true,
      });
      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }
    }

    // 4. Generar PDF con el template (personalizado o default)
    const html = buildOnboardingHtml(
      business.name,
      business.contact_email,
      newPassword,
      template
    );

    const browser = await launchBrowser();
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({
        width: "210mm",
        height: "297mm",
        printBackground: true,
        margin: { top: "0", bottom: "0", left: "0", right: "0" },
      });
      await browser.close();

      const safeName = business.name.replace(/[^a-z0-9]/gi, "-").toLowerCase();
      return new Response(pdfBuffer as unknown as BodyInit, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="onboarding-${safeName}.pdf"`,
        },
      });
    } catch (e) {
      await browser.close().catch(() => {});
      throw e;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("Onboarding PDF error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
