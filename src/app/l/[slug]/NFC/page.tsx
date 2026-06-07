import { createClient } from "@supabase/supabase-js";
import LandingRenderer from "@/components/LandingRenderer";
import PreviewClient from "./PreviewClient";
import { defaultLandingConfig } from "@/lib/landingTypes";

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
  // If the config has top-level landing fields (post-migration), use it directly.
  // Only fall back to legacy versions structure when there are no flat fields.
  const hasFlat = raw && typeof raw === "object" && ("bgColor" in raw || "showCta1" in raw || "ctaBg" in raw);
  const resolvedConfig = hasFlat ? raw : (raw?.versions ? (raw.versions[raw.published || "A"] || raw.versions["A"]) : raw);

  // Garantizar defaults completos + businessName y businessId.
  // Sin defaultLandingConfig los valores opcionales ausentes en la DB quedarían
  // como undefined y el LandingRenderer podría comportarse de forma inesperada.
  const config = {
    ...defaultLandingConfig,
    ...resolvedConfig,
    businessName: resolvedConfig?.businessName || biz.name || "",
    businessId: biz.id,
    slug: biz.slug,
  };

  // Herramientas solo activas si el negocio tiene el módulo tools habilitado
  const toolsEnabled = !!biz.module_tools;

  return <LandingRenderer config={config} toolsEnabled={toolsEnabled} skipLeadCapture />;
}
