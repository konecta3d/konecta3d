"use client";

import { useState, useRef, useEffect } from "react";
import type { CaptacionChatSection } from "@/app/api/captacion/ai/chat/route";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  suggestion?: Record<string, unknown> | null;
  timestamp: string;
}

interface CaptacionChatPanelProps {
  section: CaptacionChatSection;
  businessId: string;
  token: string;
  /** Callback cuando el usuario pulsa "Usar esto" en una sugerencia */
  onSuggestion?: (suggestion: Record<string, unknown>) => void;
  /** Abre el panel automáticamente al montar el componente */
  defaultOpen?: boolean;
}

// ─── Quick actions por sección ────────────────────────────────────────────────

const QUICK_ACTIONS: Record<CaptacionChatSection, Array<{ label: string; prompt: string }>> = {
  lead_magnets: [
    { label: "Proponer recurso completo", prompt: "Propónme un lead magnet completo para mi negocio y el tipo de evento donde suelo estar. Usa las 4 preguntas base para estructurarlo." },
    { label: "Mejorar el título", prompt: "El título que tengo no es suficientemente específico. Propón 3 alternativas usando el problema real del cliente." },
    { label: "¿PDF, vídeo o promo?", prompt: "¿Cuál es el mejor tipo de recurso para mi sector y mis eventos? Explícame cuál te recomendarías y por qué." },
  ],
  formularios: [
    { label: "Optimizar mi formulario", prompt: "Analiza mi formulario actual y dime qué cambiaría para captar más datos con menos abandono." },
    { label: "Texto del mensaje de bienvenida", prompt: "Escríbeme un mensaje de bienvenida para el formulario que conecte inmediatamente con mi cliente ideal." },
    { label: "¿Cuántos campos pedir?", prompt: "¿Qué campos debería pedir en mi formulario para captar leads cualificados sin que lo abandonen?" },
  ],
  campanas: [
    { label: "Diseñar campaña completa", prompt: "Diseña una campaña completa para mi próximo evento. Usa las 4 preguntas como base y dame nombre, objetivo, cliente y gancho del stand." },
    { label: "Frase gancho para el stand", prompt: "Dame 3 frases gancho para usar en el stand. Deben conectar con el problema del cliente en menos de 12 palabras." },
    { label: "¿Qué cliente objetivo definir?", prompt: "Ayúdame a definir el cliente objetivo de esta campaña de forma muy específica." },
  ],
  recorrido: [
    { label: "Mensaje de primer contacto", prompt: "Escríbeme el mensaje de WhatsApp que enviará justo después del evento, entregando el recurso prometido. Listo para copiar." },
    { label: "Secuencia completa de seguimiento", prompt: "Crea una secuencia de 4 mensajes de seguimiento: contacto inmediato, 24h, 3 días y 1 semana. Cada uno listo para copiar." },
    { label: "Guion de llamada de seguimiento", prompt: "Escríbeme un guion de llamada de seguimiento para la semana después del evento. Corto, directo y orientado a conseguir una cita." },
  ],
  contexto: [
    { label: "Guíame campo a campo", prompt: "Empieza a entrevistarme para rellenar mi perfil. Hazme las preguntas una a una, empezando por el primer campo vacío." },
    { label: "¿Qué pongo aquí?", prompt: "No entiendo bien qué tengo que poner en algunos campos. Explícame el bloque de identidad con un ejemplo para mi tipo de negocio." },
    { label: "Propón respuestas", prompt: "Basándote en lo que ya sabes de mi negocio, propónme directamente una respuesta para el primer campo disponible." },
  ],
  general: [
    { label: "¿Por dónde empiezo?", prompt: "Soy nuevo en la plataforma. ¿Por dónde me recomiendas empezar para tener una campaña lista para mi próximo evento?" },
    { label: "Revisar mi estrategia", prompt: "Revisa mi perfil de captación y dime qué está bien y qué debería mejorar antes del próximo evento." },
  ],
};

const SECTION_TITLES: Record<CaptacionChatSection, string> = {
  lead_magnets: "Asistente — Lead Magnets",
  formularios: "Asistente — Formularios",
  campanas: "Asistente — Campañas",
  recorrido: "Asistente — Seguimiento",
  contexto: "Asistente — Perfil",
  general: "Asistente de Captación",
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function CaptacionChatPanel({
  section,
  businessId,
  token,
  onSuggestion,
  defaultOpen = false,
}: CaptacionChatPanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current && open) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/captacion/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          businessId,
          section,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          userMessage: text,
        }),
      });

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.message ?? "No he podido generar una respuesta. Inténtalo de nuevo.",
        suggestion: data.suggestion ?? null,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Ha ocurrido un error. Comprueba tu conexión y vuelve a intentarlo.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* ── Botón flotante ── */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg font-semibold text-sm transition-all hover:scale-105 ${
          open ? "hidden" : "flex"
        }`}
        style={{ background: "var(--brand-1)", color: "white" }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Asistente IA
        {messages.length > 0 && (
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
        )}
      </button>

      {/* ── Panel lateral ── */}
      {open && (
        <>
          {/* Overlay móvil */}
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setOpen(false)}
          />

          <div className={`
            fixed z-50 flex flex-col
            bottom-0 left-0 right-0 h-[85vh]
            md:bottom-6 md:right-6 md:left-auto md:h-[600px] md:w-[380px]
            rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden
          `}
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b"
              style={{ background: "var(--brand-1)", borderColor: "rgba(255,255,255,0.15)" }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">
                  IA
                </div>
                <div>
                  <div className="text-sm font-bold text-white leading-tight">
                    {SECTION_TITLES[section]}
                  </div>
                  <div className="text-xs text-white/60">Basado en tu perfil de captación</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-white/60 hover:text-white transition-colors p-1"
              >
                ✕
              </button>
            </div>

            {/* Quick actions */}
            {messages.length === 0 && (
              <div className="p-3 border-b border-[var(--border)]">
                <p className="text-xs text-[var(--foreground)]/40 mb-2 font-medium">Acciones rápidas:</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_ACTIONS[section].map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => sendMessage(action.prompt)}
                      className="text-xs px-2.5 py-1.5 rounded-lg border transition-colors hover:border-[var(--brand-1)]/50 hover:bg-[var(--brand-1)]/8"
                      style={{ borderColor: "var(--border)" }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold"
                    style={{ background: "rgba(57,161,169,0.15)", color: "var(--brand-1)" }}
                  >
                    IA
                  </div>
                  <div>
                    <p className="font-semibold text-sm">¿En qué puedo ayudarte?</p>
                    <p className="text-xs text-[var(--foreground)]/50 mt-1 max-w-[240px]">
                      Usa una acción rápida o escríbeme directamente.
                    </p>
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5 ${
                      msg.role === "assistant"
                        ? "text-white"
                        : "bg-[var(--foreground)]/10 text-[var(--foreground)]/60"
                    }`}
                    style={msg.role === "assistant" ? { background: "var(--brand-1)" } : undefined}
                  >
                    {msg.role === "assistant" ? "IA" : "Tu"}
                  </div>

                  {/* Burbuja */}
                  <div className={`flex-1 max-w-[88%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                    <div
                      className={`px-3 py-2.5 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "rounded-tr-sm text-white"
                          : "rounded-tl-sm border border-[var(--border)]"
                      }`}
                      style={
                        msg.role === "user"
                          ? { background: "var(--brand-1)" }
                          : { background: "var(--background)" }
                      }
                    >
                      {msg.content}
                    </div>

                    {/* Botón "Usar esto" si hay sugerencia */}
                    {msg.role === "assistant" && msg.suggestion && onSuggestion && (
                      <button
                        type="button"
                        onClick={() => onSuggestion(msg.suggestion!)}
                        className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors hover:opacity-90"
                        style={{ background: "var(--brand-4)", color: "black" }}
                      >
                        ✓ Usar esto
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading */}
              {loading && (
                <div className="flex gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                    style={{ background: "var(--brand-1)" }}
                  >
                    IA
                  </div>
                  <div
                    className="px-3 py-2.5 rounded-xl rounded-tl-sm border border-[var(--border)] flex gap-1 items-center"
                    style={{ background: "var(--background)" }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-1)] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-1)] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-1)] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-[var(--border)]">
              <div className="flex gap-2 items-end">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  rows={1}
                  placeholder="Escribe tu pregunta..."
                  className="flex-1 resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--brand-1)] transition-colors disabled:opacity-50"
                  style={{ maxHeight: "120px" }}
                  onInput={(e) => {
                    const el = e.currentTarget;
                    el.style.height = "auto";
                    el.style.height = Math.min(el.scrollHeight, 120) + "px";
                  }}
                />
                <button
                  type="button"
                  disabled={loading || !input.trim()}
                  onClick={() => sendMessage(input)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity hover:opacity-90"
                  style={{ background: "var(--brand-1)", color: "white" }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMessages([])}
                  className="w-full mt-2 text-xs text-[var(--foreground)]/30 hover:text-[var(--foreground)]/60 transition-colors"
                >
                  Nueva conversación
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
