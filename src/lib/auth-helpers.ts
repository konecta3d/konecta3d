import { createClient } from "@supabase/supabase-js";

/**
 * Verify if the request comes from an authenticated admin user.
 * Admin = user who has an entry in the businesses table.
 */
export async function verifyAdminSession(req: Request): Promise<{ isAdmin: boolean; userId: string }> {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return { isAdmin: false, userId: "" };

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await anonClient.auth.getUser(token);
  if (!data?.user) return { isAdmin: false, userId: "" };

  const email = (data.user.email || "").toLowerCase();

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: admin } = await supabaseAdmin
    .from("admins")
    .select("email")
    .eq("email", email)
    .single();

  return { isAdmin: !!admin, userId: data.user.id };
}

/**
 * Verify if the authenticated user owns the specified business.
 *
 * Usa siempre el cliente admin (service role) para verificar el token y
 * consultar businesses. Esto evita los problemas del cliente anon que
 * podía devolver null silenciosamente en entornos server-side.
 */
export async function verifyBusinessOwnership(req: Request, businessId: string): Promise<boolean> {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return false;

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verificar el JWT con el cliente admin (más fiable server-side que el anon)
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData?.user) {
    console.log("[verifyBusinessOwnership] Token inválido o expirado:", userError?.message);
    return false;
  }

  const userId   = userData.user.id;
  const userEmail = (userData.user.email || "").toLowerCase();

  const { data: business, error: bizError } = await supabaseAdmin
    .from("businesses")
    .select("id, user_id, contact_email")
    .eq("id", businessId)
    .single();

  if (bizError || !business) {
    console.log("[verifyBusinessOwnership] Negocio no encontrado:", businessId, bizError?.message);
    return false;
  }

  // Verificar por user_id (preferido) O por contact_email (fallback)
  const matchesUserId = !!(business.user_id && business.user_id === userId);
  const matchesEmail  = !!(business.contact_email &&
    business.contact_email.toLowerCase() === userEmail);

  if (!matchesUserId && !matchesEmail) {
    console.log("[verifyBusinessOwnership] Sin coincidencia:", {
      businessId,
      storedUserId:    business.user_id,
      storedEmail:     business.contact_email?.toLowerCase(),
      requestUserId:   userId,
      requestEmail:    userEmail,
    });
  }

  return matchesUserId || matchesEmail;
}

/**
 * Get the authenticated user from the request token.
 */
export async function getAuthenticatedUser(req: Request): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return null;

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await anonClient.auth.getUser(token);
  if (!data?.user) return null;

  return { userId: data.user.id };
}
