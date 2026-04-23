"use client";

import { useState } from "react";

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options?: string[];
}

interface Form {
  id: string;
  title: string;
  type: string;
  questions: Question[];
  data_collection: string;
}

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: Form;
}

export default function FormModal({ isOpen, onClose, form }: FormModalProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [contactData, setContactData] = useState({ name: "", phone: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const answersArray = Object.entries(answers).map(([question_id, answer]) => ({
        question_id,
        answer,
      }));

      const body: Record<string, any> = { answers: answersArray };

      // Si es captación, incluir datos de contacto
      if (form.type === "captacion" && form.data_collection === "name_phone_email") {
        body.contactData = contactData;
      }

      const res = await fetch(`/api/forms/${form.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al enviar");
      }

      setSubmitted(true);

      // Si hay redirect, redirigir
      if (data.redirectUrl) {
        setTimeout(() => {
          window.location.href = data.redirectUrl;
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isCaptacion = form.type === "captacion";

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
        <div className="bg-[#161618] rounded-2xl p-8 max-w-md w-full text-center border border-white/10">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {isCaptacion ? "¡Datos enviados!" : "¡Listo!"}
          </h2>
          <p className="text-white">
            {isCaptacion
              ? "Gracias por tu interés. Te contactaremos pronto."
              : "Gracias por tu respuesta."}
          </p>
          <button
            onClick={onClose}
            className="mt-6 px-6 py-3 rounded-lg bg-white/10 text-white hover:bg-white/20"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-[#161618] rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{form.title || "Formulario"}</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {isCaptacion && (
          <div className="mb-4 p-3 bg-[#2D7A74]/20 border border-[#2D7A74]/30 rounded-lg">
            <p className="text-sm text-[#2D7A74]">
               Complete sus datos para enviar el formulario
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos de contacto para captación */}
          {isCaptacion && form.data_collection === "name_phone_email" && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-white mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={contactData.name}
                  onChange={(e) => setContactData({ ...contactData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white"
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <label className="block text-sm text-white mb-1">Teléfono</label>
                <input
                  type="tel"
                  required
                  value={contactData.phone}
                  onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white"
                  placeholder="+34 600 000 000"
                />
              </div>
              <div>
                <label className="block text-sm text-white mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={contactData.email}
                  onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white"
                  placeholder="tu@email.com"
                />
              </div>
            </div>
          )}

          {/* Preguntas */}
          {form.questions.map((question, index) => (
            <div key={question.id} className="space-y-2">
              <label className="block text-white font-medium">
                {index + 1}. {question.question_text}
              </label>

              {question.question_type === "text" && (
                <textarea
                  value={answers[question.id] || ""}
                  onChange={(e) => handleAnswer(question.id, e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white"
                  rows={3}
                  placeholder="Escribe tu respuesta..."
                  required
                />
              )}

              {question.question_type === "choice" && question.options && (
                <div className="space-y-2">
                  {question.options.map((option, i) => (
                    <label
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
                        answers[question.id] === option
                          ? "bg-[#2D7A74]/30 border-[#2D7A74]"
                          : "bg-white/5 border-white/10 hover:border-white/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={(e) => handleAnswer(question.id, e.target.value)}
                        className="w-4 h-4 accent-[#2D7A74]"
                      />
                      <span className="text-white">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.question_type === "scale" && (
                <div className="flex justify-between gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleAnswer(question.id, String(num))}
                      className={`w-12 h-12 rounded-lg font-bold transition-colors ${
                        answers[question.id] === String(num)
                          ? "bg-[#2D7A74] text-white"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-xl bg-[#2D7A74] text-white font-bold hover:bg-[#2D7A74]/90 disabled:opacity-50"
          >
            {submitting ? "Enviando..." : isCaptacion ? "Enviar datos" : "Enviar respuesta"}
          </button>
        </form>
      </div>
    </div>
  );
}
