import "server-only";
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_LOGIN_CONFIG, LoginPageConfig } from "./login-page-config";

/**
 * Lee la configuración de la página de login en el servidor (service role,
 * salta RLS en `settings`). Devuelve la config guardada fusionada con los
 * valores por defecto, o los defaults si no hay nada / falla.
 *
 * Usarlo desde Server Components y route handlers para entregar el HTML ya
 * personalizado y evitar el "salto" de la pantalla base a la real.
 */
export async function getLoginPageConfig(): Promise<Required<LoginPageConfig>> {
  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data } = await db
      .from("settings")
      .select("value")
      .eq("key", "login_page_config")
      .single();

    if (!data?.value) return DEFAULT_LOGIN_CONFIG;

    const saved =
      typeof data.value === "string" ? JSON.parse(data.value) : data.value;

    return { ...DEFAULT_LOGIN_CONFIG, ...saved };
  } catch {
    return DEFAULT_LOGIN_CONFIG;
  }
}
