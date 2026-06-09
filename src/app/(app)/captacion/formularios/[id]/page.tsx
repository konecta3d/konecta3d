"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type {
  CaptacionForm, FormBlock, BlockType, BlockConfig,
  WelcomeConfig, SegmentationConfig, QuestionsConfig,
  CaptureConfig, FinalMessageConfig, ThankYouConfig,
  SegmentOption, Question, CaptureField, FormDesign,
} from "@/types/captacion";
import { BLOCK_LABELS, BLOCK_OBJECTIVES, DEFAULT_DESIGN } from "@/types/captacion";

// ── Paletas y fuentes ─────────────────────────────────────────

const PALETTES: { name: string; bg: string; text: string; accent: string; border: string }[] = [
  { name: "Teal",    bg: "#0a323c", text: "#ffffff", accent: "#ffb400", border: "rgba(255,255,255,0.2)"  },
  { name: "Noche",   bg: "#0f172a", text: "#ffffff", accent: "#3b82f6", border: "rgba(255,255,255,0.15)" },
  { name: "Bosque",  bg: "#1a3a2a", text: "#ffffff", accent: "#22c55e", border: "rgba(255,255,255,0.15)" },
  { name: "Coral",   bg: "#1a0a0a", text: "#ffffff", accent: "#f97316", border: "rgba(255,255,255,0.15)" },
  { name: "Pizarra", bg: "#1e293b", text: "#f8fafc", accent: "#8b5cf6", border: "rgba(255,255,255,0.15)" },
  { name: "Blanco",  bg: "#ffffff", text: "#111827", accent: "#0a323c", border: "rgba(0,0,0,0.15)"       },
];

const FONTS: { id: string; label: string; desc: string }[] = [
  { id: "Inter",      label: "Inter",      desc: "Moderna y legible"     },
  { id: "Poppins",    label: "Poppins",    desc: "Redondeada y amigable" },
  { id: "Lora",       label: "Lora",       desc: "Elegante con serifa"   },
  { id: "Montserrat", label: "Montserrat", desc: "Geométrica y fuerte"   },
];

// ── Modal de diseño ───────────────────────────────────────────

function DesignModal({
  design,
  businessLogoUrl,
  businessId,
  token,
  onApply,
  onClose,
}: {
  design: FormDesign;
  businessLogoUrl: string;
  businessId: string;
  token: string;
  onApply: (d: FormDesign, applyAll: boolean) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<FormDesign>(design);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState("");

  // Detectar fuente del logo actual
  const initSource: "none" | "business" | "upload" = local.logo_url
    ? (local.logo_url === businessLogoUrl ? "business" : "upload")
    : "none";
  const [logoSource, setLogoSource] = useState<"none" | "business" | "upload">(initSource);

  const set    = (key: keyof FormDesign, val: string)  => setLocal(prev => ({ ...prev, [key]: val }));
  const setNum = (key: keyof FormDesign, val: number)  => setLocal(prev => ({ ...prev, [key]: val }));

  const pickLogoSource = (src: "none" | "business" | "upload") => {
    setLogoSource(src);
    setLogoError("");
    if (src === "none")     setLocal(prev => ({ ...prev, logo_url: "" }));
    if (src === "business") setLocal(prev => ({ ...prev, logo_url: businessLogoUrl }));
    // "upload" mantiene la url actual hasta que se sube el archivo
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      setLogoError("Solo se admiten PNG, JPG o WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoError("El archivo no puede superar 5 MB.");
      return;
    }
    setLogoError("");
    setLogoUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("kind", "form-logo");   // no sobreescribe el logo del negocio
    form.append("businessId", businessId);
    const res = await fetch("/api/landing/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    setLogoUploading(false);
    if (!res.ok) {
      const d = await res.json();
      setLogoError(d.error || "Error al subir la imagen.");
      return;
    }
    const data = await res.json();
    setLocal(prev => ({ ...prev, logo_url: data.url }));
  };

  const COLOR_FIELDS: { key: keyof FormDesign; label: string; hint: string }[] = [
    { key: "bg_color",     label: "Fondo",  hint: "Fondo de todos los pasos"  },
    { key: "text_color",   label: "Texto",  hint: "Texto principal"            },
    { key: "accent_color", label: "Acento", hint: "Botones y selecciones"      },
    { key: "border_color", label: "Bordes", hint: "Bordes de inputs y tarjetas" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-xl rounded-2xl border overflow-hidden flex flex-col"
        style={{ background: "var(--card)", borderColor: "var(--border)", maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--border)" }}>
          <div>
            <h2 className="font-bold text-base" style={{ color: "var(--foreground)" }}>Diseño del formulario</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--foreground)", opacity: 0.5 }}>Paleta de colores y tipografía global</p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl leading-none hover:opacity-60 transition-opacity"
            style={{ color: "var(--foreground)" }}
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-6">

          {/* Paletas predefinidas */}
          <div>
            <label className="block text-xs uppercase tracking-widest font-bold mb-3" style={{ color: "var(--brand-1)" }}>
              Paletas predefinidas
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PALETTES.map(p => {
                const active = local.bg_color === p.bg && local.text_color === p.text;
                return (
                  <button
                    key={p.name}
                    onClick={() => setLocal(prev => ({
                      ...prev,
                      bg_color: p.bg,
                      text_color: p.text,
                      accent_color: p.accent,
                      border_color: p.border,
                    }))}
                    className="rounded-xl p-3 text-left border-2 transition-all"
                    style={{
                      background: p.bg,
                      borderColor: active ? p.accent : "transparent",
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: p.accent }} />
                      <div className="w-3 h-3 rounded-full" style={{ background: p.text, opacity: 0.5 }} />
                    </div>
                    <div className="text-xs font-semibold" style={{ color: p.text }}>{p.name}</div>
                    {active && (
                      <div className="text-[10px] font-bold mt-1" style={{ color: p.accent }}>Activa</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Colores personalizados */}
          <div>
            <label className="block text-xs uppercase tracking-widest font-bold mb-3" style={{ color: "var(--brand-1)" }}>
              Colores personalizados
            </label>
            <div className="grid grid-cols-2 gap-3">
              {COLOR_FIELDS.map(({ key, label, hint }) => (
                <div
                  key={key}
                  className="rounded-xl border p-3 space-y-2"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div>
                    <div className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>{label}</div>
                    <div className="text-[10px]" style={{ color: "var(--foreground)", opacity: 0.4 }}>{hint}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Color swatch + native picker */}
                    <div
                      className="relative w-9 h-9 flex-shrink-0 rounded-lg overflow-hidden border"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <div
                        className="absolute inset-0 rounded-lg"
                        style={{ background: local[key] }}
                      />
                      <input
                        type="color"
                        value={(local[key] as string).startsWith("rgba") ? "#ffffff" : (local[key] as string)}
                        onChange={e => set(key, e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                    <input
                      className="flex-1 rounded-lg border px-2 py-1.5 text-xs bg-transparent font-mono"
                      style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                      value={local[key] as string}
                      onChange={e => set(key, e.target.value)}
                      placeholder="#000000"
                      spellCheck={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tipografía */}
          <div>
            <label className="block text-xs uppercase tracking-widest font-bold mb-3" style={{ color: "var(--brand-1)" }}>
              Tipografía
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FONTS.map(f => (
                <button
                  key={f.id}
                  onClick={() => set("font_family", f.id)}
                  className="rounded-xl border-2 p-3 text-left transition-all"
                  style={{
                    borderColor: local.font_family === f.id ? "var(--brand-1)" : "var(--border)",
                    background: local.font_family === f.id ? "rgba(57,161,169,0.08)" : "transparent",
                  }}
                >
                  <div
                    className="text-base font-bold mb-0.5"
                    style={{ fontFamily: f.id, color: "var(--foreground)" }}
                  >
                    {f.label}
                  </div>
                  <div className="text-xs" style={{ color: "var(--foreground)", opacity: 0.5 }}>{f.desc}</div>
                  {local.font_family === f.id && (
                    <div className="text-[10px] font-bold mt-1" style={{ color: "var(--brand-1)" }}>Seleccionada</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Logo */}
          <div>
            <label className="block text-xs uppercase tracking-widest font-bold mb-3" style={{ color: "var(--brand-1)" }}>
              Logo
            </label>

            {/* Fuente del logo */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {([
                { id: "none",     label: "Sin logo",      desc: ""                     },
                { id: "business", label: "Logo del perfil", desc: businessLogoUrl ? "" : "Sin logo en perfil" },
                { id: "upload",   label: "Subir imagen",  desc: "PNG · JPG · WebP"     },
              ] as const).map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => pickLogoSource(opt.id)}
                  disabled={opt.id === "business" && !businessLogoUrl}
                  className="rounded-xl border-2 p-3 text-center text-xs font-medium transition-all disabled:opacity-30"
                  style={{
                    borderColor: logoSource === opt.id ? "var(--brand-1)" : "var(--border)",
                    background: logoSource === opt.id ? "rgba(57,161,169,0.08)" : "transparent",
                    color: "var(--foreground)",
                  }}
                >
                  {opt.label}
                  {opt.desc && (
                    <div className="text-[10px] opacity-40 mt-0.5 leading-tight">{opt.desc}</div>
                  )}
                </button>
              ))}
            </div>

            {/* Subida de archivo */}
            {logoSource === "upload" && (
              <div className="mb-4 space-y-2">
                <label className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-dashed cursor-pointer text-xs font-medium transition-all hover:border-[var(--brand-1)]/60"
                  style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                  {logoUploading ? (
                    <span className="opacity-60">Subiendo...</span>
                  ) : (
                    <>
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                      </svg>
                      {local.logo_url ? "Cambiar imagen" : "Seleccionar imagen"}
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={logoUploading}
                  />
                </label>
                {logoError && (
                  <p className="text-xs text-red-400">{logoError}</p>
                )}
              </div>
            )}

            {/* Preview del logo */}
            {local.logo_url && (
              <div
                className="flex items-center justify-center py-4 rounded-xl mb-4"
                style={{ background: local.bg_color }}
              >
                <img
                  src={local.logo_url}
                  alt="logo preview"
                  style={{
                    height: local.logo_size || 72,
                    width: local.logo_shape === "rect" ? (local.logo_size || 72) * 1.8 : local.logo_size || 72,
                    borderRadius:
                      local.logo_shape === "round"  ? "50%"  :
                      local.logo_shape === "square" ? "12px" : "8px",
                    objectFit: "contain",
                  }}
                  onError={e => (e.currentTarget.style.display = "none")}
                />
              </div>
            )}

            {/* Forma + tamaño (solo si hay logo) */}
            {local.logo_url && (
              <div className="space-y-4">
                {/* Forma */}
                <div>
                  <div className="text-xs font-semibold mb-2" style={{ color: "var(--foreground)", opacity: 0.7 }}>Forma</div>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { id: "round",  label: "Circular",    preview: "●" },
                      { id: "square", label: "Cuadrado",    preview: "■" },
                      { id: "rect",   label: "Rectangular", preview: "▬" },
                    ] as const).map(s => (
                      <button
                        key={s.id}
                        onClick={() => setLocal(prev => ({ ...prev, logo_shape: s.id }))}
                        className="rounded-xl border-2 py-2 text-center text-xs font-medium transition-all"
                        style={{
                          borderColor: local.logo_shape === s.id ? "var(--brand-1)" : "var(--border)",
                          background: local.logo_shape === s.id ? "rgba(57,161,169,0.08)" : "transparent",
                          color: "var(--foreground)",
                        }}
                      >
                        <div className="text-base mb-0.5">{s.preview}</div>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tamaño */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold" style={{ color: "var(--foreground)", opacity: 0.7 }}>Tamaño</div>
                    <span className="text-xs" style={{ color: "var(--foreground)", opacity: 0.5 }}>{local.logo_size || 72}px</span>
                  </div>
                  <input
                    type="range"
                    min={32}
                    max={160}
                    value={local.logo_size || 72}
                    onChange={e => setNum("logo_size", Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--foreground)", opacity: 0.3 }}>
                    <span>32px</span><span>160px</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Vista previa */}
          <div>
            <label className="block text-xs uppercase tracking-widest font-bold mb-3" style={{ color: "var(--brand-1)" }}>
              Vista previa
            </label>
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: local.bg_color, fontFamily: local.font_family }}
            >
              <div className="px-5 pt-8 pb-6 text-center" style={{ color: local.text_color }}>
                {/* Logo en preview */}
                {local.logo_url && (
                  <div className="flex justify-center mb-4">
                    <img
                      src={local.logo_url}
                      alt="logo"
                      style={{
                        height: Math.min(local.logo_size || 72, 56),
                        width: local.logo_shape === "rect" ? Math.min(local.logo_size || 72, 56) * 1.8 : Math.min(local.logo_size || 72, 56),
                        borderRadius:
                          local.logo_shape === "round"  ? "50%"  :
                          local.logo_shape === "square" ? "10px" : "6px",
                        objectFit: "contain",
                      }}
                      onError={e => (e.currentTarget.style.display = "none")}
                    />
                  </div>
                )}
                <h3 className="font-bold text-lg mb-1">Título del formulario</h3>
                <p className="text-sm mb-6" style={{ opacity: 0.6 }}>Subtítulo descriptivo del formulario</p>
                <button
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: local.accent_color, color: local.bg_color }}
                >
                  Comenzar →
                </button>
              </div>
              <div className="px-5 pb-5 space-y-2">
                {[1, 2].map(i => (
                  <div
                    key={i}
                    className="rounded-xl border p-3"
                    style={{ borderColor: local.border_color }}
                  >
                    <div className="text-sm font-semibold" style={{ color: local.text_color }}>Opción {i}</div>
                    <div className="text-xs mt-0.5" style={{ color: local.text_color, opacity: 0.5 }}>
                      Descripción de la opción
                    </div>
                  </div>
                ))}
                <button
                  className="w-full py-3 rounded-xl text-sm font-semibold mt-2"
                  style={{ background: local.accent_color, color: local.bg_color }}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t flex gap-2 flex-shrink-0" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={() => onApply(local, true)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all hover:opacity-80"
            style={{ borderColor: "var(--brand-1)", color: "var(--brand-1)" }}
          >
            Aplicar a todos los pasos
          </button>
          <button
            onClick={() => onApply(local, false)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: "var(--brand-1)", color: "white" }}
          >
            Guardar diseño
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Vista previa móvil ────────────────────────────────────────

function WelcomePreview({ config, design }: { config: WelcomeConfig; design: FormDesign }) {
  const bg  = config.bg_color   || design.bg_color;
  const col = config.text_color || design.text_color;
  const logoSize = design.logo_size || 72;
  return (
    <div
      className="h-full flex flex-col items-center justify-center text-center p-6"
      style={{ background: bg, color: col, fontFamily: design.font_family }}
    >
      {design.logo_url && (
        <img
          src={design.logo_url}
          alt="logo"
          className="mb-5"
          style={{
            height: Math.min(logoSize, 64),
            width: design.logo_shape === "rect" ? Math.min(logoSize, 64) * 1.8 : Math.min(logoSize, 64),
            borderRadius:
              design.logo_shape === "round"  ? "50%"  :
              design.logo_shape === "square" ? "10px" : "6px",
            objectFit: "contain",
          }}
        />
      )}
      <h1 className="text-xl font-bold leading-tight mb-2">{config.title || "Título de bienvenida"}</h1>
      <p className="text-sm" style={{ opacity: 0.7 }}>{config.subtitle || "Subtítulo del formulario"}</p>
      <button
        className="mt-8 px-6 py-3 rounded-xl font-semibold text-sm"
        style={{ background: design.accent_color, color: bg }}
      >
        Comenzar →
      </button>
    </div>
  );
}

function SegmentationPreview({ config, design }: { config: SegmentationConfig; design: FormDesign }) {
  return (
    <div className="p-5 flex flex-col gap-3" style={{ fontFamily: design.font_family }}>
      <p className="text-sm font-semibold mb-1" style={{ color: design.text_color }}>
        ¿Qué describe mejor tu situación?
      </p>
      {(config.options || []).map(o => (
        <div
          key={o.id}
          className="rounded-xl border-2 p-3"
          style={{ borderColor: design.border_color }}
        >
          <p className="text-sm font-semibold" style={{ color: design.text_color }}>{o.title || "Opción"}</p>
          <p className="text-xs mt-0.5" style={{ color: design.text_color, opacity: 0.5 }}>{o.description}</p>
        </div>
      ))}
    </div>
  );
}

function QuestionsPreview({ config, design }: { config: QuestionsConfig; design: FormDesign }) {
  return (
    <div className="p-5 flex flex-col gap-4" style={{ fontFamily: design.font_family }}>
      {(config.questions || []).length === 0 ? (
        <p className="text-xs text-center py-4" style={{ color: design.text_color, opacity: 0.4 }}>
          Sin preguntas aún
        </p>
      ) : (config.questions || []).map(q => (
        <div key={q.id}>
          <p className="text-sm font-medium mb-2" style={{ color: design.text_color }}>{q.text || "Pregunta"}</p>
          {q.type === "yes_no" && (
            <div className="grid grid-cols-2 gap-2">
              {["Sí", "No"].map(v => (
                <div
                  key={v}
                  className="rounded-lg border text-center py-2 text-xs"
                  style={{ borderColor: design.border_color, color: design.text_color }}
                >
                  {v}
                </div>
              ))}
            </div>
          )}
          {q.type === "multiple_choice" && (q.options || []).map((o, i) => (
            <div
              key={i}
              className="rounded-lg border px-3 py-2 text-xs mb-1.5"
              style={{ borderColor: design.border_color, color: design.text_color }}
            >
              {o}
            </div>
          ))}
          {q.type === "scale" && (
            <div className="flex gap-1 justify-between">
              {[1, 2, 3, 4, 5].map(n => (
                <div
                  key={n}
                  className="flex-1 rounded-lg border text-center py-2 text-xs"
                  style={{ borderColor: design.border_color, color: design.text_color }}
                >
                  {n}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CapturePreview({ config, design }: { config: CaptureConfig; design: FormDesign }) {
  return (
    <div className="p-5 flex flex-col gap-3" style={{ fontFamily: design.font_family }}>
      <p className="text-sm font-semibold mb-1" style={{ color: design.text_color }}>Tus datos</p>
      {(config.fields || []).filter(f => f.enabled).map(f => (
        <div key={f.name}>
          <label className="text-xs block mb-1" style={{ color: design.text_color, opacity: 0.6 }}>
            {f.label}{f.required ? " *" : ""}
          </label>
          <div
            className="rounded-lg border px-3 py-2.5 text-xs"
            style={{ borderColor: design.border_color, color: design.text_color, opacity: 0.5 }}
          >
            {f.type === "tel" ? "+34 600 000 000" : f.type === "email" ? "email@ejemplo.com" : f.label}
          </div>
        </div>
      ))}
      <button
        className="mt-2 w-full py-3 rounded-xl text-sm font-semibold"
        style={{ background: design.accent_color, color: design.bg_color }}
      >
        {config.cta_text || "Enviar"}
      </button>
    </div>
  );
}

function FinalMessagePreview({ config, design }: { config: FinalMessageConfig; design: FormDesign }) {
  return (
    <div className="p-5 flex flex-col items-center text-center gap-4 pt-10" style={{ fontFamily: design.font_family }}>
      <h2 className="text-lg font-bold" style={{ color: design.text_color }}>
        {config.title || "¡Tu recurso está listo!"}
      </h2>
      <p className="text-sm" style={{ color: design.text_color, opacity: 0.6 }}>
        {config.text || "Descárgalo ahora."}
      </p>
      <button
        className="w-full py-3 rounded-xl text-sm font-semibold"
        style={{ background: design.accent_color, color: design.bg_color }}
      >
        {config.cta_text || "Descargar gratis"}
      </button>
    </div>
  );
}

function ThankYouPreview({ config, design }: { config: ThankYouConfig; design: FormDesign }) {
  const hasWA  = !!(config.whatsapp_phone);
  const hasCta = !!(config.cta_text && config.cta_url);
  return (
    <div className="p-5 flex flex-col items-center text-center gap-3 pt-8" style={{ fontFamily: design.font_family }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: `${design.accent_color}25`, border: `2px solid ${design.accent_color}50` }}>
        <svg className="w-5 h-5" style={{ color: design.accent_color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-base font-bold" style={{ color: design.text_color }}>{config.title || "¡Gracias!"}</h2>
      <p className="text-xs" style={{ color: design.text_color, opacity: 0.6 }}>{config.message}</p>
      {(config.next_steps || []).length > 0 && (
        <ul className="text-left text-xs space-y-1.5 w-full mt-1">
          {config.next_steps.map((s, i) => (
            <li key={i} className="flex items-start gap-2">
              <span style={{ color: design.accent_color }}>✓</span>
              <span style={{ color: design.text_color }}>{s}</span>
            </li>
          ))}
        </ul>
      )}
      {hasCta && (
        <div className="w-full py-2.5 rounded-xl text-xs font-semibold text-center"
          style={{ background: design.accent_color, color: design.bg_color }}>
          {config.cta_text}
        </div>
      )}
      {hasWA && (
        <div className="w-full py-2.5 rounded-xl text-xs font-semibold text-center text-white"
          style={{ background: "#25d366" }}>
          Escríbenos por WhatsApp
        </div>
      )}
    </div>
  );
}

function BlockPreview({ block, design }: { block: FormBlock; design: FormDesign }) {
  switch (block.type) {
    case "welcome":       return <WelcomePreview       config={block.config as WelcomeConfig}       design={design} />;
    case "segmentation":  return <SegmentationPreview  config={block.config as SegmentationConfig}  design={design} />;
    case "questions":     return <QuestionsPreview      config={block.config as QuestionsConfig}      design={design} />;
    case "capture":       return <CapturePreview        config={block.config as CaptureConfig}        design={design} />;
    case "final_message": return <FinalMessagePreview   config={block.config as FinalMessageConfig}   design={design} />;
    case "thank_you":     return <ThankYouPreview       config={block.config as ThankYouConfig}       design={design} />;
    default:
      return <div className="p-4 text-xs" style={{ color: design.text_color, opacity: 0.4 }}>Vista previa no disponible</div>;
  }
}

// ── Editores de bloque (sin cambios) ──────────────────────────

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
      <p className="text-xs text-[var(--foreground)]/40">
        Los colores de este bloque se sincronizan con el diseño global. Usa el botón "Diseño" para cambiarlos.
      </p>
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
  const remove = (i: number) => onChange({ options: config.options.filter((_, j) => j !== i) });
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
      <button onClick={addOption}
        className="w-full py-2 rounded-lg border border-dashed text-xs text-[var(--foreground)]/50 hover:border-[var(--brand-1)]/50 transition-colors"
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
          <select className="w-full rounded-lg border px-3 py-1.5 text-sm bg-transparent"
            style={{ borderColor: "var(--border)", background: "var(--card)" }}
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
    onChange({ ...config, fields });
  };
  const updateLabel = (i: number, label: string) => {
    const fields = [...config.fields];
    fields[i] = { ...fields[i], label };
    onChange({ ...config, fields });
  };
  return (
    <div className="space-y-2">
      <div>
        <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Texto del botón</label>
        <input
          className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent"
          style={{ borderColor: "var(--border)" }}
          value={config.cta_text ?? ""}
          onChange={e => onChange({ ...config, cta_text: e.target.value })}
          placeholder="Enviar"
        />
      </div>
      <p className="text-xs text-[var(--foreground)]/50 mb-2">Activa los campos que quieres mostrar. Más campos = menos conversión.</p>
      {config.fields.map((f: CaptureField, i: number) => (
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
  const addStep    = () => onChange({ ...config, next_steps: [...(config.next_steps || []), ""] });
  const removeStep = (i: number) => onChange({ ...config, next_steps: config.next_steps.filter((_, j) => j !== i) });

  return (
    <div className="space-y-4">

      {/* Contenido principal */}
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

      {/* Próximos pasos */}
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

      <hr style={{ borderColor: "var(--border)" }} />

      {/* Botón CTA opcional */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--brand-1)" }}>
            Botón de acción
          </label>
          <span className="text-[10px] text-[var(--foreground)]/40">Opcional</span>
        </div>
        <p className="text-xs text-[var(--foreground)]/40 mb-3">
          Lleva al cliente a tu web, Instagram, tienda online…
        </p>
        <div className="space-y-2">
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent"
            style={{ borderColor: "var(--border)" }}
            placeholder="Texto del botón (ej: Visitar nuestra web)"
            value={config.cta_text || ""}
            onChange={e => onChange({ ...config, cta_text: e.target.value })}
          />
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent font-mono text-xs"
            style={{ borderColor: "var(--border)" }}
            placeholder="URL (ej: https://miweb.com)"
            value={config.cta_url || ""}
            onChange={e => onChange({ ...config, cta_url: e.target.value })}
          />
        </div>
        {config.cta_text && !config.cta_url && (
          <p className="text-xs text-yellow-400 mt-1">Añade también la URL para que el botón funcione.</p>
        )}
      </div>

      {/* WhatsApp opcional */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--brand-1)" }}>
            Botón de WhatsApp
          </label>
          <span className="text-[10px] text-[var(--foreground)]/40">Opcional</span>
        </div>
        <p className="text-xs text-[var(--foreground)]/40 mb-3">
          Un botón verde de WhatsApp para que el lead te escriba directamente.
        </p>
        <div className="space-y-2">
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent font-mono"
            style={{ borderColor: "var(--border)" }}
            placeholder="Teléfono con prefijo (ej: +34600000000)"
            value={config.whatsapp_phone || ""}
            onChange={e => onChange({ ...config, whatsapp_phone: e.target.value })}
          />
          <textarea
            className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent resize-none"
            style={{ borderColor: "var(--border)" }}
            rows={2}
            placeholder="Mensaje predefinido (opcional)"
            value={config.whatsapp_text || ""}
            onChange={e => onChange({ ...config, whatsapp_text: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

function BlockEditor({ block, onChange }: { block: FormBlock; onChange: (config: BlockConfig) => void }) {
  switch (block.type) {
    case "welcome":       return <WelcomeEditor       config={block.config as WelcomeConfig}       onChange={onChange} />;
    case "segmentation":  return <SegmentationEditor  config={block.config as SegmentationConfig}  onChange={onChange} />;
    case "questions":     return <QuestionsEditor      config={block.config as QuestionsConfig}      onChange={onChange} />;
    case "capture":       return <CaptureEditor        config={block.config as CaptureConfig}        onChange={onChange} />;
    case "final_message": return <FinalMessageEditor   config={block.config as FinalMessageConfig}   onChange={onChange} />;
    case "thank_you":     return <ThankYouEditor       config={block.config as ThankYouConfig}       onChange={onChange} />;
    default: return <p className="text-xs text-[var(--foreground)]/40">Editor no disponible</p>;
  }
}

// ── Página principal ──────────────────────────────────────────

export default function FormBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [formData, setFormData]           = useState<CaptacionForm | null>(null);
  const [design, setDesign]               = useState<FormDesign>(DEFAULT_DESIGN);
  const [businessLogoUrl, setBusinessLogoUrl] = useState("");
  const [token, setToken]                 = useState("");
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [saved, setSaved]                 = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [previewBlock, setPreviewBlock]   = useState<FormBlock | null>(null);
  const [showDesignModal, setShowDesignModal] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");

  const previewWrapRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale]   = useState(1);
  const [mobileTab, setMobileTab]         = useState<"bloques" | "editor" | "preview">("bloques");

  // Cargar fuentes de Google
  useEffect(() => {
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Lora:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@400;600;700&display=swap";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  // Cargar formulario
  useEffect(() => {
    const load = async () => {
      const { data: s } = await supabase.auth.getSession();
      const t = s?.session?.access_token;
      if (!t) { setLoading(false); return; }
      setToken(t);

      const res  = await fetch(`/api/captacion/forms/${id}`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();

      if (data.form) {
        setFormData(data.form);
        const savedDesign = data.form.design ? { ...DEFAULT_DESIGN, ...data.form.design } : DEFAULT_DESIGN;
        setDesign(savedDesign);
        const first = data.form.blocks?.[0] || null;
        setPreviewBlock(first);
        setSelectedBlock(first?.id || null);

        // Cargar logo del negocio para ofrecer "Logo del perfil"
        const { data: biz } = await supabase
          .from("businesses")
          .select("logo_url")
          .eq("id", data.form.business_id)
          .single();
        if (biz?.logo_url) setBusinessLogoUrl(biz.logo_url);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  // Actualizar un bloque
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
    // En móvil, saltar al tab de editor al seleccionar un bloque
    setMobileTab("editor");
  };

  // Añadir bloque
  const addBlock = (type: BlockType) => {
    if (!formData) return;
    const defaults: Record<BlockType, BlockConfig> = {
      welcome:       { logo_type: "business", title: "Bienvenido", subtitle: "Rellena el formulario", bg_color: design.bg_color, text_color: design.text_color },
      segmentation:  { options: [{ id: `s${Date.now()}`, title: "", description: "" }] },
      questions:     { questions: [] },
      capture:       { fields: [{ name: "name", label: "Nombre", required: false, enabled: true, type: "text" }, { name: "phone", label: "WhatsApp", required: true, enabled: true, type: "tel" }] },
      final_message: { title: "¡Tu recurso está listo!", text: "Descárgalo ahora.", cta_text: "Descargar gratis", lead_magnet_by_segment: {} },
      thank_you:     { title: "¡Gracias!", message: "En breve nos ponemos en contacto.", next_steps: [] },
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
      const blocks = prev.blocks
        .filter(b => b.id !== blockId)
        .map((b, i) => ({ ...b, order: i + 1 }));
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

  // Aplicar diseño global
  const applyDesign = (newDesign: FormDesign, applyAll: boolean) => {
    setDesign(newDesign);

    if (applyAll && formData) {
      setFormData(prev => {
        if (!prev) return prev;
        const blocks = prev.blocks.map(b => {
          if (b.type === "welcome") {
            const cfg = b.config as WelcomeConfig;
            return { ...b, config: { ...cfg, bg_color: newDesign.bg_color, text_color: newDesign.text_color } };
          }
          return b;
        });
        return { ...prev, blocks };
      });
      // Sincronizar previewBlock si es welcome
      setPreviewBlock(prev => {
        if (!prev || prev.type !== "welcome") return prev;
        const cfg = prev.config as WelcomeConfig;
        return { ...prev, config: { ...cfg, bg_color: newDesign.bg_color, text_color: newDesign.text_color } };
      });
    }

    setShowDesignModal(false);
  };

  // Guardar solo el nombre
  const saveName = async (name: string) => {
    if (!name.trim() || name === formData?.name) { setEditingName(false); return; }
    await fetch(`/api/captacion/forms/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: name.trim() }),
    });
    setFormData(prev => prev ? { ...prev, name: name.trim() } : prev);
    setEditingName(false);
  };

  // Guardar
  const save = async () => {
    if (!formData) return;
    setSaving(true);
    const res = await fetch(`/api/captacion/forms/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ blocks: formData.blocks, design, status: "published" }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  // Escalar preview
  useEffect(() => {
    if (!previewWrapRef.current) return;
    const updateScale = () => {
      if (previewWrapRef.current) {
        const w = previewWrapRef.current.clientWidth;
        setPreviewScale(Math.min(1, w / 320));
      }
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(previewWrapRef.current);
    return () => ro.disconnect();
  }, []);

  const activeBlock = formData?.blocks.find(b => b.id === selectedBlock) || null;
  const BLOCK_TYPES: BlockType[] = ["welcome", "questions", "capture", "final_message", "thank_you"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[var(--foreground)]/50 text-sm">Cargando...</p>
      </div>
    );
  }
  if (!formData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-400 text-sm">Formulario no encontrado</p>
      </div>
    );
  }

  return (
    <>
      {/* Modal de diseño */}
      {showDesignModal && (
        <DesignModal
          design={design}
          businessLogoUrl={businessLogoUrl}
          businessId={formData?.business_id ?? ""}
          token={token}
          onApply={applyDesign}
          onClose={() => setShowDesignModal(false)}
        />
      )}

      <div className="flex flex-col h-[calc(100vh-2rem)] max-h-[900px]">

        {/* Barra superior */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-sm text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors"
            >
              ← Volver
            </button>
            {editingName ? (
              <input
                autoFocus
                className="font-bold text-lg bg-transparent border-b outline-none"
                style={{ borderColor: "var(--brand-1)", color: "var(--foreground)" }}
                value={nameValue}
                onChange={e => setNameValue(e.target.value)}
                onBlur={() => saveName(nameValue)}
                onKeyDown={e => {
                  if (e.key === "Enter") saveName(nameValue);
                  if (e.key === "Escape") setEditingName(false);
                }}
              />
            ) : (
              <button
                onClick={() => { setNameValue(formData.name); setEditingName(true); }}
                className="font-bold text-lg hover:opacity-70 transition-opacity text-left"
                title="Clic para renombrar"
              >
                {formData.name}
              </button>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              formData.status === "published"
                ? "bg-green-500/15 text-green-400"
                : "bg-yellow-500/15 text-yellow-400"
            }`}>
              {formData.status === "published" ? "Publicado" : "Borrador"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Botón diseño */}
            <button
              onClick={() => setShowDesignModal(true)}
              className="px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all hover:opacity-80 flex items-center gap-2"
              style={{ borderColor: "var(--brand-1)", color: "var(--brand-1)" }}
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: design.accent_color }}
              />
              Diseño
            </button>
            {/* Botón guardar */}
            <button
              onClick={save}
              disabled={saving}
              className="px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
              style={{ background: "var(--brand-1)", color: "white" }}
            >
              {saving ? "Guardando..." : saved ? "✓ Guardado" : "Guardar cambios"}
            </button>
          </div>
        </div>

        {/* ── Tabs móvil ── */}
        <div className="flex lg:hidden gap-1 rounded-xl p-1 mb-3 flex-shrink-0"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          {([
            { id: "bloques",  label: "Bloques"  },
            { id: "editor",   label: "Editor"   },
            { id: "preview",  label: "Preview"  },
          ] as const).map(tab => (
            <button key={tab.id} onClick={() => setMobileTab(tab.id)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                mobileTab === tab.id ? "text-white" : "text-[var(--foreground)]/60 hover:text-[var(--foreground)]"
              }`}
              style={mobileTab === tab.id ? { background: "var(--brand-1)" } : {}}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex gap-4 flex-1 min-h-0">

          {/* Panel izquierdo: bloques */}
          <div className={`flex-shrink-0 flex flex-col gap-4 min-h-0 w-full lg:w-64 ${mobileTab !== "bloques" ? "hidden lg:flex" : "flex"}`}>

            {/* Lista de bloques */}
            <div className="rounded-xl border overflow-hidden flex-shrink-0"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="px-3 py-2 border-b text-xs font-semibold text-[var(--foreground)]/50 uppercase tracking-wider"
                style={{ borderColor: "var(--border)" }}>
                Bloques del formulario
              </div>
              <div className="overflow-y-auto max-h-64">
                {formData.blocks.length === 0 ? (
                  <p className="text-xs text-[var(--foreground)]/40 p-3">Sin bloques</p>
                ) : formData.blocks.sort((a, b) => a.order - b.order).map((b, i) => (
                  <div
                    key={b.id}
                    onClick={() => selectBlock(b)}
                    className={`flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors border-b last:border-b-0 group ${
                      selectedBlock === b.id ? "bg-[var(--brand-1)]/10" : "hover:bg-[var(--brand-1)]/5"
                    }`}
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-[var(--foreground)]/30 w-4 flex-shrink-0">{b.order}</span>
                      <span className={`text-xs font-medium truncate ${selectedBlock === b.id ? "text-[var(--brand-1)]" : ""}`}>
                        {BLOCK_LABELS[b.type]}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => { e.stopPropagation(); moveBlock(b.id, "up"); }}
                        disabled={i === 0}
                        className="p-0.5 text-[var(--foreground)]/40 hover:text-[var(--foreground)] disabled:opacity-20 text-xs"
                      >▲</button>
                      <button
                        onClick={e => { e.stopPropagation(); moveBlock(b.id, "down"); }}
                        disabled={i === formData.blocks.length - 1}
                        className="p-0.5 text-[var(--foreground)]/40 hover:text-[var(--foreground)] disabled:opacity-20 text-xs"
                      >▼</button>
                      <button
                        onClick={e => { e.stopPropagation(); removeBlock(b.id); }}
                        className="p-0.5 text-red-400/60 hover:text-red-400 text-xs ml-1"
                      >✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Añadir bloques */}
            <div className="rounded-xl border overflow-hidden flex-shrink-0"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="px-3 py-2 border-b text-xs font-semibold text-[var(--foreground)]/50 uppercase tracking-wider"
                style={{ borderColor: "var(--border)" }}>
                Añadir bloque
              </div>
              <div className="p-2 grid grid-cols-2 gap-1">
                {BLOCK_TYPES.map(t => (
                  <button
                    key={t}
                    onClick={() => addBlock(t)}
                    className="rounded-lg border px-2 py-2 text-xs text-left hover:border-[var(--brand-1)]/50 transition-colors"
                    style={{ borderColor: "var(--border)" }}
                  >
                    {BLOCK_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Panel central: editor */}
          <div className={`min-w-0 rounded-xl border overflow-hidden flex flex-col flex-1 ${mobileTab !== "editor" ? "hidden lg:flex" : "flex"}`}
            style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            {activeBlock ? (
              <>
                <div className="px-5 py-3 border-b flex items-start justify-between gap-3"
                  style={{ borderColor: "var(--border)" }}>
                  <div>
                    <h2 className="font-semibold text-sm">{BLOCK_LABELS[activeBlock.type]}</h2>
                    <p className="text-xs text-[var(--foreground)]/50 mt-0.5 leading-relaxed">
                      {BLOCK_OBJECTIVES[activeBlock.type]}
                    </p>
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
          <div ref={previewWrapRef} className={`flex-shrink-0 flex flex-col gap-3 w-full lg:w-80 ${mobileTab !== "preview" ? "hidden lg:flex" : "flex"}`}>

            {/* Header + step dots */}
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[var(--foreground)]/50 uppercase tracking-wider">
                Vista previa
              </p>
              <div className="flex items-center gap-1">
                {(formData?.blocks || []).sort((a, b) => a.order - b.order).map(b => (
                  <button
                    key={b.id}
                    onClick={() => selectBlock(b)}
                    title={BLOCK_LABELS[b.type]}
                    className={`rounded-full transition-all duration-200 ${
                      selectedBlock === b.id
                        ? "w-5 h-2 bg-[var(--brand-1)]"
                        : "w-2 h-2 bg-[var(--foreground)]/20 hover:bg-[var(--foreground)]/40"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Marco del teléfono */}
            <div className="flex justify-center overflow-hidden">
              <div
                style={{
                  width: "320px",
                  transform: `scale(${previewScale})`,
                  transformOrigin: "top center",
                  marginBottom: `${(previewScale - 1) * 600}px`,
                }}
              >
                <div
                  className="relative rounded-[2.5rem] overflow-hidden shadow-2xl"
                  style={{ width: "320px", border: "3px solid #1a1a1a", background: "#000" }}
                >
                  {/* Status bar */}
                  <div
                    className="flex items-center justify-between px-5 py-2"
                    style={{ background: "#000", minHeight: "44px" }}
                  >
                    <span className="text-white text-[11px] font-medium">9:41</span>
                    <div className="w-24 h-6 rounded-full bg-black border border-[#333] absolute top-2 left-1/2 -translate-x-1/2" />
                    <div className="flex items-center gap-1">
                      <svg width="16" height="12" viewBox="0 0 16 12" fill="white">
                        <rect x="0" y="4" width="3" height="8" rx="1"/>
                        <rect x="4" y="2.5" width="3" height="9.5" rx="1"/>
                        <rect x="8" y="1" width="3" height="11" rx="1"/>
                        <rect x="12" y="0" width="3" height="12" rx="1"/>
                      </svg>
                      <svg width="15" height="11" viewBox="0 0 15 11" fill="white">
                        <path d="M7.5 2.5C9.7 2.5 11.7 3.4 13.1 4.9L14.5 3.5C12.7 1.6 10.2.5 7.5.5S2.3 1.6.5 3.5L1.9 4.9C3.3 3.4 5.3 2.5 7.5 2.5z"/>
                        <path d="M7.5 6C8.9 6 10.1 6.6 11 7.5L12.4 6.1C11.1 4.8 9.4 4 7.5 4S3.9 4.8 2.6 6.1L4 7.5C4.9 6.6 6.1 6 7.5 6z"/>
                        <circle cx="7.5" cy="10" r="1.5"/>
                      </svg>
                      <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
                        <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="white" strokeOpacity="0.35"/>
                        <rect x="2" y="2" width="16" height="8" rx="2" fill="white"/>
                        <path d="M23 4.5V7.5C23.8 7.2 24.5 6.4 24.5 6S23.8 4.8 23 4.5z" fill="white" fillOpacity="0.4"/>
                      </svg>
                    </div>
                  </div>

                  {/* Contenido del formulario — usa colores del diseño */}
                  <div
                    className="overflow-y-auto"
                    style={{
                      height: "560px",
                      background: design.bg_color,
                      color: design.text_color,
                      fontFamily: design.font_family,
                    }}
                  >
                    {previewBlock ? (
                      <BlockPreview block={previewBlock} design={design} />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-3 px-6">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                          style={{ background: `${design.text_color}1a` }}>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            style={{ color: design.text_color, opacity: 0.4 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <p className="text-xs text-center leading-relaxed"
                          style={{ color: design.text_color, opacity: 0.4 }}>
                          Selecciona un bloque<br/>para ver la vista previa
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Home indicator */}
                  <div className="flex justify-center py-2" style={{ background: design.bg_color }}>
                    <div className="w-28 h-1 rounded-full" style={{ background: `${design.text_color}33` }} />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-[var(--foreground)]/30 text-center">
              {previewBlock ? `Bloque: ${BLOCK_LABELS[previewBlock.type]}` : "Vista como la ve el cliente"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
