"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface LeadMagnet {
  id: string;
  title: string;
  type: string;
  objective: string;
  active: boolean;
  created_at: string;
  pdf_url: string | null;
}

function LeadMagnetListContent() {
  const [leadMagnets, setLeadMagnets] = useState<LeadMagnet[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const [businessId, setBusinessId] = useState<string>("");

  useEffect(() => {
    const paramId = searchParams.get("businessId");
    if (paramId) {
      setBusinessId(paramId);
      return;
    }
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userEmail = sessionData?.session?.user?.email || "";
      if (!userEmail) { setBusinessId(""); return; }
      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("contact_email", userEmail)
        .single();
      setBusinessId(biz?.id || "");
    };
    load();
  }, [searchParams]);

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    loadLeadMagnets();
  }, [businessId]);

  const loadLeadMagnets = async () => {
    const { data } = await supabase
      .from("lead_magnets")
      .select("id, title, type, objective, active, created_at, pdf_url")
      .eq("business_id", businessId)
      .eq("active", true)
      .order("created_at", { ascending: false });
    setLeadMagnets(data || []);
    setLoading(false);
  };

  const deleteLeadMagnet = async (id: string) => {
    if (!confirm("¿Eliminar este Lead Magnet?")) return;
    await supabase.from("lead_magnets").delete().eq("id", id);
    loadLeadMagnets();
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      guia: "Guía Estratégica",
      checklist: "Checklist",
      recomendacion: "Recomendación"
    };
    return labels[type] || type;
  };

  const getObjectiveLabel = (objective: string) => {
    const labels: Record<string, string> = {
      captar: "Captar clientes",
      volvieron: "Que vuelvan",
      conversion: "Vender más",
      referidos: "Referidos"
    };
    return labels[objective] || objective;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Recurso de Valor</h1>
<p className="text-sm text-[var(--brand-1)]">
  Crea contenido útil para fidelizar a tus clientes
</p>
      </div>

      {/* Opciones de creación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Asistente */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 md:p-6">
          <div className="text-center mb-4">
            <h2 className="text-lg md:text-xl font-bold text-white">Asistente</h2>
            <p className="text-xs md:text-sm text-white mt-2">
              Creación guiada paso a paso. Ideal para principiantes.
            </p>
          </div>
          <ul className="text-xs md:text-sm text-white space-y-2 mb-6">
            <li className="flex items-center gap-2">
              <span className="text-[var(--brand-4)]">✓</span> 5 pasos guiados
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[var(--brand-4)]">✓</span> Plantillas automáticas
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[var(--brand-4)]">✓</span> Puntos editables
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[var(--brand-4)]">✓</span> Fácil de usar
            </li>
          </ul>
          <Link
            href={businessId ? `/lead-magnet/wizard?businessId=${businessId}` : "/lead-magnet/wizard"}
            className="block w-full py-3 text-center rounded-lg bg-[var(--brand-4)] text-black font-semibold hover:opacity-90"
          >
            Crear Recurso con Asistente
          </Link>
        </div>

        {/* Avanzado */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-white">Avanzado</h2>
            <p className="text-sm text-white mt-2">
              Control total sobre el diseño y contenido.
            </p>
          </div>
          <ul className="text-xs md:text-sm text-white space-y-2 mb-6">
            <li className="flex items-center gap-2">
              <span className="text-[var(--brand-4)]">✓</span> Edición libre
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[var(--brand-4)]">✓</span> Múltiples páginas
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[var(--brand-4)]">✓</span> Testimonios
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[var(--brand-4)]">✓</span> Productos/Servicios
            </li>
          </ul>
<Link
  href={businessId ? `/lead-magnet/new?businessId=${businessId}` : "/lead-magnet/new"}
  className="block w-full py-3 text-center rounded-lg bg-[var(--brand-1)] text-black font-semibold hover:opacity-90"
>
  Crear Recurso en modo Avanzado
</Link>
        </div>
      </div>

      {/* Lead Magnets generados */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h2 className="text-base md:text-lg font-bold">Recursos de Valor generados</h2>
          <span className="text-xs px-2 py-1 bg-[var(--brand-1)]/20 text-[var(--brand-1)] rounded">
            {leadMagnets.length} recurso{leadMagnets.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-8 text-white">Cargando...</div>
        ) : leadMagnets.length === 0 ? (
          <div className="text-center py-8 text-white">
            <p>No hay Recursos de Valor todavía</p>
            <p className="text-sm mt-1">Crea uno usando el Asistente o el modo Avanzado</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[48rem] overflow-y-auto">
            {leadMagnets.map((lm) => (
              <div
                key={lm.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-[var(--background)] rounded-lg border border-[var(--border)]"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{lm.title || "Sin título"}</div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                    <span className="px-2 py-0.5 bg-[var(--brand-3)]/20 text-[var(--brand-3)] rounded">
                      {getTypeLabel(lm.type)}
                    </span>
                    {lm.objective && (
                      <span className="text-white">
                        {getObjectiveLabel(lm.objective)}
                      </span>
                    )}
                    <span className="text-white">
                      {new Date(lm.created_at).toLocaleDateString("es-ES")}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:ml-3">
                  {lm.pdf_url ? (
                    <button
                      onClick={() => window.open(lm.pdf_url as string, "_blank")}
                      className="text-xs px-3 py-1 rounded bg-[var(--brand-4)] text-black font-bold hover:opacity-90"
                    >
                      Descargar PDF
                    </button>
                  ) : (
                    <span className="text-xs px-3 py-1 rounded border border-dashed border-[var(--border)] text-slate-500">
                      Sin PDF
                    </span>
                  )}
                  <Link
                    href={businessId ? `/lead-magnet/new?businessId=${businessId}&edit=${lm.id}` : `/lead-magnet/new?edit=${lm.id}`}
                    className="text-xs px-3 py-1 border border-[var(--border)] rounded hover:bg-white/5"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => deleteLeadMagnet(lm.id)}
                    className="text-xs px-2 py-1 border border-red-500 text-red-500 rounded hover:bg-red-500/10"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LeadMagnetPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm">Cargando...</div>}>
      <LeadMagnetListContent />
    </Suspense>
  );
}
