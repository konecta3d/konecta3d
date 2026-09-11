"use client";

import { useState } from "react";
import { CONTEXT_BLOCK_GUIDE } from "@/lib/context-guide";

// Intro plegable "¿Por qué este bloque y cómo se usa?" que se muestra encima de
// los campos de cada bloque de contexto. Los textos viven en context-guide.ts.

export default function ContextBlockIntro({ blockKey }: { blockKey: string }) {
  const [open, setOpen] = useState(false);
  const guide = CONTEXT_BLOCK_GUIDE[blockKey];
  if (!guide) return null;

  return (
    <div className="mb-4 rounded-lg border border-[var(--brand-1)]/30 bg-[var(--brand-1)]/5 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-[var(--brand-1)] hover:bg-[var(--brand-1)]/10 transition-colors cursor-pointer"
      >
        {/* icono de información */}
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-left">¿Por qué este bloque y cómo se usa?</span>
        {/* pista clara de que es desplegable */}
        <span className="ml-auto flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide">
          {open ? "Ocultar" : "Ver más"}
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 space-y-2 text-xs leading-relaxed text-[var(--foreground)]/75 border-t border-[var(--brand-1)]/15">
          <p className="pt-2">
            <strong className="text-[var(--foreground)]">Por qué:</strong> {guide.porque}
          </p>
          <p>
            <strong className="text-[var(--foreground)]">Cómo se usa:</strong> {guide.como}
          </p>
        </div>
      )}
    </div>
  );
}
