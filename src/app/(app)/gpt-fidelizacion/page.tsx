"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Question {
  id: string;
  question_text: string;
  question_order: number;
}

interface Answers {
  [questionId: string]: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildPlainText(businessName: string, questions: Question[], answers: Answers): string {
  const notesQ = questions.find((q) => q.question_order === 11);
  const mainQs = questions.filter((q) => q.question_order !== 11);

  let text = `PERFIL DE: ${businessName}\n\n`;
  mainQs.forEach((q) => {
    text += `P${q.question_order}. ${q.question_text}\n`;
    text += `R: ${answers[q.id] || "(sin respuesta)"}\n\n`;
  });
  if (notesQ) {
    text += `NOTAS:\n${answers[notesQ.id] || "(sin notas)"}\n`;
  }
  return text;
}

function buildPdfHtml(businessName: string, questions: Question[], answers: Answers): string {
  const notesQ = questions.find((q) => q.question_order === 11);
  const mainQs = questions.filter((q) => q.question_order !== 11);

  const questionsHtml = mainQs
    .map(
      (q) => `
      <div class="question-block">
        <div class="question-label">P${q.question_order}. ${q.question_text}</div>
        <div class="answer-text">${answers[q.id] ? answers[q.id].replace(/\n/g, "<br>") : "<em style='color:#999'>Sin respuesta</em>"}</div>
      </div>`
    )
    .join("");

  const notesHtml = notesQ
    ? `<div class="question-block notes-block">
        <div class="question-label">Notas finales</div>
        <div class="answer-text">${answers[notesQ.id] ? answers[notesQ.id].replace(/\n/g, "<br>") : "<em style='color:#999'>Sin notas</em>"}</div>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; padding: 40px; max-width: 700px; margin: 0 auto; }
  .header { border-bottom: 3px solid #1A4D4A; padding-bottom: 16px; margin-bottom: 32px; }
  .header-label { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #2D7A74; margin-bottom: 6px; }
  .business-name { font-size: 24px; font-weight: 700; color: #1A4D4A; }
  .question-block { margin-bottom: 24px; }
  .question-label { font-size: 12px; font-weight: 700; color: #2D7A74; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
  .answer-text { font-size: 14px; color: #333; line-height: 1.7; padding: 10px 14px; background: #f8fafa; border-left: 3px solid #2D7A74; border-radius: 4px; }
  .notes-block { border-top: 1px solid #e0e0e0; padding-top: 24px; }
  .footer { margin-top: 40px; border-top: 1px solid #e0e0e0; padding-top: 12px; font-size: 11px; color: #999; text-align: center; }
</style>
</head>
<body>
  <div class="header">
    <div class="header-label">Perfil GPT de Fidelización</div>
    <div class="business-name">${businessName}</div>
  </div>
  ${questionsHtml}
  ${notesHtml}
  <div class="footer">Generado con Konecta3D · konecta3d.com</div>
</body>
</html>`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GptFidelizacionPage() {
  const router = useRouter();

  // Auth + business
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [moduleGpt, setModuleGpt] = useState<boolean | null>(null); // null = loading

  // Questions & answers
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answers>({});

  // UI state
  const [toast, setToast] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Debounce timers per question
  const debounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // GPT url from settings
  const [gptUrl, setGptUrl] = useState<string>("https://chatgpt.com/");

  // ── Load business & check access ──────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userEmail = sessionData?.session?.user?.email;
      if (!userEmail) { router.push("/business/login"); return; }

      const { data: biz } = await supabase
        .from("businesses")
        .select("id, name, module_gpt")
        .eq("contact_email", userEmail)
        .single();

      if (!biz) { router.push("/mi-negocio/perfil"); return; }

      if (!biz.module_gpt) {
        // No access: redirect to home
        router.push("/mi-negocio/perfil");
        return;
      }

      setBusinessId(biz.id);
      setBusinessName(biz.name || "Mi Negocio");
      setModuleGpt(true);
    };
    init();
  }, [router]);

  // ── Load GPT URL from settings ────────────────────────────────────────────
  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "gpt_url")
        .single();
      if (data?.value) {
        try {
          const url = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
          setGptUrl(url);
        } catch {
          setGptUrl(data.value as string);
        }
      }
    };
    loadSettings();
  }, []);

  // ── Load questions ────────────────────────────────────────────────────────
  useEffect(() => {
    const loadQuestions = async () => {
      const { data } = await supabase
        .from("gpt_context_questions")
        .select("id, question_text, question_order")
        .order("question_order", { ascending: true });
      if (data) setQuestions(data);
    };
    loadQuestions();
  }, []);

  // ── Load existing answers ─────────────────────────────────────────────────
  useEffect(() => {
    if (!businessId || questions.length === 0) return;
    const loadAnswers = async () => {
      const { data } = await supabase
        .from("gpt_context_answers")
        .select("question_id, answer_text")
        .eq("business_id", businessId);
      if (data) {
        const map: Answers = {};
        data.forEach((row) => { map[row.question_id] = row.answer_text || ""; });
        setAnswers(map);
      }
    };
    loadAnswers();
  }, [businessId, questions]);

  // ── Handle answer change with debounce ────────────────────────────────────
  const handleAnswerChange = useCallback(
    (questionId: string, value: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));

      // Clear existing timer
      if (debounceRefs.current[questionId]) {
        clearTimeout(debounceRefs.current[questionId]);
      }

      // Set new timer
      debounceRefs.current[questionId] = setTimeout(async () => {
        if (!businessId) return;
        setSaveStatus("saving");
        await supabase
          .from("gpt_context_answers")
          .upsert(
            { business_id: businessId, question_id: questionId, answer_text: value, updated_at: new Date().toISOString() },
            { onConflict: "business_id,question_id" }
          );
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      }, 1000);
    },
    [businessId]
  );

  // ── Copy to clipboard ─────────────────────────────────────────────────────
  const handleCopy = () => {
    const text = buildPlainText(businessName, questions, answers);
    navigator.clipboard.writeText(text).then(() => {
      setToast("Copiado al portapapeles ✓");
      setTimeout(() => setToast(null), 3000);
    });
  };

  // ── Generate PDF ──────────────────────────────────────────────────────────
  const handleGeneratePdf = async () => {
    if (!businessId) return;
    setPdfLoading(true);
    try {
      const html = buildPdfHtml(businessName, questions, answers);
      const filename = `perfil-gpt-${businessName.toLowerCase().replace(/\s+/g, "-")}.pdf`;

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch("/api/lead-magnet/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ html, filename, businessId }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => `HTTP ${res.status}`);
        throw new Error(`Error del servidor (${res.status}): ${text.slice(0, 200)}`);
      }

      const data = await res.json();
      if (data.error) {
        alert("Error al generar el PDF: " + data.error);
        return;
      }

      // Download PDF
      if (data.url) {
        const link = document.createElement("a");
        link.href = data.url;
        link.download = filename;
        link.click();
        setToast("PDF generado y descargado ✓");
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) {
      console.error("generatePdf error:", err);
      alert("Error al generar el PDF: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Loading / no access ───────────────────────────────────────────────────
  if (moduleGpt === null) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-sm text-[var(--foreground)]/50">Cargando...</div>
      </div>
    );
  }

  const mainQuestions = questions.filter((q) => q.question_order !== 11);
  const notesQuestion = questions.find((q) => q.question_order === 11);
  const answeredCount = questions.filter((q) => answers[q.id]?.trim()).length;
  const totalCount = questions.length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[var(--brand-1)] text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-[var(--brand-1)] mb-1">
            GPT de Fidelización
          </div>
          <h1 className="text-2xl font-bold">Perfil de: {businessName}</h1>
          <p className="text-sm text-[var(--foreground)]/60 mt-1">
            Rellena estas preguntas para que tu GPT te conozca mejor
          </p>
        </div>
        <Link
          href="/mi-negocio/perfil"
          className="shrink-0 text-sm px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--brand-1)]/10 transition-colors"
        >
          ← Volver
        </Link>
      </div>

      {/* Progress bar */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="flex items-center justify-between mb-2 text-xs text-[var(--foreground)]/60">
          <span>Perfil completado</span>
          <span className="font-semibold text-[var(--foreground)]">{answeredCount} / {totalCount}</span>
        </div>
        <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--brand-1)] transition-all duration-500"
            style={{ width: totalCount > 0 ? `${(answeredCount / totalCount) * 100}%` : "0%" }}
          />
        </div>
        {saveStatus === "saving" && (
          <div className="mt-2 text-xs text-[var(--foreground)]/50 text-right">Guardando...</div>
        )}
        {saveStatus === "saved" && (
          <div className="mt-2 text-xs text-emerald-500 text-right">✓ Guardado</div>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {mainQuestions.map((q) => (
          <div key={q.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <label className="block text-sm font-semibold mb-2">
              <span className="inline-block w-7 h-7 rounded-full bg-[var(--brand-1)]/15 text-[var(--brand-1)] text-xs font-bold text-center leading-7 mr-2">
                {q.question_order}
              </span>
              {q.question_text}
            </label>
            <textarea
              rows={3}
              value={answers[q.id] || ""}
              onChange={(e) => handleAnswerChange(q.id, e.target.value)}
              placeholder="Escribe tu respuesta aquí..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[var(--brand-1)]/40 transition"
            />
          </div>
        ))}

        {/* Notes question */}
        {notesQuestion && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <label className="block text-sm font-semibold mb-2">
              <span className="inline-block w-7 h-7 rounded-full bg-[var(--brand-1)]/15 text-[var(--brand-1)] text-xs font-bold text-center leading-7 mr-2">
                {notesQuestion.question_order}
              </span>
              {notesQuestion.question_text}
            </label>
            <textarea
              rows={4}
              value={answers[notesQuestion.id] || ""}
              onChange={(e) => handleAnswerChange(notesQuestion.id, e.target.value)}
              placeholder="Cualquier información adicional que quieras que sepa el GPT..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[var(--brand-1)]/40 transition"
            />
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleGeneratePdf}
            disabled={pdfLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--brand-1)] text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-50"
          >
            {pdfLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generar PDF
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] font-semibold text-sm hover:bg-[var(--brand-1)]/10 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copiar para GPT
          </button>

          <a
            href={gptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[var(--brand-1)] text-[var(--brand-1)] font-semibold text-sm hover:bg-[var(--brand-1)]/10 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Abrir GPT →
          </a>
        </div>
        <p className="text-xs text-[var(--foreground)]/40 text-center mt-3">
          Consejo: copia el perfil y pégalo en el GPT al inicio de cada conversación para obtener mejores respuestas
        </p>
      </div>
    </div>
  );
}
