"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getHelpSection, getHelpSlug, HelpSection, HELP_CONTENT } from "@/lib/help-content";
import Link from "next/link";

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
  const [activeTab, setActiveTab] = useState<"guide" | "faq">("faq");
  const [showPulse, setShowPulse] = useState(false);

  // ── Contenido dinámico (cargado desde la API al primer uso) ──────────────
  const [dynamicContent, setDynamicContent] = useState<Record<string, HelpSection> | null>(null);
  const contentLoaded = useRef(false);

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

  // ── Carga contenido dinámico al abrir por primera vez ────────────────────
  useEffect(() => {
    if (!open || contentLoaded.current) return;
    contentLoaded.current = true;
    fetch("/api/admin/help-content")
      .then(r => r.json())
      .then(json => {
        if (json.content) {
          setDynamicContent(json.content);
        }
      })
      .catch(() => {}); // silencioso — usa defaults
  }, [open]);

  // ── Sección: cambio por ruta o por contenido dinámico ────────────────────
  useEffect(() => {
    const slug = getHelpSlug(pathname);
    const src  = dynamicContent ?? HELP_CONTENT;
    const newSection = src[slug] ?? src["como-funciona"] ?? getHelpSection(pathname);
    setSection(newSection);
    setExpIdx(null);

    // Si la sección tiene guía, seleccionar esa pestaña por defecto
    if (newSection.guide) {
      setActiveTab("guide");
      // Pulso proactivo: una sola vez por sección por sesión
      try {
        const key = `konecta-guide-seen-${slug}`;
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1");
          setShowPulse(true);
          const t = setTimeout(() => setShowPulse(false), 6000);
          return () => clearTimeout(t);
        }
      } catch { /* ignora errores de sessionStorage */ }
    } else {
      setActiveTab("faq");
      setShowPulse(false);
    }
  }, [pathname, dynamicContent]);

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

  // ── Etiqueta dinámica: muestra la sección actual y cuántas preguntas tiene ──
  const helpCount = section.items.length;
  const helpSectionLabel = section.title.replace(/^Tu /, "tu ");

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
          background:  showPulse ? "var(--brand-4)" : "var(--brand-1)",
          color:       showPulse ? "#000000" : "#ffffff",
          boxShadow:   showPulse
            ? "0 0 0 4px rgba(197,160,98,0.25), 0 2px 10px rgba(0,0,0,0.18)"
            : "0 2px 10px rgba(0,0,0,0.18)",
          cursor:      dragging ? "grabbing" : "grab",
          transition:  dragging ? "none" : "background 0.3s, color 0.3s, box-shadow 0.3s",
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
        <span className="text-sm leading-none font-bold">{showPulse ? "★" : "?"}</span>
        {/* Escritorio */}
        {showPulse ? (
          <span className="hidden sm:inline whitespace-nowrap font-bold">Guía disponible — ábrela</span>
        ) : (
          <span className="hidden sm:inline whitespace-nowrap">Dudas de {helpSectionLabel} · {helpCount}</span>
        )}
        {/* Móvil */}
        {showPulse ? (
          <span className="sm:hidden whitespace-nowrap font-bold">Guía</span>
        ) : (
          <span className="sm:hidden whitespace-nowrap">Dudas · {helpCount}</span>
        )}

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

        {/* Pestañas — solo si la sección tiene guía */}
        {section.guide && (
          <div
            className="flex gap-1 px-4 pt-3 pb-2 flex-shrink-0"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("guide")}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
              style={{
                background: activeTab === "guide" ? "var(--brand-1)" : "transparent",
                color:      activeTab === "guide" ? "#fff" : "var(--foreground)",
                opacity:    activeTab === "guide" ? 1 : 0.5,
              }}
            >
              Guía rápida
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("faq")}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
              style={{
                background: activeTab === "faq" ? "var(--brand-1)" : "transparent",
                color:      activeTab === "faq" ? "#fff" : "var(--foreground)",
                opacity:    activeTab === "faq" ? 1 : 0.5,
              }}
            >
              Preguntas · {section.items.length}
            </button>
          </div>
        )}

        {/* Cuerpo con scroll */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Pestaña: Guía rápida ── */}
          {activeTab === "guide" && section.guide && (
            <div className="px-4 pt-4 pb-6 space-y-3">
              <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)", opacity: 0.6 }}>
                {section.guide.intro}
              </p>
              {section.guide.steps.map((s) => (
                <div
                  key={s.step}
                  className="rounded-xl p-4"
                  style={{ border: "1px solid var(--border)", background: "var(--background)" }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                      style={{ background: "var(--brand-1)", color: "#fff" }}
                    >
                      {s.step}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">{s.title}</div>
                      <div className="text-xs mt-1 leading-relaxed" style={{ color: "var(--foreground)", opacity: 0.6 }}>
                        {s.description}
                      </div>
                      {s.tip && (
                        <div
                          className="text-xs mt-2 px-2.5 py-1.5 rounded-lg leading-relaxed"
                          style={{ background: "rgba(197,160,98,0.12)", color: "var(--brand-4)" }}
                        >
                          💡 {s.tip}
                        </div>
                      )}
                      {s.href && (
                        <Link
                          href={s.href}
                          onClick={() => setOpen(false)}
                          className="inline-block mt-2.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-80"
                          style={{ background: "var(--brand-4)", color: "#000" }}
                        >
                          {s.hrefLabel ?? "Ir →"}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Pestaña: Preguntas frecuentes ── */}
          {(!section.guide || activeTab === "faq") && (
            <>
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
            </>
          )}
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
