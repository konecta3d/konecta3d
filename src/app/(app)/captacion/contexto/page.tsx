"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import CaptacionChatPanel from "@/components/captacion/CaptacionChatPanel";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type FieldType = "text" | "textarea" | "objective_cards" | "resource_cards" | "channel_checkboxes" | "style_cards";

interface BlockField {
  id: string;
  label: string;
  placeholder?: string;
  type?: FieldType;
}

interface BlockConfig {
  id: string;
  title: string;
  shortDesc: string;
  sideTitle: string;
  sideExplain: string;
  sideWithout: string;
  sideWith: string;
  fields: BlockField[];
}

type ContextData = Record<string, Record<string, string>>;

// ─── Configuración de bloques ─────────────────────────────────────────────────

const BLOCKS: BlockConfig[] = [
  {
    id: "identity",
    title: "Identidad del negocio",
    shortDesc: "A qué te dedicas y qué te hace único",
    sideTitle: "¿Para qué sirve esto?",
    sideExplain:
      "El chatbot habla en tu nombre. Sin esta info genera textos que podrían ser de cualquier negocio. Con ella, cada texto suena exactamente a ti.",
    sideWithout: "«Somos una empresa dedicada a ofrecer servicios de salud.»",
    sideWith:
      "«Para atletas que no pueden permitirse estar de baja: recuperación en la mitad del tiempo.»",
    fields: [
      {
        id: "what_you_do",
        label: "¿A qué te dedicas exactamente?",
        placeholder: "Ej: Soy fisioterapeuta especializado en lesiones deportivas",
      },
      {
        id: "what_you_sell",
        label: "¿Qué servicio o producto ofreces?",
        placeholder: "Ej: Sesiones presenciales y online de recuperación post-lesión",
      },
      {
        id: "what_differentiates",
        label: "¿Qué te diferencia de la competencia?",
        placeholder:
          "Ej: Atiendo en menos de 24h con protocolo propio de recuperación acelerada",
      },
    ],
  },
  {
    id: "ideal_client",
    title: "Cliente ideal",
    shortDesc: "A quién te diriges y qué le mueve",
    sideTitle: "El corazón de toda tu estrategia",
    sideExplain:
      "Todo el copy que genera el chatbot parte de aquí. Si sabes exactamente quién es tu cliente ideal, el chatbot habla directamente a sus miedos y deseos.",
    sideWithout: "Copy para «todo el mundo» que no conecta con nadie.",
    sideWith:
      "«¿Tu hijo se ha vuelto a lesionar jugando al fútbol? Esta guía es para ti.»",
    fields: [
      {
        id: "who_they_are",
        label: "¿Quién es tu cliente ideal?",
        placeholder:
          "Ej: Deportistas amateur de 30-45 años, padres con hijos en equipos de fútbol",
      },
      {
        id: "what_problem",
        label: "¿Qué problema tiene que tú resuelves?",
        placeholder:
          "Ej: Lesiones que no curan bien, miedo a operarse, dolor crónico que limita su vida",
      },
      {
        id: "what_makes_them_leave_data",
        label: "¿Qué lo haría dejar sus datos hoy?",
        placeholder:
          "Ej: Una guía para recuperarse sin riesgo, una valoración gratuita, un descuento en primera sesión",
      },
    ],
  },
  {
    id: "tone",
    title: "Tono de comunicación",
    shortDesc: "Cómo hablas con tus clientes",
    sideTitle: "Tu voz en la plataforma",
    sideExplain:
      "El chatbot escribirá como tú hablas. Un mensaje muy formal puede alejar clientes que buscan cercanía; uno demasiado informal puede restar credibilidad.",
    sideWithout: "Textos genéricos que no suenan a ti.",
    sideWith: "Textos que parecen escritos por ti, con tu personalidad y tu forma de conectar.",
    fields: [
      {
        id: "style",
        label: "¿Cómo describes tu estilo de comunicación?",
        type: "style_cards",
      },
      {
        id: "avoid",
        label: "¿Qué palabras o frases quieres evitar?",
        placeholder:
          "Ej: Tecnicismos médicos, frases como «metodología», «sinergia» o lenguaje demasiado corporativo",
      },
      {
        id: "notes",
        label: "¿Algo más sobre cómo te comunicas?",
        placeholder:
          "Ej: Me gustan los mensajes cortos, uso emojis, prefiero ser directo y no rodear la idea",
      },
    ],
  },
  {
    id: "resources",
    title: "Recursos disponibles",
    shortDesc: "Qué puedes ofrecer a cambio de los datos",
    sideTitle: "El incentivo para captar",
    sideExplain:
      "El recurso que ofreces es la razón por la que alguien te da sus datos. Cuanto más específico para tu cliente exacto, más leads captas.",
    sideWithout: "«Descarga nuestra guía de salud.» (nadie lo descarga)",
    sideWith:
      "«5 ejercicios para volver al campo en 3 semanas sin riesgo de recaída.»",
    fields: [
      {
        id: "resource_type",
        label: "¿Qué tipo de recurso puedes ofrecer?",
        type: "resource_cards",
      },
      {
        id: "resource_value",
        label: "¿Cuál es el contenido o valor del recurso?",
        placeholder:
          "Ej: Guía de 5 ejercicios para recuperarse de una rotura de fibras en casa",
      },
      {
        id: "resource_why",
        label: "¿Por qué alguien lo querría?",
        placeholder:
          "Ej: Evita semanas de baja y permite saber si necesitas fisio o se cura solo",
      },
    ],
  },
  {
    id: "sector",
    title: "Sector y tipo de eventos",
    shortDesc: "Dónde y cómo haces captación",
    sideTitle: "El contexto donde captas",
    sideExplain:
      "No es lo mismo un congreso médico que una feria de barrio. El chatbot adapta el copy, la urgencia y el tipo de argumento según el contexto del evento.",
    sideWithout: "El mismo discurso para todos los eventos.",
    sideWith:
      "En un congreso: datos clínicos y autoridad. En una feria: beneficios claros y precio.",
    fields: [
      {
        id: "sector",
        label: "¿En qué sector trabajas?",
        placeholder: "Ej: Salud y bienestar, Fisioterapia deportiva, Clínica dental",
      },
      {
        id: "event_types",
        label: "¿En qué tipo de eventos sueles estar?",
        placeholder:
          "Ej: Congresos médicos, ferias de barrio, eventos deportivos, colegios profesionales",
      },
      {
        id: "target_geography",
        label: "¿A qué zona te diriges?",
        placeholder: "Ej: Madrid capital, zona norte de la ciudad, toda España online",
      },
    ],
  },
  {
    id: "strategic_objective",
    title: "Objetivo estratégico",
    shortDesc: "Para qué quieres captar leads",
    sideTitle: "El norte de toda la estrategia",
    sideExplain:
      "El objetivo que eliges cambia todo: el tipo de recurso, la velocidad del seguimiento y cómo el chatbot prioriza sus sugerencias.",
    sideWithout: "Campañas que captan datos sin saber qué hacer con ellos.",
    sideWith:
      "Cada decisión alineada: si quieres citas inmediatas, todo se orienta a conseguir esa primera llamada.",
    fields: [
      {
        id: "objective",
        label: "¿Cuál es tu objetivo principal de captación?",
        type: "objective_cards",
      },
      {
        id: "conversion_target",
        label: "¿Qué significa para ti que una campaña sea un éxito?",
        placeholder:
          "Ej: Conseguir 20 leads y que al menos 5 vengan a primera consulta",
      },
      {
        id: "timeline",
        label: "¿En cuánto tiempo quieres ver resultados?",
        placeholder:
          "Ej: En el evento mismo, en la semana siguiente, en el primer mes",
      },
    ],
  },
  {
    id: "post_capture",
    title: "Próximos pasos post-captación",
    shortDesc: "Qué pasa justo después de captar los datos",
    sideTitle: "El puente al cliente",
    sideExplain:
      "Captar el dato es solo el primer paso. El chatbot diseña los mensajes de seguimiento sabiendo exactamente cómo contactas y qué espera recibir el lead.",
    sideWithout: "El lead se enfría porque no sabe si vas a llamar o nunca más.",
    sideWith:
      "El lead espera tu mensaje porque le dijiste: «Te escribo mañana por WhatsApp con el PDF.»",
    fields: [
      {
        id: "contact_channel",
        label: "¿Por qué canal contactas primero?",
        type: "channel_checkboxes",
      },
      {
        id: "contact_timing",
        label: "¿Cuándo contactas después del evento?",
        placeholder: "Ej: El mismo día al llegar a casa, al día siguiente por la mañana",
      },
      {
        id: "what_you_offer_next",
        label: "¿Qué les ofreces en ese primer contacto?",
        placeholder:
          "Ej: El PDF prometido + una llamada de valoración gratuita de 15 minutos",
      },
    ],
  },
];

// ─── Opciones de campos especiales ───────────────────────────────────────────

const STYLE_OPTIONS = [
  { value: "cercano", label: "Cercano y directo", desc: "Como un amigo experto" },
  { value: "profesional", label: "Profesional y formal", desc: "Serio y sin rodeos" },
  { value: "tecnico", label: "Técnico y experto", desc: "Para un público especializado" },
  { value: "divulgativo", label: "Divulgativo y educativo", desc: "Enseñas mientras vendes" },
];

const OBJECTIVE_OPTIONS = [
  {
    value: "database",
    label: "Construir base de datos",
    desc: "Primero cantidad, después convertir. Ideal para negocios que empiezan con captación.",
    focus: "Foco: volumen de leads",
  },
  {
    value: "expert",
    label: "Posicionarte como experto",
    desc: "El cliente decide después de confiar en ti. Ideal para profesionales técnicos.",
    focus: "Foco: calidad del lead + autoridad",
    recommended: true,
  },
  {
    value: "convert",
    label: "Convertir en el acto",
    desc: "El cliente decide hoy mismo. Ideal para negocios con oferta directa y precio accesible.",
    focus: "Foco: urgencia y oferta irresistible",
  },
];

const RESOURCE_OPTIONS = [
  {
    value: "pdf",
    label: "PDF / Guía",
    desc: "Un documento descargable con consejos, checklist o información de valor.",
    ideal: "Ideal para: expertos que educan antes de vender",
    recommended: true,
  },
  {
    value: "video",
    label: "Vídeo",
    desc: "Un vídeo tuyo ya subido a YouTube, Vimeo o similar.",
    ideal: "Ideal para: demostrar tu método o resultados",
  },
  {
    value: "promo",
    label: "Promoción",
    desc: "Un descuento o regalo exclusivo por dejar los datos.",
    ideal: "Ideal para: primera cita gratis o precio especial de evento",
  },
];

const CHANNEL_OPTIONS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "llamada", label: "Llamada telefónica" },
  { value: "email", label: "Email" },
  { value: "instagram", label: "Instagram DM" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function blockStatus(blockId: string, fields: BlockField[], context: ContextData) {
  const data = context[blockId] ?? {};
  const filled = fields.filter((f) => (data[f.id] ?? "").trim().length > 0).length;
  if (filled === 0) return "empty";
  if (filled === fields.length) return "complete";
  return "partial";
}

function completedCount(context: ContextData) {
  return BLOCKS.filter((b) => blockStatus(b.id, b.fields, context) === "complete").length;
}

// ─── Componentes de campos especiales ────────────────────────────────────────

function StyleCards({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 mt-1">
      {STYLE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`p-3 rounded-lg border text-left transition-all ${
            value === opt.value
              ? "border-[var(--brand-1)] bg-[var(--brand-1)]/10"
              : "border-[var(--border)] hover:border-[var(--brand-1)]/40"
          }`}
        >
          <div className="text-xs font-semibold">{opt.label}</div>
          <div className="text-xs text-[var(--foreground)]/50 mt-0.5">{opt.desc}</div>
        </button>
      ))}
    </div>
  );
}

function ObjectiveCards({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2 mt-1">
      {OBJECTIVE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`w-full p-3 rounded-lg border text-left transition-all relative ${
            value === opt.value
              ? "border-[var(--brand-1)] bg-[var(--brand-1)]/10"
              : "border-[var(--border)] hover:border-[var(--brand-1)]/40"
          }`}
        >
          {opt.recommended && (
            <span
              className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: "var(--brand-4)", color: "black" }}
            >
              Recomendado
            </span>
          )}
          <div className="text-sm font-semibold pr-20">{opt.label}</div>
          <div className="text-xs text-[var(--foreground)]/60 mt-0.5">{opt.desc}</div>
          <div
            className="text-xs mt-1.5 font-medium"
            style={{ color: "var(--brand-1)" }}
          >
            {opt.focus}
          </div>
        </button>
      ))}
    </div>
  );
}

function ResourceCards({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
      {RESOURCE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`p-3 rounded-lg border text-left transition-all relative flex flex-col ${
            value === opt.value
              ? "border-[var(--brand-1)] bg-[var(--brand-1)]/10"
              : "border-[var(--border)] hover:border-[var(--brand-1)]/40"
          }`}
        >
          {opt.recommended && (
            <span
              className="absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded font-semibold"
              style={{ background: "var(--brand-4)", color: "black" }}
            >
              Rec
            </span>
          )}
          <div className="text-sm font-semibold">{opt.label}</div>
          <div className="text-xs text-[var(--foreground)]/60 mt-1 flex-1">{opt.desc}</div>
          <div className="text-xs mt-2 text-[var(--foreground)]/40 italic">{opt.ideal}</div>
        </button>
      ))}
    </div>
  );
}

function ChannelCheckboxes({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const selected = value ? value.split(",").filter(Boolean) : [];

  const toggle = (ch: string) => {
    const next = selected.includes(ch)
      ? selected.filter((c) => c !== ch)
      : [...selected, ch];
    onChange(next.join(","));
  };

  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {CHANNEL_OPTIONS.map((ch) => (
        <button
          key={ch.value}
          type="button"
          onClick={() => toggle(ch.value)}
          className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
            selected.includes(ch.value)
              ? "border-[var(--brand-1)] bg-[var(--brand-1)]/10 text-[var(--brand-1)]"
              : "border-[var(--border)] text-[var(--foreground)]/60 hover:border-[var(--brand-1)]/40"
          }`}
        >
          {selected.includes(ch.value) ? "✓ " : ""}
          {ch.label}
        </button>
      ))}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ContextoPage() {
  const [context, setContext] = useState<ContextData>({});
  const [openBlock, setOpenBlock] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingBlock, setSavingBlock] = useState<string | null>(null);
  const [savedBlocks, setSavedBlocks] = useState<Set<string>>(new Set());

  // Cargar sesión y contexto existente
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
      const data = await res.json();
      if (data.context) {
        setContext(data.context);
        // Marcar como guardados los bloques que ya tienen datos
        const alreadySaved = new Set<string>(
          BLOCKS.filter((b) => Object.keys(data.context[b.id] ?? {}).length > 0).map((b) => b.id)
        );
        setSavedBlocks(alreadySaved);
      }
      setLoading(false);
    };
    load();
  }, []);

  const updateField = (blockId: string, fieldId: string, value: string) => {
    setContext((prev) => ({
      ...prev,
      [blockId]: { ...(prev[blockId] ?? {}), [fieldId]: value },
    }));
  };

  const saveBlock = async (blockId: string) => {
    if (!businessId || !token) return;
    setSavingBlock(blockId);
    try {
      await fetch("/api/captacion/context", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ businessId, context }),
      });
      setSavedBlocks((prev) => new Set(prev).add(blockId));
    } finally {
      setSavingBlock(null);
    }
  };

  const renderField = (block: BlockConfig, field: BlockField) => {
    const value = context[block.id]?.[field.id] ?? "";
    const update = (v: string) => updateField(block.id, field.id, v);

    if (field.type === "style_cards") return <StyleCards value={value} onChange={update} />;
    if (field.type === "objective_cards") return <ObjectiveCards value={value} onChange={update} />;
    if (field.type === "resource_cards") return <ResourceCards value={value} onChange={update} />;
    if (field.type === "channel_checkboxes") return <ChannelCheckboxes value={value} onChange={update} />;

    const baseClass =
      "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--brand-1)] transition-colors";

    if (field.type === "textarea") {
      return (
        <textarea
          value={value}
          onChange={(e) => update(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className={`${baseClass} resize-none`}
        />
      );
    }

    return (
      <input
        type="text"
        value={value}
        onChange={(e) => update(e.target.value)}
        placeholder={field.placeholder}
        className={baseClass}
      />
    );
  };

  const completed = completedCount(context);
  const progress = Math.round((completed / BLOCKS.length) * 100);

  const handleSuggestion = (suggestion: Record<string, unknown>) => {
    const blockId = suggestion.block_id as string | undefined;
    const fieldId = suggestion.field_id as string | undefined;
    const value = suggestion.value as string | undefined;
    if (blockId && fieldId && value) {
      updateField(blockId, fieldId, value);
      setOpenBlock(blockId);
    }
  };

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
    <div className="max-w-4xl mx-auto space-y-4">

      {/* ── Header ── */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Contexto de Captación</h1>
            <p className="text-sm text-[var(--foreground)]/60 mt-1">
              Cuanta más información aportes, mejores serán las respuestas del asistente en cada sección.
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-2xl font-bold" style={{ color: "var(--brand-1)" }}>
              {completed}
            </span>
            <span className="text-sm text-[var(--foreground)]/50"> / {BLOCKS.length} bloques</span>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-[var(--foreground)]/40 mb-1.5">
            <span>Progreso del perfil</span>
            <span>{progress}% completado</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: "var(--brand-1)" }}
            />
          </div>
        </div>

        {completed === BLOCKS.length && (
          <div className="mt-3 text-sm text-green-400 bg-green-400/10 rounded-lg px-3 py-2">
            Perfil completo. El asistente tiene todo el contexto para darte las mejores respuestas.
          </div>
        )}
      </div>

      {/* ── Bloques ── */}
      <div className="space-y-3">
        {BLOCKS.map((block, blockIndex) => {
          const status = blockStatus(block.id, block.fields, context);
          const isOpen = openBlock === block.id;
          const isSaving = savingBlock === block.id;

          return (
            <div
              key={block.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden transition-all"
            >
              {/* ── Cabecera del bloque ── */}
              <button
                type="button"
                onClick={() => setOpenBlock(isOpen ? null : block.id)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-[var(--brand-1)]/5 transition-colors"
              >
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: "var(--brand-1)", color: "white" }}
                >
                  {blockIndex + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{block.title}</div>
                  <div className="text-xs text-[var(--foreground)]/50 mt-0.5 truncate">
                    {block.shortDesc}
                  </div>
                </div>

                {/* Badge de estado */}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                    status === "complete"
                      ? "bg-green-500/15 text-green-400"
                      : status === "partial"
                      ? "bg-yellow-500/15 text-yellow-400"
                      : "bg-[var(--foreground)]/8 text-[var(--foreground)]/40"
                  }`}
                >
                  {status === "complete" ? "Completo" : status === "partial" ? "En progreso" : "Vacío"}
                </span>

                {/* Chevron */}
                <svg
                  className={`w-4 h-4 flex-shrink-0 text-[var(--foreground)]/30 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* ── Contenido expandido ── */}
              {isOpen && (
                <div className="border-t border-[var(--border)]">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">

                    {/* Columna de preguntas */}
                    <div className="lg:col-span-2 p-5 space-y-4">
                      {block.fields.map((field) => (
                        <div key={field.id}>
                          <label className="block text-xs font-semibold text-[var(--foreground)]/70 mb-1.5 uppercase tracking-wide">
                            {field.label}
                          </label>
                          {renderField(block, field)}
                        </div>
                      ))}

                      {/* Botones */}
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setOpenBlock(null)}
                          className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--foreground)]/5 transition-colors"
                          style={{ color: "var(--foreground)" }}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={async () => {
                            await saveBlock(block.id);
                            setOpenBlock(null);
                          }}
                          className="px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-60 transition-colors"
                          style={{ background: "var(--brand-1)", color: "white" }}
                        >
                          {isSaving ? "Guardando..." : "Guardar bloque ✓"}
                        </button>
                      </div>
                    </div>

                    {/* Panel explicativo lateral */}
                    <div
                      className="lg:col-span-1 p-5 border-t lg:border-t-0 lg:border-l border-[var(--border)]"
                      style={{ background: "rgba(57,161,169,0.04)" }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--brand-1)" }}>
                          {block.sideTitle}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--foreground)]/70 leading-relaxed mb-4">
                        {block.sideExplain}
                      </p>

                      <div className="space-y-3">
                        <div className="rounded-lg p-3 bg-red-500/8 border border-red-500/15">
                          <div className="text-xs font-semibold text-red-400 mb-1">Sin esta info:</div>
                          <div className="text-xs text-[var(--foreground)]/60 italic">
                            {block.sideWithout}
                          </div>
                        </div>
                        <div className="rounded-lg p-3 bg-green-500/8 border border-green-500/15">
                          <div className="text-xs font-semibold text-green-400 mb-1">Con esta info:</div>
                          <div className="text-xs text-[var(--foreground)]/60 italic">
                            {block.sideWith}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Footer: CTA al asistente ── */}
      {completed >= 3 && (
        <div
          className="rounded-xl border-2 p-5 text-center"
          style={{ borderColor: "var(--brand-1)", background: "rgba(57,161,169,0.06)" }}
        >
          <p className="text-sm font-semibold mb-1">
            {completed >= BLOCKS.length
              ? "Tu perfil está completo"
              : `Tienes ${completed} bloques completados`}
          </p>
          <p className="text-xs text-[var(--foreground)]/60">
            {completed >= BLOCKS.length
              ? "El asistente de cada sección tiene todo el contexto para darte respuestas precisas y personalizadas."
              : `Completa ${BLOCKS.length - completed} bloque${BLOCKS.length - completed > 1 ? "s" : ""} más para obtener respuestas aún más precisas.`}
          </p>
        </div>
      )}

      {/* ── Asistente IA ── */}
      {!loading && businessId && token && (
        <CaptacionChatPanel
          section="contexto"
          businessId={businessId}
          token={token}
          onSuggestion={handleSuggestion}
          defaultOpen={completed === 0}
        />
      )}
    </div>
  );
}
