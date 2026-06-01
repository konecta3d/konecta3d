"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Resource {
  id: string; nombre: string; categoria: string | null;
  para_perfil: string | null; etapa_proceso: string | null;
  usado_por: string | null; contenido: string | null; version: string | null;
}

const CATEGORIAS = [
  { key: "guion",       label: "Guiones de venta" },
  { key: "copy",        label: "Copy para redes" },
  { key: "email",       label: "Emails" },
  { key: "propuesta",   label: "Propuestas" },
  { key: "onboarding",  label: "Onboarding" },
  { key: "lead_magnet", label: "Lead Magnet" },
  { key: "objecion",    label: "Objeciones" },
];

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  return { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token || ""}` };
}

function ResourceModal({ resource, onClose, onSaved }: {
  resource: Partial<Resource> | null; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<Resource>>(resource || { categoria: "guion", version: "1.0" });
  const [saving, setSaving] = useState(false);
  const isEdit = !!resource?.id;
  const set = (k: keyof Resource, v: string) => setForm(f => ({ ...f, [k]: v }));
  const inputCls = "w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm";

  const save = async () => {
    if (!form.nombre?.trim()) return;
    setSaving(true);
    const url = isEdit ? `/api/admin/crm/resources/${resource!.id}` : "/api/admin/crm/resources";
    await fetch(url, { method: isEdit ? "PUT" : "POST", headers: await authHeaders(), body: JSON.stringify(form) });
    setSaving(false);
    onSaved(); onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl rounded-2xl border border-[var(--border)] flex flex-col" style={{ background: "var(--card)", maxHeight: "90vh" }}>
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)] flex-shrink-0">
          <h2 className="text-base font-bold">{isEdit ? "Editar recurso" : "Nuevo recurso"}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--foreground)]/40 hover:text-[var(--foreground)] hover:bg-[var(--border)]/30 transition-colors">✕</button>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto">
          <div>
            <label className="block text-xs text-[var(--foreground)]/50 mb-1">Nombre *</label>
            <input className={inputCls} value={form.nombre ?? ""} onChange={e => set("nombre", e.target.value)} placeholder="Ej: Guión diagnóstico llamada 20min" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--foreground)]/50 mb-1">Categoría</label>
              <select className={inputCls} value={form.categoria ?? ""} onChange={e => set("categoria", e.target.value)}>
                {CATEGORIAS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)]/50 mb-1">Usado por</label>
              <input className={inputCls} value={form.usado_por ?? ""} onChange={e => set("usado_por", e.target.value)} placeholder="Miguel / Miriam / Ambos" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--foreground)]/50 mb-1">Para perfil</label>
              <input className={inputCls} value={form.para_perfil ?? ""} onChange={e => set("para_perfil", e.target.value)} placeholder="A / B / Todos" />
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)]/50 mb-1">Etapa del proceso</label>
              <input className={inputCls} value={form.etapa_proceso ?? ""} onChange={e => set("etapa_proceso", e.target.value)} placeholder="P1-P6" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[var(--foreground)]/50 mb-1">Contenido</label>
            <textarea className={inputCls + " resize-y font-mono"} rows={10} value={form.contenido ?? ""} onChange={e => set("contenido", e.target.value)} placeholder="El guión, copy o email completo…" />
          </div>
        </div>
        <div className="flex justify-end gap-2 p-5 border-t border-[var(--border)] flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--foreground)]/60">Cancelar</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50" style={{ background: "var(--brand-1)", color: "white" }}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CrmResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Resource> | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/crm/resources", { headers: await authHeaders() });
      const json = await res.json();
      if (json.resources) setResources(json.resources);
    } catch { /* silencioso */ }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const del = async (id: string) => {
    if (!confirm("¿Eliminar este recurso?")) return;
    await fetch(`/api/admin/crm/resources/${id}`, { method: "DELETE", headers: await authHeaders() });
    load();
  };

  const copy = (r: Resource) => {
    navigator.clipboard.writeText(r.contenido || "");
    setCopied(r.id);
    setTimeout(() => setCopied(null), 1500);
  };

  const byCategoria = useMemo(() => {
    const groups: Record<string, Resource[]> = {};
    for (const r of resources) {
      const c = r.categoria || "otro";
      if (!groups[c]) groups[c] = [];
      groups[c].push(r);
    }
    return groups;
  }, [resources]);

  const catLabel = (k: string) => CATEGORIAS.find(c => c.key === k)?.label || k;

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: "var(--brand-1)" }} />
    </div>;
  }

  return (
    <div className="max-w-[1000px] mx-auto pb-12">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/admin/crm/pipeline" className="text-sm text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors">← Pipeline</Link>
      </div>

      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold">Recursos y guiones</h1>
          <p className="text-sm text-[var(--foreground)]/50 mt-0.5">{resources.length} recursos · todo el material comercial</p>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }}
          className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "var(--brand-1)", color: "white" }}>
          + Nuevo recurso
        </button>
      </div>

      {resources.length === 0 ? (
        <div className="text-center py-16 text-[var(--foreground)]/30 text-sm">
          Sin recursos todavía. Añade tu primer guión o plantilla.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byCategoria).map(([cat, items]) => (
            <section key={cat}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground)]/50 mb-2 px-1">{catLabel(cat)}</h2>
              <div className="space-y-2">
                {items.map(r => {
                  const open = expanded === r.id;
                  return (
                    <div key={r.id} className="rounded-xl border border-[var(--border)] overflow-hidden" style={{ background: "var(--card)" }}>
                      <div className="flex items-center justify-between gap-2 px-4 py-3">
                        <button onClick={() => setExpanded(open ? null : r.id)} className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold truncate">{r.nombre}</span>
                            {r.para_perfil && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--border)]/40 text-[var(--foreground)]/60">Perfil {r.para_perfil}</span>}
                            {r.usado_por && <span className="text-[10px] text-[var(--foreground)]/40">{r.usado_por}</span>}
                          </div>
                        </button>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => copy(r)} className="text-xs px-2 py-1 rounded border border-[var(--border)] text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors">
                            {copied === r.id ? "Copiado" : "Copiar"}
                          </button>
                          <button onClick={() => { setEditing(r); setShowModal(true); }} className="text-xs px-2 py-1 rounded border border-[var(--border)] text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors">Editar</button>
                          <button onClick={() => del(r.id)} className="text-xs px-2 py-1 rounded border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors">✕</button>
                        </div>
                      </div>
                      {open && r.contenido && (
                        <div className="px-4 pb-4 border-t border-[var(--border)] pt-3">
                          <pre className="text-xs text-[var(--foreground)]/70 whitespace-pre-wrap font-mono leading-relaxed">{r.contenido}</pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {showModal && <ResourceModal resource={editing} onClose={() => setShowModal(false)} onSaved={load} />}
    </div>
  );
}
