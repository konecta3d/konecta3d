"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { buildOnboardingHtml } from "@/lib/onboarding-html";

// ─── Constantes A4 ───────────────────────────────────────────────────────────

const A4_W = 794;
const A4_H = 1123;

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Step = {
  title: string;
  time: string;
  where: string;
  bullets: string[];
};

type Feature = {
  label: string;
  desc: string;
};

type OnboardingTemplate = {
  header_subtitle: string;
  notice_text: string;
  platform_url: string;
  steps: [Step, Step, Step];
  show_features: boolean;
  features: Feature[];
  support_text: string;
  support_phone: string;
  support_btn_text: string;
  footer_text: string;
};

type Business = {
  id: string;
  name: string;
  contact_email: string | null;
  last_onboarding_password: string | null;
};

// ─── Valores por defecto ─────────────────────────────────────────────────────

const DEFAULT_TEMPLATE: OnboardingTemplate = {
  header_subtitle: "Tu presencia digital está lista. Sigue los 3 pasos para activarla.",
  notice_text: "Guarda bien estos datos. No compartas este documento con terceros.",
  platform_url: "konecta3d.vercel.app",
  show_features: true,
  steps: [
    {
      title: "Perfil de negocio",
      time: "~5 min",
      where: "Mi Negocio → Perfil",
      bullets: [
        "Sube tu logo",
        "Añade nombre, descripción y teléfono",
        "Configura tu enlace único del llavero",
      ],
    },
    {
      title: "Landing de fidelización",
      time: "~10 min",
      where: "Fidelización → Landing",
      bullets: [
        "Diseña la página que ven al escanear el llavero",
        "Añade servicios, WhatsApp y colores de tu negocio",
        "Escanea el llavero al terminar para comprobarlo",
      ],
    },
    {
      title: "Primera campaña de captación",
      time: "~15 min",
      where: "Captación → Campañas → Nueva campaña",
      bullets: [
        "Crea una campaña para tu próxima feria o evento",
        "Vincula un formulario y un recurso gratuito",
        "El llavero empieza a captar contactos automáticamente",
      ],
    },
  ],
  features: [
    { label: "Mi Negocio", desc: "tu identidad digital y enlace NFC" },
    { label: "Fidelización", desc: "landing, recursos de valor y comunicación" },
    { label: "Captación", desc: "formularios, campañas y gestión de leads" },
  ],
  support_text: "Si tienes cualquier pregunta durante la configuración, escríbenos.",
  support_phone: "34623759451",
  support_btn_text: "Equipo Konecta3D",
  footer_text: "Documento personal con credenciales de acceso. No lo compartas con terceros.",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

// ─── Componentes reutilizables ────────────────────────────────────────────────

function BulletList({
  bullets,
  onChange,
}: {
  bullets: string[];
  onChange: (b: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      {bullets.map((b, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-[var(--brand-1)] text-lg leading-none flex-shrink-0">·</span>
          <input
            type="text"
            value={b}
            onChange={(e) => {
              const next = [...bullets];
              next[i] = e.target.value;
              onChange(next);
            }}
            className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-transparent text-sm"
          />
          <button
            type="button"
            onClick={() => onChange(bullets.filter((_, j) => j !== i))}
            className="text-red-400 hover:text-red-300 text-xs px-2 py-1.5 rounded hover:bg-red-500/10 transition-colors flex-shrink-0"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...bullets, ""])}
        className="text-xs text-[var(--brand-1)] hover:underline mt-1"
      >
        + Añadir bullet
      </button>
    </div>
  );
}

function StepEditor({
  index,
  step,
  onChange,
}: {
  index: number;
  step: Step;
  onChange: (s: Step) => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] p-5 space-y-4">
      <div className="flex items-center gap-3 mb-1">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ background: "var(--brand-1)" }}
        >
          {index + 1}
        </div>
        <span className="text-sm font-semibold text-[var(--foreground)]/70 uppercase tracking-wide">
          Paso {index + 1}
        </span>
      </div>

      <div className="grid sm:grid-cols-[1fr_auto] gap-3">
        <div>
          <label className="block text-xs text-[var(--foreground)]/50 mb-1">Título</label>
          <input
            type="text"
            value={step.title}
            onChange={(e) => onChange({ ...step, title: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm"
          />
        </div>
        <div className="w-28">
          <label className="block text-xs text-[var(--foreground)]/50 mb-1">Tiempo</label>
          <input
            type="text"
            value={step.time}
            onChange={(e) => onChange({ ...step, time: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm"
            placeholder="~5 min"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-[var(--foreground)]/50 mb-1">Ruta de navegación</label>
        <input
          type="text"
          value={step.where}
          onChange={(e) => onChange({ ...step, where: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm font-mono"
          placeholder="Mi Negocio → Perfil"
        />
      </div>

      <div>
        <label className="block text-xs text-[var(--foreground)]/50 mb-2">Bullets</label>
        <BulletList
          bullets={step.bullets}
          onChange={(b) => onChange({ ...step, bullets: b })}
        />
      </div>
    </div>
  );
}

// ─── Preview A4 con iframe ────────────────────────────────────────────────────

function OnboardingPreview({ html }: { html: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.45);

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.offsetWidth;
      if (w > 0) setScale(w / A4_W);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const wrapperHeight = Math.round(A4_H * scale);

  return (
    <div
      ref={containerRef}
      className="rounded-xl border border-[var(--border)] overflow-hidden w-full"
      style={{ background: "#f0f0f0" }}
    >
      <div style={{ position: "relative", height: `${wrapperHeight}px`, overflow: "hidden" }}>
        <iframe
          srcDoc={html}
          title="Vista previa Onboarding"
          sandbox="allow-scripts allow-same-origin"
          allow="clipboard-write"
          style={{
            width: `${A4_W}px`,
            height: `${A4_H}px`,
            border: "none",
            transformOrigin: "top left",
            transform: `scale(${scale})`,
            position: "absolute",
            top: 0,
            left: 0,
            display: "block",
          }}
        />
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function OnboardingEditorPage() {
  // ── Template (contenido guardado en Supabase) ──
  const [template, setTemplate] = useState<OnboardingTemplate>(deepClone(DEFAULT_TEMPLATE));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // ── Preview data (negocio seleccionado, solo para la vista previa) ──
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBizId, setSelectedBizId] = useState("");
  const [previewName, setPreviewName] = useState("Nombre del Negocio");
  const [previewEmail, setPreviewEmail] = useState("cliente@ejemplo.com");
  const [previewPassword, setPreviewPassword] = useState("ContraseñaEjemplo");

  // ── HTML en tiempo real ──
  const previewHtml = useMemo(
    () => buildOnboardingHtml(previewName, previewEmail, previewPassword, template),
    [template, previewName, previewEmail, previewPassword]
  );

  // ── Carga template desde Supabase ──
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "onboarding_template")
        .single();

      if (data?.value) {
        const saved =
          typeof data.value === "string" ? JSON.parse(data.value) : data.value;
        setTemplate({ ...deepClone(DEFAULT_TEMPLATE), ...saved });
      }
      setLoading(false);
    };
    load();
  }, []);

  // ── Carga lista de negocios ──
  useEffect(() => {
    const loadBiz = async () => {
      const { data } = await supabase
        .from("businesses")
        .select("id, name, contact_email, last_onboarding_password")
        .order("name");
      if (data) setBusinesses(data as Business[]);
    };
    loadBiz();
  }, []);

  // ── Selección de negocio ──
  const handleBizSelect = (id: string) => {
    setSelectedBizId(id);
    if (!id) {
      setPreviewName("Nombre del Negocio");
      setPreviewEmail("cliente@ejemplo.com");
      setPreviewPassword("ContraseñaEjemplo");
      return;
    }
    const biz = businesses.find((b) => b.id === id);
    if (biz) {
      setPreviewName(biz.name);
      setPreviewEmail(biz.contact_email ?? "cliente@ejemplo.com");
      if (biz.last_onboarding_password) {
        setPreviewPassword(biz.last_onboarding_password);
      }
    }
  };

  // ── Guardar contraseña en la BD (para negocios anteriores) ──
  const savePasswordToDB = async () => {
    if (!selectedBizId || !previewPassword) return;
    setSavingPassword(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token || "";
      const res = await fetch("/api/admin/business-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ businessId: selectedBizId, password: previewPassword }),
      });
      if (res.ok) {
        // Actualizar en memoria para que el indicador "✓ cargada" aparezca
        setBusinesses((prev) =>
          prev.map((b) =>
            b.id === selectedBizId ? { ...b, last_onboarding_password: previewPassword } : b
          )
        );
        showMsg("✓ Contraseña guardada");
      } else {
        showMsg("Error al guardar la contraseña", false);
      }
    } catch {
      showMsg("Error de red", false);
    }
    setSavingPassword(false);
  };

  const showMsg = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  };

  // ── Guardar template ──
  const save = async () => {
    setSaving(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token || "";
      const res = await fetch("/api/admin/onboarding-template", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(template),
      });
      if (res.ok) showMsg("✓ Plantilla guardada");
      else showMsg("Error al guardar", false);
    } catch {
      showMsg("Error de red", false);
    }
    setSaving(false);
  };

  // ── Descargar HTML interactivo (botones Copiar funcionales) ──
  const downloadHtml = () => {
    const name = previewName.replace(/[^a-z0-9]/gi, "-").toLowerCase();
    const blob = new Blob([previewHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `onboarding-${name}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // ── Descargar PDF de muestra ──
  const downloadPreviewPdf = async () => {
    setPreviewing(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token || "";
      const res = await fetch("/api/admin/onboarding-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          template,
          businessName: previewName,
          email: previewEmail,
          password: previewPassword,
        }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "onboarding-preview.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else {
        showMsg("Error al generar el PDF", false);
      }
    } catch {
      showMsg("Error de red", false);
    }
    setPreviewing(false);
  };

  // ── Mutaciones de template ──
  const setStep = (i: number, s: Step) => {
    const next = deepClone(template);
    next.steps[i] = s;
    setTemplate(next);
  };

  const setFeature = (i: number, f: Feature) => {
    const next = deepClone(template);
    next.features[i] = f;
    setTemplate(next);
  };

  const addFeature = () =>
    setTemplate((t) => ({ ...t, features: [...t.features, { label: "", desc: "" }] }));

  const removeFeature = (i: number) =>
    setTemplate((t) => ({ ...t, features: t.features.filter((_, j) => j !== i) }));

  const resetToDefault = () => {
    if (confirm("¿Restaurar la plantilla a los valores originales?"))
      setTemplate(deepClone(DEFAULT_TEMPLATE));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div
          className="animate-spin rounded-full h-10 w-10 border-b-2"
          style={{ borderColor: "var(--brand-1)" }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto pb-12">

      {/* ── Cabecera de página ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold">Editor de Onboarding</h1>
          <p className="text-sm text-[var(--foreground)]/50 mt-0.5">
            Edita el contenido del PDF. La vista previa se actualiza en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          {msg && (
            <span
              className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                msg.ok ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
              }`}
            >
              {msg.text}
            </span>
          )}
          <button
            onClick={resetToDefault}
            className="px-3 py-2 rounded-lg border border-[var(--border)] text-xs text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors"
          >
            Restaurar
          </button>
          <button
            onClick={downloadHtml}
            className="px-3 py-2 rounded-lg border border-[var(--brand-1)]/40 text-sm font-medium text-[var(--brand-1)] hover:bg-[var(--brand-1)]/10 transition-colors"
            title="HTML con botones Copiar funcionales — se abre en el navegador"
          >
            ⬇ HTML interactivo
          </button>
          <button
            onClick={downloadPreviewPdf}
            disabled={previewing || saving}
            className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm font-medium disabled:opacity-50 transition-colors hover:bg-white/5"
          >
            {previewing ? "Generando…" : "⬇ PDF imprimible"}
          </button>
          <button
            onClick={save}
            disabled={saving || previewing}
            className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-opacity"
            style={{ background: "var(--brand-1)", color: "white" }}
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>

      {/* ── Layout 2 columnas ── */}
      <div className="grid xl:grid-cols-[1fr_400px] gap-8 items-start">

        {/* ══ Columna izquierda: formulario ══ */}
        <div className="space-y-5 min-w-0">

          {/* CABECERA DEL PDF */}
          <section
            className="rounded-xl border border-[var(--border)] p-5 space-y-4"
            style={{ background: "var(--card)" }}
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground)]/50">
              Cabecera
            </h2>

            <div>
              <label className="block text-xs text-[var(--foreground)]/50 mb-1">
                URL de la plataforma
              </label>
              <input
                type="text"
                value={template.platform_url}
                onChange={(e) => setTemplate({ ...template, platform_url: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm font-mono"
                placeholder="konecta3d.vercel.app"
              />
              <p className="text-xs text-[var(--foreground)]/30 mt-1">
                Sin https:// — aparece en las credenciales del header
              </p>
            </div>

            <div>
              <label className="block text-xs text-[var(--foreground)]/50 mb-1">
                Subtítulo del header
              </label>
              <input
                type="text"
                value={template.header_subtitle}
                onChange={(e) => setTemplate({ ...template, header_subtitle: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--foreground)]/50 mb-1">
                Aviso de privacidad / credenciales
              </label>
              <input
                type="text"
                value={template.notice_text}
                onChange={(e) => setTemplate({ ...template, notice_text: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm"
              />
            </div>
          </section>

          {/* PASOS */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground)]/50 px-1">
              Pasos
            </h2>
            {template.steps.map((step, i) => (
              <StepEditor key={i} index={i} step={step} onChange={(s) => setStep(i, s)} />
            ))}
          </section>

          {/* QUÉ ENCONTRARÁS */}
          <section
            className="rounded-xl border border-[var(--border)] p-5 space-y-4"
            style={{ background: "var(--card)" }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground)]/50">
                Qué encontrarás
              </h2>
              {/* Toggle activar/desactivar sección */}
              <button
                type="button"
                onClick={() => setTemplate((t) => ({ ...t, show_features: !t.show_features }))}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                  template.show_features ? "bg-[var(--brand-1)]" : "bg-[var(--foreground)]/20"
                }`}
                role="switch"
                aria-checked={template.show_features}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                    template.show_features ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            {!template.show_features && (
              <p className="text-xs text-[var(--foreground)]/40 italic">
                Sección oculta — no aparecerá en el PDF.
              </p>
            )}
            {template.show_features && (
              <p className="text-xs text-[var(--foreground)]/40">
                Lista de perfiles/secciones que verá el cliente en el PDF.
              </p>
            )}
            {template.show_features && (
              <>
                <div className="space-y-2">
                  {template.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[var(--brand-1)] font-bold text-sm flex-shrink-0">→</span>
                      <input
                        type="text"
                        value={f.label}
                        onChange={(e) => setFeature(i, { ...f, label: e.target.value })}
                        className="w-28 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-transparent text-sm font-semibold"
                        placeholder="Etiqueta"
                      />
                      <span className="text-[var(--foreground)]/30 flex-shrink-0">—</span>
                      <input
                        type="text"
                        value={f.desc}
                        onChange={(e) => setFeature(i, { ...f, desc: e.target.value })}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-transparent text-sm"
                        placeholder="Descripción breve"
                      />
                      <button
                        type="button"
                        onClick={() => removeFeature(i)}
                        className="text-red-400 hover:text-red-300 text-xs px-2 py-1.5 rounded hover:bg-red-500/10 transition-colors flex-shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addFeature}
                  className="text-xs text-[var(--brand-1)] hover:underline"
                >
                  + Añadir item
                </button>
              </>
            )}
          </section>

          {/* SOPORTE */}
          <section
            className="rounded-xl border border-[var(--border)] p-5 space-y-4"
            style={{ background: "var(--card)" }}
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground)]/50">
              Bloque de soporte
            </h2>
            <div>
              <label className="block text-xs text-[var(--foreground)]/50 mb-1">Texto</label>
              <input
                type="text"
                value={template.support_text}
                onChange={(e) => setTemplate({ ...template, support_text: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[var(--foreground)]/50 mb-1">
                  Número WhatsApp
                </label>
                <input
                  type="text"
                  value={template.support_phone}
                  onChange={(e) => setTemplate({ ...template, support_phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm font-mono"
                  placeholder="34623759451"
                />
                <p className="text-xs text-[var(--foreground)]/30 mt-1">Sin + ni espacios</p>
              </div>
              <div>
                <label className="block text-xs text-[var(--foreground)]/50 mb-1">
                  Texto del botón CTA
                </label>
                <input
                  type="text"
                  value={template.support_btn_text}
                  onChange={(e) => setTemplate({ ...template, support_btn_text: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm"
                  placeholder="Equipo Konecta3D"
                />
              </div>
            </div>
          </section>

          {/* PIE DE PÁGINA */}
          <section
            className="rounded-xl border border-[var(--border)] p-5"
            style={{ background: "var(--card)" }}
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground)]/50 mb-3">
              Pie de página
            </h2>
            <input
              type="text"
              value={template.footer_text}
              onChange={(e) => setTemplate({ ...template, footer_text: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm"
            />
          </section>

          {/* Botones inferiores */}
          <div className="flex justify-end gap-2 pt-2 flex-wrap">
            <button
              onClick={downloadHtml}
              className="px-3 py-2 rounded-lg border border-[var(--brand-1)]/40 text-sm font-medium text-[var(--brand-1)] hover:bg-[var(--brand-1)]/10 transition-colors"
            >
              ⬇ HTML interactivo
            </button>
            <button
              onClick={downloadPreviewPdf}
              disabled={previewing || saving}
              className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm font-medium disabled:opacity-50 transition-colors hover:bg-white/5"
            >
              {previewing ? "Generando…" : "⬇ PDF imprimible"}
            </button>
            <button
              onClick={save}
              disabled={saving || previewing}
              className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
              style={{ background: "var(--brand-1)", color: "white" }}
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>

        {/* ══ Columna derecha: selector de negocio + preview ══ */}
        <div className="sticky top-6 space-y-4 hidden xl:block">

          {/* Panel de datos de preview */}
          <div
            className="rounded-xl border border-[var(--border)] p-4 space-y-3"
            style={{ background: "var(--card)" }}
          >
            <div className="flex items-center justify-between mb-0.5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/50">
                Datos del cliente
              </h2>
              <span className="text-xs text-[var(--foreground)]/25 italic">solo para preview</span>
            </div>

            {/* Selector de negocio */}
            <div>
              <label className="block text-xs text-[var(--foreground)]/50 mb-1">Negocio</label>
              <select
                value={selectedBizId}
                onChange={(e) => handleBizSelect(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm"
              >
                <option value="">— Datos de ejemplo —</option>
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Email (auto-rellena al seleccionar negocio) */}
            <div>
              <label className="block text-xs text-[var(--foreground)]/50 mb-1">Email de acceso</label>
              <input
                type="text"
                value={previewEmail}
                onChange={(e) => setPreviewEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm font-mono"
                placeholder="cliente@ejemplo.com"
              />
            </div>

            {/* Contraseña de acceso */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-[var(--foreground)]/50">
                  Contraseña de acceso
                </label>
                {selectedBizId && businesses.find(b => b.id === selectedBizId)?.last_onboarding_password && (
                  <span className="text-xs text-green-400 font-medium">✓ guardada</span>
                )}
              </div>
              <input
                type="text"
                value={previewPassword}
                onChange={(e) => setPreviewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm font-mono"
                placeholder="Contraseña actual del negocio"
              />
              {/* Botón guardar: visible solo cuando hay negocio seleccionado */}
              {selectedBizId && (
                <button
                  type="button"
                  onClick={savePasswordToDB}
                  disabled={savingPassword || !previewPassword}
                  className="mt-2 w-full px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-white/5 disabled:opacity-40 transition-colors"
                >
                  {savingPassword ? "Guardando…" : "💾 Guardar contraseña en el perfil"}
                </button>
              )}
              {!selectedBizId && (
                <p className="text-xs text-[var(--foreground)]/25 mt-1">
                  Selecciona un negocio para guardar su contraseña.
                </p>
              )}
            </div>
          </div>

          {/* Label de preview */}
          <div className="flex items-center justify-between px-0.5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/50">
              Vista previa A4
            </h2>
            <span className="text-xs text-[var(--foreground)]/25 italic">tiempo real</span>
          </div>

          {/* Preview iframe */}
          <OnboardingPreview html={previewHtml} />

          <p className="text-center text-xs text-[var(--foreground)]/25 pt-0.5">
            Los botones &ldquo;Copiar&rdquo; funcionan en la vista previa.
            <br />
            Usa &ldquo;⬇ Descargar PDF&rdquo; para obtener el archivo imprimible.
          </p>
        </div>

      </div>
    </div>
  );
}
