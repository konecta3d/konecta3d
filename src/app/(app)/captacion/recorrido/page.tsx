"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import CaptacionChatPanel from "@/components/captacion/CaptacionChatPanel";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ChannelType = "whatsapp" | "llamada" | "email";

interface JourneyStage {
  id: string;
  label: string;
  timing: string;
  timingLabel: string;
  channel: ChannelType;
  description: string;
  messageTemplate: string; // plantilla base que el chatbot/usuario puede editar
}

interface SavedMessage {
  stageId: string;
  channel: ChannelType;
  content: string;
  savedAt: string;
}

type JourneyData = Record<string, SavedMessage>;

// ─── Plantillas de etapas ─────────────────────────────────────────────────────

const DEFAULT_STAGES: JourneyStage[] = [
  {
    id: "inmediato",
    label: "Primer contacto",
    timing: "0h",
    timingLabel: "Mismo día (menos de 2h)",
    channel: "whatsapp",
    description: "El primer mensaje tras el evento. Entregar el recurso prometido y generar confianza.",
    messageTemplate:
      "Hola [Nombre], encantado de conocerte hoy en [Evento]. Como te prometí, aquí tienes [recurso]: [enlace]\n\nCualquier pregunta me escribes. ¡Hasta pronto!",
  },
  {
    id: "seguimiento_24h",
    label: "Seguimiento",
    timing: "24h",
    timingLabel: "Al día siguiente",
    channel: "whatsapp",
    description: "Comprobar que descargó el recurso y abrir la puerta a una conversación.",
    messageTemplate:
      "Hola [Nombre], ¿pudiste ver [recurso]? Si tienes alguna duda o quieres que hablemos de tu caso, dímelo y te llamo cuando mejor te venga.",
  },
  {
    id: "valor_3dias",
    label: "Aporte de valor",
    timing: "3d",
    timingLabel: "3-5 días después",
    channel: "email",
    description: "Enviar contenido de valor adicional. No vender todavía — generar autoridad.",
    messageTemplate:
      "Hola [Nombre],\n\nSeguimos en contacto. Quería compartirte algo que creo que te puede ayudar: [contenido/artículo/consejo].\n\nSi en algún momento quieres que hablemos de [problema que resuelves], estoy disponible.\n\nUn saludo,\n[Tu nombre]",
  },
  {
    id: "oferta_semana",
    label: "Propuesta",
    timing: "7d",
    timingLabel: "1 semana después",
    channel: "llamada",
    description: "El momento de hacer la propuesta. El lead ya te conoce y ha recibido valor.",
    messageTemplate:
      "Hola [Nombre], soy [Tu nombre]. Te llamo porque estuve pensando en lo que comentaste en [Evento] sobre [problema]. Creo que puedo ayudarte con [solución específica]. ¿Tienes 10 minutos esta semana para hablarlo?",
  },
  {
    id: "reenganche",
    label: "Reenganche",
    timing: "21d",
    timingLabel: "2-3 semanas",
    channel: "whatsapp",
    description: "Para leads que no respondieron. Un último intento con un ángulo diferente.",
    messageTemplate:
      "Hola [Nombre], sé que estás ocupado/a. Solo quería preguntarte si [problema que tienes] sigue siendo algo que quieres resolver. Si es así, me dices y hablamos. Si no, sin problema.",
  },
];

const CHANNEL_LABELS: Record<ChannelType, { label: string; color: string }> = {
  whatsapp: { label: "WhatsApp", color: "var(--brand-1)" },
  llamada: { label: "Llamada", color: "#a855f7" },
  email: { label: "Email", color: "var(--brand-4)" },
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function RecorridoPage() {
  const [businessId, setBusinessId] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [journey, setJourney] = useState<JourneyData>({});
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [editingChannel, setEditingChannel] = useState<ChannelType>("whatsapp");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [contextData, setContextData] = useState<Record<string, Record<string, string>> | null>(null);

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

      // Cargar recorrido (directo a settings) y contexto global (API) en paralelo
      const journeyKey = `captacion_journey_${biz.id}`;
      const [journeyResult, ctxRes] = await Promise.all([
        supabase.from("settings").select("value").eq("key", journeyKey).single(),
        fetch(`/api/captacion/context?businessId=${biz.id}`, {
          headers: { Authorization: `Bearer ${tok}` },
        }),
      ]);

      const ctxData = await ctxRes.json();

      if (journeyResult.data?.value?.journey) {
        setJourney(journeyResult.data.value.journey);
      }
      if (ctxData.context) {
        setContextData(ctxData.context);
      }
      setLoading(false);
    };
    load();
  }, []);

  const openStage = (stage: JourneyStage) => {
    setActiveStage(stage.id);
    const saved = journey[stage.id];
    setEditingContent(saved?.content ?? stage.messageTemplate);
    setEditingChannel(saved?.channel ?? stage.channel);
  };

  const saveMessage = async (stageId: string) => {
    if (!businessId || !token) return;
    setSaving(true);

    const updatedJourney: JourneyData = {
      ...journey,
      [stageId]: {
        stageId,
        channel: editingChannel,
        content: editingContent,
        savedAt: new Date().toISOString(),
      },
    };

    // Guardamos el recorrido bajo una key diferente para no mezclar con el contexto global
    const key = `captacion_journey_${businessId}`;
    await supabase
      .from("settings")
      .upsert({ key, value: { journey: updatedJourney } }, { onConflict: "key" });

    setJourney(updatedJourney);
    setSaving(false);
    setActiveStage(null);
  };

  const copyMessage = (stageId: string) => {
    const msg = journey[stageId]?.content ?? DEFAULT_STAGES.find(s => s.id === stageId)?.messageTemplate ?? "";
    navigator.clipboard.writeText(msg);
    setCopied(stageId);
    setTimeout(() => setCopied(null), 2000);
  };

  const personalizeTemplate = (template: string): string => {
    if (!contextData) return template;
    const identity = contextData.identity ?? {};
    const client = contextData.ideal_client ?? {};
    const resources = contextData.resources ?? {};

    return template
      .replace(/\[Tu nombre\]/g, identity.what_you_do ? "yo" : "[Tu nombre]")
      .replace(/\[recurso\]/g, resources.resource_value || "[recurso]")
      .replace(/\[problema que resuelves\]/g, identity.what_you_sell || "[lo que ofreces]")
      .replace(/\[problema que tienes\]/g, client.what_problem || "[tu problema]");
  };

  const completedStages = DEFAULT_STAGES.filter(s => journey[s.id]?.content).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--brand-1)] mx-auto mb-3" />
          <p className="text-sm text-[var(--foreground)]/50">Cargando recorrido...</p>
        </div>
      </div>
    );
  }

  const activeStageData = DEFAULT_STAGES.find(s => s.id === activeStage);

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Recorrido del Cliente</h1>
            <p className="text-sm text-[var(--foreground)]/60 mt-1">
              Los mensajes que envías a cada lead, desde el primer contacto hasta la propuesta.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs text-[var(--foreground)]/40">
              {completedStages}/{DEFAULT_STAGES.length} mensajes preparados
            </span>
            <div className="h-2 w-24 rounded-full bg-[var(--border)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(completedStages / DEFAULT_STAGES.length) * 100}%`,
                  background: "var(--brand-1)",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Timeline horizontal ── */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/40 mb-4">
          Etapas del recorrido
        </h2>

        {/* Línea de tiempo desktop */}
        <div className="hidden md:flex items-start gap-0">
          {DEFAULT_STAGES.map((stage, i) => {
            const saved = journey[stage.id];
            const isComplete = !!saved?.content;
            const ch = CHANNEL_LABELS[saved?.channel ?? stage.channel];

            return (
              <div key={stage.id} className="flex items-start flex-1">
                {/* Etapa */}
                <div className="flex flex-col items-center flex-1">
                  {/* Nodo */}
                  <button
                    type="button"
                    onClick={() => openStage(stage)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all hover:scale-110 mb-2 ${
                      activeStage === stage.id
                        ? "border-[var(--brand-1)] bg-[var(--brand-1)]/10 scale-110"
                        : isComplete
                        ? "border-green-500 bg-green-500/10 text-green-400"
                        : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--brand-1)]/50 text-[var(--foreground)]/40"
                    }`}
                  >
                    {isComplete ? "OK" : stage.timing}
                  </button>

                  {/* Info */}
                  <div className="text-center px-1">
                    <div className="text-xs font-semibold text-[var(--foreground)]/80 leading-tight">
                      {stage.label}
                    </div>
                    <div className="text-xs text-[var(--foreground)]/40 mt-0.5">
                      {stage.timingLabel}
                    </div>
                    <div
                      className="text-xs mt-1 px-2 py-0.5 rounded-full inline-block"
                      style={{ background: `${ch.color}20`, color: ch.color }}
                    >
                      {ch.label}
                    </div>
                  </div>
                </div>

                {/* Conector */}
                {i < DEFAULT_STAGES.length - 1 && (
                  <div className={`h-0.5 flex-1 mt-6 mx-1 ${isComplete ? "bg-green-500/40" : "bg-[var(--border)]"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Línea de tiempo móvil */}
        <div className="flex md:hidden flex-col gap-3">
          {DEFAULT_STAGES.map((stage) => {
            const saved = journey[stage.id];
            const isComplete = !!saved?.content;
            const ch = CHANNEL_LABELS[saved?.channel ?? stage.channel];

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => openStage(stage)}
                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                  activeStage === stage.id
                    ? "border-[var(--brand-1)] bg-[var(--brand-1)]/8"
                    : isComplete
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-[var(--border)] hover:border-[var(--brand-1)]/40"
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border ${
                    isComplete ? "border-green-500 bg-green-500/10 text-green-400" : "border-[var(--border)] text-[var(--foreground)]/40"
                  }`}
                >
                  {isComplete ? "OK" : stage.timing}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{stage.label}</div>
                  <div className="text-xs text-[var(--foreground)]/40">{stage.timingLabel}</div>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: `${ch.color}20`, color: ch.color }}
                >
                  {ch.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Editor de mensaje ── */}
      {activeStageData && (
        <div className="rounded-xl border-2 bg-[var(--card)] overflow-hidden"
          style={{ borderColor: "var(--brand-1)" }}>

          <div className="p-5 border-b border-[var(--border)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold">{activeStageData.label}</h3>
                  <span className="text-xs text-[var(--foreground)]/40">— {activeStageData.timingLabel}</span>
                </div>
                <p className="text-xs text-[var(--foreground)]/60">{activeStageData.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveStage(null)}
                className="text-[var(--foreground)]/30 hover:text-[var(--foreground)]/60 transition-colors flex-shrink-0"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Selector de canal */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/50 block mb-2">
                Canal de contacto
              </label>
              <div className="flex gap-2">
                {(Object.entries(CHANNEL_LABELS) as [ChannelType, typeof CHANNEL_LABELS[ChannelType]][]).map(([ch, info]) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => {
                      setEditingChannel(ch);
                      // Cargar plantilla del canal si es diferente
                      if (ch !== editingChannel && !journey[activeStageData.id]) {
                        setEditingContent(personalizeTemplate(activeStageData.messageTemplate));
                      }
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                      editingChannel === ch
                        ? "border-2"
                        : "border opacity-60 hover:opacity-100"
                    }`}
                    style={
                      editingChannel === ch
                        ? { borderColor: info.color, background: `${info.color}15`, color: info.color }
                        : { borderColor: "var(--border)" }
                    }
                  >
                    {info.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Texto del mensaje */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/50">
                  Mensaje
                </label>
                <button
                  type="button"
                  onClick={() => setEditingContent(personalizeTemplate(activeStageData.messageTemplate))}
                  className="text-xs text-[var(--brand-1)] hover:underline"
                >
                  ↺ Usar plantilla base
                </button>
              </div>
              <textarea
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                rows={7}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm resize-none focus:outline-none focus:border-[var(--brand-1)] transition-colors font-mono leading-relaxed"
                placeholder="Escribe tu mensaje aquí..."
              />
              <p className="text-xs text-[var(--foreground)]/30 mt-1">
                Usa [Nombre] donde quieras insertar el nombre del cliente.
              </p>
            </div>

            {/* Acciones */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveStage(null)}
                className="px-4 py-2 rounded-lg border text-sm transition-colors hover:bg-[var(--foreground)]/5"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => copyMessage(activeStageData.id)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  copied === activeStageData.id
                    ? "border-green-500/50 text-green-400"
                    : "hover:border-[var(--brand-1)]/50"
                }`}
                style={{ borderColor: copied === activeStageData.id ? undefined : "var(--border)" }}
              >
                {copied === activeStageData.id ? "✓ Copiado" : "Copiar mensaje"}
              </button>
              <button
                type="button"
                disabled={saving || !editingContent.trim()}
                onClick={() => saveMessage(activeStageData.id)}
                className="px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
                style={{ background: "var(--brand-1)", color: "white" }}
              >
                {saving ? "Guardando..." : "Guardar mensaje ✓"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Lista de mensajes guardados ── */}
      {completedStages > 0 && !activeStage && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-sm font-bold mb-4">Mensajes guardados</h2>
          <div className="space-y-3">
            {DEFAULT_STAGES.filter(s => journey[s.id]?.content).map((stage) => {
              const saved = journey[stage.id];
              const ch = CHANNEL_LABELS[saved.channel];

              return (
                <div key={stage.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border"
                  style={{ background: "var(--background)", borderColor: "var(--border)" }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="min-w-0">
                      <div className="font-medium text-sm">{stage.label}</div>
                      <div className="text-xs text-[var(--foreground)]/40 truncate mt-0.5">
                        {saved.content.substring(0, 80)}...
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: `${ch.color}20`, color: ch.color }}
                    >
                      {ch.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => openStage(stage)}
                      className="text-xs px-3 py-1 border rounded hover:border-[var(--brand-1)]/50 transition-colors"
                      style={{ borderColor: "var(--border)" }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => copyMessage(stage.id)}
                      className={`text-xs px-3 py-1 rounded font-medium transition-all ${
                        copied === stage.id
                          ? "bg-green-500/20 text-green-400"
                          : "bg-[var(--foreground)]/8 hover:bg-[var(--foreground)]/15"
                      }`}
                    >
                      {copied === stage.id ? "✓ Copiado" : "Copiar"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── CTA si no hay mensajes ── */}
      {completedStages === 0 && !activeStage && (
        <div
          className="rounded-xl border-2 border-dashed p-8 text-center"
          style={{ borderColor: "var(--border)" }}
        >
          <h3 className="font-semibold mb-1">Sin mensajes preparados</h3>
          <p className="text-sm text-[var(--foreground)]/50 mb-4">
            Haz clic en cualquier etapa de la línea de tiempo para preparar tu mensaje de seguimiento.
          </p>
          <button
            type="button"
            onClick={() => openStage(DEFAULT_STAGES[0])}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold"
            style={{ background: "var(--brand-1)", color: "white" }}
          >
            Empezar con el primer mensaje
          </button>
        </div>
      )}

      {/* ── Asistente IA ── */}
      {businessId && token && (
        <CaptacionChatPanel
          section="recorrido"
          businessId={businessId}
          token={token}
          onSuggestion={(suggestion) => {
            // Si el asistente sugiere un mensaje, lo precarga en el editor
            if (suggestion.content && activeStage) {
              setEditingContent(suggestion.content as string);
              if (suggestion.channel) {
                setEditingChannel(suggestion.channel as "whatsapp" | "llamada" | "email");
              }
            }
          }}
        />
      )}
    </div>
  );
}
