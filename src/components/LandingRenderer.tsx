"use client";
import React, { useState } from "react";
import { LandingConfig } from "@/lib/landingTypes";
import FormModal from "./FormModal";
import { supabase } from "@/lib/supabase";

interface ActiveForm {
  id: string;
  title: string;
  type: string;
  questions: Array<{ id: string; question_text: string; question_type: string; options?: string[] }>;
  data_collection: string;
}

/**
 * Convierte un color hex + opacidad en rgba().
 * Así la opacidad solo afecta al fondo, nunca al texto del botón.
 */
function hexToRgba(hex: string, opacity: number): string {
  const h = (hex || "#ffffff").replace("#", "");
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
}

/**
 * Garantiza contraste suficiente (ratio WCAG ≥ 3) entre texto y fondo.
 * Corrige configs antiguas con ctaTextColor=#ffffff sobre ctaBg=#ffffff.
 */
function ensureContrast(bg: string, text: string): string {
  const parseHex = (hex: string) => {
    const h = (hex || "").replace("#", "");
    if (h.length !== 6) return null;
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  };
  const luminance = (r: number, g: number, b: number) => {
    const s = [r, g, b].map((c) => {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
  };
  const bgRgb = parseHex(bg);
  const textRgb = parseHex(text);
  if (!bgRgb || !textRgb) return text;
  const bgL = luminance(bgRgb.r, bgRgb.g, bgRgb.b);
  const textL = luminance(textRgb.r, textRgb.g, textRgb.b);
  const lighter = Math.max(bgL, textL);
  const darker = Math.min(bgL, textL);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  if (ratio < 3) {
    return bgL > 0.4 ? "#0c1a24" : "#ffffff";
  }
  return text;
}

function normalizeUrl(url?: string | null): string {
  if (!url) return "#";
  const trimmed = url.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("whatsapp:") ||
    trimmed.startsWith("wa.me") ||
    trimmed.startsWith("sms:")
  ) {
    return trimmed;
  }
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

export default function LandingRenderer({
  config,
  toolsEnabled = true,
  activeForms = [],
}: {
  config: LandingConfig;
  toolsEnabled?: boolean;
  activeForms?: ActiveForm[];
}) {
  if (!config) return null;

  const [formModalOpen, setFormModalOpen] = useState(false);
  const activeForm = activeForms[0] as ActiveForm | undefined;

  // ── Estilos de botón CTA ─────────────────────────────────────────────────
  // La opacidad se aplica SOLO al fondo (rgba) para que el texto sea siempre legible.
  // ensureContrast corrige configs antiguas con texto y fondo del mismo color.
  // Los estilos se inyectan con <style> para que ninguna regla CSS de clase
  // pueda sobreescribir el color (independiente del modo claro/oscuro del app).
  const ctaBg = config.ctaBg || "#ffffff";
  const ctaOpacity = config.ctaOpacity ?? 100;
  const ctaTextColor = ensureContrast(ctaBg, config.ctaTextColor || "#0c1a24");
  const ctaBgRgba = hexToRgba(ctaBg, ctaOpacity);

  const ctaBaseStyle: React.CSSProperties = {
    borderColor: config.ctaBorderColor || "transparent",
    borderWidth: `${config.ctaBorderWidth ?? 0}px`,
    borderStyle: "solid",
    borderRadius: `${config.ctaRadius ?? 16}px`,
    fontSize: `${config.ctaFontSize ?? 15}px`,
  };
  // ─────────────────────────────────────────────────────────────────────────

  const heroPaddingTop = config.heroPaddingTop ?? 48;
  const heroPaddingBottom = config.heroPaddingBottom ?? 20;
  const dividerMarginTop = config.dividerMarginTop ?? 16;
  const dividerMarginBottom = config.dividerMarginBottom ?? 16;
  const buttonsGap = config.buttonsGap ?? 16;
  const finalBlockMarginTop = config.finalBlockMarginTop ?? 28;
  const contentPaddingX = config.contentPaddingX ?? 24;
  const landingPaddingY = config.landingPaddingY ?? 0;
  const heroContainer = config.heroContainer ?? false;
  const bodyContainer = config.bodyContainer ?? false;
  const logoSize = config.logoSize ?? 80;
  const titleSize = config.titleSize ?? 26;
  const subtitleSize = config.subtitleSize ?? 16;
  const textColor = config.textColor ?? "#ffffff";
  const bgSize = config.bgSize ?? 120;
  const bgPosition = config.bgPosition ?? "center center";

  const showColorBg = config.showBg && (!config.bgUrl || config.bgMode === "color");

  const trackEvent = async (eventType: string, entityType: string, entityId: string, metadata: Record<string, unknown> = {}) => {
    try {
      await supabase.from("analytics_events").insert({
        business_id: config.businessId,
        event_type: eventType,
        entity_type: entityType,
        entity_id: entityId,
        metadata,
      });
    } catch {
      // Silencioso — analytics no debe romper la página
    }
  };

  const handleShare = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      navigator.share({ url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  };

  return (
    <div className="landing-public min-h-screen bg-transparent">
      {/* Estilos de botones CTA inyectados directamente — no pueden ser
          sobreescritos por ninguna regla de clase CSS del tema global */}
      <style>{`
        .landing-cta {
          background-color: ${ctaBgRgba} !important;
          color: ${ctaTextColor} !important;
        }
      `}</style>
      <div
        className="min-h-screen w-full bg-no-repeat bg-center relative"
        style={{
          backgroundImage: config.showBg && config.bgUrl ? `url(${config.bgUrl})` : "none",
          backgroundSize: config.bgUrl ? `${bgSize}% ${bgSize}%` : "auto",
          backgroundPosition: bgPosition,
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Capa de color de fondo */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: showColorBg ? config.bgColor || "#0f2b33" : "transparent",
            opacity: showColorBg ? (config.bgOpacity ?? 100) / 100 : 0,
          }}
        />

        <div className="min-h-screen w-full relative" style={{ paddingTop: landingPaddingY, paddingBottom: landingPaddingY }}>
          <div className="mx-auto w-[390px] min-h-screen px-4">
            <div className="relative w-full" style={{ minHeight: "100vh" }}>

              {/* ── Hero ── */}
              <div
                className={`relative z-10 text-center ${heroContainer ? "rounded-2xl bg-black/30" : ""}`}
                style={{
                  color: textColor,
                  paddingTop: heroPaddingTop,
                  paddingBottom: heroPaddingBottom,
                  paddingLeft: contentPaddingX,
                  paddingRight: contentPaddingX,
                }}
              >
                {config.showLogo && config.logoUrl && (
                  <div className="flex justify-center">
                    <img
                      src={config.logoUrl}
                      alt="logo"
                      style={{
                        width: config.logoShape === "rect" ? logoSize * 1.6 : logoSize,
                        height: logoSize,
                      }}
                      className={`object-contain ${config.logoShape === "round" ? "rounded-full" : "rounded-xl"}`}
                    />
                  </div>
                )}
                {config.showBusinessName && (
                  <div className="mt-3 font-semibold" style={{ fontSize: titleSize }}>
                    {config.businessName || "Nombre"}
                  </div>
                )}
                {config.showSubtitle && config.subtitle && (
                  <div className="mt-2" style={{ fontSize: subtitleSize, color: textColor }}>
                    {config.subtitle}
                  </div>
                )}
              </div>

              {/* ── Botones CTA ── */}
              <div
                className={`relative z-10 mt-8 ${bodyContainer ? "bg-black/30 p-4 rounded-2xl" : ""}`}
                style={{
                  paddingLeft: contentPaddingX,
                  paddingRight: contentPaddingX,
                  gap: buttonsGap,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  className="h-px w-full bg-white/40"
                  style={{ marginTop: dividerMarginTop, marginBottom: dividerMarginBottom }}
                />

                {config.showCta1 && (
                  <a
                    href={config.cta1BenefitId ? `/api/benefits/generate-pdf?id=${config.cta1BenefitId}` : normalizeUrl(config.cta1Link)}
                    className="block"
                    download={Boolean(config.cta1BenefitId)}
                    onClick={() => trackEvent("cta_click", "landing", config.businessId || "", { cta_number: 1 })}
                  >
                    {/* Sin text-white — el color lo controla ctaStyle.color */}
                    <div className="landing-cta rounded-xl px-5 py-3 text-center font-semibold drop-shadow w-full max-w-[260px] mx-auto" style={ctaBaseStyle}>
                      {config.cta1Text || "WhatsApp"}
                    </div>
                  </a>
                )}

                {config.showCta2 && (
                  <a
                    href={config.cta2BenefitId ? `/api/benefits/generate-pdf?id=${config.cta2BenefitId}` : normalizeUrl(config.cta2Link)}
                    className="block"
                    download={Boolean(config.cta2BenefitId)}
                    onClick={() => trackEvent("cta_click", "landing", config.businessId || "", { cta_number: 2 })}
                  >
                    <div className="landing-cta rounded-xl px-5 py-3 text-center font-semibold drop-shadow w-full max-w-[260px] mx-auto" style={ctaBaseStyle}>
                      {config.cta2Text || "Instagram"}
                    </div>
                  </a>
                )}

                {config.showCta3 && (
                  <a
                    href={config.cta3BenefitId ? `/api/benefits/generate-pdf?id=${config.cta3BenefitId}` : normalizeUrl(config.cta3Link)}
                    className="block"
                    download={Boolean(config.cta3BenefitId)}
                    onClick={() => trackEvent("cta_click", "landing", config.businessId || "", { cta_number: 3 })}
                  >
                    <div className="landing-cta rounded-xl px-5 py-3 text-center font-semibold drop-shadow w-full max-w-[260px] mx-auto" style={ctaBaseStyle}>
                      {config.cta3Text || "Página Web"}
                    </div>
                  </a>
                )}

                {config.showMoreButtons && config.showCta4 && (
                  <a
                    href={normalizeUrl(config.cta4Link)}
                    target="_blank"
                    rel="noreferrer"
                    className="block"
                    onClick={() => trackEvent("cta_click", "landing", config.businessId || "", { cta_number: 4 })}
                  >
                    <div className="landing-cta rounded-xl px-5 py-3 text-center font-semibold drop-shadow w-full max-w-[260px] mx-auto" style={ctaBaseStyle}>
                      {config.cta4Text || "CTA 4"}
                    </div>
                  </a>
                )}

                {config.showMoreButtons && config.showCta5 && (
                  <a
                    href={normalizeUrl(config.cta5Link)}
                    target="_blank"
                    rel="noreferrer"
                    className="block"
                    onClick={() => trackEvent("cta_click", "landing", config.businessId || "", { cta_number: 5 })}
                  >
                    <div className="landing-cta rounded-xl px-5 py-3 text-center font-semibold drop-shadow w-full max-w-[260px] mx-auto" style={ctaBaseStyle}>
                      {config.cta5Text || "CTA 5"}
                    </div>
                  </a>
                )}

                {/* Formulario */}
                {activeForm && (
                  <button
                    onClick={() => setFormModalOpen(true)}
                    className="rounded-xl px-5 py-3 text-center font-semibold drop-shadow w-full max-w-[260px] mx-auto"
                    style={{
                      backgroundColor: "#39a1a9",
                      color: "#ffffff",
                      borderWidth: "0px",
                      borderStyle: "solid",
                      borderColor: "#39a1a9",
                      borderRadius: "16px",
                      fontSize: "15px",
                    }}
                  >
                    Formulario
                  </button>
                )}
              </div>

              {/* ── Bloque final ── */}
              <div
                className="mt-8"
                style={{
                  marginTop: finalBlockMarginTop,
                  paddingLeft: contentPaddingX,
                  paddingRight: contentPaddingX,
                }}
              >
                {/* Herramientas */}
                {config.finalBlockMode === "tools" && (
                  <div className="rounded-2xl border border-white/20 bg-white/10 p-5 space-y-3 text-center" style={{ color: textColor }}>
                    <div className="text-base font-semibold">
                      {config.toolsTitle || "Herramientas del negocio"}
                    </div>
                    <div className="text-sm" style={{ color: textColor, opacity: 0.8 }}>
                      {config.toolsSubtitle || "Configura esta sección desde el editor."}
                    </div>
                    {toolsEnabled && config.tools?.length > 0 ? (
                      <div className="mt-3 flex flex-col gap-2">
                        {config.tools.map((tool) => (
                          <a
                            key={tool.id}
                            href={normalizeUrl(tool.url)}
                            target="_blank"
                            rel="noreferrer"
                            className="block"
                            onClick={() => trackEvent("link_click", "tool", tool.id, { tool_label: tool.label })}
                          >
                            <div className="w-full max-w-[260px] mx-auto rounded-full bg-white px-4 py-2 text-sm font-semibold" style={{ color: "#0c1a24" }}>
                              {tool.label || "Abrir enlace"}
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3 text-xs" style={{ color: textColor, opacity: 0.6 }}>
                        Añade al menos una herramienta en el editor para mostrarla aquí.
                      </div>
                    )}
                  </div>
                )}

                {/* Invita a un amigo — el botón siempre se muestra */}
                {config.finalBlockMode === "invite" && (
                  <div className="rounded-2xl border border-white/20 bg-white/10 p-5 space-y-3 text-center" style={{ color: textColor }}>
                    <div className="text-base font-semibold">
                      {config.inviteTitle || "Invita a un amigo"}
                    </div>
                    <div className="text-sm" style={{ color: textColor, opacity: 0.8 }}>
                      {config.inviteText || "Comparte esta landing con alguien a quien pueda ayudar."}
                    </div>
                    {/* Si hay link configurado, usarlo; si no, compartir la URL actual */}
                    {config.inviteBtnLink ? (
                      <a
                        href={normalizeUrl(config.inviteBtnLink)}
                        target="_blank"
                        rel="noreferrer"
                        className="block mt-2"
                        onClick={() => trackEvent("cta_click", "landing", config.businessId || "", { cta_number: "invite" })}
                      >
                        <div className="w-full max-w-[260px] mx-auto rounded-full bg-white px-4 py-2 text-sm font-semibold" style={{ color: "#0c1a24" }}>
                          {config.inviteBtnText || "Compartir enlace"}
                        </div>
                      </a>
                    ) : (
                      <button
                        type="button"
                        className="block mt-2 w-full"
                        onClick={() => {
                          trackEvent("cta_click", "landing", config.businessId || "", { cta_number: "invite" });
                          handleShare();
                        }}
                      >
                        <div className="w-full max-w-[260px] mx-auto rounded-full bg-white px-4 py-2 text-sm font-semibold" style={{ color: "#0c1a24" }}>
                          {config.inviteBtnText || "Compartir enlace"}
                        </div>
                      </button>
                    )}
                  </div>
                )}

                {/* Imagen final */}
                {config.finalBlockMode === "image" && config.reviewImage && (
                  <div
                    className={[
                      "border border-white/20",
                      config.finalImageFramed ? "rounded-2xl bg-white/5 p-1" : "rounded-xl bg-transparent p-0",
                      config.finalImageShadow ? "shadow-lg shadow-black/40" : "",
                    ].filter(Boolean).join(" ")}
                  >
                    <a
                      href={normalizeUrl(config.reviewLink)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => trackEvent("link_click", "review_image", config.businessId || "")}
                    >
                      <img
                        src={config.reviewImage}
                        alt="Bloque final"
                        className="w-full"
                        style={{
                          borderRadius: "0.75rem",
                          objectFit: "cover",
                          height: config.finalImageHeight
                            ? config.finalImageHeight
                            : config.finalImageSize === "small"
                            ? 140
                            : config.finalImageSize === "large"
                            ? 260
                            : 200,
                        }}
                      />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal formulario */}
      {activeForm && (
        <FormModal
          isOpen={formModalOpen}
          onClose={() => setFormModalOpen(false)}
          form={activeForm}
        />
      )}
    </div>
  );
}
