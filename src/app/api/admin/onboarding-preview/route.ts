import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";
import { launchBrowser } from "@/lib/pdf-browser";
import { buildOnboardingHtml, OnboardingTemplate } from "@/lib/onboarding-html";

export const maxDuration = 60;

/**
 * Fetches an image URL and returns a base64 data-URL so Puppeteer can embed it
 * without needing to reach external hosts at render time.
 */
async function toDataUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return url;
    const mime = res.headers.get("content-type") || "image/jpeg";
    const buf  = await res.arrayBuffer();
    const b64  = Buffer.from(buf).toString("base64");
    return `data:${mime};base64,${b64}`;
  } catch {
    return url; // fallback: keep original URL
  }
}

// POST /api/admin/onboarding-preview
// Body: OnboardingTemplate JSON
// Genera un PDF de muestra con datos ficticios para previsualizar la plantilla
export async function POST(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Acepta tanto el template solo (llamada antigua) como un objeto con datos del negocio
    const template: OnboardingTemplate = body?.template ?? body;
    const businessName: string = body?.businessName || "Nombre del Negocio";
    const email: string = body?.email || "cliente@ejemplo.com";
    const password: string = body?.password || "ContraseñaEjemplo";

    // ── Pre-fetch imágenes para que Puppeteer las tenga embebidas ──
    if (template.hero?.bg_type === "image" && template.hero?.bg_image_url) {
      template.hero.bg_image_url = await toDataUrl(template.hero.bg_image_url);
    }
    if (template.hero?.logo_type === "image" && template.hero?.logo_url) {
      template.hero.logo_url = await toDataUrl(template.hero.logo_url);
    }

    const html = buildOnboardingHtml(businessName, email, password, template);

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

      return new Response(pdfBuffer as unknown as BodyInit, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="onboarding-preview.pdf"',
        },
      });
    } catch (e) {
      await browser.close().catch(() => {});
      throw e;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("Onboarding preview error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
