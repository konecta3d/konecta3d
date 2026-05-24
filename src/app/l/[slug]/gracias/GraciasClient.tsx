"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Props {
  name: string;
  slug: string;
  pdfUrl: string;
  resourceTitle: string;
  accentColor?: string;
}

const REDIRECT_DELAY = 4; // segundos tras pulsar el botón

export default function GraciasClient({ name, slug, pdfUrl, resourceTitle, accentColor = "#39a1a9" }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<"waiting" | "countdown" | "done">("waiting");
  const [seconds, setSeconds] = useState(REDIRECT_DELAY);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Inicia el countdown tras pulsar el botón de descarga
  const handleDownload = () => {
    // Abrir PDF en pestaña nueva
    window.open(pdfUrl, "_blank", "noopener,noreferrer");
    setPhase("countdown");
  };

  useEffect(() => {
    if (phase !== "countdown") return;

    intervalRef.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          setPhase("done");
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase]);

  // Redirigir cuando el countdown termine
  useEffect(() => {
    if (phase === "done") {
      router.push(`/l/${slug}`);
    }
  }, [phase, router, slug]);

  const displayName = name ? `, ${name}` : "";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: "#0f1923", color: "#ffffff", fontFamily: "Inter, sans-serif" }}
    >
      {/* Icono de éxito */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ background: `${accentColor}20`, border: `2px solid ${accentColor}50` }}
      >
        <svg className="w-10 h-10" style={{ color: accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Título */}
      <h1 className="text-2xl font-bold mb-2">
        ¡Gracias{displayName}!
      </h1>
      <p className="text-white/60 text-sm mb-8 max-w-xs leading-relaxed">
        Tu recurso está listo. Pulsa el botón para descargarlo.
      </p>

      {/* Fase: esperando que pulse */}
      {phase === "waiting" && (
        <button
          onClick={handleDownload}
          className="flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-base transition-transform active:scale-95"
          style={{ background: accentColor, color: "#fff" }}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          Descargar {resourceTitle}
        </button>
      )}

      {/* Fase: countdown */}
      {phase === "countdown" && (
        <div className="flex flex-col items-center gap-4">
          <div
            className="flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-base opacity-60"
            style={{ background: accentColor, color: "#fff" }}
          >
            <svg className="w-5 h-5 animate-pulse flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Descargando...
          </div>

          {/* Contador y barra de progreso */}
          <div className="flex flex-col items-center gap-2 mt-2">
            <p className="text-white/40 text-sm">
              Accediendo al negocio en <span className="text-white font-bold">{seconds}s</span>
            </p>
            <div className="w-48 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div
                className="h-full rounded-full transition-all duration-1000 ease-linear"
                style={{
                  background: accentColor,
                  width: `${((REDIRECT_DELAY - seconds) / REDIRECT_DELAY) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Fase: redirigiendo */}
      {phase === "done" && (
        <div className="flex items-center gap-2 text-white/50 text-sm">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Redirigiendo...
        </div>
      )}

      {/* Enlace manual por si falla el redirect */}
      {phase === "countdown" && (
        <button
          onClick={() => router.push(`/l/${slug}`)}
          className="mt-8 text-xs text-white/25 hover:text-white/50 transition-colors underline underline-offset-2"
        >
          Ir ahora al negocio
        </button>
      )}
    </div>
  );
}
