"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";

const KONECTA_MENSUAL = 99;
const KONECTA_ANUAL = KONECTA_MENSUAL * 12;

type Periodo   = "mensual" | "trimestral" | "anual";
type Escenario = "conservador" | "realista" | "optimista";

const PERIODO_MULT:   Record<Periodo,   number> = { mensual: 12, trimestral: 4, anual: 1 };
const PERIODO_LABELS: Record<Periodo,   string> = { mensual: "mes", trimestral: "trimestre", anual: "año" };
const ESCENARIO_PORC: Record<Escenario, number> = { conservador: 0.25, realista: 0.5, optimista: 0.75 };
const ESCENARIO_DESC: Record<Escenario, string> = {
  conservador: "1 de cada 4 que se van",
  realista:    "1 de cada 2 que se van",
  optimista:   "3 de cada 4 que se van",
};

function fmt(n: number) {
  return n.toLocaleString("es-ES", { maximumFractionDigits: 0 });
}

function isValidPeriodo(p: string | null): p is Periodo {
  return p === "mensual" || p === "trimestral" || p === "anual";
}

function hex(color: string, alpha: number): string {
  const h = color.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(128,128,128,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}

function Parametro({
  label, value, onChange, suffix, min, max, color,
}: {
  label: string; value: string; onChange: (v: string) => void;
  suffix?: string; min?: number; max?: number; color: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: hex(color, 0.4) }}>
        {label}
      </p>
      <div className="flex items-baseline gap-1">
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          min={min ?? 0}
          max={max}
          className="bg-transparent text-2xl font-bold w-full focus:outline-none border-b-2 border-transparent transition-colors pb-0.5"
          style={{ color: "#fff", borderBottomColor: "transparent" }}
          onFocus={e => (e.target.style.borderBottomColor = hex(color, 0.5))}
          onBlur={e  => (e.target.style.borderBottomColor = "transparent")}
        />
        {suffix && (
          <span className="text-base font-semibold" style={{ color: hex(color, 0.45) }}>{suffix}</span>
        )}
      </div>
    </div>
  );
}

export default function CalculadoraPublica() {
  const params = useSearchParams();

  const nombre     = params.get("n") ?? "";
  const rawPeriodo = params.get("p");

  // Colores configurables — con defaults
  const colBg   = params.get("bg") ?? "#0a0a0b";
  const colPain = params.get("c1") ?? "#ef4444";
  const colRoi  = params.get("c2") ?? "#22c55e";
  const colPot  = params.get("c3") ?? "#c5a059";

  const [visitantes, setVisitantes] = useState(params.get("v") ?? "150");
  const [interes, setInteres]       = useState(params.get("i") ?? "20");
  const [captados, setCaptados]     = useState(params.get("c") ?? "10");
  const [ticket, setTicket]         = useState(params.get("t") ?? "67");
  const [ferias, setFerias]         = useState(params.get("f") ?? "3");
  const [periodo, setPeriodo]       = useState<Periodo>(isValidPeriodo(rawPeriodo) ? rawPeriodo : "mensual");
  const [escenario, setEscenario]   = useState<Escenario>("realista");

  function changePeriodo(nuevo: Periodo) {
    const anual = Number(ticket) * PERIODO_MULT[periodo];
    setTicket(String(Math.round(anual / PERIODO_MULT[nuevo])));
    setPeriodo(nuevo);
  }

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

  const potencial = useMemo(() => {
    const porc = ESCENARIO_PORC[escenario];
    const recuperadosPorFeria = Math.round(r.perdidosPorFeria * porc);
    const recuperadosAnual    = recuperadosPorFeria * r.f;
    const ingresos            = recuperadosAnual * r.ticketAnual;
    const beneficio           = ingresos - KONECTA_ANUAL;
    return { recuperadosPorFeria, recuperadosAnual, ingresos, beneficio };
  }, [r, escenario]);

  const hasDatos = r.v > 0 && r.t > 0;

  return (
    <div className="min-h-screen" style={{ background: colBg, color: "#fff" }}>

      {/* Header */}
      <div className="px-6 pt-10 pb-7 text-center" style={{ borderBottom: `1px solid ${hex(colPot, 0.15)}` }}>
        <p className="text-[11px] font-semibold tracking-widest uppercase mb-3" style={{ color: colPot }}>
          Konecta3D
        </p>
        {nombre ? (
          <>
            <h1 className="text-xl font-bold leading-snug">Lo que pierdes en ferias,</h1>
            <h1 className="text-xl font-bold leading-snug" style={{ color: colPot }}>{nombre}</h1>
          </>
        ) : (
          <h1 className="text-xl font-bold leading-snug">Lo que pierdes en cada feria</h1>
        )}
        <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>
          Cambia cualquier dato y el cálculo se actualiza al momento
        </p>
      </div>

      <div className="max-w-lg mx-auto px-5 py-7 space-y-6">

        {/* Tus datos */}
        <div
          className="rounded-2xl p-5"
          style={{ background: hex("#ffffff", 0.04), border: `1px solid ${hex("#ffffff", 0.08)}` }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-5" style={{ color: hex(colPot, 0.5) }}>
            Tus datos
          </p>

          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <Parametro label="Visitantes por feria" value={visitantes} onChange={setVisitantes} color={colPot} />
            <Parametro label="Ferias al año"        value={ferias}     onChange={setFerias}     color={colPot} min={1} />
            <Parametro label="% muestran interés"   value={interes}    onChange={setInteres}    color={colPot} suffix="%" max={100} />
            <Parametro label="% dejan sus datos"    value={captados}   onChange={setCaptados}   color={colPot} suffix="%" max={100} />
          </div>

          {/* Ticket + periodo */}
          <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${hex("#ffffff", 0.07)}` }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: hex(colPot, 0.4) }}>
              Valor de un cliente
            </p>
            <div className="flex items-end gap-3">
              <div className="flex-1 flex items-baseline gap-1">
                <input
                  type="number"
                  value={ticket}
                  onChange={e => setTicket(e.target.value)}
                  min={0}
                  className="bg-transparent text-2xl font-bold w-full focus:outline-none border-b-2 border-transparent transition-colors pb-0.5"
                  style={{ color: "#fff" }}
                  onFocus={e => (e.target.style.borderBottomColor = hex(colPot, 0.5))}
                  onBlur={e  => (e.target.style.borderBottomColor = "transparent")}
                />
                <span className="text-base font-semibold" style={{ color: hex(colPot, 0.45) }}>€</span>
              </div>
              <div className="flex gap-1 pb-0.5">
                {(["mensual", "trimestral", "anual"] as Periodo[]).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => changePeriodo(p)}
                    className="px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-colors"
                    style={{
                      borderColor: periodo === p ? colPot : "rgba(255,255,255,0.12)",
                      background:  periodo === p ? hex(colPot, 0.18) : "transparent",
                      color:       periodo === p ? colPot : "rgba(255,255,255,0.35)",
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

        {/* Cómo se calcula */}
        {hasDatos && (
          <div
            className="rounded-2xl p-5 space-y-3"
            style={{ background: hex("#ffffff", 0.03), border: `1px solid ${hex("#ffffff", 0.07)}` }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: "rgba(255,255,255,0.3)" }}>
              Cómo se calcula
            </p>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}>1</span>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.9)" }}>
                <strong className="text-white">{fmt(r.v)}</strong> personas pasan por tu stand en cada feria
              </p>
            </div>
            <div className="ml-3 border-l pl-5" style={{ borderColor: "rgba(255,255,255,0.15)" }}>
              <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>el {r.i}% muestra interés real</p>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}>2</span>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.9)" }}>
                <strong className="text-white">{fmt(r.interesadosPorFeria)}</strong> personas hablan contigo y preguntan
              </p>
            </div>
            <div className="ml-3 border-l pl-5" style={{ borderColor: "rgba(255,255,255,0.15)" }}>
              <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>solo el {r.c}% deja sus datos ese mismo día</p>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                style={{ background: hex(colPain, 0.25), color: colPain }}>3</span>
              <p className="text-sm leading-relaxed">
                <strong className="text-white">{fmt(r.captadosPorFeria)}</strong>
                <span style={{ color: "rgba(255,255,255,0.85)" }}> captados</span>
                <span style={{ color: "rgba(255,255,255,0.6)" }}> — pero </span>
                <strong style={{ color: colPain }}>{fmt(r.perdidosPorFeria)} se van sin contacto</strong>
              </p>
            </div>

            <div
              className="mt-2 rounded-xl p-4 space-y-2"
              style={{ background: hex(colPain, 0.08), border: `1px solid ${hex(colPain, 0.2)}` }}
            >
              <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.78)" }}>
                {fmt(r.perdidosPorFeria)} contactos × {fmt(r.ticketAnual)} €
                {periodo !== "anual" && <span style={{ color: "rgba(255,255,255,0.55)" }}> ({ticket} €/{PERIODO_LABELS[periodo]} × {PERIODO_MULT[periodo]})</span>}
                {" "}= <strong style={{ color: colPain }}>{fmt(r.dineroPorFeria)} €</strong>
                <span style={{ color: "rgba(255,255,255,0.5)" }}> por feria</span>
              </p>
              <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.78)" }}>
                {fmt(r.dineroPorFeria)} € × {r.f} feria{r.f !== 1 ? "s" : ""}
                {" "}= <strong style={{ color: colPain }}>{fmt(r.dineroAnual)} € al año</strong>
              </p>
            </div>
          </div>
        )}

        {/* Número protagonista */}
        <div
          className="rounded-2xl p-7 text-center"
          style={{ background: hex(colPain, 0.1), border: `1px solid ${hex(colPain, 0.3)}` }}
        >
          <p className="text-sm font-medium mb-3" style={{ color: hex(colPain, 0.75) }}>
            Cada año, tus ferias te cuestan
          </p>
          <p className="font-black leading-none tracking-tight" style={{ fontSize: "clamp(3rem,16vw,5rem)", color: colPain }}>
            {hasDatos ? `${fmt(r.dineroAnual)} €` : "—"}
          </p>
          {hasDatos && r.dineroAnual > 0 && (
            <p className="text-xs mt-3" style={{ color: hex(colPain, 0.72) }}>
              en clientes que ya vieron tu stand y no pudiste contactar
            </p>
          )}
        </div>

        {/* Break-even */}
        <div
          className="rounded-2xl p-5"
          style={{ background: hex(colRoi, 0.07), border: `1px solid ${hex(colRoi, 0.2)}` }}
        >
          <p className="text-sm font-medium mb-3" style={{ color: hex(colRoi, 0.85) }}>
            Con Konecta3D — 99 €/mes
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.88)" }}>
            Con un ticket de{" "}
            <strong className="text-white">{ticket} €/{PERIODO_LABELS[periodo]}</strong>
            {periodo !== "anual" && (
              <span style={{ color: "rgba(255,255,255,0.6)" }}> ({fmt(r.ticketAnual)} €/año)</span>
            )}
            , necesitas recuperar{" "}
            <strong style={{ color: colRoi }}>
              {hasDatos && r.clientesNecesarios > 0
                ? r.clientesNecesarios < 1 ? "menos de 1 cliente" : `${Math.ceil(r.clientesNecesarios)} clientes`
                : "—"}
            </strong>{" "}
            al año para que la plataforma se pague sola.
          </p>
          {hasDatos && r.clientesNecesarios > 0 && (
            <div className="mt-3 rounded-xl py-2.5 px-3 text-center" style={{ background: hex(colRoi, 0.12) }}>
              <p className="text-sm font-semibold" style={{ color: colRoi }}>{r.paybackLabel}</p>
            </div>
          )}
        </div>

        {/* Potencial */}
        {hasDatos && r.perdidosPorFeria > 0 && (
          <div
            className="rounded-2xl p-5 space-y-5"
            style={{ background: hex(colPot, 0.1), border: `1px solid ${hex(colPot, 0.35)}` }}
          >
            <div>
              <p className="text-sm font-semibold mb-0.5" style={{ color: colPot }}>
                Lo que puedes ganar con Konecta3D
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                Elige un escenario — ¿cuántos de los que hoy se van crees que captarías?
              </p>
            </div>

            <div className="flex gap-2">
              {(["conservador", "realista", "optimista"] as Escenario[]).map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEscenario(e)}
                  className="flex-1 rounded-xl border py-2.5 px-1 text-center transition-colors"
                  style={{
                    borderColor: escenario === e ? colPot : "rgba(255,255,255,0.1)",
                    background:  escenario === e ? hex(colPot, 0.2) : "transparent",
                  }}
                >
                  <p className="text-xs font-semibold capitalize" style={{ color: escenario === e ? colPot : "rgba(255,255,255,0.45)" }}>
                    {e}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {ESCENARIO_DESC[e]}
                  </p>
                </button>
              ))}
            </div>

            <p className="text-sm" style={{ color: "rgba(255,255,255,0.88)" }}>
              Captarías{" "}
              <strong className="text-white">{potencial.recuperadosPorFeria} contactos más por feria</strong>
              {" "}— en {r.f} feria{r.f !== 1 ? "s" : ""} serían{" "}
              <strong className="text-white">{potencial.recuperadosAnual} clientes nuevos al año</strong>.
            </p>

            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: hex(colPot, 0.65) }}>
                Ingresos adicionales al año
              </p>
              <p className="font-black leading-none" style={{ fontSize: "clamp(2.5rem,13vw,4rem)", color: colPot }}>
                +{fmt(potencial.ingresos)} €
              </p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                {potencial.recuperadosAnual} clientes × {fmt(r.ticketAnual)} €/cliente
              </p>
            </div>

            <div
              className="rounded-xl p-4 space-y-2"
              style={{ background: hex(colPot, 0.12), border: `1px solid ${hex(colPot, 0.25)}` }}
            >
              <div className="flex justify-between text-sm">
                <span style={{ color: "rgba(255,255,255,0.75)" }}>Ingresos adicionales</span>
                <span style={{ color: colPot }}>+{fmt(potencial.ingresos)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "rgba(255,255,255,0.75)" }}>Konecta3D (99 €/mes)</span>
                <span style={{ color: "rgba(255,255,255,0.6)" }}>−{fmt(KONECTA_ANUAL)} €</span>
              </div>
              <div className="flex justify-between pt-2 font-bold" style={{ borderTop: `1px solid ${hex(colPot, 0.3)}` }}>
                <span style={{ color: colPot }}>Beneficio neto</span>
                <span className="text-lg" style={{ color: colPot }}>+{fmt(potencial.beneficio)} €</span>
              </div>
            </div>
          </div>
        )}

        <div className="text-center pt-2 pb-4">
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.18)" }}>
            Konecta3D · Plataforma de captación en ferias
          </p>
        </div>
      </div>
    </div>
  );
}
