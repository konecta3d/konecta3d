// ─── Resolución del negocio activo (con "modo desarrollador"/impersonación) ─────
//
// Cuando el admin entra en un negocio desde el panel admin ("Entrar como el
// negocio"), se guarda `konecta-business-id` + `konecta-from-admin-business` en
// localStorage. Este helper hace que TODAS las pantallas del panel resuelvan ese
// negocio en vez del que corresponde al email de sesión.
//
// Seguridad: la impersonación solo es efectiva de verdad si el usuario es admin,
// porque el acceso a los datos está protegido por RLS (el negocio solo ve lo suyo;
// el admin, por is_admin(), ve todo) y las rutas de servidor verifican admin por
// el token (ver verifyBusinessOwnership). Si un usuario normal forzara estas claves
// en su localStorage, RLS le bloquearía igual: no vería datos ajenos.

import type { SupabaseClient } from "@supabase/supabase-js";

const IMP_ID_KEY = "konecta-business-id";
const IMP_FLAG_KEY = "konecta-from-admin-business";

/** Devuelve el businessId impersonado (admin) si está activo, o null. */
export function getImpersonatedBusinessId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    if (localStorage.getItem(IMP_FLAG_KEY) === "true") {
      const id = localStorage.getItem(IMP_ID_KEY);
      return id && id.trim() ? id.trim() : null;
    }
  } catch {
    /* localStorage no disponible */
  }
  return null;
}

/** True si el admin está entrando "como un negocio". */
export function isImpersonating(): boolean {
  return getImpersonatedBusinessId() !== null;
}

/** Cierra la impersonación (volver a ser admin). */
export function clearImpersonation(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(IMP_ID_KEY);
    localStorage.removeItem(IMP_FLAG_KEY);
  } catch { /* noop */ }
}

type ParamGetter = { get(key: string): string | null } | null | undefined;

/**
 * Resuelve el businessId activo, en este orden de prioridad:
 *   1. ?businessId= en la URL (accesos directos "editar como este negocio")
 *   2. impersonación de admin (localStorage)
 *   3. el negocio del usuario de sesión (user_id, luego contact_email)
 * Devuelve "" si no hay ninguno.
 */
export async function getActiveBusinessId(
  supabase: SupabaseClient,
  searchParams?: ParamGetter
): Promise<string> {
  const param = searchParams?.get?.("businessId");
  if (param && param.trim()) return param.trim();

  const imp = getImpersonatedBusinessId();
  if (imp) return imp;

  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return "";

  const byUid = await supabase.from("businesses").select("id").eq("user_id", user.id).maybeSingle();
  if (byUid.data?.id) return byUid.data.id as string;

  if (user.email) {
    const byEmail = await supabase.from("businesses").select("id").ilike("contact_email", user.email).maybeSingle();
    if (byEmail.data?.id) return byEmail.data.id as string;
  }

  return "";
}
