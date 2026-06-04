"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DEFAULT_LANDING_HTML } from "@/lib/landing-template";

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  return {
    Authorization: `Bearer ${data.session?.access_token || ""}`,
    "Content-Type": "application/json",
  };
}

interface LandingRow {
  id: string;
  slug: string;
  name: string;
  published: boolean;
  updated_at: string;
}

interface LandingFull extends LandingRow {
  html: string;
}

export default function LandingsAdminPage() {
  const [list, setList] = useState<LandingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<LandingFull | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/landings", { headers: await authHeaders() });
      const json = await res.json();
      if (json.landings) setList(json.landings);
    } catch { /* silencioso */ }
    setLoading(false);
  }

  async function createNew() {
    const name = prompt("Nombre de la landing (p. ej. Presentación negocios):");
    if (!name?.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/landings", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ name: name.trim(), html: DEFAULT_LANDING_HTML, published: true }),
      });
      const json = await res.json();
      if (json.error) { setMsg(json.error); }
      else { await load(); openEditor(json.landing.id); }
    } catch { setMsg("No se pudo crear"); }
    setSaving(false);
  }

  async function openEditor(id: string) {
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/landings/${id}`, { headers: await authHeaders() });
      const json = await res.json();
      if (json.landing) setEditing(json.landing);
      else setMsg(json.error || "No se pudo abrir");
    } catch { setMsg("No se pudo abrir"); }
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/landings/${editing.id}`, {
        method: "PUT",
        headers: await authHeaders(),
        body: JSON.stringify({
          name: editing.name,
          slug: editing.slug,
          html: editing.html,
          published: editing.published,
        }),
      });
      const json = await res.json();
      if (json.error) { setMsg(json.error); }
      else { setMsg("Guardado"); await load(); if (json.landing) setEditing({ ...editing, slug: json.landing.slug }); }
    } catch { setMsg("No se pudo guardar"); }
    setSaving(false);
  }

  async function remove(id: string, name: string) {
    if (!confirm(`¿Eliminar la landing "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await fetch(`/api/admin/landings/${id}`, { method: "DELETE", headers: await authHeaders() });
      await load();
    } catch { setMsg("No se pudo eliminar"); }
  }

  function copyLink(slug: string) {
    navigator.clipboard.writeText(`${origin}/p/${slug}`);
    setMsg(`Link copiado: ${origin}/p/${slug}`);
    setTimeout(() => setMsg(null), 2500);
  }

  // ── Editor ──────────────────────────────────────────────────────────────────
  if (editing) {
    const publicUrl = `${origin}/p/${editing.slug}`;
    return (
      <div className="max-w-[1000px] mx-auto pb-12">
        <button onClick={() => setEditing(null)} className="text-sm text-[var(--foreground)]/50 hover:text-[var(--foreground)] mb-4">← Volver a la lista</button>
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <h1 className="text-xl font-bold">Editar landing</h1>
          <div className="flex items-center gap-2">
            <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-sm px-3 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/10">Ver publicada ↗</a>
            <button onClick={save} disabled={saving} className="text-sm px-4 py-2 rounded-lg font-semibold text-black disabled:opacity-50" style={{ background: "var(--brand-4)" }}>{saving ? "Guardando…" : "Guardar"}</button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-[var(--foreground)]/50">Nombre</label>
            <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-[var(--foreground)]/50">Enlace (slug)</label>
            <div className="mt-1 flex items-center gap-1">
              <span className="text-sm text-[var(--foreground)]/40 whitespace-nowrap">{origin}/p/</span>
              <input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} />
            Publicada (visible en el link)
          </label>
          <div className="flex items-center gap-2">
            <button onClick={() => copyLink(editing.slug)} className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/10">Copiar link</button>
            <button onClick={() => { if (confirm("¿Reemplazar el HTML actual por la plantilla de ejemplo? Perderás los cambios no guardados.")) setEditing({ ...editing, html: DEFAULT_LANDING_HTML }); }}
              className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/10">Cargar plantilla</button>
          </div>
        </div>

        <label className="text-xs uppercase tracking-wide text-[var(--foreground)]/50">Código HTML</label>
        <textarea value={editing.html} onChange={(e) => setEditing({ ...editing, html: e.target.value })}
          spellCheck={false}
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 font-mono text-xs leading-relaxed"
          style={{ minHeight: "55vh" }} />

        {msg && <div className="mt-3 text-sm text-[var(--brand-1)]">{msg}</div>}
        <p className="mt-2 text-xs text-[var(--foreground)]/40">Pega aquí cualquier HTML autónomo. Se sirve tal cual en el link público. Recuerda editar el número de WhatsApp y sustituir los logos del carrusel.</p>
      </div>
    );
  }

  // ── Lista ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[1000px] mx-auto pb-12">
      <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Landings de presentación</h1>
          <p className="text-sm text-[var(--foreground)]/50 mt-0.5">Crea páginas con código, genera un link y compártelo con los negocios.</p>
        </div>
        <button onClick={createNew} disabled={saving} className="text-sm px-4 py-2 rounded-lg font-semibold text-black disabled:opacity-50" style={{ background: "var(--brand-4)" }}>+ Nueva landing</button>
      </div>

      {msg && <div className="my-3 text-sm text-[var(--brand-1)]">{msg}</div>}

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-9 w-9 border-b-2" style={{ borderColor: "var(--brand-1)" }} />
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-[var(--border)] mt-4">
          <p className="text-sm text-[var(--foreground)]/40">Aún no hay landings.</p>
          <button onClick={createNew} className="text-sm text-[var(--brand-1)] hover:underline mt-1">Crear la primera (con plantilla) →</button>
        </div>
      ) : (
        <div className="space-y-2.5 mt-4">
          {list.map((l) => (
            <div key={l.id} className="rounded-xl border border-[var(--border)] p-4 flex items-center justify-between gap-3 flex-wrap" style={{ background: "var(--card)" }}>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold truncate">{l.name}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${l.published ? "text-green-600 bg-green-500/10" : "text-[var(--foreground)]/40 bg-[var(--foreground)]/5"}`}>{l.published ? "Publicada" : "Borrador"}</span>
                </div>
                <p className="text-xs text-[var(--foreground)]/45 truncate">{origin}/p/{l.slug}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => copyLink(l.slug)} className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/10">Copiar link</button>
                <a href={`${origin}/p/${l.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/10">Abrir ↗</a>
                <button onClick={() => openEditor(l.id)} className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/10">Editar</button>
                <button onClick={() => remove(l.id, l.name)} className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
