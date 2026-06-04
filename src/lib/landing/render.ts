// ─── Render de una landing visual → HTML autónomo ─────────────────────────────
// Pura (sin React). La usan la vista previa del editor (iframe) y la página
// pública /p/[slug]. Mismo resultado en ambos sitios.

import {
  LandingTheme, LandingBlock, ButtonBlock,
  HeadingBlock, ParagraphBlock, BulletsBlock, ImageBlock, SpacerBlock,
} from "./blocks";

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const nl2br = (s: string) => esc(s).replace(/\n/g, "<br/>");

const PAD: Record<string, string> = { none: "0", sm: "24px", md: "44px", lg: "72px", xl: "104px" };

function blockHref(b: ButtonBlock): { href: string; target: string } {
  const v = (b.value || "").trim();
  switch (b.linkType) {
    case "whatsapp": {
      const digits = v.replace(/[^0-9]/g, "");
      const msg = b.waMessage ? `?text=${encodeURIComponent(b.waMessage)}` : "";
      return { href: `https://wa.me/${digits}${msg}`, target: "_blank" };
    }
    case "tel":    return { href: `tel:${v}`, target: "_self" };
    case "email":  return { href: `mailto:${v}`, target: "_self" };
    case "anchor": return { href: `#${v.replace(/^#/, "")}`, target: "_self" };
    default:       return { href: v || "#", target: b.newTab ? "_blank" : "_self" };
  }
}

function renderBlock(b: LandingBlock, t: LandingTheme): string {
  const align = b.align || "left";
  const padY = PAD[b.padY || "md"];
  const bandBg =
    b.bg === "card" ? "background:rgba(255,255,255,0.045);border-top:1px solid rgba(255,255,255,0.08);border-bottom:1px solid rgba(255,255,255,0.08);"
    : b.bg === "brandSoft" ? `background:linear-gradient(135deg, ${hexA(t.brand, 0.12)}, ${hexA(t.bg2, 0.4)});`
    : "";

  let inner = "";
  switch (b.type) {
    case "heading": {
      const h = b as HeadingBlock;
      const size = h.level === 1 ? "clamp(32px,6vw,60px)" : h.level === 2 ? "clamp(26px,4vw,40px)" : "clamp(20px,3vw,28px)";
      const color = h.color || t.text;
      let html = nl2br(h.text);
      if (h.accent) {
        // pinta la última línea con el color de marca
        const parts = esc(h.text).split("\n");
        if (parts.length > 1) {
          const last = parts.pop();
          html = parts.join("<br/>") + `<br/><span style="color:${t.brand}">${last}</span>`;
        }
      }
      inner = `<h${h.level} style="font-size:${size};font-weight:900;line-height:1.1;letter-spacing:-0.02em;color:${color};margin:0">${html}</h${h.level}>`;
      break;
    }
    case "paragraph": {
      const p = b as ParagraphBlock;
      const fs = p.size === "lg" ? "clamp(17px,2.4vw,20px)" : p.size === "sm" ? "14px" : "16px";
      inner = `<p style="font-size:${fs};line-height:1.65;color:${p.color || t.muted};margin:0;max-width:680px;${align === "center" ? "margin-left:auto;margin-right:auto;" : ""}">${nl2br(p.text)}</p>`;
      break;
    }
    case "bullets": {
      const bl = b as BulletsBlock;
      const items = (bl.items || []).map(
        (it) => `<li style="display:flex;gap:12px;align-items:flex-start;margin-bottom:12px;font-size:16px;color:${bl.color || t.text}">
          <span style="flex:0 0 auto;width:22px;height:22px;border-radius:50%;background:${hexA(t.brand, 0.18)};color:${t.brand};display:flex;align-items:center;justify-content:center;font-size:13px;margin-top:1px">✓</span>
          <span>${nl2br(it)}</span></li>`
      ).join("");
      inner = `<ul style="list-style:none;margin:0;padding:0;display:inline-block;text-align:left">${items}</ul>`;
      break;
    }
    case "button": {
      const bt = b as ButtonBlock;
      const { href, target } = blockHref(bt);
      const pad = bt.size === "lg" ? "16px 30px" : "12px 24px";
      const style = bt.style === "ghost"
        ? `background:transparent;color:${t.text};border:1px solid rgba(255,255,255,0.25)`
        : `background:linear-gradient(135deg, ${lighten(t.brand)}, ${t.brand});color:${t.brandText};border:none;box-shadow:0 8px 30px ${hexA(t.brand, 0.35)}`;
      inner = `<a href="${esc(href)}" target="${target}" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;font-weight:700;border-radius:999px;padding:${pad};font-size:${bt.size === "lg" ? "16px" : "15px"};text-decoration:none;${style}">${esc(bt.label)}</a>`;
      break;
    }
    case "image": {
      const im = b as ImageBlock;
      if (!im.src) { inner = ""; break; }
      const w = im.width ? `width:${im.width}px;` : "max-width:100%;";
      const img = `<img src="${esc(im.src)}" alt="${esc(im.alt)}" style="${w}height:auto;display:inline-block;${im.rounded ? "border-radius:18px;" : ""}"/>`;
      inner = im.href ? `<a href="${esc(im.href)}" target="_blank" rel="noopener">${img}</a>` : img;
      break;
    }
    case "spacer": {
      const sp = b as SpacerBlock;
      return `<div style="height:${Math.max(0, sp.height || 0)}px"></div>`;
    }
  }

  return `<section data-reveal style="padding:${padY} 24px;${bandBg}">
    <div style="max-width:1000px;margin:0 auto;text-align:${align}">${inner}</div>
  </section>`;
}

// utilidades de color
function hexA(hex: string, a: number): string {
  const c = hex.replace("#", "");
  const f = c.length === 3 ? c.split("").map((x) => x + x).join("") : c;
  const r = parseInt(f.slice(0, 2), 16), g = parseInt(f.slice(2, 4), 16), b = parseInt(f.slice(4, 6), 16);
  if (isNaN(r)) return `rgba(0,0,0,${a})`;
  return `rgba(${r},${g},${b},${a})`;
}
function lighten(hex: string): string {
  const c = hex.replace("#", "");
  const f = c.length === 3 ? c.split("").map((x) => x + x).join("") : c;
  const adj = (n: number) => Math.min(255, Math.round(n + (255 - n) * 0.25));
  const r = adj(parseInt(f.slice(0, 2), 16)), g = adj(parseInt(f.slice(2, 4), 16)), b = adj(parseInt(f.slice(4, 6), 16));
  if (isNaN(r)) return hex;
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

/** Genera el documento HTML completo y autónomo de la landing. */
export function renderLandingHtml(theme: LandingTheme, blocks: LandingBlock[], title = "Konecta3D"): string {
  const t = { ...theme };
  const bg = t.bgType === "solid"
    ? t.bg1
    : `linear-gradient(${t.bgAngle}deg, ${t.bg1} 0%, ${t.bg2} 55%, ${t.bg1} 100%)`;

  const body = (blocks || []).map((b) => renderBlock(b, t)).join("\n");
  const fontParam = t.font.replace(/ /g, "+");

  return `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=${fontParam}:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{font-family:'${t.font}',-apple-system,BlinkMacSystemFont,sans-serif;background:${bg};
    background-attachment:fixed;color:${t.text};min-height:100vh;-webkit-font-smoothing:antialiased}
  a{color:inherit}
  [data-reveal]{opacity:0;transform:translateY(22px);transition:opacity .6s ease,transform .6s ease}
  [data-reveal].in{opacity:1;transform:none}
  @media(prefers-reduced-motion:reduce){[data-reveal]{opacity:1;transform:none}}
</style>
</head><body>
${body}
<script>
(function(){var els=document.querySelectorAll('[data-reveal]');
if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in')});return;}
var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{threshold:0.1});
els.forEach(function(e){io.observe(e)});})();
</script>
</body></html>`;
}
