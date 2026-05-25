import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";
import { launchBrowser } from "@/lib/pdf-browser";
import { buildOnboardingHtml } from "@/lib/onboarding-html";

export const maxDuration = 60;

// POST /api/admin/onboarding-preview
// Body: OnboardingTemplate JSON
// Genera un PDF de muestra con datos ficticios para previsualizar la plantilla
export async function POST(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const template = await req.json();

    const html = buildOnboardingHtml(
      "Nombre del Negocio",
      "cliente@ejemplo.com",
      "ContraseñaEjemplo",
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
