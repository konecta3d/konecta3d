"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function EstadisticasPage() {
  const [businessId, setBusinessId] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVisits: 0,
    benefitsGenerated: 0,
    benefitsViewed: 0,
    clientsTotal: 0,
    clientsNew: 30,
    productsTotal: 0,
    leadsLast7d: 0,
    leadsLast30d: 0,
  });

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

    // Beneficios activos
    const { count: benefitsCount } = await supabase
      .from("benefits")
      .select("*", { count: "exact", head: true })
      .eq("business_id", bid)
      .eq("active", true);

      // Clientes totales
      const { count: clientsCount } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("business_id", bid);

      // Productos/Servicios
      const { count: productsCount } = await supabase
        .from("products_services")
        .select("*", { count: "exact", head: true })
        .eq("business_id", bid)
        .eq("active", true);

      // Leads últimos 7 días
      const since7d = new Date();
      since7d.setDate(since7d.getDate() - 7);
      const { count: leads7d } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("business_id", bid)
        .gte("created_at", since7d.toISOString());

      // Leads últimos 30 días
      const since30d = new Date();
      since30d.setDate(since30d.getDate() - 30);
      const { count: leads30d } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("business_id", bid)
        .gte("created_at", since30d.toISOString());

      setStats({
        totalVisits: 0, // Requiere analytics externo
        benefitsGenerated: benefitsCount || 0,
        benefitsViewed: 0, // Requiere tracking
        clientsTotal: clientsCount || 0,
        clientsNew: leads7d || 0,
        productsTotal: productsCount || 0,
        leadsLast7d: leads7d || 0,
        leadsLast30d: leads30d || 0,
      });

      setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-[var(--brand-1)]">Cargando estadísticas...</div>
      </div>
    );
  }

  const cards = [
    {
      title: "Beneficios activos",
      value: stats.benefitsGenerated,
      description: "Beneficios que tus clientes pueden usar",
      color: "var(--brand-4)",
    },
    {
      title: "Clientes registrados",
      value: stats.clientsTotal,
      description: "Total de clientes en tu base de datos",
      color: "var(--brand-3)",
    },
    {
      title: "Productos/Servicios",
      value: stats.productsTotal,
      description: "Productos dados de alta en el catálogo",
      color: "var(--brand-2)",
    },
  ];

  const activity = [
    {
      title: "Nuevos clientes (7 días)",
      value: stats.leadsLast7d,
    },
    {
      title: "Nuevos clientes (30 días)",
      value: stats.leadsLast30d,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Estadísticas</h1>
        <p className="text-sm text-[var(--brand-1)]">
          Mira cómo está funcionando tu negocio
        </p>
      </div>

      {/* Métricas principales */}
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6"
          >
            <p className="text-sm text-[var(--brand-1)]">{card.title}</p>
            <p className="mt-2 text-4xl font-bold" style={{ color: card.color }}>
              {card.value}
            </p>
            <p className="mt-2 text-xs text-[var(--brand-1)]">{card.description}</p>
          </div>
        ))}
      </div>

      {/* Actividad reciente */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-semibold">Actividad reciente</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {activity.map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-[var(--border)] p-4"
            >
              <p className="text-sm text-[var(--brand-1)]">{item.title}</p>
              <p className="mt-1 text-2xl font-bold">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Notas */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-semibold">Acerca de las estadísticas</h2>
        <div className="mt-4 space-y-3 text-sm text-[var(--brand-1)]">
          <p>
            Las estadísticas se actualizan automáticamente cuando
            creas beneficios, clientes o productos.
          </p>
          <p>
            Próximamente podrás ver: visitas a tu landing,
            cuántos beneficios se han descargado, y más métricas.
          </p>
        </div>
      </div>
    </div>
  );
}
