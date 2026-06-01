"use client";

import { useState } from "react";
import Link from "next/link";
import {
  PROCESSES, COMO_USAR, CLIENTE_IDEAL, QUIEN_COLOR, PlaybookProcess,
} from "@/lib/crm/playbook";

function QuienBadge({ quien }: { quien: keyof typeof QUIEN_COLOR }) {
  return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
      style={{ background: `${QUIEN_COLOR[quien]}22`, color: QUIEN_COLOR[quien] }}>
      {quien}
    </span>
  );
}

function ProcessCard({ proc, open, onToggle }: { proc: PlaybookProcess; open: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden" style={{ background: "var(--card)" }}>
      {/* Cabecera */}
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left hover:bg-[var(--border)]/10 transition-colors">
        <span className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black text-white flex-shrink-0"
          style={{ background: proc.color }}>
          {proc.id}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold">{proc.nombre}</h3>
          <p className="text-xs text-[var(--foreground)]/50 truncate">{proc.objetivo}</p>
        </div>
        <span className="text-[var(--foreground)]/30 text-lg flex-shrink-0">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-[var(--border)] pt-4 space-y-4">
          {/* Trigger / Output */}
          <div className="grid sm:grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg p-2.5" style={{ background: "var(--background)" }}>
              <p className="text-[var(--foreground)]/40 mb-0.5">Cuándo empieza</p>
              <p className="text-[var(--foreground)]/80">{proc.trigger}</p>
            </div>
            <div className="rounded-lg p-2.5" style={{ background: "var(--background)" }}>
              <p className="text-[var(--foreground)]/40 mb-0.5">Qué produce</p>
              <p className="text-[var(--foreground)]/80">{proc.output}</p>
            </div>
          </div>

          {/* Pasos */}
          <div className="space-y-2">
            {proc.pasos.map(paso => (
              <div key={paso.n} className="flex gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{ background: "var(--background)", color: proc.color, border: `1.5px solid ${proc.color}` }}>
                  {paso.n}
                </span>
                <div className="flex-1 min-w-0 rounded-lg border border-[var(--border)] p-3" style={{ background: "var(--background)" }}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-sm font-semibold">{paso.titulo}</h4>
                    <QuienBadge quien={paso.quien} />
                  </div>
                  <p className="text-xs text-[var(--foreground)]/70 leading-relaxed">{paso.que}</p>
                  {paso.como && (
                    <p className="text-[11px] text-[var(--foreground)]/50 mt-1 leading-relaxed">{paso.como}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {paso.recurso && (
                      <Link href="/admin/crm/recursos"
                        className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--brand-1)]/40 text-[var(--brand-1)] hover:bg-[var(--brand-1)]/10 transition-colors">
                        📄 {paso.recurso}
                      </Link>
                    )}
                    <span className="text-[10px] text-green-500">→ {paso.resultado}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* KPIs */}
          <div className="rounded-lg p-3" style={{ background: "var(--background)" }}>
            <p className="text-[10px] uppercase tracking-wide text-[var(--foreground)]/40 mb-2">Qué medir en este proceso</p>
            <div className="grid sm:grid-cols-3 gap-2">
              {proc.kpis.map((k, i) => (
                <div key={i} className="text-xs">
                  <p className="text-[var(--foreground)]/60">{k.label}</p>
                  <p className="font-bold" style={{ color: proc.color }}>{k.objetivo}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CrmPlaybookPage() {
  const [openId, setOpenId] = useState<string | null>("P1");

  return (
    <div className="max-w-[900px] mx-auto pb-12">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/admin/crm/pipeline" className="text-sm text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors">← Pipeline</Link>
      </div>

      <div className="mb-6">
        <h1 className="text-xl font-bold">Playbook comercial</h1>
        <p className="text-sm text-[var(--foreground)]/50 mt-0.5">El flujo completo paso a paso. Si tienes dudas de qué hacer, está aquí.</p>
      </div>

      {/* Cliente ideal */}
      <div className="rounded-xl border border-[var(--border)] p-5 mb-5" style={{ background: "var(--card)" }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--brand-1)]">Cliente ideal</span>
          <span className="text-sm font-bold">{CLIENTE_IDEAL.nombre}</span>
        </div>
        <p className="text-sm text-[var(--foreground)]/70 mb-2">{CLIENTE_IDEAL.resumen}</p>
        <p className="text-xs text-[var(--foreground)]/50 italic mb-3">&ldquo;{CLIENTE_IDEAL.dolorClave}&rdquo;</p>
        <div className="flex flex-wrap gap-1.5">
          {CLIENTE_IDEAL.señales.map((s, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--background)", color: "var(--foreground)" }}>
              ✓ {s}
            </span>
          ))}
        </div>
      </div>

      {/* Cómo usar esto */}
      <div className="rounded-xl border border-[var(--border)] p-5 mb-6" style={{ background: "var(--card)" }}>
        <h2 className="text-sm font-semibold mb-2">Cómo usar este playbook</h2>
        <ol className="space-y-1.5">
          {COMO_USAR.map((c, i) => (
            <li key={i} className="text-xs text-[var(--foreground)]/70 flex gap-2 leading-relaxed">
              <span className="text-[var(--brand-1)] font-bold flex-shrink-0">{i + 1}.</span>
              <span>{c}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Línea del flujo */}
      <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-2">
        {PROCESSES.map((p, i) => (
          <div key={p.id} className="flex items-center flex-shrink-0">
            <button onClick={() => setOpenId(p.id)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors"
              style={{
                borderColor: openId === p.id ? p.color : "var(--border)",
                background: openId === p.id ? `${p.color}15` : "transparent",
              }}>
              <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
              <span className="text-[11px] font-semibold whitespace-nowrap">{p.id} {p.nombre}</span>
            </button>
            {i < PROCESSES.length - 1 && <span className="text-[var(--foreground)]/20 mx-0.5">→</span>}
          </div>
        ))}
      </div>

      {/* Procesos */}
      <div className="space-y-3">
        {PROCESSES.map(proc => (
          <ProcessCard key={proc.id} proc={proc}
            open={openId === proc.id}
            onToggle={() => setOpenId(openId === proc.id ? null : proc.id)} />
        ))}
      </div>
    </div>
  );
}
