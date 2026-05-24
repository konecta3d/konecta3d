import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import FidFormRenderer from "./FidFormRenderer";
import type { FormDesign } from "@/types/captacion";
import { DEFAULT_FID_DESIGN } from "@/types/fidelizacion-forms";

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function FidFormPublicPage({ params }: PageProps) {
  const { slug } = await params;
  const db = supabaseAdmin();

  // Buscar el formulario por slug
  const { data: form, error } = await db
    .from("fidelizacion_forms")
    .select("id, business_id, status, name, blocks")
    .eq("slug", slug)
    .single();

  if (error || !form) return notFound();

  // Si no está publicado, mostrar mensaje de no disponible
  if (form.status !== "published") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e]">
        <div className="text-center px-6">
          <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-4 mx-auto">
            <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Formulario no disponible</h1>
          <p className="text-white/60 text-sm">Este formulario todavía no está activo.</p>
        </div>
      </div>
    );
  }

  // Normalizar bloques y diseño
  const rawBlocks = form.blocks;
  const blocks = Array.isArray(rawBlocks) ? rawBlocks : (rawBlocks?.blocks ?? []);
  const design: FormDesign = Array.isArray(rawBlocks)
    ? DEFAULT_FID_DESIGN
    : { ...DEFAULT_FID_DESIGN, ...(rawBlocks?.design ?? {}) };

  // Obtener nombre del negocio
  const { data: biz } = await db
    .from("businesses")
    .select("name")
    .eq("id", form.business_id)
    .single();

  const businessName = biz?.name ?? "";

  return (
    <FidFormRenderer
      formId={form.id}
      blocks={blocks}
      design={design}
      businessName={businessName}
    />
  );
}
