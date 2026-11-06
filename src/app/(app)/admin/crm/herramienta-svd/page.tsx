"use client";

import { useState } from "react";

/**
 * /admin/crm/herramienta-svd
 * Acceso rápido a la herramienta pública «Monta tu SVD» (/svd):
 * abrirla, copiar el enlace o copiar un mensaje listo para enviar al iniciar un seguimiento.
 * El texto del mensaje es editable y se guarda en este navegador.
 */

const CLAVE_MENSAJE = "k3d-svd-mensaje-v1";
const ENLACE = "https://app.konecta3d.com/svd";

const MENSAJE_INICIAL =
  "Hola {nombre}, ¿qué tal? Te paso una herramienta que he preparado con lo que vimos en Explosión de Ventas. " +
  "Te ayuda a montar tu Sistema de Ventas Definitivo con tus números, crear tu encuesta PERE y preparar cómo lo vendes. " +
  "Es gratis y lo que escribas se queda en tu navegador: {enlace}";

const QUE_TRAE = [
  { t: "Sistema de ventas", d: "Las 10 fases explicadas, el caso del curso, su SVD con sus números y el plan de mejora con motivos de no compra y periodos." },
  { t: "Encuesta PERE", d: "Qué es, el ejemplo y un creador de encuesta que comprueba las cuatro reglas." },
  { t: "Comunica y cierra", d: "El problema de su cliente, la plantilla de venta de 16 pasos, las 20 técnicas de cierre y el calendario P-10-15-15." },
];

function mensajeGuardado(): string {
  if (typeof window === "undefined") return MENSAJE_INICIAL;
  try {
    return localStorage.getItem(CLAVE_MENSAJE) || MENSAJE_INICIAL;
  } catch {
    return MENSAJE_INICIAL;
  }
}

export default function HerramientaSvdPage() {
  const enlace = ENLACE;
  const [nombre, setNombre] = useState("");
  const [mensaje, setMensaje] = useState<string>(mensajeGuardado);
  const [copiado, setCopiado] = useState<"" | "enlace" | "mensaje">("");

  function guardarMensaje(texto: string): void {
    setMensaje(texto);
    try {
      localStorage.setItem(CLAVE_MENSAJE, texto);
    } catch {
      /* no pasa nada si no se puede guardar */
    }
  }

  const mensajeFinal = mensaje
    .replace(/\{nombre\}/g, nombre.trim())
    .replace(/\{enlace\}/g, enlace)
    .replace(/Hola ,/g, "Hola,")
    .replace(/ {2,}/g, " ");

  function copiar(texto: string, que: "enlace" | "mensaje"): void {
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(que);
      setTimeout(() => setCopiado(""), 2500);
    });
  }

  const btn = "px-4 py-2 rounded-lg text-sm font-semibold transition-colors";
  const btnMain = `${btn} bg-[var(--brand-1)] text-white hover:opacity-90`;
  const btnSec = `${btn} border border-[var(--border)] hover:border-[var(--foreground)]/40`;
  const inputCls = "w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--brand-1)]";

  return (
    <div className="max-w-3xl mx-auto pb-16 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Herramienta SVD</h1>
        <p className="text-sm text-[var(--foreground)]/50 mt-1">
          La página pública «Monta tu Sistema de Ventas Definitivo». Ábrela, copia el enlace o copia el mensaje para enviarla al empezar un seguimiento.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] p-6 space-y-4" style={{ background: "var(--card)" }}>
        <h2 className="text-sm font-semibold text-[var(--foreground)]/60 uppercase tracking-wide">Enlace</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input readOnly value={enlace} className={inputCls} aria-label="Enlace de la herramienta" onFocus={e => e.target.select()} />
          <div className="flex gap-2 flex-shrink-0">
            <button type="button" className={btnMain} onClick={() => copiar(enlace, "enlace")}>
              {copiado === "enlace" ? "¡Copiado!" : "Copiar enlace"}
            </button>
            <a href={enlace} target="_blank" rel="noopener noreferrer" className={btnSec}>Abrir</a>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] p-6 space-y-4" style={{ background: "var(--card)" }}>
        <h2 className="text-sm font-semibold text-[var(--foreground)]/60 uppercase tracking-wide">Mensaje para enviar</h2>
        <div>
          <label className="block text-xs text-[var(--foreground)]/50 mb-1" htmlFor="svd-nombre">Nombre de la persona (opcional)</label>
          <input id="svd-nombre" className={inputCls} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej.: Laura" />
        </div>
        <div>
          <label className="block text-xs text-[var(--foreground)]/50 mb-1" htmlFor="svd-mensaje">
            Texto del mensaje · usa {"{nombre}"} y {"{enlace}"} · se guarda en este navegador
          </label>
          <textarea suppressHydrationWarning id="svd-mensaje" rows={5} className={inputCls} value={mensaje} onChange={e => guardarMensaje(e.target.value)} />
          <button
            type="button"
            suppressHydrationWarning
            hidden={mensaje === MENSAJE_INICIAL}
            className="mt-1 text-xs text-[var(--foreground)]/50 underline"
            onClick={() => guardarMensaje(MENSAJE_INICIAL)}
          >
            Volver al texto inicial
          </button>
        </div>
        <div suppressHydrationWarning className="rounded-lg border border-[var(--border)] p-3 text-sm whitespace-pre-wrap" style={{ background: "var(--background)" }}>
          {mensajeFinal}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btnMain} onClick={() => copiar(mensajeFinal, "mensaje")}>
            {copiado === "mensaje" ? "¡Copiado!" : "Copiar mensaje"}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(mensajeFinal)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={btnSec}
          >
            Enviar por WhatsApp
          </a>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] p-6 space-y-3" style={{ background: "var(--card)" }}>
        <h2 className="text-sm font-semibold text-[var(--foreground)]/60 uppercase tracking-wide">Qué se va a encontrar</h2>
        <ul className="space-y-2">
          {QUE_TRAE.map(x => (
            <li key={x.t} className="text-sm">
              <span className="font-semibold">{x.t}.</span>{" "}
              <span className="text-[var(--foreground)]/60">{x.d}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-[var(--foreground)]/40">
          Es pública: se abre sin iniciar sesión y no recoge datos de quien la usa.
        </p>
      </div>
    </div>
  );
}
