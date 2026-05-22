import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import FormRenderer from "./FormRenderer";
import type { FormDesign } from "@/types/captacion";
import { DEFAULT_DESIGN } from "@/types/captacion";

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Nombre de la cookie que marca que este cliente ya completó el flujo
export function fidelizacionCookieName(slug: string) {
  return `k3d_done_${slug}`;
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

  // Obtener public_id del negocio (necesario para redirect a fidelización)
  const { data: biz } = await db
    .from("businesses")
    .select("public_id")
    .eq("id", campaign.business_id)
    .single();
  const businessPublicId = biz?.public_id ?? "";

  // ── Redirección automática a fidelización ─────────────────────────────────
  // Si el cliente ya completó el flujo (cookie en su dispositivo),
  // redirigirlo directamente a la landing de fidelización sin mostrar el form.
  if (campaign.status === "active" && businessPublicId) {
    const cookieStore = await cookies();
    if (cookieStore.get(fidelizacionCookieName(slug))?.value === "1") {
      redirect(`/l/${businessPublicId}`);
    }
  }

  // ── Estados de campaña ────────────────────────────────────────────────────
  if (campaign.status === "finished") {
    if (businessPublicId) redirect(`/l/${businessPublicId}`);
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a323c]">
        <div className="text-center px-6">
          <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-4 mx-auto">
            <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Campaña finalizada</h1>
          <p className="text-white/60 text-sm">Esta campaña ha terminado. Gracias por tu interés.</p>
        </div>
      </div>
    );
  }

  if (campaign.status === "draft") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a323c]">
        <div className="text-center px-6">
          <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-4 mx-auto">
            <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Próximamente</h1>
          <p className="text-white/60 text-sm">Esta campaña todavía no está activa.</p>
        </div>
      </div>
    );
  }

  // ── Campaña activa — cargar formulario y diseño ───────────────────────────
  let blocks = null;
  let design: FormDesign = DEFAULT_DESIGN;

  if (campaign.form_id) {
    const { data: form } = await db
      .from("captacion_forms")
      .select("blocks")
      .eq("id", campaign.form_id)
      .single();

    const rawBlocks = form?.blocks;
    if (Array.isArray(rawBlocks)) {
      blocks = rawBlocks;
    } else if (rawBlocks && typeof rawBlocks === "object") {
      blocks = rawBlocks.blocks ?? null;
      if (rawBlocks.design) design = { ...DEFAULT_DESIGN, ...rawBlocks.design };
    }
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
      design={design}
      slug={slug}
      businessPublicId={businessPublicId}
    />
  );
}
