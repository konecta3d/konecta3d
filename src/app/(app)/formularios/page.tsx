"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Form {
  id: string;
  title: string;
  type: string;
  objective: string;
  basis: string;
  data_collection: string;
  active: boolean;
  created_at: string;
  questions: Array<{ id: string; question_text: string; question_type: string }>;
}

function FormulariosContent() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const [businessId, setBusinessId] = useState<string>("");
  const [togglingId, setTogglingId] = useState<string>("");

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
    loadForms();
  }, [businessId]);

  const loadForms = async () => {
    const { data } = await supabase
      .from("forms")
      .select("id, title, type, objective, basis, data_collection, active, created_at, questions")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    setForms(data || []);
    setLoading(false);
  };

  const deleteForm = async (id: string) => {
    if (!confirm("¿Eliminar este formulario?")) return;
    await supabase.from("forms").delete().eq("id", id);
    loadForms();
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    setTogglingId(id);
    await supabase.from("forms").update({ active: !currentActive }).eq("id", id);
    await loadForms();
    setTogglingId("");
  };

  const getTypeLabel = (type: string) => {
    return type === "captacion" ? "Captación" : "Fidelización";
  };

  const getTypeColor = (type: string) => {
    return type === "captacion" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400";
  };

  const getObjectiveLabel = (objective: string) => {
    const labels: Record<string, string> = {
      contacto: "Recibir contacto",
      reserva: "Agendar cita",
      datos: "Captar datos",
      opinion: "Recoger opinión",
      retorno: "Motivar retorno",
      comunidad: "Crear comunidad",
    };
    return labels[objective] || objective;
  };

  const getBasisLabel = (basis: string) => {
    const labels: Record<string, string> = {
      producto_servicio: "Producto/Servicio",
      info_experiencia: "Información/Experiencia",
    };
    return labels[basis] || basis;
  };

  const getDataCollectionLabel = (value: string) => {
    const labels: Record<string, string> = {
      name_phone_email: "Recolecta datos",
      anonymous: "Anónimo",
      thanks_page: "Página de gracias",
    };
    return labels[value] || value;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Formularios</h1>
        <p className="text-sm text-[var(--brand-1)]">
          Crea formularios para captar leads o fidelizar clientes
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
              <span className="text-[var(--brand-4)]">✓</span> Máximo 3 preguntas
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[var(--brand-4)]">✓</span> Captación o Fidelización
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[var(--brand-4)]">✓</span> Preview en tiempo real
            </li>
          </ul>
          <Link
            href={businessId ? `/formularios/wizard?businessId=${businessId}` : "/formularios/wizard"}
            className="block w-full py-3 text-center rounded-lg bg-[var(--brand-4)] text-black font-semibold hover:opacity-90"
          >
            Crear con Asistente
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
              <span className="text-[var(--brand-4)]">✓</span> Todas las opciones
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[var(--brand-4)]">✓</span> Personalización completa
            </li>
          </ul>
<Link
  href={businessId ? `/formularios/new?businessId=${businessId}` : "/formularios/new"}
  className="block w-full py-3 text-center rounded-lg bg-[var(--brand-1)] text-black font-semibold hover:opacity-90"
>
  Crear en modo Avanzado
</Link>
        </div>
      </div>

      {/* Formularios generados */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h2 className="text-base md:text-lg font-bold">Formularios creados</h2>
          <span className="text-xs px-2 py-1 bg-[var(--brand-1)]/20 text-[var(--brand-1)] rounded">
            {forms.length} formulario{forms.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-8 text-white">Cargando...</div>
        ) : forms.length === 0 ? (
          <div className="text-center py-8 text-white">
            <p>No hay formularios todavía</p>
            <p className="text-sm mt-1">Crea uno usando el Asistente o el modo Avanzado</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[48rem] overflow-y-auto">
            {forms.map((form) => (
              <div
                key={form.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-[var(--background)] rounded-lg border border-[var(--border)]"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{form.title || "Sin título"}</div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                    <span className={`px-2 py-0.5 rounded ${getTypeColor(form.type)}`}>
                      {getTypeLabel(form.type)}
                    </span>
                    <span className="text-white">
                    {getObjectiveLabel(form.objective)}
                    </span>
                    <span className="text-white">
                    {getBasisLabel(form.basis)}
                    </span>
                    <span className="text-white">
                    {getDataCollectionLabel(form.data_collection)}
                    </span>
                    <span className="text-white">
                    {form.questions?.length || 0} pregunta{form.questions?.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-white">
                    {new Date(form.created_at).toLocaleDateString("es-ES")}
                    </span>
                    {!form.active && (
                      <span className="px-2 py-0.5 bg-gray-500/20 text-white rounded">
                        Inactivo
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:ml-3">
                  <button
                    onClick={() => toggleActive(form.id, form.active)}
                   disabled={togglingId === form.id}
                   className={`text-xs px-3 py-1 rounded border ${
                   form.active
                   ? "border-green-500 text-green-500 hover:bg-green-500/10"
                   : "border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
                   } ${togglingId === form.id ? "opacity-60 cursor-not-allowed" : ""}`}
                   >
                  {togglingId === form.id ? "Actualizando..." : form.active ? "Desactivar" : "Activar"}
                  </button>
                  <Link
                    href={businessId ? `/formularios/new?businessId=${businessId}&edit=${form.id}` : `/formularios/new?edit=${form.id}`}
                    className="text-xs px-3 py-1 border border-[var(--border)] rounded hover:bg-white/5"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => deleteForm(form.id)}
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

export default function FormulariosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm">Cargando...</div>}>
      <FormulariosContent />
    </Suspense>
  );
}
