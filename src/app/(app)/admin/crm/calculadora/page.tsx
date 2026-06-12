"use client";

import { useState, useMemo } from "react";

const KONECTA_MENSUAL = 99;
const KONECTA_ANUAL = KONECTA_MENSUAL * 12;

function fmt(n: number) {
  return n.toLocaleString("es-ES", { maximumFractionDigits: 0 });
}

function InputField({
  label, hint, value, onChange, prefix, suffix, min, max,
}: {
  label: string; hint: string; value: string;
  onChange: (v: string) => void;
  prefix?: string; suffix?: string; min?: number; max?: number;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium">{label}</label>
      <p className="text-xs text-[var(--foreground)]/50">{hint}</p>
      <div className="flex items-center gap-1 mt-1">
        {prefix && <span className="text-sm text-[var(--foreground)]/50">{prefix}</span>}
        <input
          type="number"
          min={min ?? 0}
          max={max}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm font-medium focus:outline-none focus:border-[var(--brand-1)]"
        />
        {suffix && <span className="text-sm text-[var(--foreground)]/50">{suffix}</span>}
      </div>
    </div>
  );
}

export default function CalculadoraPage() {
  const [visitantes, setVisitantes] = useState("150");
  const [interes, setInteres] = useState("20");
  const [captados, setCaptados] = useState("10");
  const [ticket, setTicket] = useState("800");
  const [ferias, setFerias] = useState("3");

  const r = useMemo(() => {
    const v = Math.max(0, Number(visitantes) || 0);
    const i = Math.min(100, Math.max(0, Number(interes) || 0));
    const c = Math.min(100, Math.max(0, Number(captados) || 0));
    const t = Math.max(0, Number(ticket) || 0);
    const f = Math.max(1, Number(ferias) || 1);

    const interesadosPorFeria = Math.round(v * (i / 100));
    const captadosPorFeria    = Math.round(interesadosPorFeria * (c / 100));
    const perdidosPorFeria    = interesadosPorFeria - captadosPorFeria;
    const dineroPorFeria      = perdidosPorFeria * t;
    const dineroAnual         = dineroPorFeria * f;

    const clientesNecesarios  = t > 0 ? KONECTA_ANUAL / t : 0;
    const clientesPorFeria    = clientesNecesarios / f;

    let paybackLabel = "";
    if (clientesPorFeria < 0.15) {
      paybackLabel = "menos de 1 cliente cada 10 ferias";
    } else if (clientesPorFeria < 0.34) {
      paybackLabel = "1 cliente cada 3 ferias";
    } else if (clientesPorFeria < 0.5) {
      paybackLabel = "1 cliente cada 2 ferias";
    } else if (clientesPorFeria < 1) {
      paybackLabel = "menos de 1 cliente por feria";
    } else {
      paybackLabel = `${Math.ceil(clientesPorFeria)} clientes por feria`;
    }

    const roi = t > 0 ? ((dineroAnual - KONECTA_ANUAL) / KONECTA_ANUAL) * 100 : 0;

    return {
      interesadosPorFeria, captadosPorFeria, perdidosPorFeria,
      dineroPorFeria, dineroAnual,
      clientesNecesarios, clientesPorFeria, paybackLabel, roi,
    };
  }, [visitantes, interes, captados, ticket, ferias]);

  const hasDatos = Number(visitantes) > 0 && Number(ticket) > 0;

  return (
    <div className="max-w-4xl mx-auto pb-16">
      <div className="mb-8">
        <h1 className="text-xl font-bold">Calculadora de impacto</h1>
        <p className="text-sm text-[var(--foreground)]/50 mt-1">
          Herramienta para la llamada de calificación. Introduce los datos del prospecto y muéstrale el resultado en tiempo real.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">

        {/* Inputs */}
        <div className="rounded-2xl border border-[var(--border)] p-6 space-y-5" style={{ background: "var(--card)" }}>
          <h2 className="text-sm font-semibold text-[var(--foreground)]/60 uppercase tracking-wide">Datos del negocio</h2>

          <InputField
            label="Visitantes por feria"
            hint="¿Cuántas personas pasan por el stand en un día de feria?"
            value={visitantes} onChange={setVisitantes}
            min={0}
          />
          <InputField
            label="% que muestran interés real"
            hint="De esos visitantes, ¿cuántos se paran y hablan con vosotros?"
            value={interes} onChange={setInteres}
            suffix="%" min={0} max={100}
          />
          <InputField
            label="% que dejan datos actualmente"
            hint="De los que muestran interés, ¿cuántos acaban dejando sus datos hoy?"
            value={captados} onChange={setCaptados}
            suffix="%" min={0} max={100}
          />
          <InputField
            label="Valor de un cliente (primer año)"
            hint="¿Cuánto factura de media un cliente nuevo en el primer año?"
            value={ticket} onChange={setTicket}
            suffix="€" min={0}
          />
          <InputField
            label="Ferias al año"
            hint="¿A cuántas ferias o eventos van al año?"
            value={ferias} onChange={setFerias}
            min={1}
          />
        </div>

        {/* Resultados */}
        <div className="space-y-4">

          {/* Desglose rápido */}
          {hasDatos && (
            <div className="rounded-2xl border border-[var(--border)] p-5 space-y-3" style={{ background: "var(--card)" }}>
              <h2 className="text-sm font-semibold text-[var(--foreground)]/60 uppercase tracking-wide">Por feria</h2>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-2xl font-bold">{fmt(r.interesadosPorFeria)}</p>
                  <p className="text-[11px] text-[var(--foreground)]/50 mt-0.5">Muestran interés</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-500">{fmt(r.captadosPorFeria)}</p>
                  <p className="text-[11px] text-[var(--foreground)]/50 mt-0.5">Captados hoy</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-400">{fmt(r.perdidosPorFeria)}</p>
                  <p className="text-[11px] text-[var(--foreground)]/50 mt-0.5">Se van sin datos</p>
                </div>
              </div>
            </div>
          )}

          {/* El número que duele */}
          <div
            className="rounded-2xl border p-6 text-center"
            style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.3)" }}
          >
            <p className="text-sm text-red-400/80 font-medium mb-2">Estás perdiendo cada año</p>
            <p className="text-5xl font-black text-red-400">
              {hasDatos ? `${fmt(r.dineroAnual)} €` : "—"}
            </p>
            {hasDatos && r.dineroAnual > 0 && (
              <p className="text-xs text-red-400/70 mt-2">
                {fmt(r.dineroPorFeria)} € por feria × {ferias} ferias
              </p>
            )}
          </div>

          {/* ROI Konecta3D */}
          <div
            className="rounded-2xl border p-6"
            style={{ background: "rgba(34,197,94,0.06)", borderColor: "rgba(34,197,94,0.25)" }}
          >
            <p className="text-sm text-green-500/80 font-medium mb-4">Con Konecta3D — 99 €/mes</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <p className="text-3xl font-black text-green-500">{KONECTA_ANUAL.toLocaleString("es-ES")} €</p>
                <p className="text-[11px] text-[var(--foreground)]/50 mt-0.5">Coste anual</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black" style={{ color: "var(--brand-1)" }}>
                  {hasDatos && r.clientesNecesarios > 0
                    ? r.clientesNecesarios < 1
                      ? `< 1`
                      : fmt(Math.ceil(r.clientesNecesarios))
                    : "—"}
                </p>
                <p className="text-[11px] text-[var(--foreground)]/50 mt-0.5">Clientes para recuperarlo</p>
              </div>
            </div>

            {hasDatos && r.clientesNecesarios > 0 && (
              <div
                className="rounded-xl p-3 text-center"
                style={{ background: "rgba(34,197,94,0.1)" }}
              >
                <p className="text-sm font-semibold text-green-500">
                  Necesitas {r.paybackLabel} para que Konecta3D se pague solo
                </p>
              </div>
            )}

            {hasDatos && r.roi > 0 && (
              <p className="text-xs text-[var(--foreground)]/40 text-center mt-3">
                ROI potencial: {fmt(r.roi)}% sobre la inversión anual
              </p>
            )}
          </div>

        </div>
      </div>

      {/* Nota de uso */}
      <div className="mt-8 rounded-xl border border-[var(--border)]/50 px-5 py-3 flex items-start gap-3" style={{ background: "var(--card)" }}>
        <span className="text-[var(--foreground)]/30 text-lg mt-0.5">↗</span>
        <p className="text-xs text-[var(--foreground)]/50">
          <strong className="text-[var(--foreground)]/70">Cómo usarla en la llamada:</strong> rellena los datos mientras el prospecto te los da. Cuando aparezca el número rojo, no lo comentes tú — deja que lo lea en silencio. Después habla del ROI.
        </p>
      </div>
    </div>
  );
}
