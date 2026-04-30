import { createClient } from "@supabase/supabase-js";
import LandingRenderer from "@/components/LandingRenderer";
import PreviewClient from "./PreviewClient";

export const dynamic = "force-dynamic";

export default async function PublicLanding({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> }) {
  const { slug = "" } = await params;
  const sp = await searchParams;
  if (sp?.preview === "1") {
    return <PreviewClient />;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: biz, error: bizError } = await supabase
    .from("businesses")
    .select("id, slug, name, module_tools")
    .eq("slug", slug.toLowerCase())
    .limit(1)
    .maybeSingle();

  if (!biz) {
    return <div>Landing no encontrada.{bizError?.message ? ` (${bizError.message})` : ""}</div>;
  }

  const { data: configRow, error: cfgError } = await supabase
    .from("landing_configs")
    .select("config")
    .eq("business_id", biz.id)
    .single();

  if (cfgError || !configRow?.config) {
    return <div>Landing sin configuración guardada.</div>;
  }

  const raw = configRow.config;
  const resolvedConfig = raw?.versions ? (raw.versions[raw.published || "A"] || raw.versions["A"]) : raw;

  // Garantizar businessName y businessId en el config para que el LandingRenderer
  // muestre el nombre correcto y registre analytics correctamente.
  const config = {
    ...resolvedConfig,
    businessName: resolvedConfig?.businessName || biz.name || "",
    businessId: biz.id,
  };

  // Herramientas solo activas si el negocio tiene el módulo tools habilitado
  const toolsEnabled = !!biz.module_tools;

  return <LandingRenderer config={config} toolsEnabled={toolsEnabled} />;
}
