"use client";

import { useState } from "react";
import Link from "next/link";
import { LAUNCH_FUNNEL, LaunchStage } from "@/lib/crm/launch-funnel";

function StageDetail({ stage }: { stage: LaunchStage }) {
  return (
    <div className="space-y-5">
      {/* Cabecera de la etapa */}
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-black text-white flex-shrink-0" style={{ background: stage.color }}>
          {stage.id}
        </span>
        <div>
          <h2 className="text-lg font-bold">{stage.nombre}</h2>
          <p className="text-sm text-[var(--foreground)]/60">{stage.proposito}</p>
        </div>
      </div>

      {/* Objetivos */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/40">Objetivos</h3>
        {stage.objetivos.map((o, i) => (
          <div key={i} className="rounded-xl border border-[var(--border)] p-4" style={{ background: "var(--card)" }}>
            <div className="flex items-start gap-2 mb-2">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5" style={{ background: `${stage.color}22`, color: stage.color }}>{i + 1}</span>
              <p className="text-sm font-semibold text-[var(--foreground)]">{o.texto}</p>
            </div>
            <div className="ml-7 space-y-2">
              <div className="rounded-lg p-3 text-xs text-[var(--foreground)]/70 leading-relaxed" style={{ background: "var(--background)" }}>
                <span className="text-[10px] uppercase tracking-wide text-[var(--foreground)]/40 block mb-1">Mensaje</span>
                {o.mensaje}
              </div>
              <div className="flex items-start gap-1.5 text-xs">
                <span className="text-green-500 font-bold flex-shrink-0">✓</span>
                <span className="text-[var(--foreground)]/60"><span className="text-[10px] uppercase tracking-wide text-[var(--foreground)]/40">Check: </span>{o.check}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fases (solo onboarding) */}
      {stage.fases && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/40">Fases del onboarding</h3>
          {stage.fases.map((f, i) => (
            <div key={i} className="rounded-xl border border-[var(--border)] p-3 flex gap-3" style={{ background: "var(--card)" }}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5" style={{ background: "var(--background)", color: stage.color, border: `1.5px solid ${stage.color}` }}>{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-sm font-semibold">{f.nombre}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--border)]/40 text-[var(--foreground)]/60">{f.seccion}</span>
                </div>
                <p className="text-xs text-[var(--foreground)]/60 mt-1">{f.objetivo}</p>
                <div className="flex items-start gap-1.5 text-[11px] mt-1.5">
                  <span className="text-green-500 font-bold flex-shrink-0">✓</span>
                  <span className="text-[var(--foreground)]/50">{f.check}</span>
                </div>
                <p className="text-[10px] text-[var(--foreground)]/40 mt-1">📄 {f.documento}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Documentos */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/40 mb-2">Documentos</h3>
        <div className="flex flex-wrap gap-2">
          {stage.documentos.map((d, i) => (
            <span key={i} className="text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5"
              style={{
                borderColor: d.estado === "existe" ? "rgba(34,197,94,0.4)" : "var(--border)",
                background: d.estado === "existe" ? "rgba(34,197,94,0.08)" : "transparent",
              }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: d.estado === "existe" ? "#22c55e" : "#94a3b8" }} />
              {d.nombre}
              <span className="text-[10px] text-[var(--foreground)]/40">{d.estado === "existe" ? "listo" : "por crear"}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RecorridoClientePage() {
  const [selectedId, setSelectedId] = useState(1);
  const stage = LAUNCH_FUNNEL.find(s => s.id === selectedId)!;

  const totalDocs = LAUNCH_FUNNEL.flatMap(s => s.documentos);
  const docsListos = totalDocs.filter(d => d.estado === "existe").length;

  return (
    <div className="max-w-[1000px] mx-auto pb-12">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/admin/crm/pipeline" className="text-sm text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors">← CRM</Link>
      </div>

      <div className="mb-6">
        <h1 className="text-xl font-bold">Recorrido del cliente</h1>
        <p className="text-sm text-[var(--foreground)]/50 mt-0.5">
          El embudo de lanzamiento completo · {docsListos}/{totalDocs.length} documentos listos
          <span className="ml-2 text-[var(--foreground)]/30 italic">(prototipo — solo visualización)</span>
        </p>
      </div>

      {/* Flujo de etapas */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
        {LAUNCH_FUNNEL.map((s, i) => (
          <div key={s.id} className="flex items-center flex-shrink-0">
            <button onClick={() => setSelectedId(s.id)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors"
              style={{
                borderColor: selectedId === s.id ? s.color : "var(--border)",
                background: selectedId === s.id ? `${s.color}15` : "transparent",
              }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: s.color }}>{s.id}</span>
              <span className="text-[11px] font-semibold whitespace-nowrap">{s.nombre}</span>
            </button>
            {i < LAUNCH_FUNNEL.length - 1 && <span className="text-[var(--foreground)]/20 mx-0.5">→</span>}
          </div>
        ))}
      </div>

      {/* Detalle de la etapa seleccionada */}
      <StageDetail stage={stage} />

      {/* Nota del prototipo */}
      <div className="mt-8 rounded-xl border border-dashed border-[var(--border)] p-4 text-center">
        <p className="text-xs text-[var(--foreground)]/50">
          Esto es el prototipo de visualización. Si el aspecto te encaja, el siguiente paso es
          hacerlo <strong>editable</strong> y añadir el <strong>tracker por cliente</strong>
          (ver el estado de cada negocio en cada etapa).
        </p>
      </div>
    </div>
  );
}
