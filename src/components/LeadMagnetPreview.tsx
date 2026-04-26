"use client";

import React, { useRef, useEffect, useState } from "react";

type LeadMagnetType = "guia" | "checklist" | "recomendacion";

export interface LeadMagnetPreviewProps {
  businessName: string;
  type: LeadMagnetType;
  customTitle: string;
  customIntro: string;
  customContent: string;
  logoUrl?: string;
  logoSize?: number;
  showLogo?: boolean;
  cta1Enabled: boolean;
  cta2Enabled: boolean;
  cta1Text: string;
  cta1Link: string;
  cta2Text: string;
  cta2Link: string;
  colorBrand: string;
  colorTag: string;
  colorTitle: string;
  colorButton: string;
  titleSize: number;
  sn1: string;
  sn1En: boolean;
  sn2: string;
  sn2En: boolean;
  sn3?: string;
  sn3En?: boolean;
  sn4?: string;
  sn4En?: boolean;
}

// A4 at 96 dpi: 210mm = 794px, 297mm = 1123px
const A4_W = 794;
const A4_H = 1123;

export function LeadMagnetPreview({
  businessName,
  type,
  customTitle,
  customIntro,
  customContent,
  logoUrl,
  logoSize = 32,
  showLogo = true,
  cta1Enabled,
  cta2Enabled,
  cta1Text,
  cta1Link,
  cta2Text,
  cta2Link,
  colorBrand,
  colorTag,
  colorTitle,
  colorButton,
  titleSize,
  sn1,
  sn1En,
  sn2,
  sn2En,
  sn3 = "",
  sn3En = false,
  sn4 = "",
  sn4En = false,
}: LeadMagnetPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.offsetWidth;
      if (w > 0) setScale(Math.min(1, w / A4_W));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const titleSizePreview = titleSize * 0.6;

  const renderContentPreview = () => {
    if (type === "checklist") {
      return (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {customContent
            .split("\n")
            .filter((l) => l.trim())
            .map((l, i) => (
              <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "0.8rem" }}>
                <span style={{ minWidth: "18px", height: "18px", border: `2px solid ${colorButton}`, borderRadius: "4px", display: "inline-block", marginTop: "3px" }} />
                <span style={{ color: "#374151" }}>{l}</span>
              </li>
            ))}
        </ul>
      );
    }
    if (type === "recomendacion") {
      return (
        <ol style={{ paddingLeft: "1.5rem", color: "#000000", listStyle: "decimal" }}>
          {customContent
            .split("\n")
            .filter((l) => l.trim())
            .map((l, i) => (
              <li key={i} style={{ marginBottom: "1rem", paddingLeft: "10px", color: "#000000", listStylePosition: "inside" }}>
                {l}
              </li>
            ))}
        </ol>
      );
    }
    return <div style={{ whiteSpace: "pre-line", color: "#374151", lineHeight: 1.8 }}>{customContent}</div>;
  };

  const getTypeLabel = () => {
    const labels: Record<LeadMagnetType, string> = {
      guia: "GUIA ESTRATEGICA",
      checklist: "CHECKLIST DE IMPLEMENTACION",
      recomendacion: "RECOMENDACION TECNICA",
    };
    return labels[type];
  };

  // Height that the wrapper should occupy after scaling
  const wrapperHeight = Math.round(A4_H * scale + 40);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        overflow: "hidden",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        background: "var(--card)",
      }}
    >
      {/* Clipping wrapper with the scaled height so layout flow is correct */}
      <div style={{ position: "relative", height: `${wrapperHeight}px`, overflow: "hidden" }}>
        {/* A4 page scaled from top-left corner */}
        <div style={{ transformOrigin: "top left", transform: `scale(${scale})`, position: "absolute", top: "20px", left: "20px" }}>
          <div
            style={{
              width: "210mm",
              minHeight: "297mm",
              padding: "20mm",
              paddingBottom: "15mm",
              background: "#fff",
              position: "relative",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `2px solid ${colorBrand}`, paddingBottom: "20px", marginBottom: "30px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {showLogo && logoUrl && (
                  <img src={logoUrl} alt="logo" style={{ height: `${logoSize}px`, width: `${logoSize}px`, objectFit: "contain", borderRadius: logoSize >= 40 ? "9999px" : "6px" }} />
                )}
                <div style={{ fontSize: "1.2rem", fontWeight: 900, color: colorBrand, textTransform: "uppercase" }}>
                  {(businessName || "MI NEGOCIO").toUpperCase()}
                </div>
              </div>
              <div style={{ background: colorTag, color: "#fff", padding: "5px 15px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase" }}>
                {getTypeLabel()}
              </div>
            </div>

            {/* Title */}
            <div style={{ fontSize: `${titleSizePreview * 1.2}rem`, fontWeight: 900, color: colorTitle, lineHeight: 1.1, marginBottom: "24px", textTransform: "uppercase" }}>
              {customTitle || "TITULO"}
            </div>

            {/* Intro */}
            <div style={{ fontSize: "1.32rem", color: "#4B5563", marginBottom: "48px" }}>
              {customIntro || ""}
            </div>

            {/* Content section */}
            <div style={{ marginBottom: "36px" }}>
              <h4 style={{ color: colorBrand, fontSize: "1.08rem", textTransform: "uppercase", borderLeft: `4px solid ${colorBrand}`, paddingLeft: "12px", marginBottom: "18px" }}>
                {getTypeLabel()}
              </h4>
              <div style={{ fontSize: "1.08rem", lineHeight: 1.8 }}>{renderContentPreview()}</div>
            </div>

            {/* SN Section */}
            {((sn1En && sn1) || (sn2En && sn2) || (sn3En && sn3) || (sn4En && sn4)) && (
              <div style={{ position: "absolute", bottom: "150px", left: "20mm", right: "20mm", padding: "1.44rem", borderTop: "1px dashed rgba(0,0,0,0.1)", borderBottom: "1px dashed rgba(0,0,0,0.1)", borderRadius: "8px", fontSize: "1.02rem", lineHeight: 1.4, background: "#f9fafb" }}>
                {sn1En && sn1 && <div style={{ marginBottom: "14px", color: "#000", fontWeight: "bold" }}>{sn1}</div>}
                {sn2En && sn2 && <div style={{ marginBottom: "14px", color: "#000", fontWeight: "bold" }}>{sn2}</div>}
                {sn3En && sn3 && <div style={{ marginBottom: "14px", color: "#000", fontWeight: "bold" }}>{sn3}</div>}
                {sn4En && sn4 && <div style={{ marginTop: "10px", marginBottom: "15px", fontWeight: "bold", textAlign: "center", color: "#000" }}>{sn4}</div>}
              </div>
            )}

            {/* CTA Box */}
            <div style={{ position: "absolute", bottom: "60px", left: "20mm", right: "20mm", display: "flex", justifyContent: "center", gap: "18px", flexWrap: "wrap" }}>
              {cta1Enabled && cta1Text && (
                <a href={cta1Link || "#"} style={{ padding: "14px 30px", borderRadius: "8px", background: colorButton, color: "#fff", fontWeight: 800, textTransform: "uppercase", fontSize: "1.02rem", textDecoration: "none", display: "inline-block" }}>
                  {cta1Text}
                </a>
              )}
              {cta2Enabled && cta2Text && (
                <a href={cta2Link || "#"} style={{ padding: "14px 30px", borderRadius: "8px", border: `2px solid ${colorButton}`, color: colorButton, fontWeight: 800, textTransform: "uppercase", fontSize: "1.02rem", textDecoration: "none", display: "inline-block" }}>
                  {cta2Text}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
