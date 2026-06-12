"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";

const KONECTA_MENSUAL = 99;
const KONECTA_ANUAL = KONECTA_MENSUAL * 12;

type Periodo = "mensual" | "trimestral" | "anual";

const PERIODO_MULT: Record<Periodo, number> = { mensual: 12, trimestral: 4, anual: 1 };
const PERIODO_LABELS: Record<Periodo, string> = { mensual: "Mensual", trimestral: "Trimestral", anual: "Anual" };

function fmt(n: number) {
  return n.toLocaleString("es-ES", { maximumFractionDigits: 0 });
}

function isValidPeriodo(p: string | null): p is Periodo {
  return p === "mensual" || p === "trimestral" || p === "anual";
}

export default function CalculadoraPublica() {
  const params = useSearchParams();

  const rawPeriodo = params.get("p");
  const [visitantes, setVisitantes] = useState(params.get("v") ?? "150");
  const [interes, setInteres]       = useState(params.get("i") ?? "20");
  const [captados, setCaptados]     = useState(params.get("c") ?? "10");
  const [ticket, setTicket]         = useState(params.get("t") ?? "800");
  const [ferias, setFerias]         = useState(params.get("f") ?? "3");
  const [periodo, setPeriodo]       = useState<Periodo>(isValidPeriodo(rawPeriodo) ? rawPeriodo : "anual");

  const r = useMemo(() => {
    const v = Math.max(0, Number(visitantes) || 0);
    const i = Math.min(100, Math.max(0, Number(interes) || 0));
    const c = Math.min(100, Math.max(0, Number(captados) || 0));
    const t = Math.max(0, Number(ticket) || 0);
    const f = Math.max(1, Number(ferias) || 1);
    const ticketAnual = t * PERIODO_MULT[periodo];

    const interesadosPorFeria = Math.round(v * (i / 100));
    const captadosPorFeria    = Math.round(interesadosPorFeria * (c / 100));
    const perdidosPorFeria    = interesadosPorFeria - captadosPorFeria;
    const dineroPorFeria      = perdidosPorFeria * ticketAnual;
    const dineroAnual         = dineroPorFeria * f;

    const clientesNecesarios = ticketAnual > 0 ? KONECTA_ANUAL / ticketAnual : 0;
    const clientesPorFeria   = clientesNecesarios / f;

    let paybackLabel = "";
    if (clientesPorFeria < 0.15)      paybackLabel = "menos de 1 cliente cada 10 ferias";
    else if (clientesPorFeria < 0.34) paybackLabel = "1 cliente cada 3 ferias";
    else if (clientesPorFeria < 0.5)  paybackLabel = "1 cliente cada 2 ferias";
    else if (clientesPorFeria < 1)    paybackLabel = "menos de 1 cliente por feria";
    else                              paybackLabel = `${Math.ceil(clientesPorFeria)} clientes por feria`;

    return {
      interesadosPorFeria, captadosPorFeria, perdidosPorFeria,
      dineroPorFeria, dineroAnual, clientesNecesarios, paybackLabel,
    };
  }, [visitantes, interes, captados, ticket, ferias, periodo]);

  const hasDatos = Number(visitantes) > 0 && Number(ticket) > 0;
  const ticketAnual = Number(ticket) * PERIODO_MULT[periodo];

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0B", color: "#fff" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }} className="px-6 pt-10 pb-6 text-center">
        <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "#C5A059" }}>
          Konecta3D
        </p>
        <h1 className="text-lg font-bold">Calculadora de impacto en ferias</h1>
        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
          Estos son los números de tu negocio
        </p>
      </div>

      <div className="max-w-lg mx-auto px-5 py-8 space-y-5">

        {/* Número rojo — protagonista */}
        <div
          className="rounded-2xl p-6 text-center"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}
        >
          <p className="text-sm font-medium mb-3" style={{ color: "rgba(248,113,113,0.8)" }}>
            Cada año, tus ferias te cuestan
          </p>
          <p className="font-black leading-none" style={{ fontSize: "clamp(3rem,15vw,4.5rem)", color: "#f87171" }}>
            {hasDatos ? `${fmt(r.dineroAnual)} €` : "—"}
          </p>
          {hasDatos && r.dineroAnual > 0 && (
            <p className="text-xs mt-3" style={{ color: "rgba(248,113,113,0.6)" }}>
              {fmt(r.perdidosPorFeria)} personas se van de tu stand sin dejar contacto
              <br />
              {fmt(r.dineroPorFeria)} € por feria × {ferias} ferias al año
            </p>
          )}
        </div>

        {/* Desglose por feria */}
        {hasDatos && (
          <div
            className="rounded-2xl p-5"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
              Por feria
            </p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold">{fmt(r.interesadosPorFeria)}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Muestran interés</p>
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: "#4ade80" }}>{fmt(r.captadosPorFeria)}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Captados hoy</p>
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: "#f87171" }}>{fmt(r.perdidosPorFeria)}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Sin contacto</p>
              </div>
            </div>
          </div>
        )}

        {/* ROI */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)" }}
        >
          <p className="text-sm font-medium mb-3" style={{ color: "rgba(74,222,128,0.8)" }}>
            Con Konecta3D — 99 €/mes
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
            Con un ticket de <strong style={{ color: "#fff" }}>{ticket} €</strong>
            {periodo !== "anual" && (
              <span> ({fmt(ticketAnual)} €/año)</span>
            )}{" "}
            necesitas recuperar{" "}
            <strong style={{ color: "#4ade80" }}>
              {hasDatos && r.clientesNecesarios > 0
                ? r.clientesNecesarios < 1
                  ? "menos de 1 cliente"
                  : `${Math.ceil(r.clientesNecesarios)} clientes`
                : "—"}
            </strong>{" "}
            al año para que Konecta3D se pague solo.
          </p>
          {hasDatos && r.clientesNecesarios > 0 && (
            <div
              className="mt-3 rounded-xl py-2.5 px-3 text-center"
              style={{ background: "rgba(34,197,94,0.12)" }}
            >
              <p className="text-sm font-semibold" style={{ color: "#4ade80" }}>
                {r.paybackLabel}
              </p>
            </div>
          )}
        </div>

        {/* Ajustar datos */}
        <details className="group">
          <summary
            className="text-xs cursor-pointer select-none list-none flex items-center gap-2 py-1"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            <span className="group-open:rotate-90 transition-transform inline-block text-[10px]">▶</span>
            Ajustar los datos del cálculo
          </summary>

          <div
            className="mt-3 rounded-2xl p-5 space-y-4"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {/* Period selector */}
            <div>
              <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>Valor del cliente — periodo</p>
              <div className="flex gap-1">
                {(["mensual", "trimestral", "anual"] as Periodo[]).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriodo(p)}
                    className="flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors"
                    style={{
                      borderColor: periodo === p ? "#C5A059" : "rgba(255,255,255,0.12)",
                      background: periodo === p ? "rgba(197,160,89,0.12)" : "transparent",
                      color: periodo === p ? "#C5A059" : "rgba(255,255,255,0.4)",
                    }}
                  >
                    {PERIODO_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>

            {[
              { label: "Visitantes por feria", val: visitantes, set: setVisitantes, suffix: "" },
              { label: "% interés real", val: interes, set: setInteres, suffix: "%" },
              { label: "% que dejan datos hoy", val: captados, set: setCaptados, suffix: "%" },
              { label: `Valor cliente (${periodo})`, val: ticket, set: setTicket, suffix: "€" },
              { label: "Ferias al año", val: ferias, set: setFerias, suffix: "" },
            ].map(({ label, val, set, suffix }) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <label className="text-xs flex-1" style={{ color: "rgba(255,255,255,0.55)" }}>{label}</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={val}
                    onChange={e => set(e.target.value)}
                    className="w-20 px-2 py-1.5 rounded-lg text-sm font-medium text-right focus:outline-none"
                    style={{
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.06)",
                      color: "#fff",
                    }}
                  />
                  {suffix && (
                    <span className="text-xs w-4" style={{ color: "rgba(255,255,255,0.35)" }}>{suffix}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </details>

        {/* Footer */}
        <div className="text-center pt-4 pb-2">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
            Calculadora de impacto · Konecta3D
          </p>
        </div>
      </div>
    </div>
  );
}
