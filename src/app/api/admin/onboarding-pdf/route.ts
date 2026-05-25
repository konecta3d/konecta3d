import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";
import { launchBrowser } from "@/lib/pdf-browser";
import { escapeHtml } from "@/lib/sanitize";

export const maxDuration = 60;

// ─────────────────────────────────────────────────────────────────────────────
// HTML del onboarding — renderizado por Puppeteer a A4
// ─────────────────────────────────────────────────────────────────────────────
function buildOnboardingHtml(
  businessName: string,
  email: string,
  password: string
): string {
  const name = escapeHtml(businessName);
  const mail = escapeHtml(email);
  const pass = escapeHtml(password);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    @page { size: A4 portrait; margin: 0; }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', sans-serif;
      background: #ffffff;
      color: #1a1a1a;
      font-size: 13px;
      line-height: 1.55;
      width: 210mm;
      min-height: 297mm;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── CABECERA ── */
    .header {
      background: linear-gradient(140deg, #0f3d3a 0%, #1A4D4A 55%, #1e5c57 100%);
      padding: 28px 32px 26px;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: -50px; right: -50px;
      width: 200px; height: 200px;
      border-radius: 50%;
      background: rgba(197,160,89,0.07);
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: -30px; left: -30px;
      width: 120px; height: 120px;
      border-radius: 50%;
      background: rgba(255,255,255,0.04);
    }
    .header-inner {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 24px;
      position: relative;
      z-index: 1;
    }
    .header-left { flex: 1; }
    .logo-badge {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: rgba(197,160,89,0.15);
      border: 1px solid rgba(197,160,89,0.3);
      border-radius: 20px;
      padding: 4px 12px 4px 4px;
      margin-bottom: 14px;
    }
    .logo-dot {
      width: 24px; height: 24px;
      border-radius: 50%;
      background: #C5A059;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 800; color: #0f3d3a;
    }
    .logo-text {
      font-size: 10.5px; font-weight: 700;
      color: #C5A059;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .header-welcome {
      font-size: 11px; color: rgba(255,255,255,0.5);
      font-weight: 500; margin-bottom: 4px;
    }
    .header-name {
      font-size: 23px; font-weight: 800;
      color: #ffffff; line-height: 1.15; margin-bottom: 10px;
    }
    .header-sub {
      font-size: 11.5px; color: rgba(255,255,255,0.6);
      line-height: 1.55;
    }

    /* Credenciales en header */
    .header-credentials {
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 12px;
      padding: 14px 16px;
      min-width: 210px;
      flex-shrink: 0;
    }
    .hc-title {
      font-size: 9.5px; font-weight: 700;
      color: rgba(255,255,255,0.45);
      text-transform: uppercase; letter-spacing: 0.08em;
      margin-bottom: 10px;
    }
    .hc-row { margin-bottom: 9px; }
    .hc-row:last-child { margin-bottom: 0; }
    .hc-label {
      font-size: 9px; font-weight: 700;
      color: rgba(255,255,255,0.35);
      text-transform: uppercase; letter-spacing: 0.06em;
      margin-bottom: 3px;
    }
    .hc-value {
      font-size: 12.5px; font-weight: 600;
      color: #ffffff;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 6px;
      padding: 6px 10px;
    }
    .hc-value.accent { color: #C5A059; font-size: 11px; }

    /* Aviso privacidad */
    .notice {
      margin: 14px 28px;
      background: rgba(197,160,89,0.07);
      border: 1px solid rgba(197,160,89,0.22);
      border-radius: 8px;
      padding: 9px 14px;
      display: flex; gap: 9px; align-items: flex-start;
    }
    .notice-text { font-size: 11.5px; color: #7a6030; line-height: 1.45; }
    .notice-text strong { color: #5a4520; }

    /* Separador */
    .divider { height: 1px; background: #efefef; margin: 0 28px; }

    /* Sección título */
    .section-title {
      font-size: 9px; font-weight: 700;
      color: #1A4D4A;
      text-transform: uppercase; letter-spacing: 0.12em;
      margin-bottom: 16px;
      display: flex; align-items: center; gap: 8px;
    }
    .section-title::after {
      content: ''; flex: 1; height: 1px; background: #e8f0ef;
    }

    /* Layout dos columnas */
    .body-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
      padding: 20px 28px;
    }
    .col-left { padding-right: 20px; border-right: 1px solid #efefef; }
    .col-right { padding-left: 20px; }

    /* Pasos */
    .step {
      display: flex; gap: 12px;
      margin-bottom: 20px;
    }
    .step:last-child { margin-bottom: 0; }
    .step-number {
      width: 28px; height: 28px;
      border-radius: 50%;
      background: #1A4D4A; color: white;
      font-size: 12px; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; margin-top: 1px;
    }
    .step-content { flex: 1; }
    .step-header {
      display: flex; align-items: baseline;
      justify-content: space-between; gap: 6px;
      margin-bottom: 4px; flex-wrap: wrap;
    }
    .step-title { font-size: 13px; font-weight: 700; color: #1a1a1a; }
    .step-time {
      font-size: 9.5px; font-weight: 600; color: #C5A059;
      background: rgba(197,160,89,0.1);
      border-radius: 20px; padding: 2px 8px;
      white-space: nowrap;
    }
    .step-where {
      font-size: 10.5px; font-weight: 600;
      color: #2D7A74; margin-bottom: 6px;
    }
    .step-bullets {
      list-style: none;
      display: flex; flex-direction: column; gap: 3px;
    }
    .step-bullets li {
      font-size: 11.5px; color: #555;
      display: flex; gap: 6px; align-items: flex-start;
      line-height: 1.45;
    }
    .step-bullets li::before {
      content: '·';
      color: #C5A059;
      font-weight: 900;
      font-size: 16px;
      line-height: 1;
      flex-shrink: 0;
      margin-top: 0px;
    }
    .step-connector {
      width: 1px;
      background: linear-gradient(to bottom, #1A4D4A40, #e0eeec);
      margin: 3px 0 3px 13px; height: 10px;
    }

    /* Columna derecha: acceso */
    .access-box {
      background: #fafaf7;
      border: 1px solid #e8e4d8;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .access-title {
      font-size: 12px; font-weight: 700; color: #1a1a1a;
      margin-bottom: 12px;
      display: flex; align-items: center; gap: 7px;
    }
    .access-row { margin-bottom: 8px; }
    .access-row:last-child { margin-bottom: 0; }
    .access-label {
      font-size: 9px; font-weight: 700; color: #999;
      text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 2px;
    }
    .access-value {
      font-size: 12.5px; font-weight: 600; color: #1a1a1a;
      background: #fff;
      border: 1px solid #e0ddd4;
      border-radius: 6px;
      padding: 6px 10px;
    }
    .access-value.accent { color: #1A4D4A; }

    /* Qué encontrarás */
    .features-box {
      background: #f7fbfa;
      border: 1.5px solid #d0e8e5;
      border-radius: 12px;
      overflow: hidden;
    }
    .features-header {
      background: linear-gradient(135deg, #1A4D4A, #2D7A74);
      padding: 9px 14px;
      display: flex; align-items: center; gap: 7px;
    }
    .features-header-text {
      font-size: 10px; font-weight: 700;
      color: white; text-transform: uppercase; letter-spacing: 0.07em;
    }
    .features-body { padding: 10px 14px; }
    .feature-item {
      display: flex; align-items: flex-start; gap: 8px;
      padding: 6px 0;
      border-bottom: 1px solid #e8f2f0;
      font-size: 12px; color: #333;
    }
    .feature-item:last-child { border-bottom: none; padding-bottom: 0; }
    .feature-item span { color: #2D7A74; font-weight: 700; flex-shrink: 0; }

    /* Soporte */
    .support-box {
      background: linear-gradient(135deg, #1A4D4A 0%, #0f3d3a 100%);
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      margin: 16px 28px;
    }
    .support-text {
      flex: 1;
      font-size: 12px; color: rgba(255,255,255,0.75);
      line-height: 1.45;
    }
    .support-text strong { color: #ffffff; font-size: 13px; display: block; margin-bottom: 2px; }
    .support-btn {
      display: inline-flex; align-items: center; gap: 7px;
      background: #25D366; color: white;
      font-size: 12px; font-weight: 700;
      padding: 10px 16px;
      border-radius: 50px;
      text-decoration: none;
      white-space: nowrap;
      flex-shrink: 0;
    }

    /* Footer */
    .footer {
      text-align: center;
      padding: 12px 28px 20px;
      border-top: 1px solid #f0f0f0;
    }
    .footer-logo {
      font-size: 10px; font-weight: 800;
      color: #1A4D4A; letter-spacing: 0.08em; margin-bottom: 3px;
    }
    .footer-text { font-size: 10px; color: #bbb; line-height: 1.5; }
  </style>
</head>
<body>

  <!-- CABECERA CON CREDENCIALES -->
  <div class="header">
    <div class="header-inner">
      <div class="header-left">
        <div class="logo-badge">
          <div class="logo-dot">K</div>
          <span class="logo-text">Konecta3D</span>
        </div>
        <p class="header-welcome">Bienvenido a la plataforma</p>
        <h1 class="header-name">¡Ya estás dentro,<br>${name}!</h1>
        <p class="header-sub">Tu presencia digital está lista.<br>Sigue los 3 pasos para activarla.</p>
      </div>
      <div class="header-credentials">
        <div class="hc-title">🔑 Tus datos de acceso</div>
        <div class="hc-row">
          <div class="hc-label">Plataforma</div>
          <div class="hc-value accent">konecta3d.vercel.app</div>
        </div>
        <div class="hc-row">
          <div class="hc-label">Email</div>
          <div class="hc-value">${mail}</div>
        </div>
        <div class="hc-row">
          <div class="hc-label">Contraseña</div>
          <div class="hc-value">${pass}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- AVISO PRIVACIDAD -->
  <div class="notice" style="margin-top:14px;">
    <p class="notice-text"><strong>Guarda bien estos datos.</strong> No compartas este documento con terceros.</p>
  </div>

  <div class="divider" style="margin-top:14px;"></div>

  <!-- CUERPO: 2 COLUMNAS -->
  <div class="body-grid">

    <!-- PASOS -->
    <div class="col-left">
      <div class="section-title">Tus 3 primeros pasos</div>

      <div class="step">
        <div class="step-number">1</div>
        <div class="step-content">
          <div class="step-header">
            <span class="step-title">Perfil de negocio</span>
            <span class="step-time">~5 min</span>
          </div>
          <p class="step-where">Mi Negocio → Perfil</p>
          <ul class="step-bullets">
            <li>Sube tu logo</li>
            <li>Añade nombre, descripción y teléfono</li>
            <li>Configura tu enlace único del llavero</li>
          </ul>
        </div>
      </div>

      <div class="step-connector"></div>

      <div class="step">
        <div class="step-number">2</div>
        <div class="step-content">
          <div class="step-header">
            <span class="step-title">Landing de fidelización</span>
            <span class="step-time">~10 min</span>
          </div>
          <p class="step-where">Fidelización → Landing</p>
          <ul class="step-bullets">
            <li>Diseña la página que ven al escanear el llavero</li>
            <li>Añade servicios, WhatsApp y colores de tu negocio</li>
            <li>Escanea el llavero al terminar para comprobarlo</li>
          </ul>
        </div>
      </div>

      <div class="step-connector"></div>

      <div class="step">
        <div class="step-number">3</div>
        <div class="step-content">
          <div class="step-header">
            <span class="step-title">Primera campaña de captación</span>
            <span class="step-time">~15 min</span>
          </div>
          <p class="step-where">Captación → Campañas → Nueva campaña</p>
          <ul class="step-bullets">
            <li>Crea una campaña para tu próxima feria o evento</li>
            <li>Vincula un formulario y un recurso gratuito</li>
            <li>El llavero empieza a captar contactos automáticamente</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- COLUMNA DERECHA: ACCESO + QUÉ ENCONTRARÁS -->
    <div class="col-right">
      <div class="section-title">Cómo acceder</div>

      <div class="access-box">
        <div class="access-title">🌐 Entra desde cualquier dispositivo</div>
        <div class="access-row">
          <div class="access-label">URL</div>
          <div class="access-value accent">konecta3d.vercel.app</div>
        </div>
        <div class="access-row">
          <div class="access-label">Usuario</div>
          <div class="access-value">${mail}</div>
        </div>
        <div class="access-row">
          <div class="access-label">Contraseña</div>
          <div class="access-value">${pass}</div>
        </div>
      </div>

      <div class="section-title" style="margin-top:16px;">Qué encontrarás</div>

      <div class="features-box">
        <div class="features-header">
          <span style="font-size:13px;">✦</span>
          <span class="features-header-text">Tres perfiles de trabajo</span>
        </div>
        <div class="features-body">
          <div class="feature-item">
            <span>→</span>
            <div><strong>Mi Negocio</strong> — tu identidad digital y enlace NFC</div>
          </div>
          <div class="feature-item">
            <span>→</span>
            <div><strong>Fidelización</strong> — landing, recursos de valor y comunicación</div>
          </div>
          <div class="feature-item">
            <span>→</span>
            <div><strong>Captación</strong> — formularios, campañas y gestión de leads</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="divider"></div>

  <!-- SOPORTE -->
  <div class="support-box">
    <div class="support-text">
      <strong>¿Tienes dudas?</strong>
      Si tienes cualquier pregunta durante la configuración, escríbenos.
    </div>
    <a class="support-btn" href="https://wa.me/34623759451?text=Konecta3d">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.856L.057 24l6.305-1.654A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.7 9.7 0 01-4.948-1.352l-.355-.21-3.676 1.025 1.025-3.676-.21-.355A9.693 9.693 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
      </svg>
      Equipo Konecta3D
    </a>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <p class="footer-logo">KONECTA3D</p>
    <p class="footer-text">Documento personal con credenciales de acceso. No lo compartas con terceros.</p>
  </div>

</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/onboarding-pdf
// Body: { businessId, newPassword }
// 1. Verifica sesión admin
// 2. Lee datos del negocio
// 3. Resetea la contraseña en Supabase Auth
// 4. Genera PDF con Puppeteer
// 5. Devuelve el PDF como descarga
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

    // 2. Resetear contraseña real en Supabase Auth
    let userId = business.user_id as string | null;

    if (!userId) {
      // Fallback: buscar por email en auth.users
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
      const found = (listData?.users ?? []).find(
        (u) => (u.email || "").toLowerCase() === business.contact_email!.toLowerCase()
      );
      userId = found?.id ?? null;
    }

    if (userId) {
      const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );
      if (pwError) {
        return NextResponse.json({ error: pwError.message }, { status: 500 });
      }
    } else {
      // El usuario no existe en Auth — crearlo
      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: business.contact_email,
        password: newPassword,
        email_confirm: true,
      });
      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }
    }

    // 3. Generar PDF con Puppeteer
    const html = buildOnboardingHtml(
      business.name,
      business.contact_email,
      newPassword
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
