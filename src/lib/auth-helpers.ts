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
 */
export async function verifyBusinessOwnership(req: Request, businessId: string): Promise<boolean> {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return false;

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await anonClient.auth.getUser(token);
  if (!data?.user) return false;

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("user_id, contact_email")
    .eq("id", businessId)
    .single();

  if (!business) return false;

  // Verificar por user_id (preferido) O por contact_email (fallback para
  // negocios creados antes de que existiera la columna user_id)
  const matchesUserId = business.user_id && business.user_id === data.user.id;
  const matchesEmail  = business.contact_email &&
    business.contact_email.toLowerCase() === (data.user.email || "").toLowerCase();

  return !!(matchesUserId || matchesEmail);
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
