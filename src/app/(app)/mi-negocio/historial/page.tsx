"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function HistorialPage() {
  const [businessId, setBusinessId] = useState("");
  const [envios, setEnvios] = useState<{
    id: string;
    client_name: string;
    benefit_title: string;
    benefit_id: string;
    created_at: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const load = async () => {
    let bid = "";

    const { data: sessionData } = await supabase.auth.getSession();
    const userEmail = sessionData.session?.user?.email || "";

    if (userEmail) {
      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("contact_email", userEmail)
        .single();

      bid = biz?.id || "";
    }

    if (!bid) {
      setLoading(false);
      return;
    }

    setBusinessId(bid);
    setLoading(true);

    // Cargar cliente-beneficios asignados (envíos)
    const { data } = await supabase
      .from("client_benefits")
      .select("id, client_id, benefit_id, created_at")
      .eq("business_id", bid)
      .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        // Obtener nombres de clientes y beneficios
        const clientIds = [...new Set(data.map((d) => d.client_id))];
        const benefitIds = [...new Set(data.map((d) => d.benefit_id))];

        const { data: clients } = await supabase
          .from("clients")
          .select("id, name")
          .in("id", clientIds);

        const { data: benefits } = await supabase
          .from("benefits")
          .select("id, title")
          .in("id", benefitIds);

        const clientMap = Object.fromEntries(
          (clients || []).map((c) => [c.id, c.name])
        );
        const benefitMap = Object.fromEntries(
          (benefits || []).map((b) => [b.id, b.title])
        );

        setEnvios(
          data.map((d) => ({
            id: d.id,
            client_name: clientMap[d.client_id] || "Cliente",
            benefit_title: benefitMap[d.benefit_id] || "Beneficio",
            benefit_id: d.benefit_id,
            created_at: d.created_at,
          }))
        );
      }

      setLoading(false);
    };

    load();
  }, []);

  const copyLink = async (benefitId: string) => {
    const link = `${window.location.origin}/api/benefits/generate-pdf?id=${benefitId}`;
    await navigator.clipboard.writeText(link);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-[var(--brand-1)]">Cargando historial...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Historial de Envíos</h1>
        <p className="text-sm text-[var(--brand-1)]">
          Verifica qué beneficios has enviado a tus clientes
        </p>
      </div>

      {envios.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <p className="text-[var(--brand-1)]">No hay envíos registrados</p>
          <p className="mt-2 text-sm text-[var(--brand-1)]">
            Los envíos se registran cuando asignas un beneficio a un cliente
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-[var(--border)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--brand-1)]">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--brand-1)]">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--brand-1)]">
                  Beneficio
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-[var(--brand-1)]">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {envios.map((envio) => (
                <tr key={envio.id}>
                  <td className="px-4 py-3 text-sm">
                    {formatDate(envio.created_at)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {envio.client_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--brand-1)]">
                    {envio.benefit_title}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => copyLink(envio.benefit_id)}
                      className="text-sm text-[var(--brand-3)] hover:underline"
                    >
                      Copiar link
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="font-semibold">Cómo funciona</h2>
        <div className="mt-3 space-y-2 text-sm text-[var(--brand-1)]">
          <p>1. Los envíos se registran automáticamente cuando:</p>
          <ul className="list-disc list-inside ml-4">
            <li>Asignas un beneficio a un cliente</li>
            <li>El cliente descarga un beneficio desde la landing</li>
          </ul>
          <p className="mt-2">2. Desde aquí puedes:</p>
          <ul className="list-disc list-inside ml-4">
            <li>Ver qué beneficios ha recibido cada cliente</li>
            <li>Copiar el link del beneficio para reenviarlo</li>
            <li>Consultar el historial de envíos</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
