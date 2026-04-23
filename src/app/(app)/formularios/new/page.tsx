"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type FormType = "captacion" | "fidelizacion";
type Objective = "contacto" | "reserva" | "datos" | "opinion" | "retorno" | "comunidad";
type Basis = "producto_servicio" | "info_experiencia";
type DataCollection = "name_phone_email" | "anonymous" | "thanks_page";
type QuestionType = "text" | "choice" | "scale";

interface Question {
  id: string;
  question_text: string;
  question_type: QuestionType;
  options?: string[];
}

function FormulariosNewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditing = !!editId;

  const [businessId, setBusinessId] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  // Form state
  const [title, setTitle] = useState("");
  const [formType, setFormType] = useState<FormType>("captacion");
  const [objective, setObjective] = useState<Objective>("contacto");
  const [basis, setBasis] = useState<Basis>("producto_servicio");
  const [questions, setQuestions] = useState<Question[]>([
    { id: "1", question_text: "", question_type: "text" },
  ]);
  const [dataCollection, setDataCollection] = useState<DataCollection>("name_phone_email");
  const [thanksMessage, setThanksMessage] = useState("");
  const [active, setActive] = useState(true);
  useEffect(() => {
    const load = async () => {
      const urlBusinessId = searchParams.get("businessId") || "";
      let bid = urlBusinessId;

      if (!bid) {
        const { data: sessionData } = await supabase.auth.getSession();
        const userEmail = sessionData.session?.user?.email || "";
        if (userEmail) {
          const { data: biz } = await supabase
            .from("businesses")
            .select("id")
            .eq("contact_email", userEmail)
            .single();
          bid = biz?.id || "";
        }
      }

      setBusinessId(bid);
    };
    load();
  }, [searchParams]);

  // Load form data if editing
  useEffect(() => {
    if (!editId) return;

    const loadForm = async () => {
      const { data, error } = await supabase
        .from("forms")
        .select("*")
        .eq("id", editId)
        .single();

      if (error || !data) {
        alert("Formulario no encontrado");
        router.push("/formularios");
        return;
      }

      setTitle(data.title || "");
      setFormType(data.type || "captacion");
      setObjective(data.objective || "contacto");
      setBasis(data.basis || "producto_servicio");
      setQuestions(data.questions || []);
      setDataCollection(data.data_collection || "name_phone_email");
      setActive(data.active ?? true);
      setLoading(false);
    };

    loadForm();
  }, [editId, router, supabase]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (saving) return;

    if (!title.trim()) {
      alert("El título es obligatorio");
      return;
    }

    if (!businessId) {
      alert("No se encontró el ID del negocio");
      return;
    }

    if (questions.some((q) => !q.question_text.trim())) {
      alert("Todas las preguntas deben tener texto");
      return;
    }

    setSaving(true);

    try {
      const body = {
        business_id: businessId,
        title,
        type: formType,
        objective,
        basis,
        questions,
        data_collection: dataCollection,
        thanks_message: thanksMessage,
        active,
      };

      const url = isEditing ? `/api/forms/${editId}` : "/api/forms";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1720] flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1720] p-4 md:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[var(--brand-4)] text-lg font-extrabold tracking-widest uppercase">
              {isEditing ? "Editar Formulario" : "Nuevo Formulario"}
            </h1>
            <p className="text-white text-sm">Modo avanzado — control total</p>
          </div>
          <a href="/formularios" className="text-white hover:text-white text-sm">
            Volver al panel
          </a>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <label className="block text-xs uppercase tracking-widest text-[var(--brand-4)] mb-2">
              Título del formulario
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white"
              placeholder="Ej: Solicita tu primera cita gratuita"
              required
            />
          </div>

          {/* Tipo y Objetivo */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs uppercase tracking-widest text-[var(--brand-4)] mb-2">
                Tipo
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as FormType)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white"
              >
                <option value="captacion">Captación</option>
                <option value="fidelizacion">Fidelización</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-[var(--brand-4)] mb-2">
                Objetivo
              </label>
              <select
                value={objective}
                onChange={(e) => setObjective(e.target.value as Objective)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white"
              >
                {formType === "captacion" ? (
                  <>
                    <option value="contacto">Recibir contacto</option>
                    <option value="reserva">Agendar cita</option>
                    <option value="datos">Captar datos</option>
                  </>
                ) : (
                  <>
                    <option value="opinion">Recoger opinión</option>
                    <option value="retorno">Motivar retorno</option>
                    <option value="comunidad">Crear comunidad</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Base */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <label className="block text-xs uppercase tracking-widest text-[var(--brand-4)] mb-2">
              Base del formulario
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setBasis("producto_servicio")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  basis === "producto_servicio"
                    ? "border-[var(--brand-4)] bg-[var(--brand-4)]/10"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <div className="text-xs uppercase tracking-widest text-white mb-2">Producto/Servicio</div>
                <div className="text-white font-bold">Producto/Servicio</div>
              </button>
              <button
                type="button"
                onClick={() => setBasis("info_experiencia")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  basis === "info_experiencia"
                    ? "border-[var(--brand-4)] bg-[var(--brand-4)]/10"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <div className="text-xs uppercase tracking-widest text-white mb-2">Información/Experiencia</div>
                <div className="text-white font-bold">Información/Experiencia</div>
              </button>
            </div>
          </div>

          {/* Preguntas */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <label className="block text-xs uppercase tracking-widest text-[var(--brand-4)] mb-4">
              Preguntas (máx. 3)
            </label>

            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={question.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-[var(--brand-4)]">Pregunta {index + 1}</span>
                    {questions.length > 1 && (
                      <button
                        type="button"
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

                    <select
                      value={question.question_type}
                      onChange={(e) => updateQuestion(question.id, "question_type", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm"
                    >
                      <option value="text">Texto libre</option>
                      <option value="choice">Opción múltiple</option>
                      <option value="scale">Escala 1-5</option>
                    </select>

                    {question.question_type === "choice" && (
                      <div className="space-y-2 pl-4">
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
                                type="button"
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
                            type="button"
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
              ))}

              {questions.length < 3 && (
                <button
                  type="button"
                  onClick={addQuestion}
                  className="w-full py-3 rounded-lg border-2 border-dashed border-white/20 text-white hover:border-white/40 hover:text-white transition-all text-sm"
                >
                  + Añadir pregunta
                </button>
              )}
            </div>
          </div>

          {/* Datos del cliente */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <label className="block text-xs uppercase tracking-widest text-[var(--brand-4)] mb-4">
              Recolección de datos
            </label>

{formType === "captacion" ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase tracking-widest text-white">Datos</span>
                  <div>
                    <div className="text-white font-bold">Recolectar datos del cliente</div>
                    <div className="text-sm text-white">
                      Nombre, teléfono y email se guardan en la plataforma como lead
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setDataCollection("anonymous")}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    dataCollection === "anonymous"
                      ? "border-[var(--brand-4)] bg-[var(--brand-4)]/10"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs uppercase tracking-widest text-white">Anónimo</span>
                    <div>
                      <div className="text-white font-bold">Anónimo</div>
                      <div className="text-sm text-white">El cliente responde sin identificarse</div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDataCollection("thanks_page")}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    dataCollection === "thanks_page"
                      ? "border-[var(--brand-4)] bg-[var(--brand-4)]/10"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs uppercase tracking-widest text-white">Gracias</span>
                    <div>
                      <div className="text-white font-bold">Página de gracias</div>
                      <div className="text-sm text-white">El cliente ve una página de agradecimiento</div>
                    </div>
                  </div>
                </button>
              </div>
            )}

            <div className="mt-4 bg-white/5 rounded-lg p-4 border border-white/10">
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

          {/* Estado activo */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-5 h-5 accent-[var(--brand-4)]"
              />
              <span className="text-white font-bold">Formulario activo</span>
              <span className="text-sm text-white">
                {active ? "Visible en la landing" : "No se muestra en la landing"}
              </span>
            </label>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <a
              href="/formularios"
              className="px-6 py-3 rounded-full border border-white/20 text-white hover:bg-white/5"
            >
              Cancelar
            </a>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 rounded-full bg-[var(--brand-4)] text-black font-bold disabled:opacity-50"
            >
              {saving ? "Guardando..." : isEditing ? "Actualizar" : "Crear Formulario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FormulariosNewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm">Cargando...</div>}>
      <FormulariosNewContent />
    </Suspense>
  );
}
