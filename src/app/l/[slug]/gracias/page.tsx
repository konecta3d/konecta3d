import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import GraciasClient from "./GraciasClient";

export const dynamic = "force-dynamic";

interface Props {
  params:      Promise<{ slug: string }>;
  searchParams: Promise<{ lm?: string; name?: string }>;
}

export default async function GraciasPage({ params, searchParams }: Props) {
  const { slug }         = await params;
  const { lm, name = "" } = await searchParams;

  if (!lm) notFound();

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Cargar el lead magnet para obtener el PDF y el título
  const { data: lmData, error } = await db
    .from("lead_magnets")
    .select("id, title, pdf_url, active")
    .eq("id", lm)
    .single();

  if (error || !lmData || !lmData.active) notFound();

  if (!lmData.pdf_url) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1923] text-white px-6 text-center">
        <div>
          <h1 className="text-xl font-bold mb-2">Recurso no disponible</h1>
          <p className="text-white/50 text-sm">Este recurso aún no tiene documento generado.</p>
          <a href={`/l/${slug}`} className="mt-6 inline-block text-sm underline text-white/40 hover:text-white/70">
            Volver al negocio
          </a>
        </div>
      </div>
    );
  }

  return (
    <GraciasClient
      name={decodeURIComponent(name)}
      slug={slug}
      pdfUrl={lmData.pdf_url}
      resourceTitle={lmData.title || "el recurso"}
    />
  );
}
