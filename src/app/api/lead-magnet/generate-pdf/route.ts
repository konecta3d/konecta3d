import { createClient } from "@supabase/supabase-js";
import puppeteer from "puppeteer-core";
import { verifyBusinessOwnership } from "@/lib/auth-helpers";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { html, businessId, title, leadMagnetId } = body;

    if (!html) {
      return Response.json({ error: "HTML requerido" }, { status: 400 });
    }

    if (!businessId) {
      return Response.json({ error: "businessId requerido" }, { status: 400 });
    }

    // TODO: reactivar verificación de propiedad cuando pasemos token desde el cliente.
    // const hasOwnership = await verifyBusinessOwnership(req, businessId);
    // if (!hasOwnership) {
    //   return Response.json({ error: "No autorizado" }, { status: 403 });
    // }

    // Basic HTML sanitization - remove script tags and event handlers to prevent XSS in Puppeteer
    const sanitizedHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/\son\w+="[^"]*"/gi, "")
      .replace(/\son\w+='[^']*'/gi, "");

    // Buscar Chrome
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
      return Response.json({ error: "Chrome no encontrado. Instala Chrome o define CHROME_PATH." }, { status: 500 });
    }

    const browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-javascript']
    });

    const page = await browser.newPage();
    await page.setContent(sanitizedHtml, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      width: '210mm',
      height: '297mm',
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 }
    });

    await browser.close();

    // Guardar en Supabase Storage
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const rawTitle = (title || "documento").slice(0, 80);
    const safeTitle = rawTitle
      .normalize("NFD")
      .replace(/[^a-zA-Z0-9\s-_]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    const filename = `lead-magnet/${businessId}/${Date.now()}-${safeTitle || "documento"}.pdf`;

    const { error: upErr } = await supabase.storage
      .from("landing-assets")
      .upload(filename, pdfBuffer, { contentType: "application/pdf", upsert: true });

    if (upErr) {
      return Response.json({ error: upErr.message }, { status: 500 });
    }

    const { data } = supabase.storage.from("landing-assets").getPublicUrl(filename);
    const publicUrl = data.publicUrl;

    // Si tenemos leadMagnetId, actualizamos la tabla lead_magnets
    if (leadMagnetId) {
      await supabase
        .from("lead_magnets")
        .update({ pdf_url: publicUrl })
        .eq("id", leadMagnetId);
    }

    return Response.json({ url: publicUrl });

  } catch (e: any) {
    console.error("PDF generate error:", e);
    return Response.json({ error: e?.message || "Error al generar PDF" }, { status: 500 });
  }
}
