"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { CaptacionForm } from "@/types/captacion";

const OBJECTIVE_LABELS: Record<"quick" | "diagnostic" | "full", string> = {
  quick: "Rápido",
  diagnostic: "Diagnóstico",
  full: "Completo",
};

const OBJECTIVE_DESC: Record<"quick" | "diagnostic" | "full", string> = {
  quick: "Bienvenida + Captura + Gracias. Máxima conversión, mínima fricción.",
  diagnostic: "Añade segmentación y preguntas para calificar mejor al lead.",
  full: "Flujo completo con entrega personalizada por segmento.",
};

export default function FormulariosPage() {
  const router = useRouter();

  // Data state
  const [forms, setForms] = useState<CaptacionForm[]>([]);
  const [businessId, setBusinessId] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);

  // Page mode
  const [mode, setMode] = useState<"list" | "creating">("list");

  // Creation wizard state
  const [creationStep, setCreationStep] = useState<1 | 2>(1);
  const [newName, setNewName] = useState("");
  const [newObjective, setNewObjective] = useState<"quick" | "diagnostic" | "full">("quick");
  const [creating, setCreating] = useState(false);

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
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/captacion/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ businessId, name: newName, objective: newObjective }),
    });
    const data = await res.json();
    if (data.form) {
      router.push(`/captacion/formularios/${data.form.id}`);
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

  const enterCreating = () => {
    setCreationStep(1);
    setNewName("");
    setNewObjective("quick");
    setMode("creating");
  };

  const exitCreating = () => {
    setCreationStep(1);
    setNewName("");
    setNewObjective("quick");
    setMode("list");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[var(--foreground)]/50 text-sm">Cargando...</p>
      </div>
    );
  }

  // ─── CREATING MODE ──────────────────────────────────────────────────────────
  if (mode === "creating") {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={exitCreating}
            className="text-sm text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors shrink-0"
          >
            ← Volver
          </button>

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {([1, 2] as const).map((step, idx) => {
              const isCompleted = creationStep > step;
              const isCurrent = creationStep === step;
              return (
                <div key={step} className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isCurrent
                        ? "text-white"
                        : "text-[var(--foreground)]/50"
                    }`}
                    style={
                      isCurrent && !isCompleted
                        ? { background: "var(--brand-1)" }
                        : !isCompleted && !isCurrent
                        ? { background: "rgba(var(--foreground-rgb, 255 255 255) / 0.1)" }
                        : undefined
                    }
                  >
                    {isCompleted ? "✓" : step}
                  </div>
                  {idx < 1 && (
                    <div
                      className={`w-8 h-px transition-colors ${
                        creationStep > 1 ? "bg-green-500" : "bg-[var(--border)]"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 1 */}
        {creationStep === 1 && (
          <div
            className="rounded-2xl border p-6 md:p-8"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <h2 className="text-xl font-bold mb-2">Ponle nombre a tu formulario</h2>
            <p className="text-sm text-[var(--foreground)]/50 mb-6">
              El nombre es solo interno, el cliente no lo verá
            </p>

            <div>
              <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">
                Nombre del formulario *
              </label>
              <input
                className="w-full rounded-lg border px-3 py-3 text-sm bg-transparent outline-none focus:border-[var(--brand-1)] transition-colors"
                style={{ borderColor: "var(--border)" }}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && newName.trim()) setCreationStep(2); }}
                placeholder="Ej: Formulario Feria del Mueble 2026"
                autoFocus
              />
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setCreationStep(2)}
                disabled={!newName.trim()}
                className="px-8 py-3 rounded-full text-white font-semibold disabled:opacity-40 transition-opacity"
                style={{ background: "var(--brand-1)" }}
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {creationStep === 2 && (
          <div
            className="rounded-2xl border p-6 md:p-8"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <h2 className="text-xl font-bold mb-2">¿Cuál es el objetivo del formulario?</h2>
            <p className="text-sm text-[var(--foreground)]/50 mb-6">
              Elige el nivel de profundidad que necesitas
            </p>

            <div className="space-y-3">
              {(["quick", "diagnostic", "full"] as const).map((obj) => {
                const selected = newObjective === obj;
                return (
                  <button
                    key={obj}
                    onClick={() => setNewObjective(obj)}
                    className="w-full rounded-xl border p-4 text-left transition-colors"
                    style={{
                      borderColor: selected ? "var(--brand-1)" : "var(--border)",
                      background: selected ? "rgba(var(--brand-1-rgb, 57 161 169) / 0.08)" : "transparent",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Radio circle */}
                      <div
                        className="mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors"
                        style={{
                          borderColor: selected ? "var(--brand-1)" : "var(--border)",
                          background: selected ? "var(--brand-1)" : "transparent",
                        }}
                      >
                        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{OBJECTIVE_LABELS[obj]}</p>
                        <p className="text-xs text-[var(--foreground)]/50 mt-1">{OBJECTIVE_DESC[obj]}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setCreationStep(1)}
                className="px-6 py-3 rounded-full border text-sm font-medium transition-colors hover:border-[var(--foreground)]/30"
                style={{ borderColor: "var(--border)" }}
              >
                ← Atrás
              </button>
              <button
                onClick={createForm}
                disabled={creating}
                className="px-8 py-3 rounded-full text-white font-semibold disabled:opacity-50 transition-opacity"
                style={{ background: "var(--brand-1)" }}
              >
                {creating ? "Creando..." : "Crear formulario"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── LIST MODE ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Formularios</h1>
          <p className="text-sm text-[var(--foreground)]/50 mt-1">
            Construye formularios para tus campañas
          </p>
        </div>
        <button
          onClick={enterCreating}
          className="self-start sm:self-auto px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap"
          style={{ background: "var(--brand-1)", color: "white" }}
        >
          + Nuevo formulario
        </button>
      </div>

      {/* Empty state */}
      {forms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <svg
            className="w-12 h-12 text-[var(--foreground)]/20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
            />
          </svg>
          <p className="text-[var(--foreground)]/50 text-sm">Aún no tienes formularios</p>
          <button
            onClick={enterCreating}
            className="px-5 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "var(--brand-1)", color: "white" }}
          >
            Crear primer formulario
          </button>
        </div>
      ) : (
        /* Forms grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {forms.map((f) => (
            <div
              key={f.id}
              className="rounded-xl border p-5 flex flex-col gap-3"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              {/* Top: badges */}
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    f.status === "published"
                      ? "bg-green-500/15 text-green-400"
                      : "bg-yellow-500/15 text-yellow-400"
                  }`}
                >
                  {f.status === "published" ? "Publicado" : "Borrador"}
                </span>
                <span className="text-xs text-[var(--foreground)]/40">
                  {OBJECTIVE_LABELS[f.objective]}
                </span>
              </div>

              {/* Title */}
              <h2 className="font-semibold">{f.name}</h2>

              {/* Subtitle */}
              <p className="text-xs text-[var(--foreground)]/40">
                {f.blocks?.length || 0} bloques
              </p>

              {/* Buttons row */}
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/captacion/formularios/${f.id}`}
                  className="flex-1 min-w-[70px] border rounded-lg text-xs text-center py-2 transition-colors hover:border-[var(--brand-1)]/50"
                  style={{ borderColor: "var(--border)" }}
                >
                  Editar
                </Link>
                <button
                  onClick={() => deleteForm(f.id)}
                  className="text-red-400 text-xs px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors whitespace-nowrap"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
