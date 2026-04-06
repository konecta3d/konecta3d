"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DocumentsPage() {
  const [items, setItems] = useState<{ name: string; url: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const businessId = new URLSearchParams(window.location.search).get("businessId") || "";
      if (!businessId) {
        setLoading(false);
        return;
      }
      const folder = `documents/${businessId}`;
      const { data } = await supabase.storage.from("docs").list(folder);
      const files = (data || []).map((f) => {
        const { data: urlData } = supabase.storage.from("docs").getPublicUrl(`${folder}/${f.name}`);
        return { name: f.name, url: urlData.publicUrl };
      });
      setItems(files);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Mis documentos</h1>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        {loading && <div>Cargando…</div>}
        {!loading && items.length === 0 && (
          <div className="text-sm text-[var(--brand-1)]">No hay documentos todavía.</div>
        )}
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((d) => (
            <div key={d.url} className="rounded-lg border border-[var(--border)] p-3">
              <div className="text-sm font-semibold">{d.name}</div>
              <div className="mt-2 flex gap-2">
                <a className="rounded-lg border border-[var(--border)] px-3 py-1 text-sm" href={d.url} target="_blank" rel="noreferrer">
                  Abrir
                </a>
                <a className="rounded-lg border border-[var(--border)] px-3 py-1 text-sm" href={d.url} download>
                  Descargar
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="text-xs text-[var(--brand-1)]">
        Nota: abre esta vista con ?businessId=TU_ID para ver los documentos del negocio.
      </div>
    </div>
  );
}
