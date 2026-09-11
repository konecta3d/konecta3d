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
    <div className="mb-4 rounded-lg border border-[var(--brand-1)]/25 bg-[var(--brand-1)]/5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-[var(--brand-1)]"
      >
        <span>¿Por qué este bloque y cómo se usa?</span>
        <span className="text-sm leading-none">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2 text-xs leading-relaxed text-[var(--foreground)]/75">
          <p>
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
