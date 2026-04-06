import { createClient } from "@supabase/supabase-js";
import puppeteer from "puppeteer-core";
import { escapeHtml, sanitizeUrl, sanitizeFilename } from "@/lib/sanitize";
import { verifyBusinessOwnership } from "@/lib/auth-helpers";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const benefitId = searchParams.get("id");
  
  if (!benefitId) {
    return new Response("Missing benefit id", { status: 400 });
  }

  // Buscar el benefit en Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: benefit, error } = await supabase
    .from("benefits")
    .select("*")
    .eq("id", benefitId)
    .single();

  if (error || !benefit) {
    return new Response("Beneficio no encontrado", { status: 404 });
  }

  // Verify ownership
  const hasOwnership = await verifyBusinessOwnership(req, benefit.business_id);
  if (!hasOwnership) {
    return new Response("No autorizado", { status: 403 });
  }

  const { title, description, value, conditions, redeem_instructions, business_id } = benefit;
  const instructions = redeem_instructions || "";
  const businessId = business_id;

  try {
    // Extraer y SANITIZAR todos los valores de usuario para prevenir XSS
    const showLogo = conditions?.showLogo ?? true;
    const showTitle = conditions?.showTitle ?? true;
    const showClient = conditions?.showClient ?? true;
    const showValue = conditions?.showValue ?? true;
    const showCode = conditions?.showCode ?? true;
    const showGeneratedDate = conditions?.showGeneratedDate ?? true;
    const showValidUntil = conditions?.showValidUntil ?? true;
    const showProductService = conditions?.showProductService ?? true;

    // Sanitizar todos los textos de usuario
    const productService = escapeHtml(conditions?.productService || "");
    const bizName = escapeHtml(conditions?.biz_name || title || "TU NEGOCIO");
    const clientName = escapeHtml(conditions?.client_name || "Cliente");
    const valueDisplay = escapeHtml(value || "10% Descuento");
    const personalCode = escapeHtml(conditions?.personal_code || "VIP-CODIGO");
    const generatedAt = escapeHtml(conditions?.generated_at || "FECHA");
    const validText = escapeHtml(conditions?.valid_text || "FECHA");
    const finalNote = escapeHtml(conditions?.final_note || instructions || "");
    const bottomTitle = escapeHtml(conditions?.bottom_title || "");
    const ctaText = escapeHtml(conditions?.cta_text || "");
    const ctaLink = sanitizeUrl(conditions?.cta_link);

    // Sanitizar valores de estilo (colores, números)
    const docBg = escapeHtml(conditions?.doc_bg || "#ffffff");
    const docGradient = escapeHtml(conditions?.doc_gradient || "");
    const docBgImage = sanitizeUrl(conditions?.bg_image || "");
    const docText = escapeHtml(conditions?.doc_text || "#0f172a");
    const docAccent = escapeHtml(conditions?.doc_accent || "#0d0d0c");
    const docButtonBg = escapeHtml(conditions?.doc_button_bg || "#0f172a");
    const docButtonText = escapeHtml(conditions?.doc_button_text || "#ffffff");
    const docBorder = escapeHtml(conditions?.doc_border || "#e2e8f0");
    const logoUrl = sanitizeUrl(conditions?.logo_url || "");

    // Los valores numéricos se usan en interpolation de styles, solo permitir números
    const toNum = (v: unknown, def: number) => {
      const n = Number(v);
      return isNaN(n) ? def : n;
    };
    const docRadius = toNum(conditions?.doc_radius, 16);
    const docTitleSize = toNum(conditions?.doc_title_size, 22);
    const docBodySize = toNum(conditions?.doc_body_size, 13);
    const codeWidth = toNum(conditions?.code_width, 260);
    const logoSize = toNum(conditions?.logo_size, 64);
    const spaceLogoTitle = toNum(conditions?.space_logo_title, 16);
    const spaceTitleClient = toNum(conditions?.space_title_client, 6);
    const spaceClientValue = toNum(conditions?.space_client_value, 16);
    const spaceProductService = toNum(conditions?.space_product_service, 16);
    const spaceValueCode = toNum(conditions?.space_value_code, 16);
    const spaceCodeDates = toNum(conditions?.space_code_dates, 10);
    const spaceDatesNote = toNum(conditions?.space_dates_note, 60);

    // Construir el HTML con valores ya sanitizados
    const bgStyle = docBgImage
      ? `background: url(${docBgImage}) center/cover no-repeat;`
      : (docGradient ? `background: ${docGradient};` : `background: ${docBg};`);

    // Marco tipo móvil - dimensiones similares a un teléfono
    const frameWidth = 340;
    const frameRadius = 40;
    const paddingX = 20;
    const paddingY = 28;

    const logoHtml = showLogo && logoUrl
      ? `<div style="display:flex; justify-content:center; margin-bottom:${spaceLogoTitle}px;"><img src="${logoUrl}" alt="logo" style="height:${logoSize}px;width:auto;"></div>`
      : '';

    const titleHtml = showTitle
      ? `<div style="font-size:${docTitleSize + 8}px;font-weight:700;text-align:center;">${bizName}</div>`
      : '';

    const clientHtml = showClient
      ? `<div style="font-size:${docBodySize + 2}px;margin-top:${spaceTitleClient}px;text-align:center;color:#6b7280;">Beneficio: <span style="color:${docText};font-weight:600;">${clientName}</span></div>`
      : '';

    const valueHtml = showValue
      ? `<div style="margin-top:${spaceClientValue}px;border:2px solid ${docBorder};border-radius:${docRadius}px;color:${docText};font-weight:600;padding:16px 24px;text-align:center;font-size:18px;background:${docBg};">${valueDisplay}</div>`
      : '';

    const productServiceHtml = showProductService
      ? `<div style="margin-top:${spaceProductService}px;border:2px solid ${docBorder};border-radius:${docRadius}px;color:${docAccent};padding:10px 16px;text-align:center;font-size:14px;">${productService || "Aplicable a..."}</div>`
      : '';

    const codeHtml = showCode
      ? `<div style="margin-top:${spaceValueCode}px;background:${docButtonBg};color:${docButtonText};border-radius:${docRadius}px;font-weight:700;letter-spacing:4px;padding:16px;width:${codeWidth}px;margin-left:auto;margin-right:auto;text-align:center;font-size:20px;">${personalCode}</div>`
      : '';

    let datesHtml = '';
    if (showGeneratedDate || showValidUntil) {
      datesHtml = `<div style="margin-top:${spaceCodeDates}px;">`;
      if (showGeneratedDate) {
        datesHtml += `<div style="font-size:${docBodySize}px;text-align:center;color:${docAccent};">Generado: ${generatedAt}</div>`;
      }
      if (showValidUntil) {
        datesHtml += `<div style="font-size:${docBodySize}px;text-align:center;color:${docAccent};">Valido hasta: ${validText}</div>`;
      }
      datesHtml += `</div>`;
    }

    // Mostrar nota siempre si hay contenido
    const noteHtml = finalNote
      ? `<div style="margin-top:${spaceDatesNote}px;"><div style="height:1px;background:${docBorder};margin:16px 0;"></div><div style="font-size:${docBodySize}px;text-align:center;color:${docAccent};white-space:pre-wrap;">${finalNote}</div></div>`
      : '';

    // Nuevos elementos: Bottom Title y CTA
    const bottomTitleEnabled = conditions?.bottom_title_enabled ?? false;
    const bottomTitleHtml = bottomTitleEnabled && bottomTitle
      ? `<div style="margin-top:16px;"><div style="font-size:${docBodySize}px;text-align:center;color:${docAccent};font-weight:600;">${bottomTitle}</div></div>`
      : '';

    const ctaEnabled = conditions?.cta_enabled ?? false;
    const ctaHtml = ctaEnabled && ctaText
      ? `<div style="margin-top:16px;"><a href="${ctaLink}" target="_blank" style="display:block;background:${docButtonBg};color:${docButtonText};border-radius:${docRadius}px;font-weight:700;letter-spacing:1px;padding:12px 20px;width:${codeWidth}px;margin-left:auto;margin-right:auto;text-align:center;text-decoration:none;font-size:14px;">${ctaText}</a></div>`
      : '';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Open Sans', sans-serif;
      ${bgStyle}
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .frame {
      width: ${frameWidth}px;
      min-height: ${frameHeight}px;
      border: 4px solid ${docBorder};
      border-radius: ${frameRadius}px;
      background: ${docBgImage ? `url(${docBgImage}) center/cover no-repeat` : (docGradient ? docGradient : docBg)};
      color: ${docText};
      padding: ${paddingY}px ${paddingX}px;
      position: relative;
      overflow: hidden;
    }
    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
    }
  </style>
</head>
<body>
  <div class="frame">
    <div class="container">
      ${logoHtml}
      ${titleHtml}
      ${clientHtml}
      ${valueHtml}
      ${productServiceHtml}
      ${codeHtml}
      ${datesHtml}
      ${noteHtml}
      ${bottomTitleHtml}
      ${ctaHtml}
    </div>
  </div>
</body>
</html>`;

    // Buscar Chrome/Chromium
    const possiblePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Chromium\\Application\\chromium.exe',
      process.env.CHROME_PATH,
    ].filter(Boolean);

    let executablePath = '';
    for (const path of possiblePaths) {
      try {
        const fs = require('fs');
        if (fs.existsSync(path)) {
          executablePath = path;
          break;
        }
      } catch {}
    }

    if (!executablePath) {
      return new Response("Chrome no encontrado. Instala Chrome o define CHROME_PATH.", { status: 500 });
    }

    const browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      width: '400px',
      height: '750px',
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 }
    });

    await browser.close();

    // Devolver el PDF directamente con headers correctos
    const filename = `beneficio-${sanitizeFilename(bizName || "VIP")}.pdf`;
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (e: any) {
    console.error("PDF generate error:", e);
    return new Response(e?.message || e?.toString() || "Generate PDF error", { status: 500 });
  }
}
