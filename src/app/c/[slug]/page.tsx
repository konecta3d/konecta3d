import { createClient } from "@supabase/supabase-js";
import { notFound, redirect } from "next/navigation";
import FormRenderer from "./FormRenderer";

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CampaignPage({ params }: PageProps) {
  const { slug } = await params;
  const db = supabaseAdmin();

  // Buscar campaña por slug
  const { data: campaign, error } = await db
    .from("captacion_campaigns")
    .select("id, name, status, form_id, lead_magnet_id, business_id")
    .eq("slug", slug)
    .single();

  if (error || !campaign) return notFound();

  // Lógica de estados del llavero
  if (campaign.status === "finished") {
    // Redirigir a la landing principal del negocio (si existe)
    const { data: biz } = await db
      .from("businesses")
      .select("public_id")
      .eq("id", campaign.business_id)
      .single();

    if (biz?.public_id) {
      redirect(`/l/${biz.public_id}`);
    }
    // Si no tiene landing, mostrar mensaje genérico
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a323c]">
        <div className="text-center px-6">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-white mb-2">Campaña finalizada</h1>
          <p className="text-white/60 text-sm">Esta campaña ha terminado. ¡Gracias por tu interés!</p>
        </div>
      </div>
    );
  }

  if (campaign.status === "draft") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a323c]">
        <div className="text-center px-6">
          <div className="text-6xl mb-4">🕐</div>
          <h1 className="text-2xl font-bold text-white mb-2">Próximamente</h1>
          <p className="text-white/60 text-sm">Esta campaña todavía no está activa.</p>
        </div>
      </div>
    );
  }

  // Campaña activa — cargar formulario
  let blocks = null;
  if (campaign.form_id) {
    const { data: form } = await db
      .from("captacion_forms")
      .select("blocks")
      .eq("id", campaign.form_id)
      .single();
    blocks = form?.blocks || null;
  }

  // Cargar info del lead magnet si existe
  let leadMagnetInfo = null;
  if (campaign.lead_magnet_id) {
    const { data: lm } = await db
      .from("captacion_lead_magnets")
      .select("id, type, title, description, cta_text, file_url, external_url, code_value")
      .eq("id", campaign.lead_magnet_id)
      .single();
    leadMagnetInfo = lm;
  }

  return (
    <FormRenderer
      campaignId={campaign.id}
      campaignName={campaign.name}
      blocks={blocks}
      leadMagnet={leadMagnetInfo}
    />
  );
}
