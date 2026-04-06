import React from "react";
import { LandingConfig } from "@/lib/landingTypes";

function normalizeUrl(url?: string | null): string {
  if (!url) return "#";
  const trimmed = url.trim();

  // Ya es absoluta o es un esquema especial
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

  // Si el usuario pone solo "konecta3d.com" o "www.algo.com"
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

export default function LandingRenderer({
  config,
  toolsEnabled = true,
}: {
  config: LandingConfig;
  toolsEnabled?: boolean;
}) {
  if (!config) return null;

  const ctaStyle = {
    backgroundColor: config.ctaBg || "#ffffff",
    color: config.ctaTextColor || "#ffffff",
    borderColor: config.ctaBorderColor || "#ffffff",
    borderWidth: `${config.ctaBorderWidth ?? 2}px`,
    borderStyle: "solid",
    borderRadius: `${config.ctaRadius ?? 16}px`,
    opacity: (config.ctaOpacity ?? 20) / 100,
    fontSize: `${config.ctaFontSize ?? 14}px`,
  } as React.CSSProperties;

  const heroPaddingTop = config.heroPaddingTop ?? 24;
  const heroPaddingBottom = config.heroPaddingBottom ?? 16;
  const dividerMarginTop = config.dividerMarginTop ?? 12;
  const dividerMarginBottom = config.dividerMarginBottom ?? 12;
  const buttonsGap = config.buttonsGap ?? 12;
  const finalBlockMarginTop = config.finalBlockMarginTop ?? 24;
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

const showColorBg =
  config.showBg && (!config.bgUrl || config.bgMode === "color");

return (
  <div className="min-h-screen bg-transparent">

      <div
        className="min-h-screen w-full bg-no-repeat bg-center relative"
        style={{
          backgroundImage:
            config.showBg && config.bgUrl ? `url(${config.bgUrl})` : "none",
          backgroundSize: config.bgUrl ? `${bgSize}% ${bgSize}%` : "auto",
          backgroundPosition: bgPosition,
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Capa de color por detrás si no hay imagen o modo color */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: showColorBg ? config.bgColor || "#0f2b33" : "transparent",
            opacity: showColorBg ? (config.bgOpacity ?? 100) / 100 : 0,
          }}
        />

        <div
          className="min-h-screen w-full relative"
          style={{
            paddingTop: landingPaddingY,
            paddingBottom: landingPaddingY,
          }}
        >
          <div className="mx-auto w-[390px] min-h-screen px-4">
            <div className="relative w-full" style={{ minHeight: "100vh" }}>
              {/* ── Hero ── */}
              <div
                className={`relative z-10 text-center ${
                  heroContainer ? "rounded-2xl bg-black/30" : ""
                }`}
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
                        width:
                          config.logoShape === "rect"
                            ? logoSize * 1.6
                            : logoSize,
                        height: logoSize,
                      }}
                      className={`object-contain ${
                        config.logoShape === "round"
                          ? "rounded-full"
                          : "rounded-xl"
                      }`}
                    />
                  </div>
                )}

                {config.showBusinessName && (
                  <div
                    className="mt-3 font-semibold"
                    style={{ fontSize: titleSize }}
                  >
                    {config.businessName || "Nombre"}
                  </div>
                )}
{config.showSubtitle && config.subtitle && (
  <div
    className="mt-2"
    style={{ fontSize: subtitleSize, color: textColor }}
  >
    {config.subtitle}
  </div>
)}
              </div>

              {/* ── CTAs ── */}
              <div
                className={`relative z-10 mt-8 ${
                  bodyContainer ? "bg-black/30 p-4 rounded-2xl" : ""
                }`}
                style={{
                  color: textColor,
                  paddingLeft: contentPaddingX,
                  paddingRight: contentPaddingX,
                  gap: buttonsGap,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  className="h-px w-full bg-white/40"
                  style={{
                    marginTop: dividerMarginTop,
                    marginBottom: dividerMarginBottom,
                  }}
                />

                {config.showCta1 && (
  <a
href={
  config.cta1BenefitId
    ? `/api/benefits/generate-pdf?id=${config.cta1BenefitId}`
    : normalizeUrl(config.cta1Link)
}
    className="block"
    download={Boolean(config.cta1BenefitId)}
  >
                    <div
                      className="rounded-xl px-5 py-3 text-center font-semibold text-white drop-shadow w-full max-w-[260px] mx-auto"
                      style={ctaStyle}
                    >
                      {config.cta1Text || "WhatsApp"}
                    </div>
                  </a>
                )}

                {config.showCta2 && (
                  <a
href={
  config.cta2BenefitId
    ? `/api/benefits/generate-pdf?id=${config.cta2BenefitId}`
    : normalizeUrl(config.cta1Link)
}
                    className="block"
                    download={Boolean(config.cta2BenefitId)}
                  >
                    <div
                      className="rounded-xl px-5 py-3 text-center font-semibold text-white drop-shadow w-full max-w-[260px] mx-auto"
                      style={ctaStyle}
                    >
                      {config.cta2Text || "Instagram"}
                    </div>
                  </a>
                )}

                {config.showCta3 && (
                  <a
href={
  config.cta3BenefitId
    ? `/api/benefits/generate-pdf?id=${config.cta1BenefitId}`
    : normalizeUrl(config.cta3Link)
}
                    className="block"
                    download={Boolean(config.cta3BenefitId)}
                  >
                    <div
                      className="rounded-xl px-5 py-3 text-center font-semibold text-white drop-shadow w-full max-w-[260px] mx-auto"
                      style={ctaStyle}
                    >
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
                  >
                    <div
                      className="rounded-xl px-5 py-3 text-center font-semibold text-white drop-shadow w-full max-w-[260px] mx-auto"
                      style={ctaStyle}
                    >
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
                  >
                    <div
                      className="rounded-xl px-5 py-3 text-center font-semibold text-white drop-shadow w-full max-w-[260px] mx-auto"
                      style={ctaStyle}
                    >
                      {config.cta5Text || "CTA 5"}
                    </div>
                  </a>
                )}
              </div>

              {/* ── Bloque final (herramientas / invita / imagen) ── */}
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
  <div className="rounded-2xl border border-white/20 bg-white/10 p-5 text-white space-y-3 text-center">
    <div className="text-base font-semibold">
      {config.toolsTitle || "Herramientas del negocio"}
    </div>
    <div className="text-sm text-white/80">
      {config.toolsSubtitle ||
        "Configura esta sección desde el editor."}
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
          >
            <div className="w-full max-w-[260px] mx-auto rounded-full bg-white text-black px-4 py-2 text-sm font-semibold">
              {tool.label || "Abrir enlace"}
            </div>
          </a>
        ))}
      </div>
    ) : (
      <div className="mt-3 text-xs text-white/60">
        Añade al menos una herramienta en el editor para
        mostrarla aquí.
      </div>
    )}
  </div>
)}
                {/* Invita a un amigo */}
                {config.finalBlockMode === "invite" && (
                  <div className="rounded-2xl border border-white/20 bg-white/10 p-5 text-white space-y-3 text-center">
                    <div className="text-base font-semibold">
                      {config.inviteTitle || "Invita a un amigo"}
                    </div>
                    <div className="text-sm text-white/80">
                      {config.inviteText ||
                        "Comparte esta landing con alguien a quien pueda ayudar."}
                    </div>
                    {config.inviteBtnLink && (
                      <a
                        href={normalizeUrl(config.inviteBtnLink)}
                        target="_blank"
                        rel="noreferrer"
                        className="block mt-2"
                      >
                        <div className="w-full max-w-[260px] mx-auto rounded-full bg-white text-black px-4 py-2 text-sm font-semibold">
                          {config.inviteBtnText || "Compartir enlace"}
                        </div>
                      </a>
                    )}
                  </div>
                )}

                {/* Imagen final */}
                {config.finalBlockMode === "image" && config.reviewImage && (
                  <div
                    className={[
                      "border border-white/20",
                      config.finalImageFramed
                        ? "rounded-2xl bg-white/5 p-1"
                        : "rounded-xl bg-transparent p-0",
                      config.finalImageShadow ? "shadow-lg shadow-black/40" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <a
                      href={normalizeUrl(config.reviewLink)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={config.reviewImage}
                        alt="Bloque final"
                        className="w-full"
                        style={{
                          borderRadius: config.finalImageFramed
                            ? "0.75rem"
                            : "0.75rem",
                          objectFit: "cover",
                          height: (() => {
                            // Si hay altura manual, usarla
                            if (config.finalImageHeight) {
                              return config.finalImageHeight;
                            }
                            // Si no, usar preset por tamaño
                            if (config.finalImageSize === "small") return 140;
                            if (config.finalImageSize === "large") return 260;
                            return 200; // medium
                          })(),
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
    </div>
  );
}
