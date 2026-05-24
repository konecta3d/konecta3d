"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type {
  FidelizacionForm, FidFormBlock, FidBlockType, FidBlockConfig,
  FidWelcomeConfig, FidRatingConfig, FidNpsConfig, FidQuestionsConfig,
  FidOpenTextConfig, FidCaptureConfig, FidThankYouConfig,
  RatingCategory, FidQuestion, FormDesign, FidelizacionFeedback,
} from "@/types/fidelizacion-forms";
import { FID_BLOCK_LABELS, FID_BLOCK_OBJECTIVES, DEFAULT_FID_DESIGN } from "@/types/fidelizacion-forms";

// ── Paletas y fuentes (idéntico al editor de captación) ───────

const PALETTES: { name: string; bg: string; text: string; accent: string; border: string }[] = [
  { name: "VIP",     bg: "#1a1a2e", text: "#ffffff", accent: "#C5A059", border: "rgba(255,255,255,0.2)"  },
  { name: "Teal",    bg: "#0a323c", text: "#ffffff", accent: "#ffb400", border: "rgba(255,255,255,0.2)"  },
  { name: "Noche",   bg: "#0f172a", text: "#ffffff", accent: "#3b82f6", border: "rgba(255,255,255,0.15)" },
  { name: "Bosque",  bg: "#1a3a2a", text: "#ffffff", accent: "#22c55e", border: "rgba(255,255,255,0.15)" },
  { name: "Coral",   bg: "#1a0a0a", text: "#ffffff", accent: "#f97316", border: "rgba(255,255,255,0.15)" },
  { name: "Blanco",  bg: "#ffffff", text: "#111827", accent: "#1a1a2e", border: "rgba(0,0,0,0.15)"       },
];

const FONTS: { id: string; label: string; desc: string }[] = [
  { id: "Inter",      label: "Inter",      desc: "Moderna y legible"     },
  { id: "Poppins",    label: "Poppins",    desc: "Redondeada y amigable" },
  { id: "Lora",       label: "Lora",       desc: "Elegante con serifa"   },
  { id: "Montserrat", label: "Montserrat", desc: "Geométrica y fuerte"   },
];

// ── Modal de diseño (idéntico al de captación) ─────────────────

function DesignModal({
  design, businessLogoUrl, businessId, token, onApply, onClose,
}: {
  design: FormDesign; businessLogoUrl: string; businessId: string; token: string;
  onApply: (d: FormDesign, applyAll: boolean) => void; onClose: () => void;
}) {
  const [local, setLocal] = useState<FormDesign>(design);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState("");

  const initSource: "none" | "business" | "upload" = local.logo_url
    ? (local.logo_url === businessLogoUrl ? "business" : "upload") : "none";
  const [logoSource, setLogoSource] = useState<"none" | "business" | "upload">(initSource);

  const set    = (key: keyof FormDesign, val: string) => setLocal(prev => ({ ...prev, [key]: val }));
  const setNum = (key: keyof FormDesign, val: number) => setLocal(prev => ({ ...prev, [key]: val }));

  const pickLogoSource = (src: "none" | "business" | "upload") => {
    setLogoSource(src);
    setLogoError("");
    if (src === "none")     setLocal(prev => ({ ...prev, logo_url: "" }));
    if (src === "business") setLocal(prev => ({ ...prev, logo_url: businessLogoUrl }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) { setLogoError("Solo se admiten PNG, JPG o WebP."); return; }
    if (file.size > 5 * 1024 * 1024) { setLogoError("El archivo no puede superar 5 MB."); return; }
    setLogoError("");
    setLogoUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("kind", "form-logo");
    form.append("businessId", businessId);
    const res = await fetch("/api/landing/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    setLogoUploading(false);
    if (!res.ok) { const d = await res.json(); setLogoError(d.error || "Error al subir la imagen."); return; }
    const data = await res.json();
    setLocal(prev => ({ ...prev, logo_url: data.url }));
  };

  const COLOR_FIELDS: { key: keyof FormDesign; label: string; hint: string }[] = [
    { key: "bg_color",     label: "Fondo",  hint: "Fondo de todos los pasos"   },
    { key: "text_color",   label: "Texto",  hint: "Texto principal"             },
    { key: "accent_color", label: "Acento", hint: "Botones y selecciones"       },
    { key: "border_color", label: "Bordes", hint: "Bordes de inputs y tarjetas" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-xl rounded-2xl border overflow-hidden flex flex-col"
        style={{ background: "var(--card)", borderColor: "var(--border)", maxHeight: "90vh" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--border)" }}>
          <div>
            <h2 className="font-bold text-base" style={{ color: "var(--foreground)" }}>Diseño del formulario</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--foreground)", opacity: 0.5 }}>Paleta de colores y tipografía global</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none hover:opacity-60 transition-opacity" style={{ color: "var(--foreground)" }}>×</button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-6">
          {/* Paletas */}
          <div>
            <label className="block text-xs uppercase tracking-widest font-bold mb-3" style={{ color: "var(--brand-1)" }}>Paletas predefinidas</label>
            <div className="grid grid-cols-3 gap-2">
              {PALETTES.map(p => {
                const active = local.bg_color === p.bg && local.text_color === p.text;
                return (
                  <button key={p.name}
                    onClick={() => setLocal(prev => ({ ...prev, bg_color: p.bg, text_color: p.text, accent_color: p.accent, border_color: p.border }))}
                    className="rounded-xl p-3 text-left border-2 transition-all"
                    style={{ background: p.bg, borderColor: active ? p.accent : "transparent" }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: p.accent }} />
                      <div className="w-3 h-3 rounded-full" style={{ background: p.text, opacity: 0.5 }} />
                    </div>
                    <div className="text-xs font-semibold" style={{ color: p.text }}>{p.name}</div>
                    {active && <div className="text-[10px] font-bold mt-1" style={{ color: p.accent }}>Activa</div>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Colores */}
          <div>
            <label className="block text-xs uppercase tracking-widest font-bold mb-3" style={{ color: "var(--brand-1)" }}>Colores personalizados</label>
            <div className="grid grid-cols-2 gap-3">
              {COLOR_FIELDS.map(({ key, label, hint }) => (
                <div key={key} className="rounded-xl border p-3 space-y-2" style={{ borderColor: "var(--border)" }}>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>{label}</div>
                    <div className="text-[10px]" style={{ color: "var(--foreground)", opacity: 0.4 }}>{hint}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative w-9 h-9 flex-shrink-0 rounded-lg overflow-hidden border" style={{ borderColor: "var(--border)" }}>
                      <div className="absolute inset-0 rounded-lg" style={{ background: local[key] as string }} />
                      <input type="color"
                        value={(local[key] as string).startsWith("rgba") ? "#ffffff" : (local[key] as string)}
                        onChange={e => set(key, e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    </div>
                    <input className="flex-1 rounded-lg border px-2 py-1.5 text-xs bg-transparent font-mono"
                      style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                      value={local[key] as string} onChange={e => set(key, e.target.value)} placeholder="#000000" spellCheck={false} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tipografía */}
          <div>
            <label className="block text-xs uppercase tracking-widest font-bold mb-3" style={{ color: "var(--brand-1)" }}>Tipografía</label>
            <div className="grid grid-cols-2 gap-2">
              {FONTS.map(f => (
                <button key={f.id} onClick={() => set("font_family", f.id)}
                  className="rounded-xl border-2 p-3 text-left transition-all"
                  style={{ borderColor: local.font_family === f.id ? "var(--brand-1)" : "var(--border)", background: local.font_family === f.id ? "rgba(57,161,169,0.08)" : "transparent" }}>
                  <div className="text-base font-bold mb-0.5" style={{ fontFamily: f.id, color: "var(--foreground)" }}>{f.label}</div>
                  <div className="text-xs" style={{ color: "var(--foreground)", opacity: 0.5 }}>{f.desc}</div>
                  {local.font_family === f.id && <div className="text-[10px] font-bold mt-1" style={{ color: "var(--brand-1)" }}>Seleccionada</div>}
                </button>
              ))}
            </div>
          </div>

          {/* Logo */}
          <div>
            <label className="block text-xs uppercase tracking-widest font-bold mb-3" style={{ color: "var(--brand-1)" }}>Logo</label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {([
                { id: "none",     label: "Sin logo",        desc: "" },
                { id: "business", label: "Logo del perfil", desc: businessLogoUrl ? "" : "Sin logo en perfil" },
                { id: "upload",   label: "Subir imagen",    desc: "PNG · JPG · WebP" },
              ] as const).map(opt => (
                <button key={opt.id} type="button" onClick={() => pickLogoSource(opt.id)}
                  disabled={opt.id === "business" && !businessLogoUrl}
                  className="rounded-xl border-2 p-3 text-center text-xs font-medium transition-all disabled:opacity-30"
                  style={{ borderColor: logoSource === opt.id ? "var(--brand-1)" : "var(--border)", background: logoSource === opt.id ? "rgba(57,161,169,0.08)" : "transparent", color: "var(--foreground)" }}>
                  {opt.label}
                  {opt.desc && <div className="text-[10px] opacity-40 mt-0.5 leading-tight">{opt.desc}</div>}
                </button>
              ))}
            </div>
            {logoSource === "upload" && (
              <div className="mb-4 space-y-2">
                <label className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-dashed cursor-pointer text-xs font-medium hover:border-[var(--brand-1)]/60"
                  style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                  {logoUploading ? <span className="opacity-60">Subiendo...</span> : (
                    <>{local.logo_url ? "Cambiar imagen" : "Seleccionar imagen"}</>
                  )}
                  <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden" onChange={handleFileChange} disabled={logoUploading} />
                </label>
                {logoError && <p className="text-xs text-red-400">{logoError}</p>}
              </div>
            )}
            {local.logo_url && (
              <>
                <div className="flex items-center justify-center py-4 rounded-xl mb-4" style={{ background: local.bg_color }}>
                  <img src={local.logo_url} alt="logo preview"
                    style={{ height: local.logo_size || 72, width: local.logo_shape === "rect" ? (local.logo_size || 72) * 1.8 : local.logo_size || 72, borderRadius: local.logo_shape === "round" ? "50%" : local.logo_shape === "square" ? "12px" : "8px", objectFit: "contain" }}
                    onError={e => (e.currentTarget.style.display = "none")} />
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-semibold mb-2" style={{ color: "var(--foreground)", opacity: 0.7 }}>Forma</div>
                    <div className="grid grid-cols-3 gap-2">
                      {([{ id: "round", label: "Circular", preview: "●" }, { id: "square", label: "Cuadrado", preview: "■" }, { id: "rect", label: "Rectangular", preview: "▬" }] as const).map(s => (
                        <button key={s.id} onClick={() => setLocal(prev => ({ ...prev, logo_shape: s.id }))}
                          className="rounded-xl border-2 py-2 text-center text-xs font-medium transition-all"
                          style={{ borderColor: local.logo_shape === s.id ? "var(--brand-1)" : "var(--border)", background: local.logo_shape === s.id ? "rgba(57,161,169,0.08)" : "transparent", color: "var(--foreground)" }}>
                          <div className="text-base mb-0.5">{s.preview}</div>{s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-semibold" style={{ color: "var(--foreground)", opacity: 0.7 }}>Tamaño</div>
                      <span className="text-xs" style={{ color: "var(--foreground)", opacity: 0.5 }}>{local.logo_size || 72}px</span>
                    </div>
                    <input type="range" min={32} max={160} value={local.logo_size || 72} onChange={e => setNum("logo_size", Number(e.target.value))} className="w-full" />
                    <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--foreground)", opacity: 0.3 }}><span>32px</span><span>160px</span></div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Vista previa */}
          <div>
            <label className="block text-xs uppercase tracking-widest font-bold mb-3" style={{ color: "var(--brand-1)" }}>Vista previa</label>
            <div className="rounded-xl overflow-hidden" style={{ background: local.bg_color, fontFamily: local.font_family }}>
              <div className="px-5 pt-8 pb-6 text-center" style={{ color: local.text_color }}>
                {local.logo_url && (
                  <div className="flex justify-center mb-4">
                    <img src={local.logo_url} alt="logo" style={{ height: Math.min(local.logo_size || 72, 56), width: local.logo_shape === "rect" ? Math.min(local.logo_size || 72, 56) * 1.8 : Math.min(local.logo_size || 72, 56), borderRadius: local.logo_shape === "round" ? "50%" : local.logo_shape === "square" ? "10px" : "6px", objectFit: "contain" }} onError={e => (e.currentTarget.style.display = "none")} />
                  </div>
                )}
                <h3 className="font-bold text-lg mb-1">¿Cómo fue tu experiencia?</h3>
                <p className="text-sm mb-6" style={{ opacity: 0.6 }}>Solo te llevará 2 minutos</p>
                <button className="px-6 py-2.5 rounded-xl text-sm font-semibold" style={{ background: local.accent_color, color: local.bg_color }}>Comenzar →</button>
              </div>
              <div className="px-5 pb-5 space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="rounded-xl border p-3 flex items-center gap-3" style={{ borderColor: local.border_color }}>
                    <div className="text-sm font-semibold flex-1" style={{ color: local.text_color }}>Categoría {i}</div>
                    <div className="flex gap-1">{[1,2,3,4,5].map(s => <span key={s} style={{ color: local.accent_color }}>★</span>)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t flex gap-2 flex-shrink-0" style={{ borderColor: "var(--border)" }}>
          <button onClick={() => onApply(local, true)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all hover:opacity-80" style={{ borderColor: "var(--brand-1)", color: "var(--brand-1)" }}>
            Aplicar a todos los pasos
          </button>
          <button onClick={() => onApply(local, false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "var(--brand-1)", color: "white" }}>
            Guardar diseño
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Previews móviles ──────────────────────────────────────────

function FidWelcomePreview({ config, design }: { config: FidWelcomeConfig; design: FormDesign }) {
  const bg  = config.bg_color   || design.bg_color;
  const col = config.text_color || design.text_color;
  const logoSize = design.logo_size || 72;
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-6" style={{ background: bg, color: col, fontFamily: design.font_family }}>
      {design.logo_url && (
        <img src={design.logo_url} alt="logo" className="mb-5"
          style={{ height: Math.min(logoSize, 64), width: design.logo_shape === "rect" ? Math.min(logoSize, 64) * 1.8 : Math.min(logoSize, 64), borderRadius: design.logo_shape === "round" ? "50%" : design.logo_shape === "square" ? "10px" : "6px", objectFit: "contain" }} />
      )}
      <h1 className="text-xl font-bold leading-tight mb-2">{config.title || "Título de bienvenida"}</h1>
      <p className="text-sm" style={{ opacity: 0.7 }}>{config.subtitle || "Subtítulo del formulario"}</p>
      <button className="mt-8 px-6 py-3 rounded-xl font-semibold text-sm" style={{ background: design.accent_color, color: bg }}>Comenzar →</button>
    </div>
  );
}

function FidRatingPreview({ config, design }: { config: FidRatingConfig; design: FormDesign }) {
  return (
    <div className="p-5 flex flex-col gap-3" style={{ fontFamily: design.font_family }}>
      <p className="text-sm font-semibold mb-1" style={{ color: design.text_color }}>{config.title || "Valora nuestra atención"}</p>
      {(config.categories || []).map(c => (
        <div key={c.id} className="rounded-xl border p-3 flex items-center justify-between" style={{ borderColor: design.border_color }}>
          <span className="text-xs font-medium" style={{ color: design.text_color }}>{c.label || "Categoría"}</span>
          <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <span key={s} className="text-sm" style={{ color: design.accent_color }}>★</span>)}</div>
        </div>
      ))}
      {(config.categories || []).length === 0 && (
        <p className="text-xs text-center py-4" style={{ color: design.text_color, opacity: 0.4 }}>Sin categorías aún</p>
      )}
    </div>
  );
}

function FidNpsPreview({ config, design }: { config: FidNpsConfig; design: FormDesign }) {
  return (
    <div className="p-5 flex flex-col gap-4" style={{ fontFamily: design.font_family }}>
      <p className="text-sm font-semibold" style={{ color: design.text_color }}>{config.question || "¿Nos recomendarías?"}</p>
      <div className="grid grid-cols-6 gap-1">
        {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
          <div key={n} className="aspect-square rounded-lg border flex items-center justify-center text-xs font-semibold" style={{ borderColor: design.border_color, color: design.text_color }}>{n}</div>
        ))}
      </div>
      <div className="flex justify-between text-xs" style={{ color: design.text_color, opacity: 0.5 }}>
        <span>{config.low_label || "Muy improbable"}</span>
        <span>{config.high_label || "Muy probable"}</span>
      </div>
    </div>
  );
}

function FidQuestionsPreview({ config, design }: { config: FidQuestionsConfig; design: FormDesign }) {
  return (
    <div className="p-5 flex flex-col gap-4" style={{ fontFamily: design.font_family }}>
      {(config.questions || []).length === 0 ? (
        <p className="text-xs text-center py-4" style={{ color: design.text_color, opacity: 0.4 }}>Sin preguntas aún</p>
      ) : (config.questions || []).map(q => (
        <div key={q.id}>
          <p className="text-sm font-medium mb-2" style={{ color: design.text_color }}>{q.text || "Pregunta"}</p>
          {q.type === "yes_no" && (
            <div className="grid grid-cols-2 gap-2">
              {["Sí", "No"].map(v => <div key={v} className="rounded-lg border text-center py-2 text-xs" style={{ borderColor: design.border_color, color: design.text_color }}>{v}</div>)}
            </div>
          )}
          {q.type === "multiple_choice" && (q.options || []).map((o, i) => (
            <div key={i} className="rounded-lg border px-3 py-2 text-xs mb-1.5" style={{ borderColor: design.border_color, color: design.text_color }}>{o}</div>
          ))}
          {q.type === "text" && (
            <div className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: design.border_color, color: design.text_color, opacity: 0.4 }}>Escribe tu respuesta...</div>
          )}
        </div>
      ))}
    </div>
  );
}

function FidOpenTextPreview({ config, design }: { config: FidOpenTextConfig; design: FormDesign }) {
  return (
    <div className="p-5 flex flex-col gap-3" style={{ fontFamily: design.font_family }}>
      <p className="text-sm font-semibold" style={{ color: design.text_color }}>{config.title || "¿Qué podemos mejorar?"}</p>
      <div className="rounded-xl border px-3 py-8 text-xs" style={{ borderColor: design.border_color, color: design.text_color, opacity: 0.4 }}>
        {config.placeholder || "Cuéntanos tu experiencia..."}
      </div>
      <div className="text-right text-xs" style={{ color: design.text_color, opacity: 0.3 }}>0 / {config.max_chars || 500}</div>
    </div>
  );
}

function FidCapturePreview({ config, design }: { config: FidCaptureConfig; design: FormDesign }) {
  return (
    <div className="p-5 flex flex-col gap-3" style={{ fontFamily: design.font_family }}>
      <p className="text-sm font-semibold" style={{ color: design.text_color }}>Datos del cliente</p>
      {config.allow_anonymous && (
        <div className="rounded-lg border px-3 py-2 text-xs flex items-center gap-2" style={{ borderColor: design.border_color, color: design.text_color, opacity: 0.6 }}>
          <span>Responder anónimamente</span>
        </div>
      )}
      {(config.fields || []).filter(f => f.enabled).map(f => (
        <div key={f.key}>
          <label className="text-xs block mb-1" style={{ color: design.text_color, opacity: 0.6 }}>{f.label}{f.required ? " *" : ""}</label>
          <div className="rounded-lg border px-3 py-2.5 text-xs" style={{ borderColor: design.border_color, color: design.text_color, opacity: 0.5 }}>
            {f.key === "email" ? "email@ejemplo.com" : "Tu nombre"}
          </div>
        </div>
      ))}
      <button className="mt-2 w-full py-3 rounded-xl text-sm font-semibold" style={{ background: design.accent_color, color: design.bg_color }}>Enviar valoración</button>
    </div>
  );
}

function FidThankYouPreview({ config, design }: { config: FidThankYouConfig; design: FormDesign }) {
  const hasWA  = !!(config.whatsapp_phone);
  const hasCta = !!(config.cta_text && config.cta_url);
  return (
    <div className="p-5 flex flex-col items-center text-center gap-3 pt-8" style={{ fontFamily: design.font_family }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${design.accent_color}25`, border: `2px solid ${design.accent_color}50` }}>
        <svg className="w-5 h-5" style={{ color: design.accent_color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-base font-bold" style={{ color: design.text_color }}>{config.title || "¡Gracias!"}</h2>
      <p className="text-xs" style={{ color: design.text_color, opacity: 0.6 }}>{config.message}</p>
      {hasCta && <div className="w-full py-2.5 rounded-xl text-xs font-semibold text-center" style={{ background: design.accent_color, color: design.bg_color }}>{config.cta_text}</div>}
      {hasWA  && <div className="w-full py-2.5 rounded-xl text-xs font-semibold text-center text-white" style={{ background: "#25d366" }}>Escríbenos por WhatsApp</div>}
    </div>
  );
}

function BlockPreview({ block, design }: { block: FidFormBlock; design: FormDesign }) {
  switch (block.type) {
    case "fid_welcome":   return <FidWelcomePreview   config={block.config as FidWelcomeConfig}   design={design} />;
    case "fid_rating":    return <FidRatingPreview     config={block.config as FidRatingConfig}    design={design} />;
    case "fid_nps":       return <FidNpsPreview        config={block.config as FidNpsConfig}       design={design} />;
    case "fid_questions": return <FidQuestionsPreview  config={block.config as FidQuestionsConfig} design={design} />;
    case "fid_open_text": return <FidOpenTextPreview   config={block.config as FidOpenTextConfig}  design={design} />;
    case "fid_capture":   return <FidCapturePreview    config={block.config as FidCaptureConfig}   design={design} />;
    case "fid_thank_you": return <FidThankYouPreview   config={block.config as FidThankYouConfig}  design={design} />;
    default: return <div className="p-4 text-xs" style={{ color: design.text_color, opacity: 0.4 }}>Vista previa no disponible</div>;
  }
}

// ── Editores de bloque ────────────────────────────────────────

function FidWelcomeEditor({ config, onChange }: { config: FidWelcomeConfig; onChange: (c: FidWelcomeConfig) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Título</label>
        <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
          value={config.title} onChange={e => onChange({ ...config, title: e.target.value })} />
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Subtítulo</label>
        <textarea className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent resize-none" rows={2} style={{ borderColor: "var(--border)" }}
          value={config.subtitle} onChange={e => onChange({ ...config, subtitle: e.target.value })} />
      </div>
      <p className="text-xs text-[var(--foreground)]/40">Los colores se sincronizan con el diseño global. Usa el botón "Diseño" para cambiarlos.</p>
    </div>
  );
}

function FidRatingEditor({ config, onChange }: { config: FidRatingConfig; onChange: (c: FidRatingConfig) => void }) {
  const addCategory = () => {
    const id = `c${Date.now()}`;
    onChange({ ...config, categories: [...config.categories, { id, label: "" }] });
  };
  const updateCat = (i: number, label: string) => {
    const cats = [...config.categories];
    cats[i] = { ...cats[i], label };
    onChange({ ...config, categories: cats });
  };
  const removeCat = (i: number) => onChange({ ...config, categories: config.categories.filter((_, j) => j !== i) });

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Título</label>
        <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
          value={config.title} onChange={e => onChange({ ...config, title: e.target.value })} />
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Categorías</label>
        {config.categories.map((c, i) => (
          <div key={c.id} className="flex gap-2 mb-2">
            <input className="flex-1 rounded-lg border px-3 py-1.5 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
              placeholder={`Categoría ${i + 1}`} value={c.label} onChange={e => updateCat(i, e.target.value)} />
            <button onClick={() => removeCat(i)} className="text-xs text-red-400 px-2">×</button>
          </div>
        ))}
        <button onClick={addCategory}
          className="w-full py-2 rounded-lg border border-dashed text-xs text-[var(--foreground)]/50 hover:border-[var(--brand-1)]/50 transition-colors"
          style={{ borderColor: "var(--border)" }}>
          + Añadir categoría
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Etiqueta mínima</label>
          <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
            value={config.min_label} onChange={e => onChange({ ...config, min_label: e.target.value })} placeholder="Muy malo" />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Etiqueta máxima</label>
          <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
            value={config.max_label} onChange={e => onChange({ ...config, max_label: e.target.value })} placeholder="Excelente" />
        </div>
      </div>
    </div>
  );
}

function FidNpsEditor({ config, onChange }: { config: FidNpsConfig; onChange: (c: FidNpsConfig) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Pregunta</label>
        <textarea className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent resize-none" rows={2} style={{ borderColor: "var(--border)" }}
          value={config.question} onChange={e => onChange({ ...config, question: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Etiqueta 0</label>
          <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
            value={config.low_label} onChange={e => onChange({ ...config, low_label: e.target.value })} placeholder="Muy improbable" />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Etiqueta 10</label>
          <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
            value={config.high_label} onChange={e => onChange({ ...config, high_label: e.target.value })} placeholder="Muy probable" />
        </div>
      </div>
    </div>
  );
}

function FidQuestionsEditor({ config, onChange }: { config: FidQuestionsConfig; onChange: (c: FidQuestionsConfig) => void }) {
  const addQ = () => {
    const id = `q${Date.now()}`;
    onChange({ questions: [...config.questions, { id, text: "", type: "yes_no" }] });
  };
  const updateQ = (i: number, field: keyof FidQuestion, val: unknown) => {
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
            <option value="text">Texto libre</option>
          </select>
          {q.type === "multiple_choice" && (
            <div className="space-y-1.5">
              {(q.options || []).map((opt, j) => (
                <div key={j} className="flex gap-2">
                  <input className="flex-1 rounded-lg border px-3 py-1 text-xs bg-transparent" style={{ borderColor: "var(--border)" }}
                    value={opt} placeholder={`Opción ${j + 1}`}
                    onChange={e => { const opts = [...(q.options || [])]; opts[j] = e.target.value; updateQ(i, "options", opts); }} />
                  <button onClick={() => { const opts = (q.options || []).filter((_, k) => k !== j); updateQ(i, "options", opts); }} className="text-xs text-red-400 px-2">×</button>
                </div>
              ))}
              <button onClick={() => updateQ(i, "options", [...(q.options || []), ""])} className="text-xs text-[var(--foreground)]/50 hover:text-[var(--brand-1)] transition-colors">
                + Añadir opción
              </button>
            </div>
          )}
          <label className="flex items-center gap-2 text-xs text-[var(--foreground)]/60 cursor-pointer">
            <input type="checkbox" checked={q.required || false} onChange={e => updateQ(i, "required", e.target.checked)} />
            Obligatoria
          </label>
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

function FidOpenTextEditor({ config, onChange }: { config: FidOpenTextConfig; onChange: (c: FidOpenTextConfig) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Título</label>
        <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
          value={config.title} onChange={e => onChange({ ...config, title: e.target.value })} />
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Placeholder</label>
        <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
          value={config.placeholder} onChange={e => onChange({ ...config, placeholder: e.target.value })} />
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Máximo de caracteres</label>
        <input type="number" min={50} max={2000} className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
          value={config.max_chars} onChange={e => onChange({ ...config, max_chars: Number(e.target.value) })} />
      </div>
      <label className="flex items-center gap-2 text-xs text-[var(--foreground)]/60 cursor-pointer">
        <input type="checkbox" checked={config.required} onChange={e => onChange({ ...config, required: e.target.checked })} />
        Obligatorio
      </label>
    </div>
  );
}

function FidCaptureEditor({ config, onChange }: { config: FidCaptureConfig; onChange: (c: FidCaptureConfig) => void }) {
  const updateField = (key: "name" | "email", field: "enabled" | "required", val: boolean) => {
    const fields = config.fields.map(f => f.key === key ? { ...f, [field]: val } : f);
    onChange({ ...config, fields });
  };
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm text-[var(--foreground)]/80 cursor-pointer">
        <input type="checkbox" checked={config.allow_anonymous} onChange={e => onChange({ ...config, allow_anonymous: e.target.checked })} />
        Permitir respuestas anónimas
      </label>
      <p className="text-xs text-[var(--foreground)]/40">Activa los campos que quieres solicitar (ambos son opcionales).</p>
      {config.fields.map(f => (
        <div key={f.key} className={`rounded-lg border p-3 transition-opacity ${!f.enabled ? "opacity-40" : ""}`} style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium">{f.label}</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-[var(--foreground)]/60 cursor-pointer">
                <input type="checkbox" checked={f.enabled} onChange={e => updateField(f.key, "enabled", e.target.checked)} />
                Mostrar
              </label>
              {f.enabled && (
                <label className="flex items-center gap-1.5 text-xs text-[var(--foreground)]/60 cursor-pointer">
                  <input type="checkbox" checked={f.required} onChange={e => updateField(f.key, "required", e.target.checked)} />
                  Obligatorio
                </label>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FidThankYouEditor({ config, onChange }: { config: FidThankYouConfig; onChange: (c: FidThankYouConfig) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Título</label>
        <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
          value={config.title} onChange={e => onChange({ ...config, title: e.target.value })} />
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Mensaje</label>
        <textarea className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent resize-none" rows={3} style={{ borderColor: "var(--border)" }}
          value={config.message} onChange={e => onChange({ ...config, message: e.target.value })} />
      </div>
      <hr style={{ borderColor: "var(--border)" }} />
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--brand-1)" }}>Botón de acción</label>
          <span className="text-[10px] text-[var(--foreground)]/40">Opcional</span>
        </div>
        <div className="space-y-2">
          <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
            placeholder="Texto del botón (ej: Visitar nuestra web)"
            value={config.cta_text || ""} onChange={e => onChange({ ...config, cta_text: e.target.value })} />
          <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent font-mono text-xs" style={{ borderColor: "var(--border)" }}
            placeholder="URL (ej: https://miweb.com)"
            value={config.cta_url || ""} onChange={e => onChange({ ...config, cta_url: e.target.value })} />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--brand-1)" }}>Botón de WhatsApp</label>
          <span className="text-[10px] text-[var(--foreground)]/40">Opcional</span>
        </div>
        <div className="space-y-2">
          <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent font-mono" style={{ borderColor: "var(--border)" }}
            placeholder="Teléfono con prefijo (ej: +34600000000)"
            value={config.whatsapp_phone || ""} onChange={e => onChange({ ...config, whatsapp_phone: e.target.value })} />
          <textarea className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent resize-none" rows={2} style={{ borderColor: "var(--border)" }}
            placeholder="Mensaje predefinido (opcional)"
            value={config.whatsapp_text || ""} onChange={e => onChange({ ...config, whatsapp_text: e.target.value })} />
        </div>
      </div>
    </div>
  );
}

function BlockEditor({ block, onChange }: { block: FidFormBlock; onChange: (config: FidBlockConfig) => void }) {
  switch (block.type) {
    case "fid_welcome":   return <FidWelcomeEditor   config={block.config as FidWelcomeConfig}   onChange={onChange} />;
    case "fid_rating":    return <FidRatingEditor     config={block.config as FidRatingConfig}    onChange={onChange} />;
    case "fid_nps":       return <FidNpsEditor        config={block.config as FidNpsConfig}       onChange={onChange} />;
    case "fid_questions": return <FidQuestionsEditor  config={block.config as FidQuestionsConfig} onChange={onChange} />;
    case "fid_open_text": return <FidOpenTextEditor   config={block.config as FidOpenTextConfig}  onChange={onChange} />;
    case "fid_capture":   return <FidCaptureEditor    config={block.config as FidCaptureConfig}   onChange={onChange} />;
    case "fid_thank_you": return <FidThankYouEditor   config={block.config as FidThankYouConfig}  onChange={onChange} />;
    default: return <p className="text-xs text-[var(--foreground)]/40">Editor no disponible</p>;
  }
}

// ── Vista de respuestas ───────────────────────────────────────

function StarDisplay({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{ color: i < Math.round(value) ? "#C5A059" : "rgba(255,255,255,0.15)", fontSize: "14px" }}>★</span>
      ))}
    </span>
  );
}

function NpsBadge({ score }: { score: number }) {
  const color = score >= 9 ? "#22c55e" : score >= 7 ? "#f59e0b" : "#ef4444";
  const label = score >= 9 ? "Promotor" : score >= 7 ? "Pasivo" : "Detractor";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-xl font-bold" style={{ color }}>{score}/10</span>
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>{label}</span>
    </span>
  );
}

function AnswerBlock({ block, answers }: { block: FidFormBlock; answers: Record<string, unknown> }) {
  const val = answers[block.id];

  if (block.type === "fid_welcome" || block.type === "fid_thank_you" || block.type === "fid_capture") return null;

  const border = "var(--border)";
  const card = "rounded-xl border p-4";

  if (block.type === "fid_rating") {
    const cfg = block.config as FidRatingConfig;
    const ratings = (val as Record<string, number>) ?? {};
    if (!cfg.categories?.length) return null;
    return (
      <div className={card} style={{ borderColor: border }}>
        <p className="text-xs font-semibold text-[var(--foreground)]/50 mb-3">{cfg.title || "Valoración"}</p>
        <div className="space-y-2">
          {cfg.categories.map(cat => {
            const stars = ratings[cat.id] ?? null;
            return (
              <div key={cat.id} className="flex items-center justify-between gap-3">
                <span className="text-sm text-[var(--foreground)]/80 truncate">{cat.label}</span>
                {stars !== null
                  ? <div className="flex items-center gap-1.5 flex-shrink-0"><StarDisplay value={stars} /><span className="text-xs text-[var(--foreground)]/50">{stars}/5</span></div>
                  : <span className="text-xs text-[var(--foreground)]/30 flex-shrink-0">Sin respuesta</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (block.type === "fid_nps") {
    const cfg = block.config as FidNpsConfig;
    if (val === null || val === undefined) return null;
    return (
      <div className={card} style={{ borderColor: border }}>
        <p className="text-xs font-semibold text-[var(--foreground)]/50 mb-2">{cfg.question || "NPS"}</p>
        <NpsBadge score={val as number} />
      </div>
    );
  }

  if (block.type === "fid_questions") {
    const cfg = block.config as FidQuestionsConfig;
    const qa = (val as Record<string, unknown>) ?? {};
    if (!cfg.questions?.length) return null;
    return (
      <div className={card} style={{ borderColor: border }}>
        <p className="text-xs font-semibold text-[var(--foreground)]/50 mb-3">Preguntas</p>
        <div className="space-y-2">
          {cfg.questions.map(q => {
            const ans = qa[q.id];
            return (
              <div key={q.id}>
                <p className="text-xs text-[var(--foreground)]/60 mb-0.5">{q.text}</p>
                {ans !== undefined && ans !== null && ans !== ""
                  ? <p className="text-sm font-medium">{String(ans)}</p>
                  : <p className="text-xs text-[var(--foreground)]/30 italic">Sin respuesta</p>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (block.type === "fid_open_text") {
    const cfg = block.config as FidOpenTextConfig;
    const text = val as string;
    if (!text) return null;
    return (
      <div className={card} style={{ borderColor: border }}>
        <p className="text-xs font-semibold text-[var(--foreground)]/50 mb-2">{cfg.title || "Comentario"}</p>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">&ldquo;{text}&rdquo;</p>
      </div>
    );
  }

  return null;
}

function ResponseCard({ entry, blocks }: { entry: FidelizacionFeedback; blocks: FidFormBlock[] }) {
  const [expanded, setExpanded] = useState(true);
  const date = new Date(entry.submitted_at);
  const dateStr = date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const name  = entry.respondent_name  || null;
  const email = entry.respondent_email || null;
  const isAnon = !name && !email;

  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
            style={{ background: isAnon ? "rgba(255,255,255,0.08)" : "rgba(197,160,89,0.2)", color: isAnon ? "var(--foreground)" : "#C5A059" }}>
            {isAnon ? "?" : (name?.[0] || email?.[0] || "?").toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">
              {isAnon ? <span className="text-[var(--foreground)]/40 italic">Anónimo</span> : (name || email)}
            </p>
            {name && email && <p className="text-xs text-[var(--foreground)]/40 truncate">{email}</p>}
          </div>
          {/* Badges rápidos */}
          <div className="hidden sm:flex items-center gap-2 ml-2 flex-shrink-0">
            {entry.nps_score !== null && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: entry.nps_score >= 9 ? "#22c55e20" : entry.nps_score >= 7 ? "#f59e0b20" : "#ef444420",
                         color:      entry.nps_score >= 9 ? "#22c55e"   : entry.nps_score >= 7 ? "#f59e0b"   : "#ef4444" }}>
                NPS {entry.nps_score}
              </span>
            )}
            {entry.avg_rating !== null && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(197,160,89,0.15)", color: "#C5A059" }}>
                ★ {Number(entry.avg_rating).toFixed(1)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <span className="text-xs text-[var(--foreground)]/40">{dateStr} {timeStr}</span>
          <svg className={`w-4 h-4 text-[var(--foreground)]/30 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Body */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="pt-3 space-y-3">
            {sortedBlocks.map(block => (
              <AnswerBlock key={block.id} block={block} answers={entry.answers} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ResponsesView({
  formId, blocks, token,
}: {
  formId: string;
  blocks: FidFormBlock[];
  token: string;
}) {
  const [feedback, setFeedback] = useState<FidelizacionFeedback[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetch(`/api/fidelizacion/feedback?formId=${formId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al cargar respuestas"); setLoading(false); return; }
      setFeedback(data.feedback || []);
      setLoading(false);
    };
    load();
  }, [formId, token]);

  // ── Estadísticas ─────────────────────────────────────────────
  const total    = feedback.length;
  const npsVals  = feedback.map(f => f.nps_score).filter((v): v is number => v !== null);
  const ratVals  = feedback.map(f => f.avg_rating ? Number(f.avg_rating) : null).filter((v): v is number => v !== null);

  const avgNps = npsVals.length ? npsVals.reduce((a, b) => a + b, 0) / npsVals.length : null;
  const avgRat = ratVals.length ? ratVals.reduce((a, b) => a + b, 0) / ratVals.length : null;

  // NPS real = % promotores (9-10) - % detractores (0-6)
  const promoters   = npsVals.filter(n => n >= 9).length;
  const detractors  = npsVals.filter(n => n <= 6).length;
  const npsScore    = npsVals.length ? Math.round(((promoters - detractors) / npsVals.length) * 100) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[var(--foreground)]/40 text-sm">Cargando respuestas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Respuestas totales",
            value: String(total),
            sub: total === 0 ? "Aún no hay respuestas" : total === 1 ? "1 respuesta recibida" : `${total} respuestas recibidas`,
            color: "var(--brand-1)",
          },
          {
            label: "NPS (índice)",
            value: npsScore !== null ? (npsScore > 0 ? `+${npsScore}` : String(npsScore)) : "—",
            sub: npsScore !== null
              ? (npsScore >= 50 ? "Excelente" : npsScore >= 0 ? "Aceptable" : "Mejorable")
              : "Sin datos NPS",
            color: npsScore === null ? "var(--foreground)" : npsScore >= 50 ? "#22c55e" : npsScore >= 0 ? "#f59e0b" : "#ef4444",
          },
          {
            label: "Puntuación media",
            value: avgRat !== null ? `${avgRat.toFixed(1)}/5` : "—",
            sub: avgRat !== null ? `${ratVals.length} valoraciones` : "Sin valoraciones",
            color: avgRat !== null ? "#C5A059" : "var(--foreground)",
          },
          {
            label: "Promotores NPS",
            value: npsVals.length ? `${Math.round((promoters / npsVals.length) * 100)}%` : "—",
            sub: npsVals.length ? `${promoters} de ${npsVals.length}` : "Sin datos",
            color: promoters > 0 ? "#22c55e" : "var(--foreground)",
          },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <p className="text-xs text-[var(--foreground)]/50 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-xs text-[var(--foreground)]/40 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* NPS breakdown visual */}
      {npsVals.length > 0 && (
        <div className="rounded-xl border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <p className="text-xs font-semibold text-[var(--foreground)]/50 mb-3 uppercase tracking-widest">Distribución NPS</p>
          <div className="flex gap-1 h-6 rounded-lg overflow-hidden mb-2">
            {[
              { label: "Detractores (0-6)", count: detractors, color: "#ef4444" },
              { label: "Pasivos (7-8)", count: npsVals.filter(n => n >= 7 && n <= 8).length, color: "#f59e0b" },
              { label: "Promotores (9-10)", count: promoters, color: "#22c55e" },
            ].map(({ label, count, color }) => {
              const pct = npsVals.length ? (count / npsVals.length) * 100 : 0;
              return pct > 0 ? (
                <div key={label} className="flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ width: `${pct}%`, background: color, minWidth: pct > 0 ? "2px" : "0" }}
                  title={`${label}: ${count} (${Math.round(pct)}%)`}>
                  {pct > 15 ? `${Math.round(pct)}%` : ""}
                </div>
              ) : null;
            })}
          </div>
          <div className="flex gap-4 flex-wrap">
            {[
              { label: "Detractores", count: detractors, color: "#ef4444" },
              { label: "Pasivos", count: npsVals.filter(n => n >= 7 && n <= 8).length, color: "#f59e0b" },
              { label: "Promotores", count: promoters, color: "#22c55e" },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-xs text-[var(--foreground)]/60">{label}: <strong style={{ color }}>{count}</strong></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de respuestas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-[var(--foreground)]/70">
            {total === 0 ? "Sin respuestas aún" : `${total} ${total === 1 ? "respuesta" : "respuestas"}`}
          </p>
        </div>

        {total === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
            <svg className="w-10 h-10 text-[var(--foreground)]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            <p className="text-sm text-[var(--foreground)]/40">Aún no hay respuestas para este formulario</p>
            <p className="text-xs text-[var(--foreground)]/30">Comparte el enlace del formulario con tus clientes para empezar a recibir feedback</p>
          </div>
        ) : (
          <div className="space-y-3">
            {feedback.map(entry => (
              <ResponseCard key={entry.id} entry={entry} blocks={blocks} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────

export default function FidFormBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [formData, setFormData]               = useState<FidelizacionForm | null>(null);
  const [design, setDesign]                   = useState<FormDesign>(DEFAULT_FID_DESIGN);
  const [businessLogoUrl, setBusinessLogoUrl] = useState("");
  const [token, setToken]                     = useState("");
  const [loading, setLoading]                 = useState(true);
  const [saving, setSaving]                   = useState(false);
  const [saved, setSaved]                     = useState(false);
  const [selectedBlock, setSelectedBlock]     = useState<string | null>(null);
  const [previewBlock, setPreviewBlock]       = useState<FidFormBlock | null>(null);
  const [showDesignModal, setShowDesignModal] = useState(false);
  const [activeTab, setActiveTab]             = useState<"editor" | "responses">("editor");

  const previewWrapRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

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

      const res  = await fetch(`/api/fidelizacion/forms/${id}`, { headers: { Authorization: `Bearer ${t}` } });
      const data = await res.json();

      if (data.form) {
        setFormData(data.form);
        const savedDesign = data.form.design ? { ...DEFAULT_FID_DESIGN, ...data.form.design } : DEFAULT_FID_DESIGN;
        setDesign(savedDesign);
        const first = data.form.blocks?.[0] || null;
        setPreviewBlock(first);
        setSelectedBlock(first?.id || null);

        const { data: biz } = await supabase.from("businesses").select("logo_url").eq("id", data.form.business_id).single();
        if (biz?.logo_url) setBusinessLogoUrl(biz.logo_url);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const updateBlock = useCallback((blockId: string, config: FidBlockConfig) => {
    setFormData(prev => {
      if (!prev) return prev;
      const blocks = prev.blocks.map(b => b.id === blockId ? { ...b, config } : b);
      return { ...prev, blocks };
    });
    setPreviewBlock(prev => prev?.id === blockId ? { ...prev, config } : prev);
  }, []);

  const selectBlock = (block: FidFormBlock) => { setSelectedBlock(block.id); setPreviewBlock(block); };

  const addBlock = (type: FidBlockType) => {
    if (!formData) return;
    const defaults: Record<FidBlockType, FidBlockConfig> = {
      fid_welcome:   { title: "Bienvenido", subtitle: "Tu opinión nos importa", bg_color: design.bg_color, text_color: design.text_color } as FidWelcomeConfig,
      fid_rating:    { title: "Valora nuestra atención", categories: [{ id: `c${Date.now()}`, label: "" }], min_label: "Muy malo", max_label: "Excelente" } as FidRatingConfig,
      fid_nps:       { question: "¿Nos recomendarías?", low_label: "Muy improbable", high_label: "Muy probable" } as FidNpsConfig,
      fid_questions: { questions: [] } as FidQuestionsConfig,
      fid_open_text: { title: "¿Algo más que quieras contarnos?", placeholder: "Cuéntanos...", required: false, max_chars: 500 } as FidOpenTextConfig,
      fid_capture:   { allow_anonymous: true, fields: [{ key: "name", label: "Nombre", required: false, enabled: true }, { key: "email", label: "Email", required: false, enabled: false }] } as FidCaptureConfig,
      fid_thank_you: { title: "¡Gracias!", message: "Tu opinión nos ayuda a mejorar." } as FidThankYouConfig,
    };
    const newBlock: FidFormBlock = { id: `b${Date.now()}`, type, order: formData.blocks.length + 1, config: defaults[type] };
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
    if (selectedBlock === blockId) { setSelectedBlock(null); setPreviewBlock(null); }
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

  const applyDesign = (newDesign: FormDesign, applyAll: boolean) => {
    setDesign(newDesign);
    if (applyAll && formData) {
      setFormData(prev => {
        if (!prev) return prev;
        const blocks = prev.blocks.map(b => {
          if (b.type === "fid_welcome") {
            const cfg = b.config as FidWelcomeConfig;
            return { ...b, config: { ...cfg, bg_color: newDesign.bg_color, text_color: newDesign.text_color } };
          }
          return b;
        });
        return { ...prev, blocks };
      });
      setPreviewBlock(prev => {
        if (!prev || prev.type !== "fid_welcome") return prev;
        const cfg = prev.config as FidWelcomeConfig;
        return { ...prev, config: { ...cfg, bg_color: newDesign.bg_color, text_color: newDesign.text_color } };
      });
    }
    setShowDesignModal(false);
  };

  const save = async () => {
    if (!formData) return;
    setSaving(true);
    const res = await fetch(`/api/fidelizacion/forms/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ blocks: formData.blocks, design, status: "published" }),
    });
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    setSaving(false);
  };

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
  const BLOCK_TYPES: FidBlockType[] = ["fid_welcome", "fid_rating", "fid_nps", "fid_questions", "fid_open_text", "fid_capture", "fid_thank_you"];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-[var(--foreground)]/50 text-sm">Cargando...</p></div>;
  }
  if (!formData) {
    return <div className="flex items-center justify-center h-64"><p className="text-red-400 text-sm">Formulario no encontrado</p></div>;
  }

  return (
    <>
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
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.back()} className="text-sm text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors flex-shrink-0">← Volver</button>
            <h1 className="font-bold text-lg truncate">{formData.name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${formData.status === "published" ? "bg-green-500/15 text-green-400" : "bg-yellow-500/15 text-yellow-400"}`}>
              {formData.status === "published" ? "Publicado" : "Borrador"}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Ver formulario público */}
            {formData.status === "published" && formData.slug && (
              <a
                href={`/f/${formData.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg text-sm font-semibold border-2 transition-all hover:opacity-80 flex items-center gap-1.5"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span className="hidden sm:inline">Ver formulario</span>
              </a>
            )}
            {/* Diseño — solo en tab editor */}
            {activeTab === "editor" && (
              <button
                onClick={() => setShowDesignModal(true)}
                className="px-3 py-2 rounded-lg text-sm font-semibold border-2 transition-all hover:opacity-80 flex items-center gap-2"
                style={{ borderColor: "var(--brand-1)", color: "var(--brand-1)" }}
              >
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: design.accent_color }} />
                <span className="hidden sm:inline">Diseño</span>
              </button>
            )}
            {/* Guardar — solo en tab editor */}
            {activeTab === "editor" && (
              <button
                onClick={save}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
                style={{ background: "var(--brand-1)", color: "white" }}
              >
                {saving ? "Guardando..." : saved ? "✓ Guardado" : "Guardar"}
              </button>
            )}
          </div>
        </div>

        {/* Tabs Editor / Respuestas */}
        <div className="flex border-b mb-4 flex-shrink-0" style={{ borderColor: "var(--border)" }}>
          {(([
            { id: "editor",    label: "Editor",     icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", badge: undefined },
            { id: "responses", label: "Respuestas", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
              badge: formData.response_count > 0 ? String(formData.response_count) : undefined },
          ]) as { id: "editor" | "responses"; label: string; icon: string; badge: string | undefined }[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? "border-[var(--brand-1)] text-[var(--brand-1)]"
                  : "border-transparent text-[var(--foreground)]/50 hover:text-[var(--foreground)]"
              }`}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
              {tab.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "var(--brand-1)", color: "white" }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab: Respuestas */}
        {activeTab === "responses" && (
          <div className="flex-1 overflow-y-auto pr-1">
            <ResponsesView
              formId={id}
              blocks={formData.blocks}
              token={token}
            />
          </div>
        )}

        {/* Tab: Editor */}
        {activeTab === "editor" && (
        <div className="flex gap-4 flex-1 min-h-0">

          {/* Panel izquierdo: bloques */}
          <div className="w-64 flex-shrink-0 flex flex-col gap-4 min-h-0">

            {/* Lista de bloques */}
            <div className="rounded-xl border overflow-hidden flex-shrink-0" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="px-3 py-2 border-b text-xs font-semibold text-[var(--foreground)]/50 uppercase tracking-wider" style={{ borderColor: "var(--border)" }}>
                Bloques del formulario
              </div>
              <div className="overflow-y-auto max-h-64">
                {formData.blocks.length === 0 ? (
                  <p className="text-xs text-[var(--foreground)]/40 p-3">Sin bloques</p>
                ) : formData.blocks.sort((a, b) => a.order - b.order).map((b, i) => (
                  <div
                    key={b.id}
                    onClick={() => selectBlock(b)}
                    className={`flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors border-b last:border-b-0 group ${selectedBlock === b.id ? "bg-[var(--brand-1)]/10" : "hover:bg-[var(--brand-1)]/5"}`}
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-[var(--foreground)]/30 w-4 flex-shrink-0">{b.order}</span>
                      <span className={`text-xs font-medium truncate ${selectedBlock === b.id ? "text-[var(--brand-1)]" : ""}`}>{FID_BLOCK_LABELS[b.type]}</span>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={e => { e.stopPropagation(); moveBlock(b.id, "up"); }} disabled={i === 0} className="p-0.5 text-[var(--foreground)]/40 hover:text-[var(--foreground)] disabled:opacity-20 text-xs">▲</button>
                      <button onClick={e => { e.stopPropagation(); moveBlock(b.id, "down"); }} disabled={i === formData.blocks.length - 1} className="p-0.5 text-[var(--foreground)]/40 hover:text-[var(--foreground)] disabled:opacity-20 text-xs">▼</button>
                      <button onClick={e => { e.stopPropagation(); removeBlock(b.id); }} className="p-0.5 text-red-400/60 hover:text-red-400 text-xs ml-1">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Añadir bloques */}
            <div className="rounded-xl border overflow-hidden flex-shrink-0" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="px-3 py-2 border-b text-xs font-semibold text-[var(--foreground)]/50 uppercase tracking-wider" style={{ borderColor: "var(--border)" }}>
                Añadir bloque
              </div>
              <div className="p-2 grid grid-cols-2 gap-1">
                {BLOCK_TYPES.map(t => (
                  <button key={t} onClick={() => addBlock(t)}
                    className="rounded-lg border px-2 py-2 text-xs text-left hover:border-[var(--brand-1)]/50 transition-colors"
                    style={{ borderColor: "var(--border)" }}>
                    {FID_BLOCK_LABELS[t]}
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
                    <h2 className="font-semibold text-sm">{FID_BLOCK_LABELS[activeBlock.type]}</h2>
                    <p className="text-xs text-[var(--foreground)]/50 mt-0.5 leading-relaxed">{FID_BLOCK_OBJECTIVES[activeBlock.type]}</p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-5">
                  <BlockEditor block={activeBlock} onChange={config => updateBlock(activeBlock.id, config)} />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-[var(--foreground)]/40">Selecciona un bloque para editarlo</p>
              </div>
            )}
          </div>

          {/* Panel derecho: preview móvil */}
          <div ref={previewWrapRef} className="w-80 flex-shrink-0 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[var(--foreground)]/50 uppercase tracking-wider">Vista previa</p>
              <div className="flex items-center gap-1">
                {(formData?.blocks || []).sort((a, b) => a.order - b.order).map(b => (
                  <button key={b.id} onClick={() => selectBlock(b)} title={FID_BLOCK_LABELS[b.type]}
                    className={`rounded-full transition-all duration-200 ${selectedBlock === b.id ? "w-5 h-2 bg-[var(--brand-1)]" : "w-2 h-2 bg-[var(--foreground)]/20 hover:bg-[var(--foreground)]/40"}`} />
                ))}
              </div>
            </div>

            <div className="flex justify-center overflow-hidden">
              <div style={{ width: "320px", transform: `scale(${previewScale})`, transformOrigin: "top center", marginBottom: `${(previewScale - 1) * 600}px` }}>
                <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl" style={{ width: "320px", border: "3px solid #1a1a1a", background: "#000" }}>
                  <div className="flex items-center justify-between px-5 py-2" style={{ background: "#000", minHeight: "44px" }}>
                    <span className="text-white text-[11px] font-medium">9:41</span>
                    <div className="w-24 h-6 rounded-full bg-black border border-[#333] absolute top-2 left-1/2 -translate-x-1/2" />
                    <div className="flex items-center gap-1">
                      <svg width="16" height="12" viewBox="0 0 16 12" fill="white"><rect x="0" y="4" width="3" height="8" rx="1"/><rect x="4" y="2.5" width="3" height="9.5" rx="1"/><rect x="8" y="1" width="3" height="11" rx="1"/><rect x="12" y="0" width="3" height="12" rx="1"/></svg>
                      <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="white" strokeOpacity="0.35"/><rect x="2" y="2" width="16" height="8" rx="2" fill="white"/><path d="M23 4.5V7.5C23.8 7.2 24.5 6.4 24.5 6S23.8 4.8 23 4.5z" fill="white" fillOpacity="0.4"/></svg>
                    </div>
                  </div>
                  <div className="overflow-y-auto" style={{ height: "560px", background: design.bg_color, color: design.text_color, fontFamily: design.font_family }}>
                    {previewBlock ? (
                      <BlockPreview block={previewBlock} design={design} />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-3 px-6">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: design.text_color, opacity: 0.4 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-xs text-center leading-relaxed" style={{ color: design.text_color, opacity: 0.4 }}>Selecciona un bloque para ver la vista previa</p>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-center py-2" style={{ background: design.bg_color }}>
                    <div className="w-28 h-1 rounded-full" style={{ background: `${design.text_color}33` }} />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-[var(--foreground)]/30 text-center">
              {previewBlock ? `Bloque: ${FID_BLOCK_LABELS[previewBlock.type]}` : "Vista como la ve el cliente"}
            </p>
          </div>
        </div>
        )} {/* fin tab editor */}
      </div>
    </>
  );
}
