"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";

const KONECTA_MENSUAL = 99;
const KONECTA_ANUAL = KONECTA_MENSUAL * 12;

type Periodo   = "mensual" | "trimestral" | "anual";
type ModoInput = "pct" | "num";

const PERIODO_MULT:   Record<Periodo, number> = { mensual: 12, trimestral: 4, anual: 1 };
const PERIODO_LABELS: Record<Periodo, string> = { mensual: "mes", trimestral: "trimestre", anual: "año" };
const SCENARIO_RATES = [0.25, 0.50, 0.75] as const;

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

function ModoToggle({
  mode, onSwitch, color,
}: { mode: ModoInput; onSwitch: (m: ModoInput) => void; color: string }) {
  return (
    <div className="flex gap-0.5 p-0.5 rounded-md" style={{ background: hex(color, 0.15) }}>
      {(["pct", "num"] as ModoInput[]).map(m => (
        <button
          key={m}
          type="button"
          onClick={() => onSwitch(m)}
          className="px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors"
          style={{
            background: mode === m ? hex(color, 0.45) : "transparent",
            color:      mode === m ? color : hex(color, 0.5),
          }}
        >
          {m === "pct" ? "%" : "N"}
        </button>
      ))}
    </div>
  );
}

function Parametro({
  label, value, onChange, suffix, min, max, color, toggle,
}: {
  label: string; value: string; onChange: (v: string) => void;
  suffix?: string; min?: number; max?: number; color: string;
  toggle?: { mode: ModoInput; onSwitch: (m: ModoInput) => void };
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: hex(color, 0.8) }}>
          {label}
        </p>
        {toggle && <ModoToggle mode={toggle.mode} onSwitch={toggle.onSwitch} color={color} />}
      </div>
      <div className="flex items-baseline gap-1">
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          min={min ?? 0}
          max={max}
          className="bg-transparent text-2xl font-bold w-full focus:outline-none border-b-2 border-transparent transition-colors pb-0.5"
          style={{ color: "#fff", borderBottomColor: "transparent" }}
          onFocus={e => (e.target.style.borderBottomColor = hex(color, 0.6))}
          onBlur={e  => (e.target.style.borderBottomColor = "transparent")}
        />
        {suffix && (
          <span className="text-base font-semibold" style={{ color: hex(color, 0.7) }}>{suffix}</span>
        )}
      </div>
    </div>
  );
}

export default function CalculadoraPublica() {
  const params = useSearchParams();

  const nombre     = params.get("n") ?? "";
  const rawPeriodo = params.get("p");

  const colBg   = params.get("bg") ?? "#0a0a0b";
  const colPain = params.get("c1") ?? "#ef4444";
  const colRoi  = params.get("c2") ?? "#22c55e";
  const colPot  = params.get("c3") ?? "#c5a059";

  const [visitantes,   setVisitantes]   = useState(params.get("v") ?? "150");
  const [interes,      setInteres]      = useState(params.get("i") ?? "20");
  const [captados,     setCaptados]     = useState(params.get("c") ?? "10");
  const [ticket,       setTicket]       = useState(params.get("t") ?? "67");
  const [ferias,       setFerias]       = useState(params.get("f") ?? "3");
  const [periodo,      setPeriodo]      = useState<Periodo>(isValidPeriodo(rawPeriodo) ? rawPeriodo : "mensual");
  const [interesMode,  setInteresMode]  = useState<ModoInput>(params.get("im") === "num" ? "num" : "pct");
  const [captadosMode, setCaptadosMode] = useState<ModoInput>(params.get("cm") === "num" ? "num" : "pct");
  const [scenarioIdx,  setScenarioIdx]  = useState<0 | 1 | 2>(1);

  function changePeriodo(nuevo: Periodo) {
    const anual = Number(ticket) * PERIODO_MULT[periodo];
    setTicket(String(Math.round(anual / PERIODO_MULT[nuevo])));
    setPeriodo(nuevo);
  }

  const r = useMemo(() => {
    const v    = Math.max(0, Number(visitantes) || 0);
    const iRaw = Math.max(0, Number(interes) || 0);
    const cRaw = Math.max(0, Number(captados) || 0);
    const t    = Math.max(0, Number(ticket) || 0);
    const f    = Math.max(1, Number(ferias) || 1);
    const ticketAnual = t * PERIODO_MULT[periodo];

    const interesadosPorFeria = interesMode === "pct"
      ? Math.round(v * (Math.min(100, iRaw) / 100))
      : Math.min(v, Math.round(iRaw));

    const captadosPorFeria = captadosMode === "pct"
      ? Math.round(interesadosPorFeria * (Math.min(100, cRaw) / 100))
      : Math.min(interesadosPorFeria, Math.round(cRaw));

    const perdidosPorFeria = interesadosPorFeria - captadosPorFeria;
    const dineroPorFeria   = perdidosPorFeria * ticketAnual;
    const dineroAnual      = dineroPorFeria * f;

    const clientesNecesarios = ticketAnual > 0 ? KONECTA_ANUAL / ticketAnual : 0;
    const clientesPorFeria   = clientesNecesarios / f;

    let paybackLabel = "";
    if (clientesPorFeria < 0.15)      paybackLabel = "menos de 1 cliente cada 10 ferias";
    else if (clientesPorFeria < 0.34) paybackLabel = "1 cliente cada 3 ferias";
    else if (clientesPorFeria < 0.5)  paybackLabel = "1 cliente cada 2 ferias";
    else if (clientesPorFeria < 1)    paybackLabel = "menos de 1 cliente por feria";
    else                              paybackLabel = `${Math.ceil(clientesPorFeria)} clientes por feria`;

    const interesadosPct = v > 0 ? Math.round((interesadosPorFeria / v) * 100) : 0;
    const captadosPct    = interesadosPorFeria > 0 ? Math.round((captadosPorFeria / interesadosPorFeria) * 100) : 0;

    return {
      v, t, f, ticketAnual,
      interesadosPorFeria, captadosPorFeria, perdidosPorFeria,
      dineroPorFeria, dineroAnual, clientesNecesarios, paybackLabel,
      interesadosPct, captadosPct,
    };
  }, [visitantes, interes, captados, ticket, ferias, periodo, interesMode, captadosMode]);

  const potencial = useMemo(() => {
    const rate = SCENARIO_RATES[scenarioIdx];
    const recuperadosPorFeria   = Math.round(r.perdidosPorFeria * rate);
    const totalCaptadosPorFeria = r.captadosPorFeria + recuperadosPorFeria;
    const recuperadosAnual      = recuperadosPorFeria * r.f;
    const ingresos              = recuperadosAnual * r.ticketAnual;
    const beneficio             = ingresos - KONECTA_ANUAL;
    return { recuperadosPorFeria, totalCaptadosPorFeria, recuperadosAnual, ingresos, beneficio };
  }, [r, scenarioIdx]);

  function changeInteresMode(newMode: ModoInput) {
    if (newMode === interesMode) return;
    if (newMode === "num") {
      setInteres(String(r.interesadosPorFeria));
    } else {
      setInteres(r.v > 0 ? String(Math.round((r.interesadosPorFeria / r.v) * 100)) : "20");
    }
    setInteresMode(newMode);
  }

  function changeCaptadosMode(newMode: ModoInput) {
    if (newMode === captadosMode) return;
    if (newMode === "num") {
      setCaptados(String(r.captadosPorFeria));
    } else {
      setCaptados(r.interesadosPorFeria > 0
        ? String(Math.round((r.captadosPorFeria / r.interesadosPorFeria) * 100))
        : "10");
    }
    setCaptadosMode(newMode);
  }

  const hasDatos = r.v > 0 && r.t > 0;

  const interesHint = interesMode === "pct"
    ? `el ${r.interesadosPct}% muestra interés real`
    : "de ellos muestra interés real";

  const captadosHint = captadosMode === "pct"
    ? `solo el ${r.captadosPct}% deja sus datos ese mismo día`
    : `solo ${r.captadosPorFeria} deja sus datos ese mismo día`;

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
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-5" style={{ color: hex(colPot, 0.85) }}>
            Tus datos
          </p>

          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <Parametro
              label="Visitantes por feria"
              value={visitantes}
              onChange={setVisitantes}
              color={colPot}
            />
            <Parametro
              label="Ferias al año"
              value={ferias}
              onChange={setFerias}
              color={colPot}
              min={1}
            />
            <Parametro
              label={interesMode === "pct" ? "% muestran interés" : "Muestran interés"}
              value={interes}
              onChange={setInteres}
              color={colPot}
              suffix={interesMode === "pct" ? "%" : undefined}
              max={interesMode === "pct" ? 100 : Number(visitantes)}
              toggle={{ mode: interesMode, onSwitch: changeInteresMode }}
            />
            <Parametro
              label={captadosMode === "pct" ? "% dejan sus datos" : "Dejan sus datos"}
              value={captados}
              onChange={setCaptados}
              color={colPot}
              suffix={captadosMode === "pct" ? "%" : undefined}
              max={captadosMode === "pct" ? 100 : r.interesadosPorFeria}
              toggle={{ mode: captadosMode, onSwitch: changeCaptadosMode }}
            />
          </div>

          {/* Ticket + periodo */}
          <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${hex("#ffffff", 0.07)}` }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: hex(colPot, 0.8) }}>
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
                  onFocus={e => (e.target.style.borderBottomColor = hex(colPot, 0.6))}
                  onBlur={e  => (e.target.style.borderBottomColor = "transparent")}
                />
                <span className="text-base font-semibold" style={{ color: hex(colPot, 0.7) }}>€</span>
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
              <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>
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
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>
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
              <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>{interesHint}</p>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}>2</span>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.9)" }}>
                <strong className="text-white">{fmt(r.interesadosPorFeria)}</strong> personas hablan contigo y preguntan
              </p>
            </div>
            <div className="ml-3 border-l pl-5" style={{ borderColor: "rgba(255,255,255,0.15)" }}>
              <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>{captadosHint}</p>
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
                {periodo !== "anual" && (
                  <span style={{ color: "rgba(255,255,255,0.55)" }}> ({ticket} €/{PERIODO_LABELS[periodo]} × {PERIODO_MULT[periodo]})</span>
                )}
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
              <p className="text-sm font-semibold mb-1" style={{ color: colPot }}>
                Lo que puedes ganar con Konecta3D
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                Ahora captas <strong className="text-white">{r.captadosPorFeria}</strong> contactos por feria.
                {" "}¿Cuántos podrías captar?
              </p>
            </div>

            {/* Scenario buttons */}
            <div className="flex gap-2">
              {([0, 1, 2] as const).map(idx => {
                const recuperados = Math.round(r.perdidosPorFeria * SCENARIO_RATES[idx]);
                const total = r.captadosPorFeria + recuperados;
                const sel = scenarioIdx === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setScenarioIdx(idx)}
                    className="flex-1 rounded-xl border py-3 px-1 text-center transition-colors"
                    style={{
                      borderColor: sel ? colPot : "rgba(255,255,255,0.1)",
                      background:  sel ? hex(colPot, 0.2) : "transparent",
                    }}
                  >
                    <p className="text-2xl font-black" style={{ color: sel ? colPot : "rgba(255,255,255,0.65)" }}>
                      {total}
                    </p>
                    <p className="text-[9px] font-medium mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                      contactos/feria
                    </p>
                    <p className="text-[10px] mt-1.5 font-semibold" style={{ color: sel ? hex(colPot, 0.85) : "rgba(255,255,255,0.3)" }}>
                      +{recuperados} vs. ahora
                    </p>
                  </button>
                );
              })}
            </div>

            <p className="text-sm" style={{ color: "rgba(255,255,255,0.88)" }}>
              Captarías{" "}
              <strong className="text-white">{potencial.recuperadosPorFeria} contactos más por feria</strong>
              {" "}— en {r.f} feria{r.f !== 1 ? "s" : ""} serían{" "}
              <strong className="text-white">{potencial.recuperadosAnual} clientes nuevos al año</strong>.
            </p>

            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: hex(colPot, 0.85) }}>
                Ingresos adicionales al año
              </p>
              <p className="font-black leading-none" style={{ fontSize: "clamp(2.5rem,13vw,4rem)", color: colPot }}>
                +{fmt(potencial.ingresos)} €
              </p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
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
