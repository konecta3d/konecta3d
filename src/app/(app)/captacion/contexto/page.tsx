"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type {
  ContextoIdentidad,
  ContextoClientes,
  ContextoTono,
  ContextoSector,
  ContextoExpectativas,
  ContextoSeguimiento,
} from "@/types/contexto";

type SectionStatus = "empty" | "partial" | "complete";

interface SectionConfig {
  key: string;
  href: string;
  label: string;
  desc: string;
  requiredFields: string[];
}

const SECTIONS: SectionConfig[] = [
  {
    key: "identidad",
    href: "/captacion/contexto/identidad",
    label: "Identidad del negocio",
    desc: "Qué haces, qué resultado produces y qué te diferencia",
    requiredFields: ["what_you_do", "what_you_sell", "client_result", "differentiator"],
  },
  {
    key: "clientes",
    href: "/captacion/contexto/clientes",
    label: "Perfiles de Cliente Ideal",
    desc: "Hasta 3 perfiles con sus problemas, necesidades y deseos",
    requiredFields: [],
  },
  {
    key: "tono",
    href: "/captacion/contexto/tono",
    label: "Tono y comunicación",
    desc: "Cómo hablas con tus clientes",
    requiredFields: ["style", "tuteo", "ten_second_phrase"],
  },
  {
    key: "sector",
    href: "/captacion/contexto/sector",
    label: "Sector y tipo de eventos",
    desc: "Dónde y cómo haces captación",
    requiredFields: ["sector"],
  },
  {
    key: "expectativas",
    href: "/captacion/contexto/expectativas",
    label: "Expectativas de captación",
    desc: "Cuántos contactos quieres conseguir por evento",
    requiredFields: ["visitors", "contacts_target"],
  },
  {
    key: "seguimiento",
    href: "/captacion/contexto/seguimiento",
    label: "Seguimiento post-captación",
    desc: "Qué pasa después de captar el dato",
    requiredFields: ["channels", "timing"],
  },
];

function getSectionStatus(
  section: SectionConfig,
  context: Record<string, unknown>
): SectionStatus {
  const raw = context[section.key];

  if (section.key === "clientes") {
    const c = raw as ContextoClientes | undefined;
    if (!c?.profiles || c.profiles.length === 0) return "empty";
    const first = c.profiles[0];
    if (!first?.name) return "empty";
    if (first.motivators && first.motivators.length > 0) return "complete";
    return "partial";
  }

  if (!raw || typeof raw !== "object") return "empty";
  const data = raw as Record<string, unknown>;

  const filled = section.requiredFields.filter((f) => {
    const val = data[f];
    if (Array.isArray(val)) return val.length > 0;
    return typeof val === "string" && val.trim().length > 0;
  });

  if (filled.length === 0) return "empty";
  if (filled.length === section.requiredFields.length) return "complete";
  return "partial";
}

export default function ContextoIndexPage() {
  const [context, setContext] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: s } = await supabase.auth.getSession();
      const tok = s?.session?.access_token;
      const email = s?.session?.user?.email;
      if (!email || !tok) { setLoading(false); return; }
      setToken(tok);
      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("contact_email", email)
        .single();
      if (!biz) { setLoading(false); return; }
      setBusinessId(biz.id);
      const res = await fetch(`/api/captacion/context?businessId=${biz.id}`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const json = await res.json();
      if (json.context) setContext(json.context);
      setLoading(false);
    };
    load();
  }, []);

  const statuses = SECTIONS.map((s) => getSectionStatus(s, context));
  const completeCount = statuses.filter((s) => s === "complete").length;
  const progress = Math.round((completeCount / SECTIONS.length) * 100);
  const firstIncomplete = SECTIONS.find((_, i) => statuses[i] !== "complete");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--brand-1)] mx-auto mb-3" />
          <p className="text-sm text-[var(--foreground)]/50">Cargando contexto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">Contexto de Captación</h1>
            <p className="text-sm text-[var(--foreground)]/60 mt-1">
              Rellena cada sección para que el asistente genere textos precisos y personalizados.
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-2xl font-bold" style={{ color: "var(--brand-1)" }}>
              {completeCount}
            </span>
            <span className="text-sm text-[var(--foreground)]/50"> / {SECTIONS.length}</span>
            <div className="text-xs text-[var(--foreground)]/40 mt-0.5">completos</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-[var(--foreground)]/40 mb-1.5">
            <span>Progreso</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: "var(--brand-1)" }}
            />
          </div>
        </div>

        {firstIncomplete && (
          <div className="mt-4">
            <Link
              href={firstIncomplete.href}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: "var(--brand-1)", color: "white" }}
            >
              Continuar con {firstIncomplete.label}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}

        {completeCount === SECTIONS.length && (
          <div className="mt-3 text-sm text-green-400 bg-green-400/10 rounded-lg px-3 py-2">
            Perfil completo. El asistente tiene todo el contexto para darte las mejores respuestas.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SECTIONS.map((section, i) => {
          const status = statuses[i];
          return (
            <Link
              key={section.key}
              href={section.href}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--brand-1)]/40 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{ background: "var(--brand-1)", color: "white" }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold group-hover:text-[var(--brand-1)] transition-colors">
                      {section.label}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                        status === "complete"
                          ? "bg-green-500/15 text-green-400"
                          : status === "partial"
                          ? "bg-yellow-500/15 text-yellow-400"
                          : "bg-[var(--foreground)]/8 text-[var(--foreground)]/40"
                      }`}
                    >
                      {status === "complete" ? "Completo" : status === "partial" ? "En progreso" : "Vacio"}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--foreground)]/50 mt-1">{section.desc}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
