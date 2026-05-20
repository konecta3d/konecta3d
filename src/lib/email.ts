/**
 * Capa de envío de emails para Konecta3D.
 * Usa Resend (resend.com) como proveedor.
 *
 * Si RESEND_API_KEY no está configurada, todas las funciones
 * devuelven { ok: false, skipped: true } sin lanzar error.
 * El resto de la aplicación no se ve afectado.
 */

import { Resend } from "resend";

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

// ─── Dirección remitente ──────────────────────────────────────────────────────
// Personalizar cuando el dominio esté verificado en Resend.
// Mientras tanto usar el dominio de Resend por defecto.
const FROM_EMAIL = process.env.EMAIL_FROM ?? "Konecta3D <noreply@konecta3d.com>";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface LeadNotificationParams {
  /** Email del negocio que recibirá la notificación */
  businessEmail: string;
  businessName: string;
  /** Datos del lead capturado */
  leadName?: string | null;
  leadPhone: string;
  leadEmail?: string | null;
  campaignName: string;
  capturedAt?: Date;
}

export interface LeadDeliveryParams {
  /** Email del lead al que se envía el recurso */
  leadEmail: string;
  leadName?: string | null;
  businessName: string;
  resourceTitle: string;
  resourceDescription?: string | null;
  resourceUrl: string;
  ctaText?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── 1. Notificación al negocio: nuevo lead capturado ────────────────────────

export async function sendLeadNotification(params: LeadNotificationParams): Promise<{ ok: boolean; skipped?: boolean }> {
  const resend = getResend();
  if (!resend) return { ok: false, skipped: true };

  const {
    businessEmail, businessName, leadName, leadPhone,
    leadEmail, campaignName, capturedAt = new Date(),
  } = params;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Header -->
        <tr><td style="background:#1A4D4A;border-radius:12px 12px 0 0;padding:24px 32px;">
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.6);letter-spacing:1px;text-transform:uppercase;">Konecta3D</p>
          <h1 style="margin:8px 0 0;font-size:22px;color:#ffffff;font-weight:700;">Nuevo lead capturado</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:32px;border-radius:0 0 12px 12px;">
          <p style="margin:0 0 24px;font-size:15px;color:#374151;">
            Hola <strong>${businessName}</strong>, acabas de captar un nuevo contacto en la campaña
            <strong>${campaignName}</strong>.
          </p>

          <!-- Lead card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 4px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Contacto</p>
              <p style="margin:0 0 16px;font-size:18px;color:#111827;font-weight:700;">${leadName || "Sin nombre"}</p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:4px 12px 4px 0;font-size:13px;color:#6b7280;">WhatsApp</td>
                  <td style="padding:4px 0;font-size:13px;color:#111827;font-weight:600;">${leadPhone}</td>
                </tr>
                ${leadEmail ? `
                <tr>
                  <td style="padding:4px 12px 4px 0;font-size:13px;color:#6b7280;">Email</td>
                  <td style="padding:4px 0;font-size:13px;color:#111827;">${leadEmail}</td>
                </tr>` : ""}
                <tr>
                  <td style="padding:4px 12px 4px 0;font-size:13px;color:#6b7280;">Campaña</td>
                  <td style="padding:4px 0;font-size:13px;color:#111827;">${campaignName}</td>
                </tr>
                <tr>
                  <td style="padding:4px 12px 4px 0;font-size:13px;color:#6b7280;">Hora</td>
                  <td style="padding:4px 0;font-size:13px;color:#111827;">${formatDate(capturedAt)}</td>
                </tr>
              </table>
            </td></tr>
          </table>

          <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">
            Recuerda: los mejores resultados se consiguen contactando en las primeras 2 horas.
          </p>

          <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:16px;">
            Este email fue enviado automaticamente por Konecta3D. Puedes ver todos tus leads en la plataforma.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [businessEmail],
      subject: `Nuevo lead: ${leadName || leadPhone} — ${campaignName}`,
      html,
    });
    if (error) {
      console.error("[email] sendLeadNotification error:", error);
      return { ok: false };
    }
    return { ok: true };
  } catch (e) {
    console.error("[email] sendLeadNotification exception:", e);
    return { ok: false };
  }
}

// ─── 2. Entrega del recurso al lead ──────────────────────────────────────────

export async function sendLeadDelivery(params: LeadDeliveryParams): Promise<{ ok: boolean; skipped?: boolean }> {
  const resend = getResend();
  if (!resend) return { ok: false, skipped: true };

  const {
    leadEmail, leadName, businessName,
    resourceTitle, resourceDescription,
    resourceUrl, ctaText,
  } = params;

  const greeting = leadName ? `Hola ${leadName}` : "Hola";
  const buttonLabel = ctaText || "Acceder al recurso";

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Header -->
        <tr><td style="background:#1A4D4A;border-radius:12px 12px 0 0;padding:24px 32px;">
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.6);letter-spacing:1px;">${businessName}</p>
          <h1 style="margin:8px 0 0;font-size:22px;color:#ffffff;font-weight:700;">Tu recurso está listo</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:32px;border-radius:0 0 12px 12px;">
          <p style="margin:0 0 24px;font-size:15px;color:#374151;">${greeting},</p>

          <!-- Resource card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:28px;">
            <tr><td style="padding:24px;">
              <p style="margin:0 0 8px;font-size:17px;color:#111827;font-weight:700;">${resourceTitle}</p>
              ${resourceDescription ? `<p style="margin:0 0 20px;font-size:14px;color:#6b7280;">${resourceDescription}</p>` : ""}
              <a href="${resourceUrl}"
                style="display:inline-block;background:#1A4D4A;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 28px;border-radius:8px;">
                ${buttonLabel}
              </a>
            </td></tr>
          </table>

          <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:
          </p>
          <p style="margin:0;font-size:12px;color:#9ca3af;word-break:break-all;">${resourceUrl}</p>

          <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:16px;">
            Enviado por ${businessName} a traves de Konecta3D.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [leadEmail],
      subject: `${resourceTitle} — de ${businessName}`,
      html,
    });
    if (error) {
      console.error("[email] sendLeadDelivery error:", error);
      return { ok: false };
    }
    return { ok: true };
  } catch (e) {
    console.error("[email] sendLeadDelivery exception:", e);
    return { ok: false };
  }
}
