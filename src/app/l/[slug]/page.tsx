import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import LandingRenderer from "@/components/LandingRenderer";
import { defaultLandingConfig } from "@/lib/landingTypes";

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Buscar el negocio por slug
  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .select("id, slug, name")
    .eq("slug", slug)
    .single();

  if (bizError || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f2b33] text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Landing no encontrada</h1>
          <p className="mt-2 text-white/70">Esta URL no existe</p>
        </div>
      </div>
    );
  }

  // Cargar configuración de landing
  const { data: landingConfig } = await supabase
    .from("landing_configs")
    .select("config")
    .eq("business_id", business.id)
    .single();

  // Extraer la versión correcta (publicada)
  let resolvedConfig = landingConfig?.config || {};
  if (resolvedConfig.versions) {
    const published = resolvedConfig.published || "A";
    resolvedConfig = resolvedConfig.versions[published] || resolvedConfig.versions["A"] || {};
  }

  const config = {
    ...defaultLandingConfig,
    ...resolvedConfig,
    businessName: business.name,
  };

  return <LandingRenderer config={config} />;
}
