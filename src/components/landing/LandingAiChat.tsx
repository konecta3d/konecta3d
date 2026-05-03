"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { LandingConfig } from "@/lib/landingTypes";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  changes: Partial<LandingConfig> | null;
  timestamp: string;
}

interface Props {
  businessId: string;
  businessName: string;
  config: LandingConfig;
  onApply: (changes: Partial<LandingConfig>) => void;
  onFinalize: () => Promise<void> | void;
}

type ProfileState = "loading" | "incomplete" | "ready";

export default function LandingAiChat({ businessId, businessName, config, onApply, onFinalize }: Props) {
  const [profileState, setProfileState] = useState<ProfileState>("loading");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Validar perfil del negocio: todas las preguntas del cuestionario deben estar respondidas
  useEffect(() => {
    if (!businessId) return;
    const check = async () => {
      const [questionsRes, answersRes] = await Promise.all([
        supabase.from("gpt_context_questions").select("id"),
        supabase.from("gpt_context_answers").select("question_id, answer_text").eq("business_id", businessId),
      ]);
      const totalQuestions = questionsRes.data?.length || 0;
      const validAnswers = (answersRes.data || []).filter((a) => (a.answer_text || "").trim().length > 0);
      if (totalQuestions === 0 || validAnswers.length < totalQuestions) {
        setProfileState("incomplete");
      } else {
        setProfileState("ready");
      }
    };
    check();
  }, [businessId]);

  // Bienvenida automática al iniciar (solo cuando perfil está listo y no hay mensajes)
  useEffect(() => {
    if (profileState !== "ready" || messages.length > 0 || !businessName) return;
    const welcome: ChatMessage = {
      role: "assistant",
      content: `¡Bienvenido ${businessName}, vamos a personalizar tu landing!`,
      changes: null,
      timestamp: new Date().toISOString(),
    };
    setMessages([welcome]);
  }, [profileState, businessName, messages.length]);

  // Auto-scroll al fondo cuando llega un mensaje nuevo
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const pendingChanges = lastAssistant?.changes ?? null;

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending || completed) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: text,
      changes: null,
      timestamp: new Date().toISOString(),
    };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setSending(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      const res = await fetch("/api/mi-negocio/landing/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          businessId,
          currentConfig: config,
          messages: next,
          userMessage: text,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.message || "(respuesta vacía)",
        changes: data.changes ?? null,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      console.error("chat send error:", e);
      const errMsg: ChatMessage = {
        role: "assistant",
        content: "Hubo un error al contactar el asistente. Inténtalo de nuevo.",
        changes: null,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  };

  const applyChanges = () => {
    if (!pendingChanges) return;
    onApply(pendingChanges);
    // Marcar el último mensaje del assistant como ya aplicado para que el botón desaparezca
    setMessages((prev) => {
      const idx = prev.map((m) => m.role).lastIndexOf("assistant");
      if (idx === -1) return prev;
      const copy = [...prev];
      copy[idx] = { ...copy[idx], changes: null };
      return copy;
    });
  };

  const finalize = async () => {
    if (finalizing || completed) return;
    setFinalizing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      // 1) Guardar conversación
      const res = await fetch("/api/mi-negocio/landing/chat/finalize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          businessId,
          messages,
          finalConfig: config,
        }),
      });
      if (!res.ok) {
        alert("No se pudo guardar la conversación. Revisa la consola.");
        return;
      }
      // 2) Guardar landing (delegado al padre)
      await onFinalize();
      // 3) Bloquear chat
      setCompleted(true);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Conversación cerrada y cambios guardados. ¡Listo!",
          changes: null,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      console.error("finalize error:", e);
      alert("Error al finalizar. Mira consola/Network.");
    } finally {
      setFinalizing(false);
    }
  };

  // ── Estados UI ────────────────────────────────────────────────────────────

  if (profileState === "loading") {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 flex items-center justify-center min-h-[300px]">
        <div className="text-xs text-[var(--foreground)]/50">Cargando asistente...</div>
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
          <h3 className="text-sm font-bold">Completa todas tus respuestas</h3>
        </div>
        <p className="text-xs text-[var(--foreground)]/70 leading-relaxed">
          Para que el asistente pueda personalizar tu landing necesita conocer tu negocio.
          Rellena todas las preguntas del cuestionario.
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
      {/* Cabecera */}
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--brand-1)]">
            Asistente IA
          </div>
          <div className="text-sm font-bold">Personaliza tu landing</div>
        </div>
        {completed && (
          <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold uppercase">
            Cerrado
          </span>
        )}
      </div>

      {/* Mensajes */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
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

      {/* Botón Aplicar Sugerencias */}
      {pendingChanges && !completed && (
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={applyChanges}
            className="w-full px-3 py-2 rounded-lg bg-[var(--brand-4)] text-black text-xs font-semibold hover:opacity-90 transition"
          >
            Aplicar Sugerencias
          </button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-[var(--border)] p-3 space-y-2">
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
            disabled={completed || sending}
            placeholder={completed ? "Conversación cerrada" : "Escribe tu mensaje..."}
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--brand-1)]/40 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={completed || sending || !input.trim()}
            className="px-3 py-2 rounded-lg bg-[var(--brand-1)] text-white text-xs font-semibold hover:opacity-90 transition disabled:opacity-40"
          >
            Enviar
          </button>
        </div>
        <button
          type="button"
          onClick={finalize}
          disabled={completed || finalizing || messages.length < 2}
          className="w-full px-3 py-2 rounded-lg border border-[var(--brand-3)] text-[var(--brand-3)] text-xs font-semibold hover:bg-[var(--brand-3)]/10 transition disabled:opacity-40"
        >
          {finalizing ? "Guardando..." : "Finalizar y guardar"}
        </button>
      </div>
    </div>
  );
}
