"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DEFAULT_LOGIN_CONFIG, LoginPageConfig, buildLoginPageHtml } from "@/lib/login-page-config";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

// ─── Subcomponentes de control ────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-[var(--foreground)]/50 mb-1">{label}</label>
      {children}
    </div>
  );
}

function TextInput({
  value, onChange, placeholder, mono,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm ${mono ? "font-mono" : ""}`}
    />
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 rounded cursor-pointer border border-[var(--border)] bg-transparent p-0.5 flex-shrink-0"
        />
        <input
          type="text" value={value} onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-transparent text-sm font-mono"
          placeholder="#000000"
        />
      </div>
    </Field>
  );
}

function ImageUploadField({
  label, value, onChange, kind, hint,
}: {
  label: string; value: string; onChange: (url: string) => void; kind: string; hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token || "";
      const form = new FormData();
      form.append("file", file);
      form.append("kind", kind);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const json = await res.json();
      if (!res.ok) setUploadError(json.error || "Error al subir");
      else onChange(json.url);
    } catch {
      setUploadError("Error de red");
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <Field label={label}>
      {value && (
        <div className="mb-2 rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--background)] flex items-center justify-center" style={{ height: 72 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="preview" style={{ maxHeight: 72, maxWidth: "100%", objectFit: "contain" }} />
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--foreground)]/70 hover:text-[var(--foreground)] hover:bg-white/5 disabled:opacity-40 transition-colors text-center"
        >
          {uploading ? "Subiendo…" : value ? "Cambiar imagen" : "Seleccionar imagen"}
        </button>
        {value && (
          <button type="button" onClick={() => onChange("")}
            className="px-3 py-2 rounded-lg border border-[var(--border)] text-xs text-red-400 hover:bg-red-500/10 transition-colors">
            ✕
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {uploadError && <p className="text-xs text-red-400 mt-1">{uploadError}</p>}
      {hint && !uploadError && <p className="text-xs text-[var(--foreground)]/30 mt-1">{hint}</p>}
    </Field>
  );
}

// ─── Preview iframe (desktop 1280×800 escalado) ───────────────────────────────

const PREVIEW_W = 1280;
const PREVIEW_H = 800;

function LoginPreview({ config }: { config: LoginPageConfig }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.32);

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.offsetWidth;
      if (w > 0) setScale(w / PREVIEW_W);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const html = buildLoginPageHtml(config);
  const wrapperHeight = Math.round(PREVIEW_H * scale);

  return (
    <div
      ref={containerRef}
      className="rounded-xl border border-[var(--border)] overflow-hidden w-full"
      style={{ background: "#1a1a1a" }}
    >
      {/* Barra del navegador simulada */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/10" style={{ background: "#2a2a2a" }}>
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        <div className="flex-1 mx-3 px-3 py-0.5 rounded text-[10px] text-white/30 text-center"
          style={{ background: "#1a1a1a" }}>
          app.konecta3d.com
        </div>
      </div>
      {/* Viewport escalado */}
      <div style={{ position: "relative", height: `${wrapperHeight}px`, overflow: "hidden" }}>
        <iframe
          srcDoc={html}
          title="Vista previa página de acceso"
          sandbox="allow-same-origin"
          style={{
            width: `${PREVIEW_W}px`,
            height: `${PREVIEW_H}px`,
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

export default function LoginPageEditor() {
  const [config, setConfig] = useState<LoginPageConfig>(deepClone(DEFAULT_LOGIN_CONFIG));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [tab, setTab] = useState<"fondo" | "marca" | "textos" | "soporte">("fondo");

  const set = (patch: Partial<LoginPageConfig>) => setConfig((c) => ({ ...c, ...patch }));
  const c = config;

  // Carga
  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/login-page-config");
      const json = await res.json();
      if (json.config) setConfig({ ...deepClone(DEFAULT_LOGIN_CONFIG), ...json.config });
      setLoading(false);
    };
    load();
  }, []);

  const showMsg = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3000);
  };

  const save = async () => {
    setSaving(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token || "";
      const res = await fetch("/api/admin/login-page", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(config),
      });
      if (res.ok) showMsg("✓ Cambios guardados");
      else showMsg("Error al guardar", false);
    } catch {
      showMsg("Error de red", false);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: "var(--brand-1)" }} />
      </div>
    );
  }

  return (
    <div className="max-w-[1300px] mx-auto pb-12">

      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold">Página de acceso</h1>
          <p className="text-sm text-[var(--foreground)]/50 mt-0.5">
            Personaliza lo que ven los negocios al entrar en{" "}
            <a href="https://app.konecta3d.com" target="_blank" rel="noopener noreferrer"
              className="text-[var(--brand-1)] hover:underline">
              app.konecta3d.com
            </a>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {msg && (
            <span className={`text-xs px-3 py-1.5 rounded-lg font-medium ${msg.ok ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
              {msg.text}
            </span>
          )}
          <button
            onClick={() => setConfig(deepClone(DEFAULT_LOGIN_CONFIG))}
            className="px-3 py-2 rounded-lg border border-[var(--border)] text-xs text-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors"
          >
            Restaurar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-opacity"
            style={{ background: "var(--brand-1)", color: "white" }}
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>

      {/* Layout 2 columnas */}
      <div className="grid xl:grid-cols-[1fr_400px] gap-8 items-start">

        {/* ── Columna izquierda: controles ── */}
        <div className="rounded-xl border border-[var(--border)] overflow-hidden" style={{ background: "var(--card)" }}>

          {/* Tabs */}
          <div className="flex border-b border-[var(--border)]">
            {(["fondo", "marca", "textos", "soporte"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-3 text-xs font-semibold capitalize transition-colors border-b-2 ${
                  tab === t
                    ? "text-[var(--brand-1)] border-[var(--brand-1)]"
                    : "text-[var(--foreground)]/40 border-transparent hover:text-[var(--foreground)]/70"
                }`}>
                {t === "fondo" ? "Fondo" : t === "marca" ? "Marca" : t === "textos" ? "Textos" : "Soporte"}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-5">

            {/* ── Tab: Fondo ── */}
            {tab === "fondo" && (
              <>
                <Field label="Tipo de fondo">
                  <div className="flex gap-2">
                    {(["gradient", "solid", "image"] as const).map((type) => (
                      <button key={type} type="button" onClick={() => set({ bg_type: type })}
                        className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors ${
                          c.bg_type === type
                            ? "border-[var(--brand-1)] text-[var(--brand-1)] bg-[var(--brand-1)]/10"
                            : "border-[var(--border)] text-[var(--foreground)]/50 hover:text-[var(--foreground)]"
                        }`}>
                        {type === "gradient" ? "Degradado" : type === "solid" ? "Sólido" : "Imagen"}
                      </button>
                    ))}
                  </div>
                </Field>

                {c.bg_type !== "image" && (
                  <ColorField
                    label={c.bg_type === "gradient" ? "Color primario" : "Color de fondo"}
                    value={c.bg_color_1}
                    onChange={(v) => set({ bg_color_1: v })}
                  />
                )}

                {c.bg_type === "gradient" && (
                  <>
                    <ColorField label="Color secundario" value={c.bg_color_2} onChange={(v) => set({ bg_color_2: v })} />
                    <Field label={`Ángulo del degradado: ${c.bg_angle}°`}>
                      <input type="range" min={0} max={360} value={c.bg_angle}
                        onChange={(e) => set({ bg_angle: Number(e.target.value) })}
                        className="w-full" style={{ accentColor: "var(--brand-1)" }} />
                      <div className="flex justify-between text-xs text-[var(--foreground)]/25 mt-0.5">
                        <span>0°</span><span>180°</span><span>360°</span>
                      </div>
                    </Field>
                  </>
                )}

                {c.bg_type === "image" && (
                  <>
                    <ImageUploadField
                      label="Imagen de fondo"
                      value={c.bg_image_url}
                      onChange={(url) => set({ bg_image_url: url })}
                      kind="login-bg"
                      hint="JPG, PNG, WebP · máx. 5 MB · recomendado formato landscape"
                    />
                    <ColorField
                      label="Color del velo"
                      value={c.bg_overlay_color}
                      onChange={(v) => set({ bg_overlay_color: v })}
                    />
                    <Field label={`Opacidad del velo: ${Math.round(c.bg_overlay * 100)}%`}>
                      <input type="range" min={0} max={1} step={0.05} value={c.bg_overlay}
                        onChange={(e) => set({ bg_overlay: Number(e.target.value) })}
                        className="w-full" style={{ accentColor: "var(--brand-1)" }} />
                      <div className="flex justify-between text-xs text-[var(--foreground)]/25 mt-0.5">
                        <span>Sin velo</span><span>100%</span>
                      </div>
                    </Field>
                  </>
                )}
              </>
            )}

            {/* ── Tab: Marca ── */}
            {tab === "marca" && (
              <>
                {/* Tipo de logo */}
                <Field label="Tipo de logo">
                  <div className="flex gap-2">
                    {(["badge", "image"] as const).map((type) => (
                      <button key={type} type="button"
                        onClick={() => set({ logo_type: type })}
                        className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors ${
                          (c.logo_type ?? "badge") === type
                            ? "border-[var(--brand-1)] text-[var(--brand-1)] bg-[var(--brand-1)]/10"
                            : "border-[var(--border)] text-[var(--foreground)]/50 hover:text-[var(--foreground)]"
                        }`}>
                        {type === "badge" ? "Badge (letra + nombre)" : "Logo personalizado"}
                      </button>
                    ))}
                  </div>
                </Field>

                {/* Badge */}
                {(c.logo_type ?? "badge") === "badge" && (
                  <>
                    <Field label="Nombre de la plataforma">
                      <TextInput value={c.brand_name} onChange={(v) => set({ brand_name: v })} placeholder="KONECTA3D" />
                    </Field>
                    <ColorField
                      label="Color de marca (badge, acento decorativo)"
                      value={c.brand_color}
                      onChange={(v) => set({ brand_color: v })}
                    />
                    {/* Vista previa inline */}
                    <div className="rounded-xl border border-[var(--border)] p-4"
                      style={{ background: "var(--background)" }}>
                      <p className="text-xs text-[var(--foreground)]/40 mb-3">Vista previa del badge</p>
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
                          style={{ background: c.brand_color, color: c.button_text_color || "#0f3d3a" }}>
                          {(c.brand_name || "K").charAt(0)}
                        </div>
                        <span className="text-sm font-bold tracking-widest uppercase" style={{ color: c.brand_color }}>
                          {c.brand_name || "KONECTA3D"}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* Logo imagen */}
                {c.logo_type === "image" && (
                  <>
                    <ImageUploadField
                      label="Imagen del logo"
                      value={c.logo_url ?? ""}
                      onChange={(url) => set({ logo_url: url })}
                      kind="login-logo"
                      hint="PNG con fondo transparente recomendado · máx. 5 MB"
                    />
                    <Field label={`Altura del logo: ${c.logo_height ?? 40} px`}>
                      <input type="range" min={20} max={120} step={4}
                        value={c.logo_height ?? 40}
                        onChange={(e) => set({ logo_height: Number(e.target.value) })}
                        className="w-full" style={{ accentColor: "var(--brand-1)" }} />
                      <div className="flex justify-between text-xs text-[var(--foreground)]/25 mt-0.5">
                        <span>20 px</span><span>120 px</span>
                      </div>
                    </Field>
                    {/* Preview */}
                    {c.logo_url && (
                      <div className="rounded-xl border border-[var(--border)] p-4 flex items-center justify-start"
                        style={{ background: "var(--background)" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={c.logo_url} alt="logo preview"
                          style={{ height: Math.min(c.logo_height ?? 40, 80), maxWidth: "100%", objectFit: "contain" }} />
                      </div>
                    )}
                    <ColorField
                      label="Color de acento (decoración)"
                      value={c.brand_color}
                      onChange={(v) => set({ brand_color: v })}
                    />
                  </>
                )}
              </>
            )}

            {/* ── Tab: Textos ── */}
            {tab === "textos" && (
              <>
                {/* Titular */}
                <div className="rounded-xl border border-[var(--border)] p-4 space-y-3"
                  style={{ background: "var(--background)" }}>
                  <p className="text-xs font-semibold text-[var(--foreground)]/60 uppercase tracking-wide">Titular</p>
                  <Field label="Texto">
                    <textarea
                      value={c.headline}
                      onChange={(e) => set({ headline: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm resize-none"
                      placeholder={"Accede a tu\npanel de negocio"}
                    />
                    <p className="text-xs text-[var(--foreground)]/30 mt-1">Salto de línea para dividir en dos líneas.</p>
                  </Field>
                  <ColorField
                    label="Color del titular"
                    value={c.headline_color ?? "#ffffff"}
                    onChange={(v) => set({ headline_color: v })}
                  />
                </div>

                {/* Subtítulo */}
                <div className="rounded-xl border border-[var(--border)] p-4 space-y-3"
                  style={{ background: "var(--background)" }}>
                  <p className="text-xs font-semibold text-[var(--foreground)]/60 uppercase tracking-wide">Subtítulo</p>
                  <Field label="Texto">
                    <TextInput
                      value={c.subtext}
                      onChange={(v) => set({ subtext: v })}
                      placeholder="Gestiona tu presencia digital y captación de leads."
                    />
                  </Field>
                  <ColorField
                    label="Color del subtítulo"
                    value={c.subtext_color ?? "#ffffff"}
                    onChange={(v) => set({ subtext_color: v })}
                  />
                  <Field label={`Opacidad: ${Math.round((c.subtext_opacity ?? 0.45) * 100)}%`}>
                    <input type="range" min={0.1} max={1} step={0.05}
                      value={c.subtext_opacity ?? 0.45}
                      onChange={(e) => set({ subtext_opacity: Number(e.target.value) })}
                      className="w-full" style={{ accentColor: "var(--brand-1)" }} />
                    <div className="flex justify-between text-xs text-[var(--foreground)]/25 mt-0.5">
                      <span>10%</span><span>100%</span>
                    </div>
                  </Field>
                </div>

                {/* Botón */}
                <div className="rounded-xl border border-[var(--border)] p-4 space-y-3"
                  style={{ background: "var(--background)" }}>
                  <p className="text-xs font-semibold text-[var(--foreground)]/60 uppercase tracking-wide">Botón de acceso</p>
                  <Field label="Texto del botón">
                    <TextInput value={c.button_text} onChange={(v) => set({ button_text: v })} placeholder="Entrar →" />
                  </Field>
                  <ColorField
                    label="Color de fondo del botón"
                    value={c.button_color || c.brand_color}
                    onChange={(v) => set({ button_color: v })}
                  />
                  <ColorField
                    label="Color del texto del botón"
                    value={c.button_text_color ?? "#0f3d3a"}
                    onChange={(v) => set({ button_text_color: v })}
                  />
                  {/* Preview del botón */}
                  <div className="pt-1">
                    <div className="w-full py-3 rounded-xl text-sm font-bold text-center"
                      style={{
                        background: c.button_color || c.brand_color,
                        color: c.button_text_color || "#0f3d3a",
                      }}>
                      {c.button_text || "Entrar →"}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── Tab: Soporte ── */}
            {tab === "soporte" && (
              <>
                <Field label="Número de WhatsApp de soporte">
                  <TextInput
                    value={c.support_phone}
                    onChange={(v) => set({ support_phone: v })}
                    placeholder="34623759451"
                    mono
                  />
                  <p className="text-xs text-[var(--foreground)]/30 mt-1">Sin + ni espacios. Enlace en la línea de ayuda inferior.</p>
                </Field>
                <Field label="Etiqueta del enlace de soporte">
                  <TextInput value={c.support_label} onChange={(v) => set({ support_label: v })} placeholder="soporte" />
                  <p className="text-xs text-[var(--foreground)]/30 mt-1">
                    Se muestra como: &ldquo;¿Problemas de acceso? Contacta con <em>{c.support_label || "soporte"}</em>.&rdquo;
                  </p>
                </Field>
              </>
            )}
          </div>
        </div>

        {/* ── Columna derecha: preview ── */}
        <div className="sticky top-6 space-y-3 hidden xl:block">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/50">Vista previa</h2>
            <span className="text-xs text-[var(--foreground)]/25 italic">tiempo real</span>
          </div>
          <LoginPreview config={config} />
          <p className="text-center text-xs text-[var(--foreground)]/25 pt-1">
            El resultado real se ve en{" "}
            <a href="https://app.konecta3d.com" target="_blank" rel="noopener noreferrer"
              className="text-[var(--brand-1)] hover:underline">
              app.konecta3d.com
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
