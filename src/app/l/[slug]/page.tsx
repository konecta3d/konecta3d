import { createClient } from "@supabase/supabase-js";
import LandingRenderer from "@/components/LandingRenderer";
import { defaultLandingConfig } from "@/lib/landingTypes";

// Forzar renderizado dinámico en cada petición — evita que Vercel
// sirva una versión cacheada con estilos desactualizados.
export const dynamic = "force-dynamic";

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Buscar el negocio por slug
  // Nota: landing_active no se selecciona porque la columna puede no existir en la DB
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

  // Cargar formularios activos del negocio (máx 1 para mostrar)
  const { data: activeForms } = await supabase
    .from("forms")
    .select("id, title, type, questions, data_collection")
    .eq("business_id", business.id)
    .eq("active", true)
    .limit(1);

  // Use flat config directly if it has landing fields; only fall back to legacy versions.
  const raw = landingConfig?.config || {};
  const hasFlat = raw && typeof raw === "object" && ("bgColor" in raw || "showCta1" in raw || "ctaBg" in raw);
  let resolvedConfig = hasFlat ? raw : (raw.versions ? (raw.versions[raw.published || "A"] || raw.versions["A"] || {}) : raw);

  const config = {
    ...defaultLandingConfig,
    ...resolvedConfig,
    businessName: business.name,
    businessId: business.id,
    slug: business.slug,
  };

  return <LandingRenderer config={config} activeForms={activeForms || []} />;
}
