"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Business = {
  id: string;
  public_id?: string | null;
  name: string;
  sector: string | null;
  contact_email?: string | null;
  logo_url?: string | null;
};

export default function BusinessesPage() {
  const [items, setItems] = useState<Business[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token || "";

        const res = await fetch("/api/admin/businesses", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();

        if (!res.ok) {
          setError(json.error || "Error al cargar negocios");
        } else {
          setItems(json.businesses || []);
        }
      } catch (err) {
        setError("Error de red al cargar negocios");
      }
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
          <p className="mt-1 text-xs text-[var(--foreground)]/50">Elige un negocio y abre una sección concreta editando sus datos.</p>
          <select
            className="mt-3 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm md:max-w-md"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">— Selecciona un negocio —</option>
            {[...items]
              .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
              .map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}{b.public_id ? ` · ${b.public_id}` : ""}
                </option>
              ))}
          </select>

          {(() => {
            const disabled = !selectedId;
            const q = selectedId ? `?businessId=${selectedId}` : "";
            const links = [
              { label: "Abrir dashboard del negocio", href: `/dashboard${q}` },
              { label: "Ver documentos", href: `/documents${q}` },
              { label: "Ver landing", href: `/landing/new${q}` },
              { label: "Generador link WhatsApp", href: `/whatsapp-generator${q}` },
            ];
            return (
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                {links.map((l) => (
                  <a
                    key={l.href}
                    href={disabled ? undefined : l.href}
                    target={disabled ? undefined : "_blank"}
                    rel="noreferrer"
                    aria-disabled={disabled}
                    onClick={(e) => { if (disabled) e.preventDefault(); }}
                    className={`rounded-lg border border-[var(--border)] px-3 py-2 text-sm ${
                      disabled
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:border-[var(--brand-1)] hover:text-[var(--brand-1)]"
                    }`}
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            );
          })()}
          {!selectedId && (
            <p className="mt-2 text-xs text-[var(--foreground)]/40">Selecciona un negocio para activar los accesos.</p>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold">Abrir ficha por ID</h3>
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
                window.location.href = `/admin/businesses/${el.value.trim()}`;
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
                  <td className="py-2 font-medium">
                    <a className="flex items-center gap-2 hover:text-[var(--brand-1)] hover:underline" href={`/admin/businesses/${b.id}`}>
                      <span className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold text-black overflow-hidden flex-shrink-0 ${b.logo_url ? "bg-[var(--background)] border border-[var(--border)]" : "bg-[var(--brand-1)]"}`}>
                        {b.logo_url ? (
                          <img src={b.logo_url} alt={b.name} className="w-full h-full object-contain" />
                        ) : (
                          (b.name || "?").charAt(0).toUpperCase()
                        )}
                      </span>
                      <span>{b.name}</span>
                    </a>
                  </td>
                  <td className="py-2">{b.sector || "—"}</td>
                  <td className="py-2">{b.contact_email || "—"}</td>
                  <td className="py-2 flex gap-3">
  <a className="text-[var(--brand-3)] font-semibold" href={`/admin/businesses/${b.id}`}>
    Gestionar →
  </a>
  <a
    className="text-[var(--brand-1)]"
    href={`/business/select-profile?businessId=${b.id}&fromAdmin=1`}
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
