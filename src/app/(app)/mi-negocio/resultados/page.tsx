"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ResultadosPage() {
  const router = useRouter();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [leadCount, setLeadCount] = useState(0);
  const [landingCount, setLandingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: session } = await supabase.auth.getSession();
      const user = session.session?.user;
      if (!user) {
        router.push("/business/login?redirect=/mi-negocio/resultados");
        return;
      }

      const userEmail = user.email || "";
      const { data: bizId } = await supabase
        .from("businesses")
        .select("id")
        .eq("contact_email", userEmail)
        .single();

      const resolvedId = bizId?.id;
      if (!resolvedId) {
        router.push("/business/login?redirect=/mi-negocio/resultados");
        return;
      }

      setBusinessId(resolvedId);

      const { data: biz } = await supabase
        .from("businesses")
        .select("name, slug")
        .eq("id", resolvedId)
        .single();

      if (biz) {
        setName(biz.name || "");
        setSlug(biz.slug || "");
      }

      const [{ count: leads }, { count: landings }] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("business_id", resolvedId),
        supabase.from("landing_configs").select("id", { count: "exact", head: true }).eq("business_id", resolvedId),
      ]);

      setLeadCount(leads || 0);
      setLandingCount(landings || 0);
      setLoading(false);
    };
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-4)]"></div>
      </div>
    );
  }

  const publicSlug = slug || name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Resultados</h1>
        <p className="text-sm text-white">
          Aquí verás los activos que se han generado para tu negocio y los resultados principales.
        </p>
      </div>

      {/* Enlaces principales */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-1">Landing pública</h2>
            <p className="text-sm text-white mb-2">Esta es la página que puedes compartir con tus clientes.</p>
            <p className="text-xs text-white break-words">konecta3d.com/l/{publicSlug}</p>
          </div>
          <div className="mt-3 flex gap-2">
            <a
              href={`/l/${publicSlug}`}
              target="_blank"
              className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg:white/5"
            >
              Ver landing
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-1">Lead Magnet / Documentos</h2>
            <p className="text-sm text-white mb-2">
              Recursos descargables que puedes usar para captar y nutrir a tus leads.
            </p>
          </div>
          <div className="mt-3 flex gap-2 flex-wrap">
            <a
              href="/lead-magnet"
              className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg:white/5"
            >
              Ver Lead Magnets
            </a>
            <a
              href="/vip-benefits"
              className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg:white/5"
            >
              Ver Beneficios VIP
            </a>
            <a
              href={`/documents?businessId=${businessId}`}
              className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg:white/5"
            >
              Ver documentos
            </a>
          </div>
        </div>
      </div>

      {/* KPI simples */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-center">
          <div className="text-2xl font-bold text-[var(--brand-1)]">{landingCount}</div>
          <div className="text-xs text-white">Landings creadas</div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-center">
          <div className="text-2xl font-bold text-green-500">{leadCount}</div>
          <div className="text-xs text-white">Leads capturados</div>
        </div>
      </div>

      {/* Recordatorio acción */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <h2 className="text-lg font-semibold mb-2">Qué hacer ahora</h2>
        <ul className="list-disc list-inside text-sm text-white space-y-1">
          <li>Comparte tu landing con tus clientes por WhatsApp o redes sociales.</li>
          <li>Usa tus lead magnets como gancho para capturar contactos.</li>
          <li>Revisa tus leads frecuentemente y haz seguimiento.</li>
        </ul>
      </div>
    </div>
  );
}
