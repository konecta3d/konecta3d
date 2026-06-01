"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ClientProfile, DEFAULT_CLIENT_PROFILE, PROFILE_LISTS, Objecion, Solucion,
} from "@/lib/crm/client-profile";

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  return { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token || ""}` };
}

// Lista editable de strings
function EditableList({ items, onChange }: { items: string[]; onChange: (items: string[]) => void }) {
  const [nuevo, setNuevo] = useState("");
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 group">
          <span className="text-[var(--brand-1)] text-xs font-bold mt-2 flex-shrink-0 w-5 text-right">{i + 1}.</span>
          <textarea
            value={item}
            onChange={e => { const n = [...items]; n[i] = e.target.value; onChange(n); }}
            rows={1}
            className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm resize-y"
          />
          <button onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="text-red-400 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">✕</button>
        </div>
      ))}
      <div className="flex items-center gap-2 pl-7">
        <input
          value={nuevo}
          onChange={e => setNuevo(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && nuevo.trim()) { onChange([...items, nuevo.trim()]); setNuevo(""); } }}
          placeholder="Añadir nuevo…"
          className="flex-1 px-3 py-1.5 rounded-lg border border-dashed border-[var(--border)] bg-transparent text-sm"
        />
        <button onClick={() => { if (nuevo.trim()) { onChange([...items, nuevo.trim()]); setNuevo(""); } }}
          className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors">
          Añadir
        </button>
      </div>
    </div>
  );
}

// Editor de objeciones (par objeción + respuesta)
function ObjecionesEditor({ items, onChange }: { items: Objecion[]; onChange: (items: Objecion[]) => void }) {
  const set = (i: number, field: keyof Objecion, v: string) => {
    const n = [...items]; n[i] = { ...n[i], [field]: v }; onChange(n);
  };
  return (
    <div className="space-y-3">
      {items.map((o, i) => (
        <div key={i} className="rounded-lg border border-[var(--border)] p-3 group" style={{ background: "var(--background)" }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wide text-[var(--foreground)]/40">Objeción {i + 1}</span>
            <button onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
          </div>
          <input value={o.objecion} onChange={e => set(i, "objecion", e.target.value)}
            placeholder="«Lo que dice el cliente»"
            className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm font-semibold mb-2" />
          <textarea value={o.respuesta} onChange={e => set(i, "respuesta", e.target.value)} rows={2}
            placeholder="Cómo responder"
            className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm resize-y" />
        </div>
      ))}
      <button onClick={() => onChange([...items, { objecion: "", respuesta: "" }])}
        className="text-xs px-3 py-1.5 rounded-lg border border-dashed border-[var(--border)] text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors">
        + Añadir objeción
      </button>
    </div>
  );
}

// Editor del mapeo problema → beneficio → solución
function SolucionesEditor({ items, onChange }: { items: Solucion[]; onChange: (items: Solucion[]) => void }) {
  const set = (i: number, field: keyof Solucion, v: string) => {
    const n = [...items]; n[i] = { ...n[i], [field]: v }; onChange(n);
  };
  return (
    <div className="space-y-3">
      {items.map((s, i) => (
        <div key={i} className="rounded-lg border border-[var(--border)] p-3 group" style={{ background: "var(--background)" }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wide text-[var(--foreground)]/40">Mapeo {i + 1}</span>
            <button onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-2 mb-2">
            <div>
              <label className="block text-[10px] text-red-400/70 mb-0.5">Problema</label>
              <input value={s.problema} onChange={e => set(i, "problema", e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm" />
            </div>
            <div>
              <label className="block text-[10px] text-green-500/70 mb-0.5">Beneficio Konecta</label>
              <input value={s.beneficio} onChange={e => set(i, "beneficio", e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm" />
            </div>
          </div>
          <div className="grid sm:grid-cols-[auto_1fr] gap-2 items-start">
            <select value={s.tipo} onChange={e => set(i, "tipo", e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-xs">
              <option>Directo</option>
              <option>Indirecto</option>
              <option>Directo + Indirecto</option>
            </select>
            <div>
              <textarea value={s.mensaje} onChange={e => set(i, "mensaje", e.target.value)} rows={1}
                placeholder="Mensaje de solución (cómo se comunica)"
                className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm resize-y" />
            </div>
          </div>
        </div>
      ))}
      <button onClick={() => onChange([...items, { problema: "", beneficio: "", tipo: "Directo", mensaje: "" }])}
        className="text-xs px-3 py-1.5 rounded-lg border border-dashed border-[var(--border)] text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors">
        + Añadir mapeo
      </button>
    </div>
  );
}

function Section({ title, desc, count, children }: { title: string; desc: string; count?: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden" style={{ background: "var(--card)" }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--border)]/10 transition-colors">
        <div>
          <h3 className="text-sm font-bold">{title}{count !== undefined && <span className="ml-2 text-xs font-normal text-[var(--foreground)]/40">({count})</span>}</h3>
          <p className="text-xs text-[var(--foreground)]/50">{desc}</p>
        </div>
        <span className="text-[var(--foreground)]/30 text-lg">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export default function ClientProfilePage() {
  const [profile, setProfile] = useState<ClientProfile>(DEFAULT_CLIENT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/crm/client-profile", { headers: await authHeaders() });
      const json = await res.json();
      if (json.profile) setProfile(json.profile);
    } catch { /* silencioso */ }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const set = (patch: Partial<ClientProfile>) => { setProfile(p => ({ ...p, ...patch })); setDirty(true); };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/crm/client-profile", {
        method: "POST", headers: await authHeaders(), body: JSON.stringify({ profile }),
      });
      setMsg(res.ok ? "Guardado" : "Error al guardar");
      if (res.ok) setDirty(false);
    } catch { setMsg("Error de red"); }
    setSaving(false);
    setTimeout(() => setMsg(null), 2500);
  };

  const restaurar = async () => {
    if (!confirm("¿Restaurar el perfil a los valores por defecto?")) return;
    await fetch("/api/admin/crm/client-profile", { method: "DELETE", headers: await authHeaders() });
    setProfile(DEFAULT_CLIENT_PROFILE); setDirty(false);
    setMsg("Restaurado");
    setTimeout(() => setMsg(null), 2500);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: "var(--brand-1)" }} />
    </div>;
  }

  return (
    <div className="max-w-[900px] mx-auto pb-12">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/admin/crm/pipeline" className="text-sm text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors">← Pipeline</Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold">Cliente ideal</h1>
          <p className="text-sm text-[var(--foreground)]/50 mt-0.5">Centraliza el «quién» para enfocar comunicación, prospección y venta.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {msg && <span className="text-xs px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 font-medium">{msg}</span>}
          {dirty && <span className="text-xs px-2 py-1 rounded-lg bg-amber-400/15 text-amber-400">Sin guardar</span>}
          <button onClick={restaurar} className="px-3 py-2 rounded-lg border border-[var(--border)] text-xs text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors">Restaurar</button>
          <button onClick={save} disabled={saving || !dirty} className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50" style={{ background: "var(--brand-1)", color: "white" }}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {/* Identidad */}
        <Section title="Identidad" desc="Quién es, en una frase">
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-[var(--foreground)]/50 mb-1">Nombre del perfil</label>
              <input value={profile.nombre} onChange={e => set({ nombre: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm font-semibold" />
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)]/50 mb-1">Descripción</label>
              <textarea value={profile.descripcion} onChange={e => set({ descripcion: e.target.value })} rows={3}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm resize-y" />
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)]/50 mb-1">Demografía / datos del negocio</label>
              <textarea value={profile.demografia} onChange={e => set({ demografia: e.target.value })} rows={2}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm resize-y" />
            </div>
          </div>
        </Section>

        {/* Listas */}
        {PROFILE_LISTS.map(({ key, label, desc }) => (
          <Section key={key} title={label} desc={desc} count={(profile[key] as string[]).length}>
            <EditableList items={profile[key] as string[]} onChange={items => set({ [key]: items } as Partial<ClientProfile>)} />
          </Section>
        ))}

        {/* Objeciones */}
        <Section title="Objeciones y respuestas" desc="Lo que frena la venta y cómo rebatirlo" count={profile.objeciones.length}>
          <ObjecionesEditor items={profile.objeciones} onChange={items => set({ objeciones: items })} />
        </Section>

        {/* Mapeo problema → beneficio → solución */}
        <Section title="Problema → Beneficio → Solución" desc="Cómo cada problema del cliente se convierte en un beneficio de Konecta. La base de toda la comunicación." count={profile.soluciones.length}>
          <SolucionesEditor items={profile.soluciones} onChange={items => set({ soluciones: items })} />
        </Section>
      </div>
    </div>
  );
}
