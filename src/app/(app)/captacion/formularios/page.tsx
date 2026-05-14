"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { CaptacionForm } from "@/types/captacion";

export default function FormulariosPage() {
  const [forms, setForms] = useState<CaptacionForm[]>([]);
  const [businessId, setBusinessId] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", objective: "quick" as "quick" | "diagnostic" | "full" });

  const OBJECTIVE_LABELS = { quick: "Rápido", diagnostic: "Diagnóstico", full: "Completo" };
  const OBJECTIVE_DESC = {
    quick: "Bienvenida + Captura + Gracias. Máxima conversión, mínima fricción.",
    diagnostic: "Añade segmentación y preguntas para calificar mejor al lead.",
    full: "Flujo completo con entrega personalizada por segmento.",
  };

  useEffect(() => {
    const load = async () => {
      const { data: s } = await supabase.auth.getSession();
      const t = s?.session?.access_token;
      const email = s?.session?.user?.email;
      if (!email || !t) { setLoading(false); return; }
      setToken(t);
      const { data: biz } = await supabase.from("businesses").select("id").eq("contact_email", email).single();
      if (!biz) { setLoading(false); return; }
      setBusinessId(biz.id);
      await loadForms(biz.id, t);
    };
    load();
  }, []);

  const loadForms = async (bid: string, tok: string) => {
    const res = await fetch(`/api/captacion/forms?businessId=${bid}`, {
      headers: { Authorization: `Bearer ${tok}` },
    });
    const data = await res.json();
    setForms(data.forms || []);
    setLoading(false);
  };

  const createForm = async () => {
    if (!newForm.name.trim()) return;
    setCreating(true);
    const res = await fetch("/api/captacion/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ businessId, name: newForm.name, objective: newForm.objective }),
    });
    const data = await res.json();
    if (data.form) {
      setShowModal(false);
      await loadForms(businessId, token);
    }
    setCreating(false);
  };

  const deleteForm = async (id: string) => {
    if (!confirm("¿Eliminar este formulario?")) return;
    await fetch(`/api/captacion/forms/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await loadForms(businessId, token);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-[var(--foreground)]/50 text-sm">Cargando...</p></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Formularios</h1>
          <p className="text-sm text-[var(--foreground)]/50 mt-1">Construye formularios para tus campañas</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "var(--brand-1)", color: "white" }}
        >
          + Nuevo formulario
        </button>
      </div>

      {forms.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[var(--foreground)]/50 mb-4">Aún no tienes formularios</p>
          <button onClick={() => setShowModal(true)} className="px-5 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "var(--brand-1)", color: "white" }}>
            Crear primer formulario
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {forms.map((f) => (
            <div key={f.id} className="rounded-xl border p-5 flex flex-col gap-3"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${f.status === "published" ? "bg-green-500/15 text-green-400" : "bg-yellow-500/15 text-yellow-400"}`}>
                      {f.status === "published" ? "Publicado" : "Borrador"}
                    </span>
                    <span className="text-xs text-[var(--foreground)]/40">
                      {OBJECTIVE_LABELS[f.objective]}
                    </span>
                  </div>
                  <h2 className="font-semibold">{f.name}</h2>
                  <p className="text-xs text-[var(--foreground)]/40 mt-1">
                    {f.blocks?.length || 0} bloques
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/captacion/formularios/${f.id}`}
                  className="flex-1 text-center py-2 rounded-lg text-xs font-semibold border transition-colors hover:border-[var(--brand-1)]/50"
                  style={{ borderColor: "var(--border)" }}
                >
                  Editar
                </Link>
                <button onClick={() => deleteForm(f.id)}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-md rounded-2xl border p-6 space-y-4"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">Nuevo formulario</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--foreground)]/40 hover:text-[var(--foreground)] text-xl leading-none">×</button>
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Nombre *</label>
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent"
                style={{ borderColor: "var(--border)" }}
                value={newForm.name}
                onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Formulario Feria del Mueble"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-2">Objetivo</label>
              <div className="space-y-2">
                {(["quick", "diagnostic", "full"] as const).map(obj => (
                  <button key={obj} onClick={() => setNewForm(f => ({ ...f, objective: obj }))}
                    className={`w-full text-left rounded-lg border p-3 transition-colors ${newForm.objective === obj ? "border-[var(--brand-1)]" : "border-[var(--border)]"}`}
                    style={{ background: newForm.objective === obj ? "rgba(57,161,169,0.08)" : "transparent" }}>
                    <p className="text-sm font-semibold">{OBJECTIVE_LABELS[obj]}</p>
                    <p className="text-xs text-[var(--foreground)]/50 mt-0.5">{OBJECTIVE_DESC[obj]}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-lg border text-sm font-medium"
                style={{ borderColor: "var(--border)" }}>
                Cancelar
              </button>
              <button onClick={createForm} disabled={creating || !newForm.name.trim()}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
                style={{ background: "var(--brand-1)", color: "white" }}>
                {creating ? "Creando..." : "Crear formulario"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
