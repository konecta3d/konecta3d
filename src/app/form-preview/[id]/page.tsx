import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import FormRenderer from "../../c/[slug]/FormRenderer";
import type { FormDesign } from "@/types/captacion";
import { DEFAULT_DESIGN } from "@/types/captacion";

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Vista previa de prueba de un formulario, independiente de cualquier campaña.
 * No pone cookies, no redirige a fidelización y no guarda ningún lead.
 * Pensada para enviar el enlace al móvil y probar el formulario por separado.
 */
export default async function FormPreviewPage({ params }: PageProps) {
  const { id } = await params;
  const db = supabaseAdmin();

  const { data: form, error } = await db
    .from("captacion_forms")
    .select("id, name, blocks")
    .eq("id", id)
    .single();

  if (error || !form) return notFound();

  let blocks = null;
  let design: FormDesign = DEFAULT_DESIGN;
  const rawBlocks = form.blocks;
  if (Array.isArray(rawBlocks)) {
    blocks = rawBlocks;
  } else if (rawBlocks && typeof rawBlocks === "object") {
    blocks = rawBlocks.blocks ?? null;
    if (rawBlocks.design) design = { ...DEFAULT_DESIGN, ...rawBlocks.design };
  }

  return (
    <FormRenderer
      campaignId="preview"
      campaignName={form.name}
      blocks={blocks}
      leadMagnet={null}
      design={design}
      preview
    />
  );
}
