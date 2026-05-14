"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type {
  CaptacionForm, FormBlock, BlockType, BlockConfig,
  WelcomeConfig, SegmentationConfig, QuestionsConfig,
  CaptureConfig, FinalMessageConfig, ThankYouConfig,
  SegmentOption, Question, CaptureField,
} from "@/types/captacion";
import { BLOCK_LABELS, BLOCK_OBJECTIVES } from "@/types/captacion";

// ── Mobile preview ────────────────────────────────────────────

function WelcomePreview({ config }: { config: WelcomeConfig }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-6"
      style={{ background: config.bg_color, color: config.text_color }}>
      <div className="w-16 h-16 rounded-2xl bg-white/20 mb-5" />
      <h1 className="text-xl font-bold leading-tight mb-2">{config.title || "Título de bienvenida"}</h1>
      <p className="text-sm opacity-70">{config.subtitle || "Subtítulo del formulario"}</p>
      <button className="mt-8 px-6 py-3 rounded-xl font-semibold text-sm" style={{ background: config.text_color, color: config.bg_color }}>
        Comenzar →
      </button>
    </div>
  );
}

function SegmentationPreview({ config }: { config: SegmentationConfig }) {
  return (
    <div className="p-5 flex flex-col gap-3">
      <p className="text-sm font-semibold mb-1">¿Qué describe mejor tu situación?</p>
      {(config.options || []).map((o) => (
        <div key={o.id} className="rounded-xl border-2 p-3" style={{ borderColor: "var(--border)" }}>
          <p className="text-sm font-semibold">{o.title || "Opción"}</p>
          <p className="text-xs text-[var(--foreground)]/50 mt-0.5">{o.description}</p>
        </div>
      ))}
    </div>
  );
}

function QuestionsPreview({ config }: { config: QuestionsConfig }) {
  return (
    <div className="p-5 flex flex-col gap-4">
      {(config.questions || []).length === 0 ? (
        <p className="text-xs text-[var(--foreground)]/40 text-center py-4">Sin preguntas aún</p>
      ) : (config.questions || []).map((q) => (
        <div key={q.id}>
          <p className="text-sm font-medium mb-2">{q.text || "Pregunta"}</p>
          {q.type === "yes_no" && (
            <div className="grid grid-cols-2 gap-2">
              {["Sí", "No"].map(v => <div key={v} className="rounded-lg border text-center py-2 text-xs" style={{ borderColor: "var(--border)" }}>{v}</div>)}
            </div>
          )}
          {q.type === "multiple_choice" && (q.options || []).map((o, i) => (
            <div key={i} className="rounded-lg border px-3 py-2 text-xs mb-1.5" style={{ borderColor: "var(--border)" }}>{o}</div>
          ))}
          {q.type === "scale" && (
            <div className="flex gap-1 justify-between">
              {[1, 2, 3, 4, 5].map(n => <div key={n} className="flex-1 rounded-lg border text-center py-2 text-xs" style={{ borderColor: "var(--border)" }}>{n}</div>)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CapturePreview({ config }: { config: CaptureConfig }) {
  return (
    <div className="p-5 flex flex-col gap-3">
      <p className="text-sm font-semibold mb-1">Tus datos</p>
      {(config.fields || []).filter(f => f.enabled).map((f) => (
        <div key={f.name}>
          <label className="text-xs text-[var(--foreground)]/60 block mb-1">
            {f.label}{f.required ? " *" : ""}
          </label>
          <div className="rounded-lg border px-3 py-2.5 text-xs text-[var(--foreground)]/30"
            style={{ borderColor: "var(--border)" }}>
            {f.type === "tel" ? "+34 600 000 000" : f.type === "email" ? "email@ejemplo.com" : f.label}
          </div>
        </div>
      ))}
      <button className="mt-2 w-full py-3 rounded-xl text-sm font-semibold text-white"
        style={{ background: "var(--brand-1)" }}>
        Recibir recurso gratis
      </button>
    </div>
  );
}

function FinalMessagePreview({ config }: { config: FinalMessageConfig }) {
  return (
    <div className="p-5 flex flex-col items-center text-center gap-4 pt-10">
      <h2 className="text-lg font-bold">{config.title || "¡Tu recurso está listo!"}</h2>
      <p className="text-sm text-[var(--foreground)]/60">{config.text || "Descárgalo ahora."}</p>
      <button className="w-full py-3 rounded-xl text-sm font-semibold text-white"
        style={{ background: "var(--brand-1)" }}>
        {config.cta_text || "Descargar gratis"}
      </button>
    </div>
  );
}

function ThankYouPreview({ config }: { config: ThankYouConfig }) {
  return (
    <div className="p-5 flex flex-col items-center text-center gap-4 pt-10">
      <h2 className="text-lg font-bold">{config.title || "¡Gracias!"}</h2>
      <p className="text-sm text-[var(--foreground)]/60">{config.message}</p>
      {(config.next_steps || []).length > 0 && (
        <ul className="text-left text-xs space-y-1.5 w-full mt-2">
          {config.next_steps.map((s, i) => (
            <li key={i} className="flex items-start gap-2"><span className="text-green-400">✓</span>{s}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BlockPreview({ block }: { block: FormBlock }) {
  switch (block.type) {
    case "welcome": return <WelcomePreview config={block.config as WelcomeConfig} />;
    case "segmentation": return <SegmentationPreview config={block.config as SegmentationConfig} />;
    case "questions": return <QuestionsPreview config={block.config as QuestionsConfig} />;
    case "capture": return <CapturePreview config={block.config as CaptureConfig} />;
    case "final_message": return <FinalMessagePreview config={block.config as FinalMessageConfig} />;
    case "thank_you": return <ThankYouPreview config={block.config as ThankYouConfig} />;
    default: return <div className="p-4 text-xs text-[var(--foreground)]/40">Vista previa no disponible</div>;
  }
}

// ── Block editors ─────────────────────────────────────────────

function WelcomeEditor({ config, onChange }: { config: WelcomeConfig; onChange: (c: WelcomeConfig) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Título</label>
        <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
          value={config.title} onChange={e => onChange({ ...config, title: e.target.value })} />
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Subtítulo</label>
        <textarea className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent resize-none" rows={2}
          style={{ borderColor: "var(--border)" }}
          value={config.subtitle} onChange={e => onChange({ ...config, subtitle: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Color de fondo</label>
          <div className="flex items-center gap-2">
            <input type="color" className="w-8 h-8 rounded cursor-pointer border-0" style={{ background: "transparent" }}
              value={config.bg_color} onChange={e => onChange({ ...config, bg_color: e.target.value })} />
            <input className="flex-1 rounded-lg border px-2 py-1.5 text-xs bg-transparent font-mono" style={{ borderColor: "var(--border)" }}
              value={config.bg_color} onChange={e => onChange({ ...config, bg_color: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Color de texto</label>
          <div className="flex items-center gap-2">
            <input type="color" className="w-8 h-8 rounded cursor-pointer border-0" style={{ background: "transparent" }}
              value={config.text_color} onChange={e => onChange({ ...config, text_color: e.target.value })} />
            <input className="flex-1 rounded-lg border px-2 py-1.5 text-xs bg-transparent font-mono" style={{ borderColor: "var(--border)" }}
              value={config.text_color} onChange={e => onChange({ ...config, text_color: e.target.value })} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SegmentationEditor({ config, onChange }: { config: SegmentationConfig; onChange: (c: SegmentationConfig) => void }) {
  const addOption = () => {
    const id = `s${Date.now()}`;
    onChange({ options: [...config.options, { id, title: "", description: "" }] });
  };
  const update = (i: number, field: keyof SegmentOption, val: string) => {
    const opts = [...config.options];
    opts[i] = { ...opts[i], [field]: val };
    onChange({ options: opts });
  };
  const remove = (i: number) => {
    const opts = config.options.filter((_, j) => j !== i);
    onChange({ options: opts });
  };
  return (
    <div className="space-y-3">
      {config.options.map((o, i) => (
        <div key={o.id} className="rounded-lg border p-3 space-y-2" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--foreground)]/50">Segmento {i + 1}</span>
            <button onClick={() => remove(i)} className="text-xs text-red-400 hover:text-red-300">Eliminar</button>
          </div>
          <input className="w-full rounded-lg border px-3 py-1.5 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
            placeholder="Título" value={o.title} onChange={e => update(i, "title", e.target.value)} />
          <input className="w-full rounded-lg border px-3 py-1.5 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
            placeholder="Descripción corta" value={o.description} onChange={e => update(i, "description", e.target.value)} />
        </div>
      ))}
      <button onClick={addOption} className="w-full py-2 rounded-lg border border-dashed text-xs text-[var(--foreground)]/50 hover:border-[var(--brand-1)]/50 transition-colors"
        style={{ borderColor: "var(--border)" }}>
        + Añadir segmento
      </button>
    </div>
  );
}

function QuestionsEditor({ config, onChange }: { config: QuestionsConfig; onChange: (c: QuestionsConfig) => void }) {
  const addQ = () => {
    const id = `q${Date.now()}`;
    onChange({ questions: [...config.questions, { id, text: "", type: "yes_no", options: [] }] });
  };
  const updateQ = (i: number, field: keyof Question, val: unknown) => {
    const qs = [...config.questions];
    qs[i] = { ...qs[i], [field]: val };
    onChange({ questions: qs });
  };
  const removeQ = (i: number) => onChange({ questions: config.questions.filter((_, j) => j !== i) });

  return (
    <div className="space-y-3">
      {(config.questions || []).map((q, i) => (
        <div key={q.id} className="rounded-lg border p-3 space-y-2" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--foreground)]/50">Pregunta {i + 1}</span>
            <button onClick={() => removeQ(i)} className="text-xs text-red-400">Eliminar</button>
          </div>
          <input className="w-full rounded-lg border px-3 py-1.5 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
            placeholder="Texto de la pregunta" value={q.text} onChange={e => updateQ(i, "text", e.target.value)} />
          <select className="w-full rounded-lg border px-3 py-1.5 text-sm bg-transparent" style={{ borderColor: "var(--border)", background: "var(--card)" }}
            value={q.type} onChange={e => updateQ(i, "type", e.target.value)}>
            <option value="yes_no">Sí / No</option>
            <option value="multiple_choice">Opción múltiple</option>
            <option value="scale">Escala 1-5</option>
          </select>
          {q.type === "multiple_choice" && (
            <div className="space-y-1.5">
              {(q.options || []).map((opt, j) => (
                <div key={j} className="flex gap-2">
                  <input className="flex-1 rounded-lg border px-3 py-1 text-xs bg-transparent" style={{ borderColor: "var(--border)" }}
                    value={opt} placeholder={`Opción ${j + 1}`}
                    onChange={e => {
                      const opts = [...(q.options || [])];
                      opts[j] = e.target.value;
                      updateQ(i, "options", opts);
                    }} />
                  <button onClick={() => {
                    const opts = (q.options || []).filter((_, k) => k !== j);
                    updateQ(i, "options", opts);
                  }} className="text-xs text-red-400 px-2">×</button>
                </div>
              ))}
              <button onClick={() => updateQ(i, "options", [...(q.options || []), ""])}
                className="text-xs text-[var(--foreground)]/50 hover:text-[var(--brand-1)] transition-colors">
                + Añadir opción
              </button>
            </div>
          )}
        </div>
      ))}
      <button onClick={addQ}
        className="w-full py-2 rounded-lg border border-dashed text-xs text-[var(--foreground)]/50 hover:border-[var(--brand-1)]/50 transition-colors"
        style={{ borderColor: "var(--border)" }}>
        + Añadir pregunta
      </button>
    </div>
  );
}

function CaptureEditor({ config, onChange }: { config: CaptureConfig; onChange: (c: CaptureConfig) => void }) {
  const toggleField = (i: number, key: "enabled" | "required", val: boolean) => {
    const fields = [...config.fields];
    fields[i] = { ...fields[i], [key]: val };
    onChange({ fields });
  };
  const updateLabel = (i: number, label: string) => {
    const fields = [...config.fields];
    fields[i] = { ...fields[i], label };
    onChange({ fields });
  };
  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--foreground)]/50 mb-2">Activa los campos que quieres mostrar. Más campos = menos conversión.</p>
      {config.fields.map((f, i) => (
        <div key={f.name} className={`rounded-lg border p-3 transition-opacity ${!f.enabled ? "opacity-40" : ""}`}
          style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium">{f.label}</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-[var(--foreground)]/60 cursor-pointer">
                <input type="checkbox" checked={f.enabled} onChange={e => toggleField(i, "enabled", e.target.checked)} />
                Mostrar
              </label>
              {f.enabled && (
                <label className={`flex items-center gap-1.5 text-xs cursor-pointer ${f.name === "phone" ? "opacity-50" : ""} text-[var(--foreground)]/60`}>
                  <input type="checkbox" checked={f.required} disabled={f.name === "phone"}
                    onChange={e => toggleField(i, "required", e.target.checked)} />
                  Obligatorio
                </label>
              )}
            </div>
          </div>
          {f.enabled && (
            <input className="w-full rounded-lg border px-3 py-1.5 text-xs bg-transparent" style={{ borderColor: "var(--border)" }}
              value={f.label} onChange={e => updateLabel(i, e.target.value)}
              placeholder="Etiqueta del campo" />
          )}
        </div>
      ))}
    </div>
  );
}

function FinalMessageEditor({ config, onChange }: { config: FinalMessageConfig; onChange: (c: FinalMessageConfig) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Título</label>
        <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
          value={config.title} onChange={e => onChange({ ...config, title: e.target.value })} />
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Mensaje</label>
        <textarea className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent resize-none" rows={3}
          style={{ borderColor: "var(--border)" }}
          value={config.text} onChange={e => onChange({ ...config, text: e.target.value })} />
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Texto del botón CTA</label>
        <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
          value={config.cta_text} onChange={e => onChange({ ...config, cta_text: e.target.value })} />
      </div>
    </div>
  );
}

function ThankYouEditor({ config, onChange }: { config: ThankYouConfig; onChange: (c: ThankYouConfig) => void }) {
  const updateStep = (i: number, val: string) => {
    const steps = [...config.next_steps];
    steps[i] = val;
    onChange({ ...config, next_steps: steps });
  };
  const addStep = () => onChange({ ...config, next_steps: [...(config.next_steps || []), ""] });
  const removeStep = (i: number) => onChange({ ...config, next_steps: config.next_steps.filter((_, j) => j !== i) });

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Título</label>
        <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
          value={config.title} onChange={e => onChange({ ...config, title: e.target.value })} />
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Mensaje</label>
        <textarea className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent resize-none" rows={3}
          style={{ borderColor: "var(--border)" }}
          value={config.message} onChange={e => onChange({ ...config, message: e.target.value })} />
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Próximos pasos</label>
        <div className="space-y-2">
          {(config.next_steps || []).map((s, i) => (
            <div key={i} className="flex gap-2">
              <input className="flex-1 rounded-lg border px-3 py-1.5 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
                value={s} placeholder={`Paso ${i + 1}`} onChange={e => updateStep(i, e.target.value)} />
              <button onClick={() => removeStep(i)} className="text-xs text-red-400 px-2">×</button>
            </div>
          ))}
          <button onClick={addStep}
            className="text-xs text-[var(--foreground)]/50 hover:text-[var(--brand-1)] transition-colors">
            + Añadir paso
          </button>
        </div>
      </div>
    </div>
  );
}

function BlockEditor({ block, onChange }: { block: FormBlock; onChange: (config: BlockConfig) => void }) {
  switch (block.type) {
    case "welcome": return <WelcomeEditor config={block.config as WelcomeConfig} onChange={onChange} />;
    case "segmentation": return <SegmentationEditor config={block.config as SegmentationConfig} onChange={onChange} />;
    case "questions": return <QuestionsEditor config={block.config as QuestionsConfig} onChange={onChange} />;
    case "capture": return <CaptureEditor config={block.config as CaptureConfig} onChange={onChange} />;
    case "final_message": return <FinalMessageEditor config={block.config as FinalMessageConfig} onChange={onChange} />;
    case "thank_you": return <ThankYouEditor config={block.config as ThankYouConfig} onChange={onChange} />;
    default: return <p className="text-xs text-[var(--foreground)]/40">Editor no disponible</p>;
  }
}

// ── Main page ─────────────────────────────────────────────────

export default function FormBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [formData, setFormData] = useState<CaptacionForm | null>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [previewBlock, setPreviewBlock] = useState<FormBlock | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: s } = await supabase.auth.getSession();
      const t = s?.session?.access_token;
      if (!t) { setLoading(false); return; }
      setToken(t);
      const res = await fetch(`/api/captacion/forms/${id}`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (data.form) {
        setFormData(data.form);
        const first = data.form.blocks?.[0] || null;
        setPreviewBlock(first);
        setSelectedBlock(first?.id || null);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const updateBlock = useCallback((blockId: string, config: BlockConfig) => {
    setFormData(prev => {
      if (!prev) return prev;
      const blocks = prev.blocks.map(b => b.id === blockId ? { ...b, config } : b);
      return { ...prev, blocks };
    });
    setPreviewBlock(prev => prev?.id === blockId ? { ...prev, config } : prev);
  }, []);

  const selectBlock = (block: FormBlock) => {
    setSelectedBlock(block.id);
    setPreviewBlock(block);
  };

  const addBlock = (type: BlockType) => {
    if (!formData) return;
    const defaults: Record<BlockType, BlockConfig> = {
      welcome: { logo_type: "business", title: "Bienvenido", subtitle: "Rellena el formulario", bg_color: "#0a323c", text_color: "#ffffff" },
      segmentation: { options: [{ id: `s${Date.now()}`, title: "", description: "" }] },
      questions: { questions: [] },
      capture: { fields: [{ name: "name", label: "Nombre", required: false, enabled: true, type: "text" }, { name: "phone", label: "WhatsApp", required: true, enabled: true, type: "tel" }] },
      final_message: { title: "¡Tu recurso está listo!", text: "Descárgalo ahora.", cta_text: "Descargar gratis", lead_magnet_by_segment: {} },
      thank_you: { title: "¡Gracias!", message: "En breve nos ponemos en contacto.", next_steps: [] },
    };
    const newBlock: FormBlock = {
      id: `b${Date.now()}`,
      type,
      order: formData.blocks.length + 1,
      config: defaults[type],
    };
    setFormData(prev => prev ? { ...prev, blocks: [...prev.blocks, newBlock] } : prev);
    setSelectedBlock(newBlock.id);
    setPreviewBlock(newBlock);
  };

  const removeBlock = (blockId: string) => {
    setFormData(prev => {
      if (!prev) return prev;
      const blocks = prev.blocks.filter(b => b.id !== blockId).map((b, i) => ({ ...b, order: i + 1 }));
      return { ...prev, blocks };
    });
    if (selectedBlock === blockId) {
      setSelectedBlock(null);
      setPreviewBlock(null);
    }
  };

  const moveBlock = (blockId: string, dir: "up" | "down") => {
    setFormData(prev => {
      if (!prev) return prev;
      const blocks = [...prev.blocks];
      const i = blocks.findIndex(b => b.id === blockId);
      const j = dir === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= blocks.length) return prev;
      [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
      return { ...prev, blocks: blocks.map((b, idx) => ({ ...b, order: idx + 1 })) };
    });
  };

  const save = async () => {
    if (!formData) return;
    setSaving(true);
    const res = await fetch(`/api/captacion/forms/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ blocks: formData.blocks, status: "published" }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const activeBlock = formData?.blocks.find(b => b.id === selectedBlock) || null;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-[var(--foreground)]/50 text-sm">Cargando...</p></div>;
  }
  if (!formData) {
    return <div className="flex items-center justify-center h-64"><p className="text-red-400 text-sm">Formulario no encontrado</p></div>;
  }

  const BLOCK_TYPES: BlockType[] = ["welcome", "segmentation", "questions", "capture", "final_message", "thank_you"];

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-h-[900px]">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-sm text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors">
            ← Volver
          </button>
          <h1 className="font-bold text-lg">{formData.name}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full ${formData.status === "published" ? "bg-green-500/15 text-green-400" : "bg-yellow-500/15 text-yellow-400"}`}>
            {formData.status === "published" ? "Publicado" : "Borrador"}
          </span>
        </div>
        <button onClick={save} disabled={saving}
          className="px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
          style={{ background: saved ? "var(--brand-1)" : "var(--brand-1)", color: "white" }}>
          {saving ? "Guardando..." : saved ? "✓ Guardado" : "Guardar cambios"}
        </button>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Panel izquierdo: bloques */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-4 min-h-0">
          {/* Lista de bloques */}
          <div className="rounded-xl border overflow-hidden flex-shrink-0" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="px-3 py-2 border-b text-xs font-semibold text-[var(--foreground)]/50 uppercase tracking-wider"
              style={{ borderColor: "var(--border)" }}>
              Bloques del formulario
            </div>
            <div className="overflow-y-auto max-h-64">
              {formData.blocks.length === 0 ? (
                <p className="text-xs text-[var(--foreground)]/40 p-3">Sin bloques</p>
              ) : formData.blocks.sort((a, b) => a.order - b.order).map((b, i) => (
                <div key={b.id}
                  onClick={() => selectBlock(b)}
                  className={`flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors border-b last:border-b-0 group ${selectedBlock === b.id ? "bg-[var(--brand-1)]/10" : "hover:bg-[var(--brand-1)]/5"}`}
                  style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-[var(--foreground)]/30 w-4 flex-shrink-0">{b.order}</span>
                    <span className={`text-xs font-medium truncate ${selectedBlock === b.id ? "text-[var(--brand-1)]" : ""}`}>
                      {BLOCK_LABELS[b.type]}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={e => { e.stopPropagation(); moveBlock(b.id, "up"); }}
                      disabled={i === 0}
                      className="p-0.5 text-[var(--foreground)]/40 hover:text-[var(--foreground)] disabled:opacity-20 text-xs">▲</button>
                    <button onClick={e => { e.stopPropagation(); moveBlock(b.id, "down"); }}
                      disabled={i === formData.blocks.length - 1}
                      className="p-0.5 text-[var(--foreground)]/40 hover:text-[var(--foreground)] disabled:opacity-20 text-xs">▼</button>
                    <button onClick={e => { e.stopPropagation(); removeBlock(b.id); }}
                      className="p-0.5 text-red-400/60 hover:text-red-400 text-xs ml-1">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Añadir bloques */}
          <div className="rounded-xl border overflow-hidden flex-shrink-0" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="px-3 py-2 border-b text-xs font-semibold text-[var(--foreground)]/50 uppercase tracking-wider"
              style={{ borderColor: "var(--border)" }}>
              Añadir bloque
            </div>
            <div className="p-2 grid grid-cols-2 gap-1">
              {BLOCK_TYPES.map(t => (
                <button key={t} onClick={() => addBlock(t)}
                  className="rounded-lg border px-2 py-2 text-xs text-left hover:border-[var(--brand-1)]/50 transition-colors"
                  style={{ borderColor: "var(--border)" }}>
                  {BLOCK_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Panel central: editor */}
        <div className="flex-1 min-w-0 rounded-xl border overflow-hidden flex flex-col" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          {activeBlock ? (
            <>
              <div className="px-5 py-3 border-b flex items-start justify-between gap-3" style={{ borderColor: "var(--border)" }}>
                <div>
                  <h2 className="font-semibold text-sm">{BLOCK_LABELS[activeBlock.type]}</h2>
                  <p className="text-xs text-[var(--foreground)]/50 mt-0.5 leading-relaxed">{BLOCK_OBJECTIVES[activeBlock.type]}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <BlockEditor
                  block={activeBlock}
                  onChange={(config) => updateBlock(activeBlock.id, config)}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-[var(--foreground)]/40">Selecciona un bloque para editarlo</p>
            </div>
          )}
        </div>

        {/* Panel derecho: preview móvil */}
        <div className="w-64 flex-shrink-0 flex flex-col items-center gap-3">
          <p className="text-xs font-semibold text-[var(--foreground)]/50 uppercase tracking-wider self-start">
            Vista previa
          </p>
          {/* Marco de móvil */}
          <div className="w-full rounded-[2rem] border-4 overflow-hidden relative flex-1 max-h-[580px]"
            style={{ borderColor: "var(--border)", background: "var(--background)" }}>
            {/* Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1.5 rounded-full bg-[var(--border)] z-10" />
            <div className="pt-6 h-full overflow-y-auto text-[var(--foreground)]" style={{ fontSize: "13px" }}>
              {previewBlock ? (
                <BlockPreview block={previewBlock} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-[var(--foreground)]/30 text-center px-4">Selecciona un bloque para ver la vista previa</p>
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-[var(--foreground)]/30 text-center">
            Vista del bloque seleccionado
          </p>
        </div>
      </div>
    </div>
  );
}
