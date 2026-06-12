"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";

const KONECTA_MENSUAL = 99;
const KONECTA_ANUAL = KONECTA_MENSUAL * 12;

type Periodo = "mensual" | "trimestral" | "anual";

const PERIODO_MULT: Record<Periodo, number> = { mensual: 12, trimestral: 4, anual: 1 };
const PERIODO_LABELS: Record<Periodo, string> = { mensual: "mes", trimestral: "trimestre", anual: "año" };

function fmt(n: number) {
  return n.toLocaleString("es-ES", { maximumFractionDigits: 0 });
}

function isValidPeriodo(p: string | null): p is Periodo {
  return p === "mensual" || p === "trimestral" || p === "anual";
}

function Parametro({
  label, value, onChange, suffix, min, max,
}: {
  label: string; value: string; onChange: (v: string) => void;
  suffix?: string; min?: number; max?: number;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>
        {label}
      </p>
      <div className="flex items-baseline gap-1">
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          min={min ?? 0}
          max={max}
          className="bg-transparent text-2xl font-bold w-full focus:outline-none border-b-2 border-transparent focus:border-[#C5A059]/60 transition-colors pb-0.5 appearance-none"
          style={{ color: "#fff" }}
        />
        {suffix && (
          <span className="text-base font-semibold" style={{ color: "rgba(255,255,255,0.45)" }}>{suffix}</span>
        )}
      </div>
    </div>
  );
}

export default function CalculadoraPublica() {
  const params = useSearchParams();

  const rawPeriodo = params.get("p");
  const nombre = params.get("n") ?? "";

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
      v, i, c, t, f, ticketAnual,
      interesadosPorFeria, captadosPorFeria, perdidosPorFeria,
      dineroPorFeria, dineroAnual, clientesNecesarios, paybackLabel,
    };
  }, [visitantes, interes, captados, ticket, ferias, periodo]);

  const hasDatos = r.v > 0 && r.t > 0;

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0B", color: "#fff" }}>

      {/* Header */}
      <div className="px-6 pt-10 pb-7 text-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <p className="text-[11px] font-semibold tracking-widest uppercase mb-3" style={{ color: "#C5A059" }}>
          Konecta3D
        </p>
        {nombre ? (
          <>
            <h1 className="text-xl font-bold leading-snug">Lo que pierdes en ferias,</h1>
            <h1 className="text-xl font-bold leading-snug" style={{ color: "#C5A059" }}>{nombre}</h1>
          </>
        ) : (
          <h1 className="text-xl font-bold leading-snug">Lo que pierdes en cada feria</h1>
        )}
        <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>
          Cambia cualquier dato y el cálculo se actualiza al momento
        </p>
      </div>

      <div className="max-w-lg mx-auto px-5 py-7 space-y-6">

        {/* Inputs — tus datos */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-5" style={{ color: "rgba(255,255,255,0.3)" }}>
            Tus datos
          </p>

          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <Parametro
              label="Visitantes por feria"
              value={visitantes} onChange={setVisitantes} min={0}
            />
            <Parametro
              label="Ferias al año"
              value={ferias} onChange={setFerias} min={1}
            />
            <Parametro
              label="% muestran interés"
              value={interes} onChange={setInteres} suffix="%" min={0} max={100}
            />
            <Parametro
              label="% dejan sus datos"
              value={captados} onChange={setCaptados} suffix="%" min={0} max={100}
            />
          </div>

          {/* Ticket + periodo */}
          <div className="mt-5 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
              Valor de un cliente
            </p>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    value={ticket}
                    onChange={e => setTicket(e.target.value)}
                    min={0}
                    className="bg-transparent text-2xl font-bold w-full focus:outline-none border-b-2 border-transparent focus:border-[#C5A059]/60 transition-colors pb-0.5"
                    style={{ color: "#fff" }}
                  />
                  <span className="text-base font-semibold" style={{ color: "rgba(255,255,255,0.45)" }}>€</span>
                </div>
              </div>
              <div className="flex gap-1 pb-0.5">
                {(["mensual", "trimestral", "anual"] as Periodo[]).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriodo(p)}
                    className="px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-colors"
                    style={{
                      borderColor: periodo === p ? "#C5A059" : "rgba(255,255,255,0.12)",
                      background: periodo === p ? "rgba(197,160,89,0.15)" : "transparent",
                      color: periodo === p ? "#C5A059" : "rgba(255,255,255,0.35)",
                    }}
                  >
                    {p === "mensual" ? "mes" : p === "trimestral" ? "trim." : "año"}
                  </button>
                ))}
              </div>
            </div>
            {periodo !== "anual" && r.t > 0 && (
              <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                = {fmt(r.ticketAnual)} € en el primer año
              </p>
            )}
          </div>
        </div>

        {/* Desglose — el razonamiento */}
        {hasDatos && (
          <div
            className="rounded-2xl p-5 space-y-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: "rgba(255,255,255,0.3)" }}>
              Cómo se calcula
            </p>

            {/* Paso 1 */}
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>1</span>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
                <strong className="text-white">{fmt(r.v)}</strong> personas pasan por tu stand en cada feria
              </p>
            </div>

            <div className="ml-3 border-l" style={{ borderColor: "rgba(255,255,255,0.1)", paddingLeft: "1.25rem" }}>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                el {r.i}% muestra interés real
              </p>
            </div>

            {/* Paso 2 */}
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>2</span>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
                <strong className="text-white">{fmt(r.interesadosPorFeria)}</strong> personas hablan contigo y preguntan
              </p>
            </div>

            <div className="ml-3 border-l" style={{ borderColor: "rgba(255,255,255,0.1)", paddingLeft: "1.25rem" }}>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                solo el {r.c}% deja sus datos ese mismo día
              </p>
            </div>

            {/* Paso 3 — el agujero */}
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                style={{ background: "rgba(239,68,68,0.2)", color: "#f87171" }}>3</span>
              <div>
                <p className="text-sm leading-relaxed">
                  <strong className="text-white">{fmt(r.captadosPorFeria)}</strong>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}> captados</span>
                  <span style={{ color: "rgba(255,255,255,0.35)" }}> — pero </span>
                  <strong style={{ color: "#f87171" }}>{fmt(r.perdidosPorFeria)} se van sin contacto</strong>
                </p>
              </div>
            </div>

            {/* Cálculo del dinero */}
            <div
              className="mt-2 rounded-xl p-4 space-y-1.5"
              style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
            >
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                {fmt(r.perdidosPorFeria)} contactos × {fmt(r.ticketAnual)} €
                {periodo !== "anual" && (
                  <span> ({ticket} €/{PERIODO_LABELS[periodo]} × {PERIODO_MULT[periodo]})</span>
                )}{" "}
                = <strong style={{ color: "rgba(248,113,113,0.9)" }}>{fmt(r.dineroPorFeria)} €</strong>
                <span style={{ color: "rgba(255,255,255,0.3)" }}> por feria</span>
              </p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                {fmt(r.dineroPorFeria)} € × {r.f} feria{r.f !== 1 ? "s" : ""}{" "}
                ={" "}
                <strong style={{ color: "#f87171" }}>{fmt(r.dineroAnual)} € al año</strong>
              </p>
            </div>
          </div>
        )}

        {/* Número protagonista */}
        <div
          className="rounded-2xl p-7 text-center"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}
        >
          <p className="text-sm font-medium mb-3" style={{ color: "rgba(248,113,113,0.75)" }}>
            Cada año, tus ferias te cuestan
          </p>
          <p
            className="font-black leading-none tracking-tight"
            style={{ fontSize: "clamp(3rem,16vw,5rem)", color: "#f87171" }}
          >
            {hasDatos ? `${fmt(r.dineroAnual)} €` : "—"}
          </p>
          {hasDatos && r.dineroAnual > 0 && (
            <p className="text-xs mt-3" style={{ color: "rgba(248,113,113,0.5)" }}>
              en clientes que ya vieron tu stand y no pudiste contactar
            </p>
          )}
        </div>

        {/* ROI */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)" }}
        >
          <p className="text-sm font-medium mb-3" style={{ color: "rgba(74,222,128,0.8)" }}>
            Con Konecta3D — 99 €/mes
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
            Con un ticket de{" "}
            <strong className="text-white">
              {ticket} €/{PERIODO_LABELS[periodo]}
            </strong>
            {periodo !== "anual" && (
              <span style={{ color: "rgba(255,255,255,0.4)" }}> ({fmt(r.ticketAnual)} €/año)</span>
            )}
            , necesitas recuperar{" "}
            <strong style={{ color: "#4ade80" }}>
              {hasDatos && r.clientesNecesarios > 0
                ? r.clientesNecesarios < 1 ? "menos de 1 cliente" : `${Math.ceil(r.clientesNecesarios)} clientes`
                : "—"}
            </strong>{" "}
            al año para que la plataforma se pague sola.
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

        <div className="text-center pt-2 pb-4">
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.18)" }}>
            Konecta3D · Plataforma de captación en ferias
          </p>
        </div>
      </div>
    </div>
  );
}
