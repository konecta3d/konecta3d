"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Business = {
  id: string;
  public_id?: string | null;
  name: string;
  sector: string | null;
  contact_email?: string | null;
};

export default function BusinessesPage() {
  const [items, setItems] = useState<Business[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("businesses")
        .select("id,public_id,name,sector,contact_email")
        .order("created_at", { ascending: false });
      if (error) setError(error.message);
      else setItems(data || []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold">Negocios</h1>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <input
            className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
            placeholder="Buscar negocio..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <a
            href="/admin/businesses/new"
            className="rounded-lg bg-[var(--brand-4)] px-4 py-2 font-semibold text-black"
          >
            Crear negocio
          </a>
        </div>
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-4">
        <div>
          <h2 className="text-base font-semibold">Acceso rápido al panel del negocio</h2>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <a className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm" href="/dashboard">
              Abrir dashboard del negocio
            </a>
            <a className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm" href="/documents">
              Ver documentos
            </a>
            <a className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm" href="/landing/new">
              Ver landing
            </a>
            <a className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm" href="/whatsapp-generator">
              Generador link WhatsApp
            </a>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Abrir perfil por ID</h3>
          <div className="mt-2 flex gap-2">
            <input
              id="businessIdInput"
              className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
              placeholder="Pega el UUID del negocio"
            />
            <button
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
              onClick={() => {
                const el = document.getElementById("businessIdInput") as HTMLInputElement;
                if (!el?.value) return;
                window.location.href = `/admin/businesses/${el.value}`;
              }}
            >
              Abrir
            </button>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        {loading && <div>Cargando…</div>}
        {error && <div className="text-red-500">{error}</div>}
        {!loading && !error && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--brand-1)]">
                <th className="py-2">ID</th>
                <th className="py-2">Nombre</th>
                <th className="py-2">Sector</th>
                <th className="py-2">Email</th>
                <th className="py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items
                .filter((b) =>
                  (b.name || "").toLowerCase().includes(query.toLowerCase())
                )
                .map((b) => (
                <tr key={b.id} className="border-t border-[var(--border)]">
                  <td className="py-2 font-mono text-xs">{b.public_id || "—"}</td>
                  <td className="py-2 font-medium">{b.name}</td>
                  <td className="py-2">{b.sector || "—"}</td>
                  <td className="py-2">{b.contact_email || "—"}</td>
                  <td className="py-2 flex gap-3">
  <a className="text-[var(--brand-3)]" href={`/admin/businesses/${b.id}`}>
    Editar
  </a>
  <a
    className="text-[var(--brand-1)]"
    href={`/business/select-profile?businessId=${b.id}`}
    target="_blank"
  >
    Entrar
  </a>
</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
