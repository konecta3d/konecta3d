"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type FormType = "captacion" | "fidelizacion";
type Objective = "contacto" | "reserva" | "datos" | "opinion" | "retorno" | "comunidad";
type Basis = "producto_servicio" | "info_experiencia";
type DataCollection = "name_phone_email" | "anonymous" | "thanks_page";
type QuestionType = "text" | "choice" | "scale";
type WizardStep = "tipo" | "objetivo" | "base" | "preguntas" | "datos";

interface Question {
  id: string;
  question_text: string;
  question_type: QuestionType;
  options?: string[];
}

const OBJECTIVE_CAPTACION = [
  { key: "contacto", label: "Recibir contacto", description: "Recibir datos de contacto de potenciales clientes" },
  { key: "reserva", label: "Agendar cita", description: "Gestionar reservas de citas o turnos" },
  { key: "datos", label: "Captar datos", description: "Recopilar información específica de los clientes" },
];

const OBJECTIVE_FIDELIZACION = [
  { key: "opinion", label: "Recoger opinión", description: "Conocer la satisfacción del cliente" },
  { key: "retorno", label: "Motivar retorno", description: "Incentivar que el cliente vuelva" },
  { key: "comunidad", label: "Crear comunidad", description: "Fomentar la relación con el cliente" },
];

const BASE_OPTIONS = [
  {
    key: "producto_servicio",
    label: "Basado en Producto/Servicio",
    description: "El formulario gira en torno al producto o servicio que ofreces",
    icon: "",
  },
  {
    key: "info_experiencia",
    label: "Basado en Información/Experiencia",
    description: "El formulario aporta valor, conocimiento o experiencia al cliente",
    icon: "",
  },
];

const DATA_COLLECTION_CAPTACION = [
  {
    key: "name_phone_email",
    label: "Recolectar datos del cliente",
    description: "Nombre, teléfono y email se guardan en la plataforma",
    icon: "",
  },
];

const DATA_COLLECTION_FIDELIZACION = [
  {
    key: "anonymous",
    label: "Anónimo",
    description: "El cliente responde sin identificarse",
    icon: "",
  },
  {
    key: "thanks_page",
    label: "Página de gracias",
    description: "El cliente ve una página de agradecimiento al terminar",
    icon: "",
  },
];

export default function FormulariosWizardPage() {
  const router = useRouter();
  const [businessId, setBusinessId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [step, setStep] = useState<WizardStep>("tipo");
  const [saving, setSaving] = useState(false);

  // Wizard state
  const [formType, setFormType] = useState<FormType | null>(null);
  const [objective, setObjective] = useState<Objective | null>(null);
  const [basis, setBasis] = useState<Basis | null>(null);
  const [questions, setQuestions] = useState<Question[]>([
    { id: "1", question_text: "", question_type: "text" },
  ]);
  const [dataCollection, setDataCollection] = useState<DataCollection | null>(null);
  const [thanksMessage, setThanksMessage] = useState("");

  // Title auto-generated
  const [title, setTitle] = useState("");

  const steps: WizardStep[] = ["tipo", "objetivo", "base", "preguntas", "datos"];

  useEffect(() => {
    const load = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paramId = urlParams.get("businessId") || "";
      let bid = paramId;

      if (!bid) {
        const { data: sessionData } = await supabase.auth.getSession();
        const userEmail = sessionData.session?.user?.email || "";
        if (userEmail) {
          const { data: biz } = await supabase
            .from("businesses")
            .select("id, name")
            .eq("contact_email", userEmail)
            .single();
          bid = biz?.id || "";
          if (biz?.name) setBusinessName(biz.name);
        }
      }

      if (!bid) return;
      setBusinessId(bid);
    };
    load();
  }, []);

  // Auto-generate title based on selections
  useEffect(() => {
    if (formType && objective) {
      const typeLabel = formType === "captacion" ? "Captación" : "Fidelización";
      const objectiveLabels: Record<string, string> = {
        contacto: "Contacto",
        reserva: "Reserva de Cita",
        datos: "Datos",
        opinion: "Opinión",
        retorno: "Retorno",
        comunidad: "Comunidad",
      };
      setTitle(`Formulario de ${typeLabel} - ${objectiveLabels[objective] || objective}`);
    }
  }, [formType, objective]);

  const addQuestion = () => {
    if (questions.length >= 3) return;
    setQuestions([
      ...questions,
      { id: String(Date.now()), question_text: "", question_type: "text" },
    ]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(
      questions.map((q) =>
        q.id === id ? { ...q, [field]: value } : q
      )
    );
  };

  const addOption = (questionId: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id !== questionId) return q;
        const options = q.options || [];
        if (options.length >= 4) return q;
        return { ...q, options: [...options, `Opción ${options.length + 1}`] };
      })
    );
  };

  const updateOption = (questionId: string, index: number, value: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id !== questionId) return q;
        const options = [...(q.options || [])];
        options[index] = value;
        return { ...q, options };
      })
    );
  };

  const removeOption = (questionId: string, index: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id !== questionId) return q;
        const options = (q.options || []).filter((_, i) => i !== index);
        return { ...q, options };
      })
    );
  };

  const canProceed = () => {
    switch (step) {
      case "tipo":
        return formType !== null;
      case "objetivo":
        return objective !== null;
      case "base":
        return basis !== null;
      case "preguntas":
        return questions.every((q) => q.question_text.trim() !== "");
      case "datos":
        return dataCollection !== null;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleSave = async () => {
    if (saving) return;

    if (!businessId) {
      alert("No se encontró el ID del negocio");
      return;
    }

    if (!canProceed()) return;

    setSaving(true);

    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: businessId,
          title,
          type: formType,
          objective,
          basis,
          questions,
          data_collection: dataCollection,
          thanks_message: thanksMessage,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al guardar");
      }

      router.push("/formularios");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const currentStepIndex = steps.indexOf(step);

  const renderStep = () => {
    switch (step) {
      case "tipo":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">¿Qué tipo de formulario quieres crear?</h2>
              <p className="text-white">Selecciona el propósito principal del formulario</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => setFormType("captacion")}
                className="p-8 rounded-xl text-left transition-all border-2"
                style={{
                  borderColor: formType === "captacion" ? "#10B981" : "rgba(255,255,255,0.1)",
                  backgroundColor: formType === "captacion" ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)",
                }}
              >
                <div className="text-xs uppercase tracking-widest text-white mb-2">Captación</div>
                <h3 className="text-xl font-bold text-white mb-2">Captación</h3>
                <p className="text-white">
                  Para captar nuevos clientes. Recoge datos de contacto y guarda leads en la plataforma.
                </p>
              </button>

              <button
                onClick={() => setFormType("fidelizacion")}
                className="p-8 rounded-xl text-left transition-all border-2"
                style={{
                  borderColor: formType === "fidelizacion" ? "#3B82F6" : "rgba(255,255,255,0.1)",
                  backgroundColor: formType === "fidelizacion" ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.05)",
                }}
              >
                <div className="text-xs uppercase tracking-widest text-white mb-2">Fidelización</div>
                <h3 className="text-xl font-bold text-white mb-2">Fidelización</h3>
                <p className="text-white">
                  Para fidelizar clientes existentes. Puedes usar respuestas anónimas o mostrar una página de gracias.
                </p>
              </button>
            </div>
          </div>
        );

      case "objetivo":
        const objectives = formType === "captacion" ? OBJECTIVE_CAPTACION : OBJECTIVE_FIDELIZACION;
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">¿Cuál es el objetivo del formulario?</h2>
              <p className="text-white">Selecciona qué quieres lograr con este formulario</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {objectives.map((obj) => (
                <button
                  key={obj.key}
                  onClick={() => setObjective(obj.key as Objective)}
                  className="p-6 rounded-xl text-left transition-all border-2"
                  style={{
                    borderColor: objective === obj.key ? "#39a1a9" : "rgba(255,255,255,0.1)",
                    backgroundColor: objective === obj.key ? "rgba(57,161,169,0.1)" : "rgba(255,255,255,0.05)",
                  }}
                >
                  <h3 className="text-lg font-bold text-white mb-2">{obj.label}</h3>
                  <p className="text-sm text-white">{obj.description}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case "base":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">¿Sobre qué se basa el formulario?</h2>
              <p className="text-white">Elige la temática principal del formulario</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {BASE_OPTIONS.map((base) => (
                <button
                  key={base.key}
                  onClick={() => setBasis(base.key as Basis)}
                  className="p-8 rounded-xl text-left transition-all border-2"
                  style={{
                    borderColor: basis === base.key ? "#39a1a9" : "rgba(255,255,255,0.1)",
                    backgroundColor: basis === base.key ? "rgba(57,161,169,0.1)" : "rgba(255,255,255,0.05)",
                  }}
                >
                  <div className="text-xs uppercase tracking-widest text-white mb-2">Base</div>
                  <h3 className="text-xl font-bold text-white mb-2">{base.label}</h3>
                  <p className="text-white">{base.description}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case "preguntas":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">¿Qué preguntas quieres incluir?</h2>
              <p className="text-white">Máximo 3 preguntas. Define el texto y el tipo de cada una.</p>
            </div>

            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={question.id} className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-[var(--brand-4)]">Pregunta {index + 1}</span>
                    {questions.length > 1 && (
                      <button
                        onClick={() => removeQuestion(question.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <input
                      type="text"
                      value={question.question_text}
                      onChange={(e) => updateQuestion(question.id, "question_text", e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white"
                      placeholder="Escribe tu pregunta..."
                    />

                    <div className="flex flex-wrap gap-2">
                      <select
                        value={question.question_type}
                        onChange={(e) => updateQuestion(question.id, "question_type", e.target.value)}
                        className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm"
                      >
                        <option value="text">Texto libre</option>
                        <option value="choice">Opción múltiple</option>
                        <option value="scale">Escala 1-5</option>
                      </select>

                      {question.question_type === "choice" && (
                        <div className="w-full mt-2 space-y-2">
                          {(question.options || []).map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => updateOption(question.id, i, e.target.value)}
                                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                                placeholder={`Opción ${i + 1}`}
                              />
                              {(question.options || []).length > 2 && (
                                <button
                                  onClick={() => removeOption(question.id, i)}
                                  className="text-red-400 text-sm"
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>
                          ))}
                          {(question.options || []).length < 4 && (
                            <button
                              onClick={() => addOption(question.id)}
                              className="text-sm text-[var(--brand-4)] hover:underline"
                            >
                              + Añadir opción
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {questions.length < 3 && (
                <button
                  onClick={addQuestion}
                  className="w-full py-4 rounded-xl border-2 border-dashed border-white/20 text-white hover:border-white/40 hover:text-white transition-all"
                >
                  + Añadir otra pregunta
                </button>
              )}
            </div>
          </div>
        );

      case "datos":
        const dataOptions = formType === "captacion" ? DATA_COLLECTION_CAPTACION : DATA_COLLECTION_FIDELIZACION;
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">¿Cómo obtener los datos del cliente?</h2>
              <p className="text-white">Configura cómo se manejarán los datos collected</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dataOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setDataCollection(opt.key as DataCollection)}
                  className="p-6 rounded-xl text-left transition-all border-2"
                  style={{
                    borderColor: dataCollection === opt.key ? "#39a1a9" : "rgba(255,255,255,0.1)",
                    backgroundColor: dataCollection === opt.key ? "rgba(57,161,169,0.1)" : "rgba(255,255,255,0.05)",
                  }}
                >
                  <div className="text-xs uppercase tracking-widest text-white mb-2">Datos</div>
                  <h3 className="text-lg font-bold text-white mb-2">{opt.label}</h3>
                  <p className="text-sm text-white">{opt.description}</p>
                </button>
              ))}
            </div>

{/* Preview del título */}
<div className="bg-white/5 rounded-xl p-6 border border-white/10 mt-6">
  <label className="block text-xs uppercase tracking-widest text-[var(--brand-4)] mb-2">
    Título del formulario (auto-generado)
  </label>
  <input
    type="text"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white text-lg"
  />
</div>

{/* Mensaje de gracias */}
<div className="bg-white/5 rounded-xl p-6 border border-white/10 mt-4">
  <label className="block text-xs uppercase tracking-widest text-[var(--brand-4)] mb-2">
    Mensaje de gracias
  </label>
  <textarea
    value={thanksMessage}
    onChange={(e) => setThanksMessage(e.target.value)}
    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white"
    rows={3}
    placeholder="Gracias por tu tiempo. Hemos recibido tus respuestas."
  />
</div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-4 md:p-6 lg:p-8 overflow-x-auto">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[var(--brand-4)] text-lg font-extrabold tracking-widest uppercase">Asistente de Formularios</h1>
            <p className="text-white text-sm">Crea formularios para tu landing</p>
          </div>
          <a href="/formularios" className="text-white hover:text-white text-sm">Volver al panel</a>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-2 mb-8 overflow-x-auto">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  step === s
                    ? "bg-[var(--brand-4)] text-black"
                    : currentStepIndex > i
                      ? "bg-green-500 text-white"
                      : "bg-white/10 text-white"
                }`}
              >
                {i + 1}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`w-12 h-0.5 mx-1 flex-shrink-0 ${
                    currentStepIndex > i ? "bg-green-500" : "bg-white/10"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step labels */}
        <div className="flex items-center justify-center gap-4 mb-8 text-xs text-white overflow-x-auto">
          <span className={step === "tipo" ? "text-white" : ""}>Tipo</span>
          <span>→</span>
          <span className={step === "objetivo" ? "text-white" : ""}>Objetivo</span>
          <span>→</span>
          <span className={step === "base" ? "text-white" : ""}>Base</span>
          <span>→</span>
          <span className={step === "preguntas" ? "text-white" : ""}>Preguntas</span>
          <span>→</span>
          <span className={step === "datos" ? "text-white" : ""}>Datos</span>
        </div>

        {/* Step content */}
        <div className="max-w-3xl mx-auto">
          {renderStep()}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8 max-w-3xl mx-auto">
          <button
            onClick={handleBack}
            disabled={currentStepIndex === 0}
            className="px-6 py-3 rounded-full border border-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5"
          >
            Atrás
          </button>

          {currentStepIndex === steps.length - 1 ? (
            <button
              onClick={handleSave}
              disabled={!canProceed() || saving}
              className="px-8 py-3 rounded-full bg-[var(--brand-4)] text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Guardando..." : "Crear Formulario"}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-8 py-3 rounded-full bg-[var(--brand-4)] text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}