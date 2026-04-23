import { createClient } from "@supabase/supabase-js";
import { verifyBusinessOwnership } from "@/lib/auth-helpers";
import { launchBrowser } from "@/lib/pdf-browser";

export const maxDuration = 60; // Vercel Pro: hasta 60s para PDF generation

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

    // Verificar propiedad del negocio
    const hasOwnership = await verifyBusinessOwnership(req, businessId);
    if (!hasOwnership) {
      return Response.json({ error: "No autorizado" }, { status: 403 });
    }

    // Sanitizar HTML — eliminar scripts y event handlers para prevenir XSS en Puppeteer
    const sanitizedHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/\son\w+="[^"]*"/gi, "")
      .replace(/\son\w+='[^']*'/gi, "");

    const browser = await launchBrowser();

    try {
      const page = await browser.newPage();
      await page.setContent(sanitizedHtml, { waitUntil: "networkidle0" });

      const pdfBuffer = await page.pdf({
        width: "210mm",
        height: "297mm",
        printBackground: true,
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
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
        .replace(/[^a-zA-Z0-9\s\-_]/g, "")
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

      // Actualizar lead_magnet con la URL del PDF si se proporciona ID
      if (leadMagnetId) {
        await supabase
          .from("lead_magnets")
          .update({ pdf_url: data.publicUrl })
          .eq("id", leadMagnetId);
      }

      return Response.json({ url: data.publicUrl });
    } catch (e) {
      await browser.close().catch(() => {});
      throw e;
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error al generar PDF";
    console.error("PDF generate error:", e);
    return Response.json({ error: msg }, { status: 500 });
  }
}
