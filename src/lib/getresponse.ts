// ─── Integración con GetResponse ──────────────────────────────────────────────
// Añade contactos a una campaña (lista) de GetResponse vía API v3.
// Al añadir el contacto a una campaña con autoresponder configurado,
// GetResponse dispara automáticamente el primer email y la secuencia.
//
// Configuración (variables de entorno en Vercel):
//   GETRESPONSE_API_KEY      → API key de GetResponse
//   GETRESPONSE_CAMPAIGN_ID  → ID de la lista/campaña destino
//   KONECTA_BUSINESS_ID      → ID del negocio Konecta (para enviar solo sus leads)

const API = "https://api.getresponse.com/v3";

function apiKey(): string | null {
  return process.env.GETRESPONSE_API_KEY || null;
}

/**
 * Añade un contacto a la campaña de GetResponse.
 * Devuelve { ok } — nunca lanza, para usarse fire-and-forget.
 */
export async function addContactToGetResponse(
  email: string,
  name?: string | null,
  campaignIdOverride?: string,
): Promise<{ ok: boolean; error?: string }> {
  const key = apiKey();
  const campaignId = campaignIdOverride || process.env.GETRESPONSE_CAMPAIGN_ID || "";
  if (!key || !campaignId) return { ok: false, error: "GetResponse no configurado" };

  try {
    const res = await fetch(`${API}/contacts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": `api-key ${key}`,
      },
      body: JSON.stringify({
        email,
        ...(name ? { name } : {}),
        campaign: { campaignId },
      }),
      signal: AbortSignal.timeout(8000),
    });

    // GetResponse responde 202 Accepted (procesa de forma asíncrona)
    if (res.status === 202 || res.ok) return { ok: true };

    const txt = await res.text().catch(() => "");
    return { ok: false, error: `GetResponse ${res.status}: ${txt.slice(0, 200)}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "error de red" };
  }
}

/**
 * Lista las campañas (listas) de GetResponse para obtener sus IDs.
 * Útil para configurar GETRESPONSE_CAMPAIGN_ID.
 */
export async function listGetResponseCampaigns(): Promise<{ campaignId: string; name: string }[]> {
  const key = apiKey();
  if (!key) return [];
  try {
    const res = await fetch(`${API}/campaigns`, {
      headers: { "X-Auth-Token": `api-key ${key}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((c: { campaignId: string; name: string }) => ({
      campaignId: c.campaignId,
      name: c.name,
    }));
  } catch {
    return [];
  }
}
