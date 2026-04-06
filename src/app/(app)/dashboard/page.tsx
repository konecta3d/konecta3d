"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const [businessId, setBusinessId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [landingSlug, setLandingSlug] = useState("");
  const [landingUrl, setLandingUrl] = useState("");
  const [stats, setStats] = useState({
    benefits: 0,
    clients: 0,
    products: 0,
    leadMagnets: 0,
  });

  useEffect(() => {
    // Primero verificar parametro businessId en URL (desde admin)
    const urlBusinessId = searchParams.get("businessId");
    const bid = urlBusinessId || localStorage.getItem("konecta-business-id") || "";
    if (!bid) return;
    setBusinessId(bid);

    const load = async () => {
      // Cargar datos del negocio
      const { data: biz } = await supabase
        .from("businesses")
        .select("name, slug")
        .eq("id", bid)
        .single();

      if (biz) {
        setBusinessName(biz.name);
        setLandingSlug(biz.slug || "");
        setLandingUrl(`${window.location.origin}/l/${biz.slug}`);
      }

      // Contar beneficios
      const { count: benefitsCount } = await supabase
        .from("benefits")
        .select("*", { count: "exact", head: true })
        .eq("business_id", bid);

      // Contar lead magnets
      const { count: leadMagnetsCount } = await supabase
        .from("lead_magnets")
        .select("*", { count: "exact", head: true })
        .eq("business_id", bid)
        .eq("active", true);

      // Contar clientes
      const { count: clientsCount } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("business_id", bid);

      // Contar productos/servicios
      const { count: productsCount } = await supabase
        .from("products_services")
        .select("*", { count: "exact", head: true })
        .eq("business_id", bid);

      setStats({
        benefits: benefitsCount || 0,
        leadMagnets: leadMagnetsCount || 0,
        clients: clientsCount || 0,
        products: productsCount || 0,
      });
    };

    load();
  }, []);

  const copyLink = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const generators = [
    {
      title: "Landing",
      description: "Tu página web pública donde clientes ven tu negocio",
      href: businessId ? `/landing/new?businessId=${businessId}` : "/landing/new",
      cta: "Personalizar mi landing",
      steps: [
        "Añade tu logo",
        "Escribe el nombre de tu negocio",
        "Configura los botones de contacto",
        "Guarda y comparte el enlace",
      ],
    },
    {
      title: "Lead Magnet",
      description: "Crea recursos de valor para tus clientes",
      href: "",
      cta: "Crear lead magnet",
      isSpecial: true,
      options: [
        { 
          title: "Asistente", 
          description: "Guía paso a paso", 
          href: businessId ? `/lead-magnet/wizard?businessId=${businessId}` : "/lead-magnet/wizard",
          icon: "🚀"
        },
        { 
          title: "Avanzado", 
          description: "Control total", 
          href: businessId ? `/lead-magnet/new?businessId=${businessId}` : "/lead-magnet/new",
          icon: "⚙️"
        }
      ],
      steps: [
        "Elige el tipo (guía, checklist, recomendación)",
        "Escribe el título y contenido",
        "Añade los botones de acción",
        "Personaliza los colores",
        "Descarga el PDF",
      ],
    },
    {
      title: "Beneficios VIP",
      description: "Crea descuentos y beneficios exclusivos para tus clientes",
      href: businessId ? `/vip-benefits/new?businessId=${businessId}` : "/vip-benefits/new",
      cta: "Crear un beneficio",
      steps: [
        "Escribe el título del beneficio",
        "Añade el valor (ej: 10% descuento)",
        "Personaliza el diseño",
        "Descarga el PDF o compártelo",
      ],
    },
    {
      title: "Herramientas del negocio",
      description: "Todas las herramientas para generar acción en tus clientes",
      href: businessId ? `/acciones?businessId=${businessId}` : "/acciones",
      cta: "Ver herramientas",
      steps: [
        "Explora todas las herramientas",
        "Guarda tus enlaces de acción",
        "Úsalos en tus generadores",
      ],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Cabecera */}
      <header className="space-y-1">
        <h1 className="text-xl md:text-2xl font-bold">Mi negocio</h1>
        <p className="text-sm text-slate-300">
          Resumen general y accesos rápidos a tus herramientas clave.
        </p>
      </header>

      {/* Bienvenida */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold">Bienvenido, {businessName || "tu negocio"}</h2>
        <p className="mt-1 text-sm text-[var(--brand-1)]">
          Aquí tienes todo lo que necesitas para gestionar tu negocio.
        </p>
      </div>

      {/* Tu enlace público */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 md:p-6">
        <div className="text-base md:text-lg font-semibold">Tu enlace público</div>
        <p className="mt-1 text-sm text-[var(--brand-1)]">
          Comparte esta página con tus clientes.
        </p>
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <input
            className="flex-1 rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
            value={landingUrl}
            readOnly
          />
          <button
            onClick={() => copyLink(landingUrl)}
            className="rounded-lg bg-[var(--brand-4)] px-6 py-2 font-semibold text-black text-sm"
          >
            Copiar enlace
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-center">
          <p className="text-3xl font-bold text-[var(--brand-4)]">{stats.benefits}</p>
          <p className="text-sm text-[var(--brand-1)]">Beneficios</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-center">
          <p className="text-3xl font-bold text-[var(--brand-4)]">{stats.leadMagnets}</p>
          <p className="text-sm text-[var(--brand-1)]">Lead Magnets</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-center">
          <p className="text-3xl font-bold text-[var(--brand-4)]">{stats.clients}</p>
          <p className="text-sm text-[var(--brand-1)]">Clientes</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-center">
          <p className="text-3xl font-bold text-[var(--brand-4)]">{stats.products}</p>
          <p className="text-sm text-[var(--brand-1)]">Productos</p>
        </div>
      </div>

      {/* Generadores con guía */}
      <div>
        <h2 className="mb-2 text-lg font-semibold">Generadores principales</h2>
        <p className="text-sm text-slate-300 mb-4">Crea recursos y herramientas en pocos pasos.</p>
        <div className="grid gap-4 md:grid-cols-3">
          {generators.map((gen) => (
            <div
              key={gen.title}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 md:p-5 flex flex-col"
            >
              <div className="font-semibold">{gen.title}</div>
              <p className="mt-2 text-sm text-[var(--brand-1)]">{gen.description}</p>

              {/* Special case: Lead Magnet with two options */}
              {gen.isSpecial && gen.options ? (
                <div className="mt-4 space-y-2">
                  {gen.options.map((opt) => (
                    <Link
                      key={opt.title}
                      href={opt.href}
                      className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] hover:border-[var(--brand-4)] transition-colors"
                    >
                      <span className="text-xl">{opt.icon}</span>
                      <div>
                        <div className="font-semibold text-sm">{opt.title}</div>
                        <div className="text-xs text-gray-500">{opt.description}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <>
                  <div className="mt-4 flex-1">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--brand-1)]">
                      Pasos:
                    </p>
                    <ol className="list-inside list-decimal text-sm space-y-1 text-[var(--brand-1)]">
                      {gen.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  <Link
                    href={gen.href}
                    className="mt-4 rounded-lg bg-[var(--brand-4)] py-2 text-center font-semibold text-black"
                  >
                    {gen.cta}
                  </Link>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Accesos rápidos */}
      <div>
        <h2 className="mb-2 text-lg font-semibold">Gestiona tu negocio</h2>
        <p className="text-sm text-slate-300 mb-4">Accede rápido a las secciones clave de tu cuenta.</p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/mi-negocio/perfil"
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--brand-3)]"
          >
            <div className="font-semibold">Mi Perfil</div>
            <p className="mt-1 text-sm text-[var(--brand-1)]">Edita tus datos de negocio</p>
          </Link>
          <Link
            href="/mi-negocio/cliente-ideal"
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--brand-3)]"
          >
            <div className="font-semibold">Mis Clientes</div>
            <p className="mt-1 text-sm text-[var(--brand-1)]">Gestiona tu lista de clientes</p>
          </Link>
          <Link
            href="/mi-negocio/catalogo"
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--brand-3)]"
          >
            <div className="font-semibold">Mi Catálogo</div>
            <p className="mt-1 text-sm text-[var(--brand-1)]">Añade tus productos y servicios</p>
          </Link>
          <Link
            href="/mi-negocio/historial"
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--brand-3)]"
          >
            <div className="font-semibold">Historial</div>
            <p className="mt-1 text-sm text-[var(--brand-1)]">Ver qué enviaste a cada cliente</p>
          </Link>
          <Link
            href="/mi-negocio/estadisticas"
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--brand-3)]"
          >
            <div className="font-semibold">Estadísticas</div>
            <p className="mt-1 text-sm text-[var(--brand-1)]">Mira cómo va tu negocio</p>
          </Link>
          <Link
            href="/ayuda"
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--brand-3)]"
          >
            <div className="font-semibold">Ayuda</div>
            <p className="mt-1 text-sm text-[var(--brand-1)]">Guía de uso del sistema</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
