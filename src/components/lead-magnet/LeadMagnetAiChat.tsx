"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// Mirror the type from the API route (avoids importing server code in client)
export type WizardChanges = {
  objective?: "volvieron" | "conversion" | "referidos" | "captar" | "reactivar" | "educar" | "temporada" | "lanzamiento";
  type?: "guia" | "checklist" | "recomendacion";
  title?: string;
  intro?: string;
  content?: string;
  cta1Text?: string;
  cta1Link?: string;
  cta2Text?: string;
  cta2Link?: string;
  colorBrand?: string;
  colorButton?: string;
};

export interface WizardChatMessage {
  role: "user" | "assistant";
  content: string;
  changes: WizardChanges | null;
  timestamp: string;
}

interface Props {
  businessId: string;
  businessName: string;
  currentStep: string;
  currentState: Record<string, unknown>;
  messages: WizardChatMessage[];
  onMessages: (messages: WizardChatMessage[]) => void;
  onApply: (changes: WizardChanges) => void;
}

// Estas sugerencias pre-rellenan el input al cambiar de paso.
// El usuario las puede editar antes de enviar o directamente pulsar Enviar.
const STEP_SUGGESTIONS: Record<string, string> = {
  objetivo: "Según mi perfil de negocio, ¿cuáles son los 2 objetivos más adecuados para mi primer Recurso de Valor? Recomiéndame el mejor.",
  tipo: "Según el objetivo que hemos elegido, ¿qué formato de recurso (guía, checklist o recomendación) funcionará mejor para mis clientes?",
  contenido: "Crea el contenido completo del recurso adaptado a mi negocio. Que sea específico y listo para usar tal cual.",
  personalizacion: "¿Qué colores y textos de botones recomiendas para este documento? Usa los colores de mi marca si los tienes.",
};

type ProfileState = "loading" | "incomplete" | "ready";

export default function LeadMagnetAiChat({
  businessId,
  businessName,
  currentStep,
  currentState,
  messages,
  onMessages,
  onApply,
}: Props) {
  const [profileState, setProfileState] = useState<ProfileState>("loading");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevStep = useRef<string>("");

  // Validate profile completeness
  useEffect(() => {
    if (!businessId) return;
    const check = async () => {
      const [questionsRes, answersRes] = await Promise.all([
        supabase.from("gpt_context_questions").select("id"),
        supabase
          .from("gpt_context_answers")
          .select("question_id, answer_text")
          .eq("business_id", businessId),
      ]);
      const totalQuestions = questionsRes.data?.length || 0;
      const validAnswers = (answersRes.data || []).filter(
        (a) => (a.answer_text || "").trim().length > 0
      );
      setProfileState(
        totalQuestions === 0 || validAnswers.length < totalQuestions
          ? "incomplete"
          : "ready"
      );
    };
    check();
  }, [businessId]);

  // Welcome message (only when profile ready and no messages yet)
  useEffect(() => {
    if (profileState !== "ready" || messages.length > 0 || !businessName) return;
    onMessages([
      {
        role: "assistant",
        content: `¡Hola ${businessName}! Soy tu asistente para crear el Recurso de Valor. Puedes preguntarme lo que necesites en cada paso y aplicaré los cambios directamente al formulario.`,
        changes: null,
        timestamp: new Date().toISOString(),
      },
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileState, businessName]);

  // Pre-fill input suggestion when step changes
  useEffect(() => {
    if (prevStep.current === currentStep) return;
    prevStep.current = currentStep;
    const suggestion = STEP_SUGGESTIONS[currentStep];
    if (suggestion) setInput(suggestion);
  }, [currentStep]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  // Find last assistant message with pending changes
  const lastAssistantIdx = messages.map((m) => m.role).lastIndexOf("assistant");
  const pendingChanges =
    lastAssistantIdx !== -1 ? messages[lastAssistantIdx].changes : null;

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: WizardChatMessage = {
      role: "user",
      content: text,
      changes: null,
      timestamp: new Date().toISOString(),
    };
    const next = [...messages, userMsg];
    onMessages(next);
    setInput("");
    setSending(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token || "";

      const res = await fetch("/api/lead-magnet/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          businessId,
          currentState,
          messages: next,
          userMessage: text,
          currentStep,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const assistantMsg: WizardChatMessage = {
        role: "assistant",
        content: data.message || "(respuesta vacía)",
        changes: data.changes ?? null,
        timestamp: new Date().toISOString(),
      };
      onMessages([...next, assistantMsg]);
    } catch (e) {
      console.error("[LeadMagnetAiChat] send error:", e);
      onMessages([
        ...next,
        {
          role: "assistant",
          content: "Hubo un error al contactar el asistente. Inténtalo de nuevo.",
          changes: null,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const applyChanges = () => {
    if (!pendingChanges) return;
    onApply(pendingChanges);
    // Clear changes from that message so the button disappears
    const updated = messages.map((m, i) =>
      i === lastAssistantIdx ? { ...m, changes: null } : m
    );
    onMessages(updated);
  };

  // ── States ────────────────────────────────────────────────────────────────

  if (profileState === "loading") {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 flex items-center justify-center min-h-[300px]">
        <div className="text-xs text-[var(--foreground)]/50">
          Cargando asistente...
        </div>
      </div>
    );
  }

  if (profileState === "incomplete") {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-widest text-[var(--brand-1)]">
            Asistente IA
          </div>
          <h3 className="text-sm font-bold">Completa tu perfil primero</h3>
        </div>
        <p className="text-xs text-[var(--foreground)]/70 leading-relaxed">
          Para personalizar tu Recurso de Valor el asistente necesita conocer tu
          negocio. Rellena todas las preguntas del cuestionario.
        </p>
        <Link
          href="/gpt-fidelizacion"
          className="block w-full text-center px-3 py-2 rounded-lg bg-[var(--brand-1)] text-white text-xs font-semibold hover:opacity-90 transition"
        >
          Ir al cuestionario →
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] flex flex-col h-[calc(100vh-180px)] min-h-[500px] lg:sticky lg:top-6">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--brand-1)]">
          Asistente IA
        </div>
        <div className="text-sm font-bold">Recurso de Valor</div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-[var(--brand-1)] text-white rounded-br-sm"
                  : "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] rounded-bl-sm"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-[var(--background)] border border-[var(--border)] rounded-2xl rounded-bl-sm px-3 py-2 text-xs text-[var(--foreground)]/50">
              Pensando...
            </div>
          </div>
        )}
      </div>

      {/* Apply button — shown when last assistant message has changes */}
      {pendingChanges && (
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={applyChanges}
            className="w-full px-3 py-2 rounded-lg bg-[var(--brand-4)] text-black text-xs font-semibold hover:opacity-90 transition"
          >
            ✓ Aplicar Sugerencias
          </button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-[var(--border)] p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={sending}
            placeholder="Escribe tu mensaje..."
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--brand-1)]/40 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="px-3 py-2 rounded-lg bg-[var(--brand-1)] text-white text-xs font-semibold hover:opacity-90 transition disabled:opacity-40"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
