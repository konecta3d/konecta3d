"use client";

import React, { useState } from "react";

interface CollapsibleSectionProps {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function CollapsibleSection({
  title,
  description,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <div className="text-sm font-semibold">{title}</div>
          {description && (
            <p className="mt-1 text-xs text-[var(--brand-1)]">{description}</p>
          )}
        </div>
        <span
          className={`ml-2 px-2 py-0.5 rounded-full border text-[10px] tracking-wide uppercase ${
            open
              ? "border-[var(--border)] text-[var(--brand-1)] bg-transparent"
              : "border-[var(--brand-3)] text-[var(--brand-3)] bg-[var(--brand-3)]/10"
          }`}
        >
          {open ? "Ocultar" : "Mostrar"}
        </span>
      </button>
      {open && <div className="mt-4 space-y-3">{children}</div>}
    </section>
  );
}
