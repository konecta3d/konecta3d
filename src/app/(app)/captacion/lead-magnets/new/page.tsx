"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type ResourceType = "pdf" | "url" | "code";
type ResourceStatus = "draft" | "active";

const TYPE_OPTIONS: { value: ResourceType; label: string; hint: string }[] = [
  { value: "pdf", label: "PDF descargable", hint: "URL directa a un PDF ya alojado o generado" },
  { value: "url", label: "Recurso online",  hint: "Vídeo, artículo, landing page o cualquier URL" },
  { value: "code", label: "Cupón o acceso", hint: "Código de descuento, cupón o acceso exclusivo" },
];

export default function NewLeadMagnetAdvancedPage() {
  const router = useRouter();

  const [businessId, setBusinessId] = useState("");
  const [token, setToken]           = useState("");
  const [loading, setLoading]       = useState(true);

  // Form state
  const [type, setType]             = useState<ResourceType>("pdf");
  const [name, setName]             = useState("");
  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [ctaText, setCtaText]       = useState("Descargar ahora");
  const [fileUrl, setFileUrl]       = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [codeValue, setCodeValue]   = useState("");
  const [status, setStatus]         = useState<ResourceStatus>("draft");

  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data: s } = await supabase.auth.getSession();
      const email = s?.session?.user?.email;
      const tok   = s?.session?.access_token;
      if (!email || !tok) { setLoading(false); return; }
      setToken(tok);

      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("contact_email", email)
        .single();

      if (biz?.id) setBusinessId(biz.id);
      setLoading(false);
    };
    load();
  }, []);

  // ── Validation ────────────────────────────────────────────────────────────
  const canSave = name.trim().length > 0;

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!businessId || !canSave) return;
    setSaving(true);
    setError(null);

    const payload = {
      businessId,
      name:         name.trim(),
      type,
      title:        title.trim() || null,
      description:  description.trim() || null,
      cta_text:     ctaText.trim() || "Descargar ahora",
      file_url:     type === "pdf"  ? (fileUrl.trim()    || null) : null,
      external_url: type === "url"  ? (externalUrl.trim() || null) : null,
      code_value:   type === "code" ? (codeValue.trim()  || null) : null,
    };

    try {
      const res = await fetch("/api/captacion/lead-magnets", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al guardar el recurso."); return; }

      // If requested active, do a quick PUT to update status
      if (status === "active" && data.leadMagnet?.id) {
        await fetch(`/api/captacion/lead-magnets/${data.leadMagnet.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status: "active" }),
        });
      }

      router.push("/captacion/lead-magnets");
    } catch {
      setError("Error de red. Comprueba tu conexión.");
    } finally {
      setSaving(false);
    }
  };

  // ── UI ────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm" style={{ color: "var(--foreground)" }}>
        Cargando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: "var(--brand-4)" }}>
              Modo Avanzado
            </p>
            <h1 className="text-xl md:text-2xl font-extrabold" style={{ color: "var(--foreground)" }}>
              Nuevo recurso de captación
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--foreground)", opacity: 0.6 }}>
              Todos los campos de una vez. Sin pasos.
            </p>
          </div>
          <Link
            href="/captacion/lead-magnets"
            className="text-sm shrink-0 mt-1"
            style={{ color: "var(--foreground)", opacity: 0.5 }}
          >
            ← Volver
          </Link>
        </div>

        <div className="rounded-2xl border p-5 md:p-8 space-y-7"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}>

          {/* Error banner */}
          {error && (
            <div className="rounded-lg px-4 py-3 text-sm bg-red-500/10 border border-red-500/30 text-red-400">
              {error}
            </div>
          )}

          {/* Type selector */}
          <div>
            <label className="block text-xs uppercase tracking-widest mb-3 font-bold" style={{ color: "var(--brand-1)" }}>
              Tipo de recurso *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TYPE_OPTIONS.map(({ value, label, hint }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className="p-3 md:p-4 rounded-xl text-left transition-all border-2"
                  style={{
                    borderColor: type === value ? "var(--brand-1)" : "var(--border)",
                    background:  type === value ? "rgba(57,161,169,0.08)" : "transparent",
                  }}
                >
                  <div className="w-2 h-2 rounded-full mb-3" style={{ background: type === value ? "var(--brand-1)" : "var(--border)" }} />
                  <div className="text-xs md:text-sm font-bold" style={{ color: "var(--foreground)" }}>{label}</div>
                  <div className="text-[10px] md:text-xs mt-0.5" style={{ color: "var(--foreground)", opacity: 0.5 }}>{hint}</div>
                  {type === value && (
                    <div className="mt-1.5 text-[10px] font-bold" style={{ color: "var(--brand-1)" }}>Seleccionado</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <hr style={{ borderColor: "var(--border)" }} />

          {/* Internal name */}
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2 font-bold" style={{ color: "var(--brand-1)" }}>
              Nombre interno * <span className="normal-case font-normal opacity-60">(solo lo ves tú)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Guía captación dental 2026"
              className="w-full px-4 py-3 rounded-lg border text-sm"
              style={{
                background:   "var(--background)",
                borderColor:  !name.trim() ? "rgba(239,68,68,0.5)" : "var(--border)",
                color:        "var(--foreground)",
              }}
            />
            {!name.trim() && (
              <p className="text-xs text-red-400 mt-1">Campo obligatorio</p>
            )}
          </div>

          {/* Client-facing title */}
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2 font-bold" style={{ color: "var(--brand-1)" }}>
              Título visible para el cliente
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={
                type === "pdf"  ? "Ej: Guía gratuita: lo que nadie te cuenta antes de tu primera consulta" :
                type === "url"  ? "Ej: El vídeo que debes ver antes de empezar" :
                                  "Ej: Tu descuento de bienvenida"
              }
              className="w-full px-4 py-3 rounded-lg border text-sm"
              style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2 font-bold" style={{ color: "var(--brand-1)" }}>
              Descripción breve
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Qué aprenderá o recibirá quien descargue este recurso"
              className="w-full px-4 py-3 rounded-lg border text-sm resize-none"
              style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
            />
          </div>

          {/* CTA text */}
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2 font-bold" style={{ color: "var(--brand-1)" }}>
              Texto del botón CTA
            </label>
            <input
              type="text"
              value={ctaText}
              onChange={e => setCtaText(e.target.value)}
              placeholder="Descargar ahora"
              className="w-full px-4 py-3 rounded-lg border text-sm"
              style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
            />
          </div>

          {/* Type-specific fields */}
          {type === "pdf" && (
            <div>
              <label className="block text-xs uppercase tracking-widest mb-2 font-bold" style={{ color: "var(--brand-1)" }}>
                URL del PDF
              </label>
              <input
                type="url"
                value={fileUrl}
                onChange={e => setFileUrl(e.target.value)}
                placeholder="https://... (deja vacío si aún no tienes el PDF)"
                className="w-full px-4 py-3 rounded-lg border text-sm font-mono"
                style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
              />
              <p className="text-xs mt-1.5" style={{ color: "var(--foreground)", opacity: 0.4 }}>
                Puedes dejar esto vacío y usar el generador de PDFs del Asistente después.
              </p>
            </div>
          )}

          {type === "url" && (
            <div>
              <label className="block text-xs uppercase tracking-widest mb-2 font-bold" style={{ color: "var(--brand-1)" }}>
                URL de destino
              </label>
              <input
                type="url"
                value={externalUrl}
                onChange={e => setExternalUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-lg border text-sm font-mono"
                style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
              />
            </div>
          )}

          {type === "code" && (
            <div>
              <label className="block text-xs uppercase tracking-widest mb-2 font-bold" style={{ color: "var(--brand-1)" }}>
                Código o cupón
              </label>
              <input
                type="text"
                value={codeValue}
                onChange={e => setCodeValue(e.target.value)}
                placeholder="BIENVENIDO20"
                className="w-full px-4 py-3 rounded-lg border text-sm font-mono tracking-widest"
                style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
              />
            </div>
          )}

          {/* Divider */}
          <hr style={{ borderColor: "var(--border)" }} />

          {/* Status */}
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2 font-bold" style={{ color: "var(--brand-1)" }}>
              Estado inicial
            </label>
            <div className="flex gap-3">
              {([
                { value: "draft",  label: "Borrador",   desc: "No visible en formularios" },
                { value: "active", label: "Activo",     desc: "Disponible en formularios" },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className="flex-1 p-3 rounded-lg text-left border-2 transition-all"
                  style={{
                    borderColor: status === opt.value ? "var(--brand-4)" : "var(--border)",
                    background:  status === opt.value ? "rgba(255,180,0,0.08)" : "transparent",
                  }}
                >
                  <div className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{opt.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--foreground)", opacity: 0.5 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview strip */}
          <div className="rounded-xl border p-4 space-y-2" style={{ background: "var(--background)", borderColor: "var(--border)" }}>
            <div className="text-xs uppercase tracking-widest mb-2 font-bold" style={{ color: "var(--brand-1)" }}>
              Vista previa rápida
            </div>
            <div className="font-bold text-base" style={{ color: "var(--foreground)" }}>
              {title || <span style={{ opacity: 0.3 }}>Título del recurso</span>}
            </div>
            <div className="text-sm" style={{ color: "var(--foreground)", opacity: 0.6 }}>
              {description || <span style={{ opacity: 0.5 }}>Descripción de lo que recibirá el cliente.</span>}
            </div>
            {type === "code" && codeValue && (
              <div
                className="text-center py-2 rounded font-mono font-bold text-lg tracking-widest border"
                style={{ borderColor: "var(--border)", color: "var(--brand-4)" }}
              >
                {codeValue}
              </div>
            )}
            {type === "url" && externalUrl && (
              <div className="text-xs break-all" style={{ color: "var(--foreground)", opacity: 0.3 }}>
                {externalUrl}
              </div>
            )}
            <button
              className="w-full py-2.5 rounded-lg text-sm font-bold mt-1"
              style={{ background: "var(--brand-1)", color: "white" }}
            >
              {ctaText || "Descargar ahora"}
            </button>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/captacion/lead-magnets"
              className="flex-1 py-3 rounded-full border text-center text-sm font-medium"
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              Cancelar
            </Link>
            <button
              onClick={handleSave}
              disabled={saving || !canSave}
              className="flex-1 py-3 rounded-full font-bold text-sm disabled:opacity-40 transition-opacity"
              style={{ background: "var(--brand-4)", color: "black" }}
            >
              {saving ? "Guardando..." : "Guardar recurso"}
            </button>
          </div>

          {/* Wizard suggestion */}
          <p className="text-xs text-center pt-2" style={{ color: "var(--foreground)", opacity: 0.4 }}>
            ¿Quieres crear un PDF con editor completo y vista previa?{" "}
            <Link href="/captacion/lead-magnets/wizard" className="underline hover:opacity-80" style={{ color: "var(--brand-1)" }}>
              Usar el Asistente
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
