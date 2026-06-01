import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";
import { listGetResponseCampaigns } from "@/lib/getresponse";

/**
 * GET /api/admin/getresponse/campaigns
 * Lista las campañas (listas) de GetResponse para obtener su ID.
 * Solo admin. Requiere GETRESPONSE_API_KEY configurada.
 */
export async function GET(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!process.env.GETRESPONSE_API_KEY) {
    return NextResponse.json({ error: "GETRESPONSE_API_KEY no configurada", campaigns: [] }, { status: 200 });
  }

  const campaigns = await listGetResponseCampaigns();
  return NextResponse.json({ campaigns });
}
