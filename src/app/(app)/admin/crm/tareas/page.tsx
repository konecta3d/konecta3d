"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ASIGNADOS } from "@/lib/crm/stages";

interface Task {
  id: string;
  lead_id: string | null;
  titulo: string;
  tipo: string | null;
  asignado_a: string | null;
  fecha: string | null;
  completada: boolean;
  notas: string | null;
  crm_leads?: { id: string; nombre: string; empresa: string | null } | null;
}

const TIPOS_TAREA = [
  { key: "llamada",   label: "Llamada" },
  { key: "whatsapp",  label: "WhatsApp" },
  { key: "email",     label: "Email" },
  { key: "dm",        label: "DM" },
  { key: "propuesta", label: "Propuesta" },
  { key: "config",    label: "Configuración" },
  { key: "contenido", label: "Contenido" },
];

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  return { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token || ""}` };
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

export default function CrmTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPersona, setFilterPersona] = useState("todos");
  const [vista, setVista] = useState<"hoy" | "todas" | "pendientes">("hoy");

  // Form nueva tarea
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevoTipo, setNuevoTipo] = useState("llamada");
  const [nuevaPersona, setNuevaPersona] = useState("Miguel");
  const [nuevaFecha, setNuevaFecha] = useState(todayStr());

  const load = async () => {
    try {
      const res = await fetch("/api/admin/crm/tasks", { headers: await authHeaders() });
      const json = await res.json();
      if (json.tasks) setTasks(json.tasks);
    } catch { /* silencioso */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const crear = async () => {
    if (!nuevoTitulo.trim()) return;
    await fetch("/api/admin/crm/tasks", {
      method: "POST", headers: await authHeaders(),
      body: JSON.stringify({ titulo: nuevoTitulo, tipo: nuevoTipo, asignado_a: nuevaPersona, fecha: nuevaFecha }),
    });
    setNuevoTitulo("");
    load();
  };

  const toggle = async (t: Task) => {
    setTasks(prev => prev.map(x => x.id === t.id ? { ...x, completada: !x.completada } : x));
    await fetch(`/api/admin/crm/tasks/${t.id}`, {
      method: "PUT", headers: await authHeaders(),
      body: JSON.stringify({ completada: !t.completada }),
    });
  };

  const borrar = async (id: string) => {
    await fetch(`/api/admin/crm/tasks/${id}`, { method: "DELETE", headers: await authHeaders() });
    load();
  };

  const filtered = useMemo(() => {
    const today = todayStr();
    return tasks.filter(t => {
      if (filterPersona !== "todos" && t.asignado_a !== filterPersona) return false;
      if (vista === "hoy") return !t.completada && (!t.fecha || t.fecha <= today);
      if (vista === "pendientes") return !t.completada;
      return true;
    });
  }, [tasks, filterPersona, vista]);

  const tipoLabel = (k: string | null) => TIPOS_TAREA.find(t => t.key === k)?.label || k || "";

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: "var(--brand-1)" }} />
    </div>;
  }

  const pendientesHoy = tasks.filter(t => !t.completada && (!t.fecha || t.fecha <= todayStr())).length;

  return (
    <div className="max-w-[900px] mx-auto pb-12">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/admin/crm/pipeline" className="text-sm text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors">← Pipeline</Link>
      </div>

      <div className="mb-6">
        <h1 className="text-xl font-bold">Tareas</h1>
        <p className="text-sm text-[var(--foreground)]/50 mt-0.5">{pendientesHoy} pendientes para hoy</p>
      </div>

      {/* Crear tarea */}
      <div className="rounded-xl border border-[var(--border)] p-4 mb-5" style={{ background: "var(--card)" }}>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto_auto] gap-2">
          <input className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
            value={nuevoTitulo} onChange={e => setNuevoTitulo(e.target.value)}
            onKeyDown={e => e.key === "Enter" && crear()}
            placeholder="Nueva tarea…" />
          <select className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
            value={nuevoTipo} onChange={e => setNuevoTipo(e.target.value)}>
            {TIPOS_TAREA.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
          <select className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
            value={nuevaPersona} onChange={e => setNuevaPersona(e.target.value)}>
            {ASIGNADOS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <input type="date" className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
            value={nuevaFecha} onChange={e => setNuevaFecha(e.target.value)} />
          <button onClick={crear} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "var(--brand-1)", color: "white" }}>
            Añadir
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(["hoy", "pendientes", "todas"] as const).map(v => (
          <button key={v} onClick={() => setVista(v)}
            className={`text-xs px-3 py-1.5 rounded-lg border capitalize transition-colors ${
              vista === v ? "border-[var(--brand-1)] text-[var(--brand-1)] bg-[var(--brand-1)]/10"
                : "border-[var(--border)] text-[var(--foreground)]/50 hover:text-[var(--foreground)]"
            }`}>
            {v === "hoy" ? "Hoy" : v === "pendientes" ? "Pendientes" : "Todas"}
          </button>
        ))}
        <span className="text-xs text-[var(--foreground)]/40 ml-3">Persona:</span>
        {["todos", ...ASIGNADOS].map(p => (
          <button key={p} onClick={() => setFilterPersona(p)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              filterPersona === p ? "border-[var(--brand-1)] text-[var(--brand-1)] bg-[var(--brand-1)]/10"
                : "border-[var(--border)] text-[var(--foreground)]/50 hover:text-[var(--foreground)]"
            }`}>
            {p === "todos" ? "Todos" : p}
          </button>
        ))}
      </div>

      {/* Lista de tareas */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-[var(--foreground)]/30 text-sm">
          {vista === "hoy" ? "Nada pendiente para hoy. Buen trabajo." : "Sin tareas."}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(t => {
            const today = todayStr();
            const overdue = t.fecha && t.fecha < today && !t.completada;
            return (
              <div key={t.id}
                className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-3 py-2.5 group"
                style={{ background: "var(--card)" }}>
                <button onClick={() => toggle(t)}
                  className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    t.completada ? "bg-green-500 border-green-500" : "border-[var(--border)] hover:border-[var(--brand-1)]"
                  }`}>
                  {t.completada && <span className="text-white text-xs leading-none">✓</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${t.completada ? "line-through text-[var(--foreground)]/40" : "text-[var(--foreground)]"}`}>
                    {t.titulo}
                  </p>
                  {t.crm_leads && (
                    <Link href={`/admin/crm/pipeline/${t.crm_leads.id}`}
                      className="text-[11px] text-[var(--brand-1)] hover:underline">
                      {t.crm_leads.nombre}{t.crm_leads.empresa ? ` · ${t.crm_leads.empresa}` : ""}
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {t.tipo && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--border)]/40 text-[var(--foreground)]/60">{tipoLabel(t.tipo)}</span>}
                  {t.asignado_a && <span className="text-[10px] text-[var(--foreground)]/40">{t.asignado_a}</span>}
                  {t.fecha && (
                    <span className={`text-[10px] ${overdue ? "text-red-400 font-semibold" : "text-[var(--foreground)]/40"}`}>
                      {new Date(t.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                    </span>
                  )}
                  <button onClick={() => borrar(t.id)}
                    className="text-[10px] text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
