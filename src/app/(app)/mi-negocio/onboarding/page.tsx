"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Datos del negocio
  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [city, setCity] = useState("");

  // Cliente ideal
  const [idealClient, setIdealClient] = useState("");
  const [problems, setProblems] = useState("");

  // Oferta principal
  const [offerName, setOfferName] = useState("");
  const [offerBenefits, setOfferBenefits] = useState("");
  const [offerCTA, setOfferCTA] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: session } = await supabase.auth.getSession();
      const user = session.session?.user;
      if (!user) {
        router.push("/business/login?redirect=/mi-negocio/onboarding");
        return;
      }

      const userEmail = user.email || "";
      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("contact_email", userEmail)
        .single();

      const resolvedId = biz?.id;
      if (!resolvedId) {
        router.push("/business/login?redirect=/mi-negocio/onboarding");
        return;
      }

      setBusinessId(resolvedId);

      const { data } = await supabase
        .from("businesses")
        .select("name, sector, city, ideal_client, problems, offer_name, offer_benefits, offer_cta")
        .eq("id", resolvedId)
        .single();

      if (data) {
        setName(data.name || "");
        setSector(data.sector || "");
        setCity(data.city || "");
        setIdealClient(data.ideal_client || "");
        setProblems(data.problems || "");
        setOfferName(data.offer_name || "");
        setOfferBenefits(data.offer_benefits || "");
        setOfferCTA(data.offer_cta || "");
      }

      setLoading(false);
    };
    load();
  }, [router]);

  const saveStep = async () => {
    if (!businessId) return;
    setSaving(true);
    setMsg(null);

    const payload: any = {};

    if (step === 1) {
      if (!name.trim()) {
        setMsg("El nombre del negocio es obligatorio");
        setSaving(false);
        return;
      }
      payload.name = name;
      payload.sector = sector;
      payload.city = city;
    }

    if (step === 2) {
      payload.ideal_client = idealClient;
      payload.problems = problems;
    }

    if (step === 3) {
      payload.offer_name = offerName;
      payload.offer_benefits = offerBenefits;
      payload.offer_cta = offerCTA;
    }

    const { error } = await supabase
      .from("businesses")
      .update(payload)
      .eq("id", businessId);

    if (error) {
      setMsg("Error al guardar: " + error.message);
    } else {
      if (step < 3) {
        setStep(step + 1);
      } else {
        setMsg("Onboarding completado");
      }
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-4)]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Configurar mi negocio</h1>
        <p className="text-sm text-white">
          Responde a estas preguntas básicas. Con esta información podremos generar tu landing, recursos y mensajes.
        </p>
      </div>

      {/* Paso indicador */}
      <div className="flex items-center gap-2 text-xs text-white">
        <span className={step === 1 ? "text-[var(--brand-4)]" : ""}>1. Negocio</span>
        <span>›</span>
        <span className={step === 2 ? "text-[var(--brand-4)]" : ""}>2. Cliente ideal</span>
        <span>›</span>
        <span className={step === 3 ? "text-[var(--brand-4)]" : ""}>3. Oferta principal</span>
      </div>

      {msg && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-2">
          {msg}
        </div>
      )}

      {/* PASO 1: Datos de negocio */}
      {step === 1 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
          <h2 className="text-lg font-semibold mb-2">Sobre tu negocio</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-[var(--brand-4)] block mb-2">
                Nombre del negocio
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Udara Fisioterapia"
                className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-[var(--brand-4)] block mb-2">Sector</label>
                <input
                  type="text"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  placeholder="Ej: Fisioterapia, Estética, Clínica dental"
                  className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-[var(--brand-4)] block mb-2">Ciudad / Zona</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ej: Valencia, Barrio Ruzafa"
                  className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PASO 2: Cliente ideal */}
      {step === 2 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
          <h2 className="text-lg font-semibold mb-2">Tu cliente ideal</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-[var(--brand-4)] block mb-2">Descríbelo en 2-3 frases</label>
              <textarea
                value={idealClient}
                onChange={(e) => setIdealClient(e.target.value)}
                rows={3}
                placeholder="Ej: Mujeres entre 30 y 55 años que sufren dolor de espalda por trabajo de oficina y quieren soluciones naturales sin medicación constante."
                className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-[var(--brand-4)] block mb-2">Problemas principales que tiene</label>
              <textarea
                value={problems}
                onChange={(e) => setProblems(e.target.value)}
                rows={3}
                placeholder="Enumera 2-3 problemas o miedos habituales que tienen tus mejores clientes."
                className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* PASO 3: Oferta principal */}
      {step === 3 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
          <h2 className="text-lg font-semibold mb-2">Tu oferta principal</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-[var(--brand-4)] block mb-2">Nombre de la oferta</label>
              <input
                type="text"
                value={offerName}
                onChange={(e) => setOfferName(e.target.value)}
                placeholder="Ej: Programa intensivo de espalda sana en 4 semanas"
                className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-[var(--brand-4)] block mb-2">Beneficios (en lista)</label>
              <textarea
                value={offerBenefits}
                onChange={(e) => setOfferBenefits(e.target.value)}
                rows={3}
                placeholder="Escribe 3-5 beneficios, uno por línea."
                className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-[var(--brand-4)] block mb-2">Llamada a la acción (CTA)</label>
              <input
                type="text"
                value={offerCTA}
                onChange={(e) => setOfferCTA(e.target.value)}
                placeholder="Ej: Reserva tu sesión gratuita de valoración"
                className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Navegación de pasos */}
      <div className="flex justify-between items-center pt-2">
        <button
          type="button"
          disabled={step === 1 || saving}
          onClick={() => setStep(step - 1)}
          className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm disabled:opacity-50"
        >
          Atrás
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={saveStep}
          className="px-6 py-2 rounded-lg bg-[var(--brand-4)] text-black font-medium hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Guardando..." : step === 3 ? "Guardar y terminar" : "Guardar y continuar"}
        </button>
      </div>
    </div>
  );
}
