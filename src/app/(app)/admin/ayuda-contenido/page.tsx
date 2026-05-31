"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { HELP_CONTENT, HelpSection, HelpQA } from "@/lib/help-content";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

// Lista ordenada de slugs para el panel izquierdo
const SECTION_ORDER = [
  "llavero-nfc",
  "dashboard",
  "perfil",
  "landing",
  "recurso-de-valor",
  "beneficios-vip",
  "formularios",
  "campanas",
  "clientes",
  "herramientas",
  "contexto-de-negocio",
  "como-funciona",
];

const SECTION_ICONS: Record<string, string> = {};

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function QAItem({
  item,
  index,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  item: HelpQA;
  index: number;
  onChange: (i: number, field: keyof HelpQA, val: string) => void;
  onDelete: (i: number) => void;
  onMoveUp: (i: number) => void;
  onMoveDown: (i: number) => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div
      className="rounded-xl border border-[var(--border)] overflow-hidden"
      style={{ background: "var(--background)" }}
    >
      {/* Cabecera del item */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--card)" }}
      >
        <span className="text-xs font-semibold text-[var(--foreground)]/40 uppercase tracking-wide">
          Pregunta {index + 1}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMoveUp(index)}
            disabled={isFirst}
            className="w-6 h-6 flex items-center justify-center rounded text-[var(--foreground)]/40 hover:text-[var(--foreground)] hover:bg-[var(--border)]/30 disabled:opacity-20 transition-colors text-xs"
            title="Subir"
          >↑</button>
          <button
            type="button"
            onClick={() => onMoveDown(index)}
            disabled={isLast}
            className="w-6 h-6 flex items-center justify-center rounded text-[var(--foreground)]/40 hover:text-[var(--foreground)] hover:bg-[var(--border)]/30 disabled:opacity-20 transition-colors text-xs"
            title="Bajar"
          >↓</button>
          <button
            type="button"
            onClick={() => onDelete(index)}
            className="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:bg-red-500/10 transition-colors text-xs ml-1"
            title="Eliminar pregunta"
          >✕</button>
        </div>
      </div>

      {/* Campos */}
      <div className="p-3 space-y-2">
        <div>
          <label className="block text-xs text-[var(--foreground)]/50 mb-1">Pregunta</label>
          <input
            type="text"
            value={item.question}
            onChange={e => onChange(index, "question", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm"
            placeholder="¿Cómo funciona...?"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--foreground)]/50 mb-1">
            Respuesta
            <span className="ml-1 text-[var(--foreground)]/30 font-normal">(usa ↵ para saltos de línea)</span>
          </label>
          <textarea
            value={item.answer}
            onChange={e => onChange(index, "answer", e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm resize-y"
            placeholder="La respuesta directa sin rodeos..."
          />
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function HelpContentEditor() {
  const [content, setContent] = useState<Record<string, HelpSection>>(deepClone(HELP_CONTENT));
  const [selectedSlug, setSelectedSlug] = useState(SECTION_ORDER[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [resetting, setResetting] = useState(false);

  // ── Carga contenido guardado ────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/help-content");
        const json = await res.json();
        if (json.content) setContent(json.content);
      } catch {
        // usa defaults
      }
      setLoading(false);
    };
    load();
  }, []);

  // ── Guardar ─────────────────────────────────────────────────────────────
  const save = async () => {
    setSaving(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token || "";
      const res = await fetch("/api/admin/help-content", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        setMsg({ text: "✓ Contenido guardado", ok: true });
        setDirty(false);
      } else {
        setMsg({ text: "Error al guardar", ok: false });
      }
    } catch {
      setMsg({ text: "Error de red", ok: false });
    }
    setSaving(false);
    setTimeout(() => setMsg(null), 3500);
  };

  // ── Restaurar defaults ──────────────────────────────────────────────────
  const resetToDefaults = async () => {
    if (!confirm("¿Restaurar todo el contenido de ayuda a los valores originales? Esta acción no se puede deshacer.")) return;
    setResetting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token || "";
      await fetch("/api/admin/help-content", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setContent(deepClone(HELP_CONTENT));
      setDirty(false);
      setMsg({ text: "✓ Contenido restaurado a valores originales", ok: true });
    } catch {
      setMsg({ text: "Error al restaurar", ok: false });
    }
    setResetting(false);
    setTimeout(() => setMsg(null), 3500);
  };

  // ── Mutaciones de la sección activa ─────────────────────────────────────
  const updateSection = (patch: Partial<HelpSection>) => {
    setContent(c => ({
      ...c,
      [selectedSlug]: { ...c[selectedSlug], ...patch },
    }));
    setDirty(true);
  };

  const updateQA = (index: number, field: keyof HelpQA, val: string) => {
    const items = [...(content[selectedSlug]?.items ?? [])];
    items[index] = { ...items[index], [field]: val };
    updateSection({ items });
  };

  const deleteQA = (index: number) => {
    const items = (content[selectedSlug]?.items ?? []).filter((_, i) => i !== index);
    updateSection({ items });
  };

  const moveQA = (index: number, dir: -1 | 1) => {
    const items = [...(content[selectedSlug]?.items ?? [])];
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    updateSection({ items });
  };

  const addQA = () => {
    const items = [...(content[selectedSlug]?.items ?? []), { question: "", answer: "" }];
    updateSection({ items });
  };

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: "var(--brand-1)" }} />
      </div>
    );
  }

  const section = content[selectedSlug];

  return (
    <div className="max-w-[1400px] mx-auto pb-12">

      {/* ── Cabecera ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold">Contenido de ayuda</h1>
          <p className="text-sm text-[var(--foreground)]/50 mt-0.5">
            Edita las preguntas y respuestas que ven los negocios en el drawer de ayuda.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {msg && (
            <span className={`text-xs px-3 py-1.5 rounded-lg font-medium ${msg.ok ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
              {msg.text}
            </span>
          )}
          {dirty && (
            <span className="text-xs px-2 py-1 rounded-lg font-medium bg-amber-400/15 text-amber-400">
              Cambios sin guardar
            </span>
          )}
          <button
            onClick={resetToDefaults}
            disabled={resetting || saving}
            className="px-3 py-2 rounded-lg border border-[var(--border)] text-xs text-[var(--foreground)]/50 hover:text-[var(--foreground)] disabled:opacity-40 transition-colors"
          >
            {resetting ? "Restaurando…" : "Restaurar defaults"}
          </button>
          <button
            onClick={save}
            disabled={saving || !dirty}
            className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-opacity"
            style={{ background: "var(--brand-1)", color: "white" }}
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>

      {/* ── Layout 2 columnas ── */}
      <div className="grid lg:grid-cols-[260px_1fr] gap-6 items-start">

        {/* ── Columna izquierda: lista de secciones ── */}
        <div
          className="rounded-xl border border-[var(--border)] overflow-hidden sticky top-6"
          style={{ background: "var(--card)" }}
        >
          <div
            className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/40"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            Secciones
          </div>
          <nav className="p-2 space-y-0.5">
            {SECTION_ORDER.map(slug => {
              const sec = content[slug];
              if (!sec) return null;
              const isActive = slug === selectedSlug;
              return (
                <button
                  key={slug}
                  type="button"
                  onClick={() => setSelectedSlug(slug)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                    isActive
                      ? "font-semibold"
                      : "text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--border)]/20"
                  }`}
                  style={isActive ? { background: "var(--brand-1)", color: "white" } : {}}
                >
                  <span className="flex-1 truncate">{sec.title}</span>
                  <span
                    className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      isActive ? "bg-white/20 text-white" : "bg-[var(--border)] text-[var(--foreground)]/40"
                    }`}
                  >
                    {sec.items.length}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Columna derecha: editor de la sección ── */}
        {section && (
          <div className="space-y-4">

            {/* Metadatos de la sección */}
            <div
              className="rounded-xl border border-[var(--border)] p-5 space-y-4"
              style={{ background: "var(--card)" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-base font-bold">Datos de la sección</h2>
              </div>

              <div>
                <label className="block text-xs text-[var(--foreground)]/50 mb-1">Título de la sección</label>
                <input
                  type="text"
                  value={section.title}
                  onChange={e => updateSection({ title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs text-[var(--foreground)]/50 mb-1">
                  Introducción
                  <span className="ml-1 text-[var(--foreground)]/30 font-normal">— aparece en la cabecera del drawer</span>
                </label>
                <textarea
                  value={section.intro ?? ""}
                  onChange={e => updateSection({ intro: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm resize-none"
                  placeholder="Una frase que resume de qué trata esta sección…"
                />
              </div>
            </div>

            {/* Lista de Q&A */}
            <div
              className="rounded-xl border border-[var(--border)] p-5 space-y-3"
              style={{ background: "var(--card)" }}
            >
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-bold">
                  Preguntas y respuestas
                  <span className="ml-2 text-sm font-normal text-[var(--foreground)]/40">
                    ({section.items.length})
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={addQA}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  style={{ background: "var(--brand-1)", color: "white" }}
                >
                  + Añadir pregunta
                </button>
              </div>

              {section.items.length === 0 ? (
                <div className="text-center py-8 text-[var(--foreground)]/30 text-sm">
                  No hay preguntas en esta sección.{" "}
                  <button
                    type="button"
                    onClick={addQA}
                    className="underline underline-offset-2 hover:text-[var(--foreground)]/60 transition-colors"
                  >
                    Añade la primera
                  </button>
                </div>
              ) : (
                section.items.map((item, i) => (
                  <QAItem
                    key={i}
                    item={item}
                    index={i}
                    onChange={updateQA}
                    onDelete={deleteQA}
                    onMoveUp={idx => moveQA(idx, -1)}
                    onMoveDown={idx => moveQA(idx, 1)}
                    isFirst={i === 0}
                    isLast={i === section.items.length - 1}
                  />
                ))
              )}

              {section.items.length > 0 && (
                <button
                  type="button"
                  onClick={addQA}
                  className="w-full py-2.5 rounded-lg border border-dashed border-[var(--border)] text-xs text-[var(--foreground)]/40 hover:text-[var(--foreground)]/70 hover:border-[var(--foreground)]/30 transition-colors"
                >
                  + Añadir otra pregunta
                </button>
              )}
            </div>

            {/* Preview live */}
            <div
              className="rounded-xl border border-[var(--border)] p-5"
              style={{ background: "var(--card)" }}
            >
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/40 mb-3">
                Vista previa del drawer
              </h2>
              <div
                className="rounded-xl border border-[var(--border)] overflow-hidden"
                style={{ background: "var(--background)" }}
              >
                {/* Cabecera simulada */}
                <div
                  className="flex items-center gap-2.5 px-4 py-3"
                  style={{ borderBottom: "1px solid var(--border)", background: "var(--card)" }}
                >
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: "var(--brand-1)", color: "#fff" }}
                  >?</div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground)]/40">Ayuda</p>
                    <p className="text-xs font-bold text-[var(--foreground)]">{section.title}</p>
                  </div>
                </div>
                {/* Intro */}
                {section.intro && (
                  <div className="mx-3 my-2.5 px-3 py-2 rounded-lg text-xs text-[var(--foreground)]/60 leading-relaxed"
                    style={{ background: "var(--card)" }}>
                    {section.intro}
                  </div>
                )}
                {/* Items */}
                <div className="px-3 pb-3 space-y-1">
                  {section.items.slice(0, 3).map((item, i) => (
                    <div key={i}
                      className="rounded-lg border border-[var(--border)] px-3 py-2.5 flex items-center justify-between gap-2"
                    >
                      <span className="text-xs text-[var(--foreground)] font-medium leading-snug flex-1">
                        {item.question || <span className="text-[var(--foreground)]/30 italic">Pregunta vacía…</span>}
                      </span>
                      <span className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
                        style={{ background: "var(--border)", color: "var(--foreground)" }}>+</span>
                    </div>
                  ))}
                  {section.items.length > 3 && (
                    <p className="text-center text-xs text-[var(--foreground)]/30 pt-1">
                      + {section.items.length - 3} preguntas más
                    </p>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
