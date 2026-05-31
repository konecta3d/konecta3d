"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getHelpSection, HelpSection } from "@/lib/help-content";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface HelpDrawerProps {
  enabled: boolean;
  isAdmin: boolean;
}

interface Pos { x: number; y: number }

// Posición por defecto (arriba-izquierda del área de contenido)
const DEFAULT_POS: Pos = { x: 296, y: 12 };
const STORAGE_KEY = "konecta-help-btn-pos";

// Mantiene el botón dentro de los límites de la ventana
function clamp(pos: Pos, btnW = 110, btnH = 36): Pos {
  return {
    x: Math.max(4, Math.min(window.innerWidth  - btnW - 4, pos.x)),
    y: Math.max(4, Math.min(window.innerHeight - btnH - 4, pos.y)),
  };
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function HelpDrawer({ enabled, isAdmin }: HelpDrawerProps) {
  const pathname = usePathname();

  // ── Drawer state ──────────────────────────────────────────────────────────
  const [open, setOpen]           = useState(false);
  const [expandedIndex, setExpIdx] = useState<number | null>(null);
  const [section, setSection]     = useState<HelpSection>(getHelpSection(pathname));

  // ── Drag state ────────────────────────────────────────────────────────────
  const [pos, setPos]         = useState<Pos | null>(null); // null = usa default
  const [dragging, setDragging] = useState(false);
  const dragOffset  = useRef<Pos>({ x: 0, y: 0 });
  const didMove     = useRef(false); // distingue click de drag
  const btnRef      = useRef<HTMLButtonElement>(null);

  // ── Init: cargar posición guardada ────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPos(clamp(JSON.parse(raw)));
    } catch {
      // ignora errores de localStorage (SSR, privado)
    }
  }, []);

  // ── Sección: cambio por ruta ──────────────────────────────────────────────
  useEffect(() => {
    setSection(getHelpSection(pathname));
    setExpIdx(null);
  }, [pathname]);

  // ── Tecla Escape ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open]);

  // ── Scroll lock ───────────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // ── Drag: eventos globales durante el arrastre ────────────────────────────
  useEffect(() => {
    if (!dragging) return;

    const onMouseMove = (e: MouseEvent) => {
      didMove.current = true;
      setPos(clamp({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y }));
    };
    const onMouseUp = () => {
      setDragging(false);
      setPos(prev => {
        if (prev) {
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prev)); } catch {}
        }
        return prev;
      });
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      didMove.current = true;
      setPos(clamp({ x: e.touches[0].clientX - dragOffset.current.x, y: e.touches[0].clientY - dragOffset.current.y }));
    };
    const onTouchEnd = () => onMouseUp();

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [dragging]);

  // ── Visibilidad ───────────────────────────────────────────────────────────
  const shouldShow = isAdmin || enabled;
  if (!shouldShow) return null;

  // ── Handlers del botón ────────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    didMove.current = false;
    const rect = btnRef.current?.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - (rect?.left ?? e.clientX),
      y: e.clientY - (rect?.top  ?? e.clientY),
    };
    setDragging(true);
    e.preventDefault(); // evita selección de texto
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    if (!e.touches[0]) return;
    didMove.current = false;
    const rect = btnRef.current?.getBoundingClientRect();
    dragOffset.current = {
      x: e.touches[0].clientX - (rect?.left ?? e.touches[0].clientX),
      y: e.touches[0].clientY - (rect?.top  ?? e.touches[0].clientY),
    };
    setDragging(true);
  };

  const handleClick = () => {
    if (!didMove.current) setOpen(true);
  };

  const toggle = (i: number) => setExpIdx(prev => (prev === i ? null : i));

  // ── Posición efectiva del botón ───────────────────────────────────────────
  const effectivePos = pos ?? DEFAULT_POS;

  return (
    <>
      {/* ── Botón arrastrable ──────────────────────────────────────────────── */}
      <button
        ref={btnRef}
        type="button"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleClick}
        aria-label="Abrir ayuda"
        className="fixed z-40 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold shadow-md select-none"
        style={{
          top:    effectivePos.y,
          left:   effectivePos.x,
          background:  "var(--brand-1)",
          color:       "#ffffff",
          boxShadow:   "0 2px 10px rgba(0,0,0,0.18)",
          cursor:      dragging ? "grabbing" : "grab",
          transition:  dragging ? "none" : "box-shadow 0.15s, opacity 0.15s",
          opacity:     dragging ? 0.85 : 1,
          touchAction: "none",
          userSelect:  "none",
        }}
      >
        {/* Icono de arrastre */}
        <svg
          width="10" height="14" viewBox="0 0 10 14" fill="none"
          className="opacity-50 flex-shrink-0"
          aria-hidden="true"
        >
          <circle cx="2.5" cy="2"  r="1.5" fill="currentColor" />
          <circle cx="7.5" cy="2"  r="1.5" fill="currentColor" />
          <circle cx="2.5" cy="7"  r="1.5" fill="currentColor" />
          <circle cx="7.5" cy="7"  r="1.5" fill="currentColor" />
          <circle cx="2.5" cy="12" r="1.5" fill="currentColor" />
          <circle cx="7.5" cy="12" r="1.5" fill="currentColor" />
        </svg>
        <span className="text-sm leading-none font-bold">?</span>
        <span>Ayuda</span>

        {/* Indicador: oculto para clientes */}
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
          background:  "var(--card)",
          borderLeft:  "1px solid var(--border)",
          boxShadow:   "-8px 0 40px rgba(0,0,0,0.15)",
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
                    border:     `1px solid ${isOpen ? "rgba(10,50,60,0.2)" : "var(--border)"}`,
                    background: isOpen ? "var(--background)" : "transparent",
                  }}
                >
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
                        color:      isOpen ? "#fff" : "var(--foreground)",
                      }}
                    >
                      +
                    </span>
                  </button>

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
            {section.items.length} preguntas · arrastra para mover
          </p>
        </div>
      </div>
    </>
  );
}
