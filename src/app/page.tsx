import { getLoginPageConfig } from "@/lib/login-page-config.server";
import BusinessLoginForm from "./BusinessLoginForm";

// Render dinámico en cada petición para que la config (logo, colores, textos)
// llegue siempre fresca en el HTML inicial → sin "salto" de la pantalla base.
export const dynamic = "force-dynamic";

export default async function BusinessLoginPage() {
  const config = await getLoginPageConfig();
  return <BusinessLoginForm initialConfig={config} />;
}
