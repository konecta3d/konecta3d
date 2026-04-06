"use client";

import { useEffect, useState } from "react";

export default function LandingPreviewPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("konecta-landing-preview");
    if (stored) setData(JSON.parse(stored));
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[var(--brand-1)]">
        No hay datos de vista previa.
      </div>
    );
  }

  const ctaStyle = {
    backgroundColor: data.ctaBg || "#ffffff",
    color: data.ctaTextColor || "#ffffff",
    borderColor: data.ctaBorderColor || "#ffffff",
    borderWidth: `${data.ctaBorderWidth || 2}px`,
    borderStyle: "solid",
    borderRadius: `${data.ctaRadius || 24}px`,
    opacity: (data.ctaOpacity ?? 20) / 100,
    fontSize: `${data.ctaFontSize || 14}px`,
  };

  const hexToRgba = (hex: string, alpha: number) => {
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto w-[390px] min-h-screen bg-transparent">
        <div
          className="relative h-[740px] w-full bg-cover bg-center"
          style={{
            backgroundColor: data.showBg && data.bgMode === "color"
              ? hexToRgba(data.bgColor || "#0f2b33", (data.bgOpacity ?? 100) / 100)
              : "transparent",
            backgroundImage: data.showBg && data.bgMode === "image" && data.bgUrl ? `url(${data.bgUrl})` : "none",
            backgroundSize: data.bgMode === "image" ? "cover" : "auto",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        >
          <div className="relative z-10 px-6 pt-8 text-center" style={{ color: data.textColor || "#ffffff" }}>
            {data.showLogo && data.logoUrl && (
              <div className="flex justify-center">
                <img
                  src={data.logoUrl}
                  alt="logo"
                  className={`object-contain bg-white ${
                    data.logoShape === "round"
                      ? "h-20 w-20 rounded-full"
                      : data.logoShape === "square"
                      ? "h-20 w-20 rounded-xl"
                      : "h-14 w-28 rounded-xl"
                  }`}
                />
              </div>
            )}
            {data.showBusinessName && (
              <div className="mt-3 text-2xl font-semibold">{data.businessName || "Nombre"}</div>
            )}
            {data.showSubtitle && (
              <div className="mt-2 text-base opacity-80">{data.subtitle || "Subtítulo"}</div>
            )}
          </div>

          <div className="relative z-10 mt-8 px-6 space-y-3">
            <div className="h-px w-full bg-white/40" />
            {data.showCta1 && (
              <div className="rounded-full px-5 py-3 text-center font-semibold text-white drop-shadow" style={ctaStyle}>
                {data.cta1Text || "WhatsApp"}
              </div>
            )}
            {data.showCta2 && (
              <div className="rounded-full px-5 py-3 text-center font-semibold text-white drop-shadow" style={ctaStyle}>
                {data.cta2Text || "Instagram"}
              </div>
            )}
            {data.showCta3 && (
              <div className="rounded-full px-5 py-3 text-center font-semibold text-white drop-shadow" style={ctaStyle}>
                {data.cta3Text || "Página Web"}
              </div>
            )}
            {data.showMoreButtons && data.showCta4 && data.cta4Text && (
              <div className="rounded-full px-5 py-3 text-center font-semibold text-white drop-shadow" style={ctaStyle}>
                {data.cta4Text}
              </div>
            )}
            {data.showMoreButtons && data.showCta5 && data.cta5Text && (
              <div className="rounded-full px-5 py-3 text-center font-semibold text-white drop-shadow" style={ctaStyle}>
                {data.cta5Text}
              </div>
            )}
          </div>

          {data.showInvite && (
            <div className="relative z-10 mt-8 px-6">
              <div className="rounded-2xl border border-white/20 bg-white/15 p-5 text-center text-white space-y-2">
                <div className="text-base font-semibold">{data.inviteTitle || "Invitar a un amigo"}</div>
                <div className="text-sm text-white/80">{data.inviteText || "Comparte este link y ganan los 2"}</div>
                <button className="mt-2 w-full rounded-full bg-white text-black px-4 py-2">
                  {data.inviteBtnText || "COMPARTIR"}
                </button>
              </div>
            </div>
          )}
        </div>

        {data.showReview && data.reviewImage && (
          <div className="bg-white p-4">
            <a href={data.reviewLink || "#"}>
              <img src={data.reviewImage} alt="extra" className="w-full rounded-xl" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
