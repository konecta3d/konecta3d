"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getHelpSection, HelpSection } from "@/lib/help-content";

// ─── Props ────────────────────────────────────────────────────────────────────

interface HelpDrawerProps {
  /** Cuando es false Y no es admin, el botón queda oculto */
  enabled: boolean;
  /** Los admins siempre ven el botón independientemente de `enabled` */
  isAdmin: boolean;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function HelpDrawer({ enabled, isAdmin }: HelpDrawerProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [section, setSection] = useState<HelpSection>(getHelpSection(pathname));

  // Actualiza el contenido y resetea el acordeón al cambiar de sección
  useEffect(() => {
    setSection(getHelpSection(pathname));
    setExpandedIndex(null);
  }, [pathname]);

  // Cierra con Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Bloquea scroll del body cuando el drawer está abierto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const shouldShow = isAdmin || enabled;
  if (!shouldShow) return null;

  const toggle = (i: number) =>
    setExpandedIndex((prev) => (prev === i ? null : i));

  return (
    <>
      {/* ── Botón flotante ─────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir ayuda"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full shadow-lg text-xs font-semibold transition-all hover:scale-105 active:scale-95"
        style={{
          background: "var(--brand-1)",
          color: "#ffffff",
          boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
        }}
      >
        <span className="text-sm leading-none font-bold">?</span>
        <span className="hidden sm:inline">Ayuda</span>
        {/* Indicador admin */}
        {isAdmin && !enabled && (
          <span
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2"
            style={{ background: "#f97316", borderColor: "var(--card)" }}
            title="Botón oculto para clientes"
          />
        )}
      </button>

      {/* ── Backdrop ───────────────────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "rgba(0,0,0,0.45)" }}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* ── Panel lateral ──────────────────────────────────────────────────── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Panel de ayuda"
        className={`fixed top-0 right-0 h-screen z-50 flex flex-col transition-transform duration-300 ease-in-out
          w-full sm:w-[420px]
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
        style={{
          background: "var(--card)",
          borderLeft: "1px solid var(--border)",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
        }}
      >
        {/* Cabecera */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: "var(--brand-1)", color: "#fff" }}
            >
              ?
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--foreground)]/40">
                Ayuda
              </p>
              <h2 className="text-sm font-bold leading-tight text-[var(--foreground)]">
                {section.title}
              </h2>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--foreground)]/40 hover:text-[var(--foreground)] hover:bg-[var(--border)]/30 transition-colors text-base"
            aria-label="Cerrar ayuda"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo con scroll */}
        <div className="flex-1 overflow-y-auto">

          {/* Intro */}
          {section.intro && (
            <div
              className="mx-4 mt-4 mb-2 px-4 py-3 rounded-xl text-sm text-[var(--foreground)]/70 leading-relaxed"
              style={{ background: "var(--background)" }}
            >
              {section.intro}
            </div>
          )}

          {/* Acordeón Q&A */}
          <div className="px-4 pb-6 pt-2 space-y-1">
            {section.items.map((item, i) => {
              const isOpen = expandedIndex === i;
              return (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden transition-all"
                  style={{
                    border: `1px solid ${isOpen ? "rgba(10,50,60,0.2)" : "var(--border)"}`,
                    background: isOpen ? "var(--background)" : "transparent",
                  }}
                >
                  {/* Pregunta */}
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    className="w-full flex items-start justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[var(--border)]/20"
                  >
                    <span className="text-sm font-semibold text-[var(--foreground)] leading-snug flex-1">
                      {item.question}
                    </span>
                    <span
                      className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 mt-0.5 ${
                        isOpen ? "rotate-45" : "rotate-0"
                      }`}
                      style={{
                        background: isOpen ? "var(--brand-1)" : "var(--border)",
                        color: isOpen ? "#fff" : "var(--foreground)",
                      }}
                    >
                      +
                    </span>
                  </button>

                  {/* Respuesta */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isOpen ? "max-h-96" : "max-h-0"
                    }`}
                  >
                    <div
                      className="px-4 pb-4 text-sm text-[var(--foreground)]/70 leading-relaxed whitespace-pre-line"
                      style={{ borderTop: "1px solid var(--border)" }}
                    >
                      <div className="pt-3">{item.answer}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pie */}
        <div
          className="flex-shrink-0 px-5 py-3 text-center"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p className="text-xs text-[var(--foreground)]/30">
            {isAdmin && !enabled && (
              <span className="inline-flex items-center gap-1 text-orange-400 font-medium mr-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
                Oculto para clientes
              </span>
            )}
            {section.items.length} preguntas sobre esta sección
          </p>
        </div>
      </div>
    </>
  );
}
