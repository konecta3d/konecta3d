import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";

/**
 * POST /api/admin/is-admin
 * Recibe el JWT en el header Authorization y devuelve { isAdmin: boolean }.
 * Permite que el login page verifique el rol admin sin exponer el email
 * de admin en el bundle del cliente.
 */
export async function POST(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  return NextResponse.json({ isAdmin });
}
