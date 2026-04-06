"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Benefit {
  id: string;
  title: string;
  type: string;
  value: string;
  active: boolean;
  created_at: string;
}

export default function VipBenefitsPage() {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const businessId = searchParams.get("businessId") || localStorage.getItem("konecta-business-id") || "";

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    loadBenefits();
  }, [businessId]);

  const loadBenefits = async () => {
    const { data } = await supabase
      .from("benefits")
      .select("id, title, type, value, active, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    setBenefits(data || []);
    setLoading(false);
  };

  const deleteBenefit = async (id: string) => {
    if (!confirm("¿Eliminar este beneficio?")) return;
    await supabase.from("benefits").delete().eq("id", id);
    loadBenefits();
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      percent_discount: "Descuento %",
      fixed_discount: "Descuento fijo",
      two_for_one: "2x1 / Combo",
      free_gift: "Regalo",
      upgrade: "Upgrade",
      free_service: "Servicio/Envío gratis"
    };
    return labels[type] || type;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Beneficios VIP</h1>
        <p className="text-sm text-[var(--brand-1)]">
          Crea descuentos y beneficios exclusivos para tus clientes
        </p>
      </div>

      {/* Botón de crear */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Asistente */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">Asistente</h2>
            <p className="text-sm text-gray-400 mb-4">
              Creación guiada paso a paso.
            </p>
            <ul className="text-sm text-gray-400 space-y-1 mb-4 text-left max-w-xs mx-auto">
              <li className="flex items-center gap-2">
                <span className="text-[var(--brand-4)]">✓</span> 4 pasos guiados
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--brand-4)]">✓</span> Plantillas por objetivo
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--brand-4)]">✓</span> Vista previa en tiempo real
              </li>
            </ul>
            <Link
              href={businessId ? `/vip-benefits/wizard?businessId=${businessId}` : "/vip-benefits/wizard"}
              className="block w-full max-w-xs mx-auto py-3 text-center rounded-lg bg-[var(--brand-4)] text-black font-semibold hover:opacity-90"
            >
              Crear con Asistente
            </Link>
          </div>

          {/* Avanzado */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">Avanzado</h2>
            <p className="text-sm text-gray-400 mb-4">
              Control total sobre el diseño.
            </p>
            <ul className="text-sm text-gray-400 space-y-1 mb-4 text-left max-w-xs mx-auto">
              <li className="flex items-center gap-2">
                <span className="text-[var(--brand-4)]">✓</span> Edición libre
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--brand-4)]">✓</span> Todos los tipos de beneficio
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--brand-4)]">✓</span> Personalización completa
              </li>
            </ul>
            <Link
              href={businessId ? `/vip-benefits/new?businessId=${businessId}` : "/vip-benefits/new"}
              className="block w-full max-w-xs mx-auto py-3 text-center rounded-lg bg-[var(--brand-1)] text-white font-semibold hover:opacity-90"
            >
              Crear en modo Avanzado
            </Link>
          </div>
        </div>
      </div>

      {/* Beneficios generados */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Beneficios generados</h2>
          <span className="text-xs px-2 py-1 bg-[var(--brand-1)]/20 text-[var(--brand-1)] rounded">
            {benefits.length} beneficio{benefits.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400">Cargando...</div>
        ) : benefits.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No hay beneficios todavía</p>
            <p className="text-sm mt-1">Crea uno usando el botón de arriba</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {benefits.map((benefit) => (
              <div
                key={benefit.id}
                className="flex items-center justify-between p-4 bg-[var(--background)] rounded-lg border border-[var(--border)]"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{benefit.title || "Sin título"}</div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-[var(--brand-3)]/20 text-[var(--brand-3)] rounded">
                      {getTypeLabel(benefit.type)}
                    </span>
                    {benefit.value && (
                      <span className="text-xs font-semibold text-[var(--brand-4)]">
                        {benefit.value}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {new Date(benefit.created_at).toLocaleDateString("es-ES")}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 ml-3">
                  <Link
                    href={businessId ? `/vip-benefits/new?businessId=${businessId}&edit=${benefit.id}` : `/vip-benefits/new?edit=${benefit.id}`}
                    className="text-xs px-3 py-1 border border-[var(--border)] rounded hover:bg-white/5"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => deleteBenefit(benefit.id)}
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
