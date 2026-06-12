import { Suspense } from "react";
import type { Metadata } from "next";
import CalculadoraPublica from "./CalculadoraPublica";

export const metadata: Metadata = {
  title: "Calculadora de impacto — Konecta3D",
  description: "¿Cuánto te están costando las ferias donde no capturas contactos?",
};

export default function CalculadoraPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#0A0A0B", color: "rgba(255,255,255,0.3)", fontSize: "0.875rem" }}>
        Cargando…
      </div>
    }>
      <CalculadoraPublica />
    </Suspense>
  );
}
