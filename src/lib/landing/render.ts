// ─── Render de una landing visual → HTML autónomo ─────────────────────────────
// Pura (sin React). La usan la vista previa del editor (iframe) y la página
// pública /p/[slug]. Mismo resultado en ambos sitios.

import {
  LandingTheme, LandingBlock, BlockStyle, ButtonBlock,
  HeadingBlock, ParagraphBlock, BulletsBlock, ImageBlock, SpacerBlock,
  LogosBlock, StepsBlock, CardsBlock, FaqBlock, CountdownBlock, VideoBlock, SocialsBlock, RowBlock, HtmlBlock,
} from "./blocks";
import { SiteConfig, NavLink } from "./site";

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const nl2br = (s: string) => esc(s).replace(/\n/g, "<br/>");

const PAD: Record<string, number> = { none: 0, xs: 12, sm: 24, md: 44, lg: 72, xl: 104 };

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

// ─── Render de cada bloque (inner) ────────────────────────────────────────────

function innerHtml(b: LandingBlock, t: LandingTheme): string {
  const s = b.s || {};
  const textColor = s.color || t.text;

  switch (b.type) {
    case "heading": {
      const h = b as HeadingBlock;
      const size = s.fontSize ? `${s.fontSize}px`
        : h.level === 1 ? "clamp(32px,6vw,60px)" : h.level === 2 ? "clamp(26px,4vw,40px)" : "clamp(20px,3vw,28px)";
      const weight = s.fontWeight || 900;
      const color = h.color || s.color || t.text;
      let html = nl2br(h.text);
      if (h.accent) {
        const parts = esc(h.text).split("\n");
        if (parts.length > 1) {
          const last = parts.pop();
          html = parts.join("<br/>") + `<br/><span style="color:${t.brand}">${last}</span>`;
        }
      }
      return `<h${h.level} style="font-size:${size};font-weight:${weight};line-height:1.1;letter-spacing:-0.02em;color:${color};margin:0">${html}</h${h.level}>`;
    }
    case "paragraph": {
      const p = b as ParagraphBlock;
      const fs = s.fontSize ? `${s.fontSize}px` : p.size === "lg" ? "clamp(17px,2.4vw,20px)" : p.size === "sm" ? "14px" : "16px";
      const weight = s.fontWeight ? `font-weight:${s.fontWeight};` : "";
      return `<p style="font-size:${fs};${weight}line-height:1.65;color:${p.color || s.color || t.muted};margin:0;max-width:720px;${(b.align || "left") === "center" ? "margin-left:auto;margin-right:auto;" : ""}">${nl2br(p.text)}</p>`;
    }
    case "bullets": {
      const bl = b as BulletsBlock;
      const items = (bl.items || []).map(
        (it) => `<li style="display:flex;gap:12px;align-items:flex-start;margin-bottom:12px;font-size:${s.fontSize ? s.fontSize + "px" : "16px"};color:${bl.color || textColor}">
          <span style="flex:0 0 auto;width:22px;height:22px;border-radius:50%;background:${hexA(t.brand, 0.18)};color:${t.brand};display:flex;align-items:center;justify-content:center;font-size:13px;margin-top:1px">✓</span>
          <span>${nl2br(it)}</span></li>`
      ).join("");
      return `<ul style="list-style:none;margin:0;padding:0;display:inline-block;text-align:left">${items}</ul>`;
    }
    case "button": {
      const bt = b as ButtonBlock;
      const { href, target } = blockHref(bt);
      const pad = bt.size === "lg" ? "16px 30px" : "12px 24px";
      const fs = bt.size === "lg" ? "16px" : "15px";
      let btnStyle: string;
      let icon = "";
      if (bt.style === "ghost") {
        btnStyle = `background:transparent;color:${textColor};border:1px solid ${hexA(textColor, 0.3)}`;
      } else if (bt.style === "whatsapp") {
        btnStyle = `background:#25D366;color:#ffffff;border:none;box-shadow:0 8px 30px rgba(37,211,102,0.35)`;
        icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0"><path d="M12 2a10 10 0 00-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1012 2zm0 18a8 8 0 01-4.1-1.1l-.3-.2-2.8.7.7-2.8-.2-.3A8 8 0 1112 20zm4.4-5.6c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 01-3.2-2.8c-.2-.4.2-.4.6-1.2.1-.2 0-.3 0-.5l-.7-1.6c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3a3 3 0 00-.9 2.2c0 1.3 1 2.6 1.1 2.7s1.9 3 4.7 4.1c1.7.7 2.3.8 3.2.6.5-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1z"/></svg>`;
      } else if (bt.style === "white") {
        btnStyle = `background:#ffffff;color:#0a0a0b;border:none;box-shadow:0 8px 30px rgba(255,255,255,0.18)`;
      } else {
        btnStyle = `background:linear-gradient(135deg, ${lighten(t.brand)}, ${t.brand});color:${t.brandText};border:none;box-shadow:0 8px 30px ${hexA(t.brand, 0.35)}`;
      }
      return `<a href="${esc(href)}" target="${target}" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;font-weight:700;border-radius:999px;padding:${pad};font-size:${fs};text-decoration:none;${btnStyle}">${icon}${esc(bt.label)}</a>`;
    }
    case "image": {
      const im = b as ImageBlock;
      if (!im.src) return `<div style="padding:40px;border:1px dashed ${hexA(textColor, 0.3)};border-radius:12px;color:${hexA(textColor, 0.5)};font-size:14px">Añade la URL de una imagen</div>`;
      const w = im.width ? `width:${im.width}px;` : "max-width:100%;";
      const img = `<img src="${esc(im.src)}" alt="${esc(im.alt)}" style="${w}height:auto;display:inline-block;${im.rounded ? "border-radius:18px;" : ""}"/>`;
      return im.href ? `<a href="${esc(im.href)}" target="_blank" rel="noopener">${img}</a>` : img;
    }
    case "logos": {
      const lo = b as LogosBlock;
      const valid = (lo.items || []).filter((i) => i.src);
      const chip = (i: { src: string; alt?: string }) =>
        `<div style="flex:0 0 auto;height:64px;min-width:140px;display:flex;align-items:center;justify-content:center;padding:0 22px;background:${hexA(textColor, 0.05)};border:1px solid ${hexA(textColor, 0.1)};border-radius:14px"><img src="${esc(i.src)}" alt="${esc(i.alt)}" style="max-height:40px;max-width:120px;object-fit:contain;filter:grayscale(1) brightness(1.6);opacity:.85"/></div>`;
      const ph = (n: number) => `<div style="flex:0 0 auto;height:64px;min-width:150px;display:flex;align-items:center;justify-content:center;padding:0 26px;background:${hexA(textColor, 0.05)};border:1px solid ${hexA(textColor, 0.1)};border-radius:14px;color:${hexA(textColor, 0.5)};font-weight:700;font-size:13px">LOGO ${n}</div>`;
      const cells = valid.length > 0 ? valid.map(chip) : [1, 2, 3, 4, 5].map(ph);
      const track = [...cells, ...cells].join("");
      const title = lo.title ? `<p style="font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${hexA(textColor, 0.55)};text-align:center;margin-bottom:22px">${esc(lo.title)}</p>` : "";
      return `${title}<div class="mq"><div class="mqt" style="display:flex;gap:16px;width:max-content">${track}</div></div>`;
    }
    case "steps": {
      const st = b as StepsBlock;
      const cells = (st.items || []).map((it, i) =>
        `<div style="position:relative;background:${hexA(textColor, 0.045)};border:1px solid ${hexA(textColor, 0.1)};border-radius:18px;padding:30px 24px;text-align:left">
          <div style="width:40px;height:40px;border-radius:11px;background:linear-gradient(135deg,${lighten(t.brand)},${t.brand});color:${t.brandText};font-weight:900;font-size:19px;display:flex;align-items:center;justify-content:center;margin-bottom:14px">${i + 1}</div>
          <h3 style="font-size:18px;font-weight:700;margin:0 0 6px;color:${textColor}">${esc(it.title)}</h3>
          <p style="font-size:15px;color:${hexA(textColor, 0.7)};margin:0">${nl2br(it.text)}</p></div>`
      ).join("");
      return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px">${cells}</div>`;
    }
    case "cards": {
      const cd = b as CardsBlock;
      const min = cd.columns === 3 ? 240 : 280;
      const cells = (cd.items || []).map((it) =>
        `<div style="background:${hexA(textColor, 0.045)};border:1px solid ${hexA(textColor, 0.1)};border-radius:18px;padding:26px;text-align:left">
          ${it.icon ? `<div style="font-size:26px;margin-bottom:12px">${esc(it.icon)}</div>` : ""}
          <h3 style="font-size:18px;font-weight:700;margin:0 0 6px;color:${textColor}">${esc(it.title)}</h3>
          <p style="font-size:15px;color:${hexA(textColor, 0.7)};margin:0">${nl2br(it.text)}</p></div>`
      ).join("");
      return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(${min}px,1fr));gap:16px">${cells}</div>`;
    }
    case "faq": {
      const fq = b as FaqBlock;
      const items = (fq.items || []).map((it) =>
        `<details style="background:${hexA(textColor, 0.045)};border:1px solid ${hexA(textColor, 0.1)};border-radius:14px;margin-bottom:10px;overflow:hidden">
          <summary style="cursor:pointer;padding:18px 22px;font-weight:700;font-size:16px;color:${textColor};list-style:none">${esc(it.q)}</summary>
          <div style="padding:0 22px 18px;color:${hexA(textColor, 0.7)};font-size:15px">${nl2br(it.a)}</div></details>`
      ).join("");
      return `<div data-faq style="max-width:760px;margin:0 auto;text-align:left">${items}</div>`;
    }
    case "countdown": {
      const cd = b as CountdownBlock;
      const box = (key: string, lbl: string) =>
        `<div style="min-width:72px;background:${hexA(textColor, 0.06)};border:1px solid ${hexA(textColor, 0.12)};border-radius:14px;padding:14px 10px;text-align:center">
          <div data-${key} style="font-size:30px;font-weight:900;color:${t.brand};line-height:1">--</div>
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:${hexA(textColor, 0.55)};margin-top:4px">${lbl}</div></div>`;
      const label = cd.label ? `<p style="font-size:16px;color:${hexA(textColor, 0.75)};margin:0 0 16px">${esc(cd.label)}</p>` : "";
      const valid = cd.target ? "" : `<p style="font-size:13px;color:${hexA(textColor, 0.45)}">Configura la fecha en el editor</p>`;
      return `${label}<div data-countdown="${esc(cd.target)}" style="display:inline-flex;gap:12px;flex-wrap:wrap;justify-content:center">${box("d", "Días")}${box("h", "Horas")}${box("m", "Min")}${box("s", "Seg")}</div>${valid}`;
    }
    case "video": {
      const v = b as VideoBlock;
      if (!v.url) return `<div style="padding:40px;border:1px dashed ${hexA(textColor, 0.3)};border-radius:12px;color:${hexA(textColor, 0.5)};font-size:14px">Añade la URL del vídeo (YouTube, Vimeo o MP4)</div>`;
      const embed = videoEmbed(v.url);
      return `<div style="max-width:820px;margin:0 auto">${embed}</div>`;
    }
    case "socials": {
      const so = b as SocialsBlock;
      const valid = (so.items || []).filter((i) => i.url);
      const links = valid.map((i) =>
        `<a href="${esc(i.url)}" target="_blank" rel="noopener" aria-label="${esc(i.network)}" style="width:46px;height:46px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:${hexA(textColor, 0.08)};border:1px solid ${hexA(textColor, 0.14)};color:${textColor}">${SOCIAL_SVG[i.network] || SOCIAL_SVG.web}</a>`
      ).join("");
      return `<div style="display:inline-flex;gap:12px;flex-wrap:wrap;justify-content:center">${links}</div>`;
    }
    case "row": {
      const r = b as RowBlock;
      const fr = (r.ratio || "1-1").split("-").map((n) => Number(n) || 1);
      const cols = (r.columns || []).map((col, i) => {
        const childHtml = (col || []).map((c) => renderBlock(c, t, true)).join("");
        return `<div style="flex:${fr[i] || 1} 1 0;min-width:0">${childHtml || ""}</div>`;
      }).join("");
      const valign = r.vAlign === "center" ? "center" : r.vAlign === "bottom" ? "flex-end" : "flex-start";
      const stack = r.stackMobile !== false ? "row-stack" : "";
      return `<div class="${stack}" style="display:flex;gap:${r.gap ?? 24}px;align-items:${valign}">${cols}</div>`;
    }
    case "html":
      return (b as HtmlBlock).html || "";
    case "spacer":
      return "";
  }
}

function renderBlock(b: LandingBlock, t: LandingTheme, nested = false): string {
  if (b.type === "spacer") {
    const sp = b as SpacerBlock;
    return `<div data-bid="${b.id}" style="height:${Math.max(0, sp.height || 0)}px"></div>`;
  }

  const s: BlockStyle = b.s || {};
  const align = b.align || "left";
  const padY = PAD[b.padY || "md"];
  const padT = s.padT ?? padY;
  const padB = s.padB ?? padY;
  // Dentro de una columna no se aplica padding lateral de página (lo da la fila).
  const padX = s.padX ?? (nested ? 0 : 24);
  const hideCls = [s.hideMobile ? "hide-mobile" : "", s.hideDesktop ? "hide-desktop" : ""].filter(Boolean).join(" ");

  // Fondo de la banda
  let bandBg = "";
  if (s.bgImage) bandBg = `background:url('${s.bgImage.replace(/'/g, "")}') center/cover no-repeat;`;
  else if (s.bgColor) bandBg = `background:${s.bgColor};`;
  else if (b.bg === "card") bandBg = `background:${hexA(t.text, 0.045)};border-top:1px solid ${hexA(t.text, 0.08)};border-bottom:1px solid ${hexA(t.text, 0.08)};`;
  else if (b.bg === "brandSoft") bandBg = `background:linear-gradient(135deg, ${hexA(t.brand, 0.12)}, ${hexA(t.bg2, 0.4)});`;

  // Estilo del contenido (inner)
  const maxW = s.maxWidth || 1000;
  const innerExtra: string[] = [`max-width:${maxW}px`, "margin:0 auto", `text-align:${align}`];
  if (s.fontFamily) innerExtra.push(`font-family:'${s.fontFamily}',sans-serif`);
  if (s.radius) innerExtra.push(`border-radius:${s.radius}px`);
  if (s.borderWidth) innerExtra.push(`border:${s.borderWidth}px solid ${s.borderColor || hexA(t.text, 0.15)}`);
  if (s.shadow) innerExtra.push("box-shadow:0 20px 60px rgba(0,0,0,0.35)");
  if ((s.radius || s.borderWidth || s.shadow) && !s.padX) innerExtra.push("padding:28px");

  return `<section data-reveal data-bid="${b.id}" class="${hideCls}" style="padding:${padT}px ${padX}px ${padB}px;${bandBg}">
    <div style="${innerExtra.join(";")}">${innerHtml(b, t)}</div>
  </section>`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function videoEmbed(url: string): string {
  const u = url.trim();
  const yt = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  if (yt) return `<div style="position:relative;padding-bottom:56.25%;height:0;border-radius:16px;overflow:hidden"><iframe src="https://www.youtube.com/embed/${yt[1]}" style="position:absolute;inset:0;width:100%;height:100%;border:0" allowfullscreen allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture"></iframe></div>`;
  const vm = u.match(/vimeo\.com\/(\d+)/);
  if (vm) return `<div style="position:relative;padding-bottom:56.25%;height:0;border-radius:16px;overflow:hidden"><iframe src="https://player.vimeo.com/video/${vm[1]}" style="position:absolute;inset:0;width:100%;height:100%;border:0" allowfullscreen></iframe></div>`;
  return `<video controls style="width:100%;border-radius:16px;display:block"><source src="${esc(u)}"/></video>`;
}

const SOCIAL_SVG: Record<string, string> = {
  instagram: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>`,
  facebook: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M14 9h3V6h-3c-2 0-3 1-3 3v2H9v3h2v6h3v-6h2.5l.5-3H14V9.5c0-.3.2-.5.5-.5z"/></svg>`,
  whatsapp: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1012 2zm0 18a8 8 0 01-4.1-1.1l-.3-.2-2.8.7.7-2.8-.2-.3A8 8 0 1112 20zm4.4-5.6c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 01-3.2-2.8c-.2-.4.2-.4.6-1.2.1-.2 0-.3 0-.5l-.7-1.6c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3a3 3 0 00-.9 2.2c0 1.3 1 2.6 1.1 2.7s1.9 3 4.7 4.1c1.7.7 2.3.8 3.2.6.5-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1z"/></svg>`,
  tiktok: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16 3c.3 2 1.6 3.5 3.5 3.8v2.6c-1.3 0-2.5-.4-3.5-1v5.9a5.4 5.4 0 11-5.4-5.4c.3 0 .5 0 .8.1v2.7a2.7 2.7 0 102 2.6V3z"/></svg>`,
  linkedin: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6.5 8H4v11h2.5zM5.2 4a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM20 19h-2.5v-5.6c0-1.4-.5-2.3-1.7-2.3-1 0-1.5.6-1.7 1.3v6.6H10.6V8H13v1.5c.4-.7 1.3-1.7 3-1.7 2.2 0 3.9 1.4 3.9 4.5z"/></svg>`,
  youtube: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22 8.2a3 3 0 00-2-2C18 5.7 12 5.7 12 5.7s-6 0-8 .5a3 3 0 00-2 2C1.7 10 1.7 12 1.7 12s0 2 .3 3.8a3 3 0 002 2c2 .5 8 .5 8 .5s6 0 8-.5a3 3 0 002-2c.3-1.8.3-3.8.3-3.8s0-2-.3-3.8zM10 15V9l5 3z"/></svg>`,
  web: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></svg>`,
  email: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>`,
};

// ─── Cabecera / pie del sitio ─────────────────────────────────────────────────

function navHref(l: NavLink): { href: string; target: string } {
  if (l.type === "page") return { href: `/p/${(l.value || "").replace(/^\//, "")}`, target: "_self" };
  if (l.type === "anchor") return { href: `#${(l.value || "").replace(/^#/, "")}`, target: "_self" };
  return { href: l.value || "#", target: "_blank" };
}

function renderHeader(site: SiteConfig, t: LandingTheme): string {
  const h = site.header;
  const logo = h.logoType === "image" && h.logoImg
    ? `<img src="${esc(h.logoImg)}" alt="${esc(h.logoText)}" style="height:${h.logoHeight || 32}px;display:block"/>`
    : `<span style="font-weight:800;font-size:18px;color:${t.text}">${esc(h.logoText || "")}</span>`;

  const links = (h.links || []).map((l) => {
    const { href, target } = navHref(l);
    return `<a href="${esc(href)}" target="${target}" style="font-size:14px;color:${hexA(t.text, 0.8)};text-decoration:none">${esc(l.label)}</a>`;
  }).join("");

  let cta = "";
  if (h.ctaType !== "none" && h.ctaLabel) {
    let href = "#", target = "_self";
    if (h.ctaType === "whatsapp") { href = `https://wa.me/${(h.ctaValue || "").replace(/[^0-9]/g, "")}${h.ctaMessage ? `?text=${encodeURIComponent(h.ctaMessage)}` : ""}`; target = "_blank"; }
    else if (h.ctaType === "url") { href = h.ctaValue || "#"; target = "_blank"; }
    else if (h.ctaType === "page") { href = `/p/${(h.ctaValue || "").replace(/^\//, "")}`; }
    else if (h.ctaType === "anchor") { href = `#${(h.ctaValue || "").replace(/^#/, "")}`; }
    cta = `<a href="${esc(href)}" target="${target}" style="display:inline-flex;align-items:center;font-weight:700;font-size:14px;border-radius:999px;padding:9px 18px;text-decoration:none;background:linear-gradient(135deg,${lighten(t.brand)},${t.brand});color:${t.brandText}">${esc(h.ctaLabel)}</a>`;
  }

  return `<header style="${h.sticky ? "position:sticky;top:0;" : ""}z-index:50;backdrop-filter:blur(10px);background:${hexA(t.bg1, 0.72)};border-bottom:1px solid ${hexA(t.text, 0.1)}">
    <div style="max-width:1120px;margin:0 auto;padding:13px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
      <a href="#top" style="display:flex;align-items:center;gap:10px;text-decoration:none">${logo}</a>
      <nav style="display:flex;align-items:center;gap:18px;flex-wrap:wrap">${links}${cta}</nav>
    </div>
  </header>`;
}

function renderFooter(site: SiteConfig, t: LandingTheme): string {
  const f = site.footer;
  const links = (f.links || []).map((l) => {
    const { href, target } = navHref(l);
    return `<a href="${esc(href)}" target="${target}" style="font-size:14px;color:${hexA(t.text, 0.65)};text-decoration:none;margin:0 10px">${esc(l.label)}</a>`;
  }).join("");
  const socials = (f.socials || []).filter((s) => s.url).map((s) =>
    `<a href="${esc(s.url)}" target="_blank" rel="noopener" aria-label="${esc(s.network)}" style="width:40px;height:40px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:${hexA(t.text, 0.08)};border:1px solid ${hexA(t.text, 0.14)};color:${t.text}">${SOCIAL_SVG[s.network] || SOCIAL_SVG.web}</a>`
  ).join("");

  return `<footer style="border-top:1px solid ${hexA(t.text, 0.1)};padding:40px 24px;text-align:center">
    <div style="max-width:1000px;margin:0 auto">
      ${links ? `<div style="margin-bottom:16px">${links}</div>` : ""}
      ${socials ? `<div style="display:flex;gap:10px;justify-content:center;margin-bottom:16px">${socials}</div>` : ""}
      <p style="font-size:13px;color:${hexA(t.text, 0.5)};margin:0">${esc(f.text)}</p>
    </div>
  </footer>`;
}

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
export function renderLandingHtml(theme: LandingTheme, blocks: LandingBlock[], title = "Konecta3D", site?: SiteConfig | null): string {
  const t = { ...theme };
  const bg = t.bgType === "solid"
    ? t.bg1
    : `linear-gradient(${t.bgAngle}deg, ${t.bg1} 0%, ${t.bg2} 55%, ${t.bg1} 100%)`;

  const showChrome = !t.noChrome && !!site;
  const header = showChrome && site!.header?.enabled ? renderHeader(site!, t) : "";
  const footer = showChrome && site!.footer?.enabled ? renderFooter(site!, t) : "";
  const blocksHtml = (blocks || []).map((b) => renderBlock(b, t)).join("\n");
  // El contenido va en un <main> que crece para empujar el pie al fondo
  // (sticky footer), aunque haya poco contenido.
  const body = `${header}<main style="flex:1 0 auto"><span id="top"></span>${blocksHtml}</main>${footer}`;
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
    background-attachment:fixed;color:${t.text};min-height:100vh;-webkit-font-smoothing:antialiased;
    display:flex;flex-direction:column}
  a{color:inherit}
  details summary::-webkit-details-marker{display:none}
  .mq{overflow:hidden;-webkit-mask-image:linear-gradient(to right,transparent,#000 8%,#000 92%,transparent);mask-image:linear-gradient(to right,transparent,#000 8%,#000 92%,transparent)}
  .mqt{animation:mq 40s linear infinite}
  .mq:hover .mqt{animation-play-state:paused}
  @keyframes mq{from{transform:translateX(0)}to{transform:translateX(-50%)}}
  [data-reveal]{opacity:0;transform:translateY(22px);transition:opacity .6s ease,transform .6s ease}
  [data-reveal].in{opacity:1;transform:none}
  @media(prefers-reduced-motion:reduce){[data-reveal]{opacity:1;transform:none}.mqt{animation:none}}
  @media(max-width:760px){.row-stack{flex-direction:column!important}.hide-mobile{display:none!important}}
  @media(min-width:761px){.hide-desktop{display:none!important}}
</style>
</head><body>
${body}
<script>
(function(){
  var els=document.querySelectorAll('[data-reveal]');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{threshold:0.1});
    els.forEach(function(e){io.observe(e)});
  } else { els.forEach(function(e){e.classList.add('in')}); }
  document.querySelectorAll('[data-countdown]').forEach(function(el){
    var raw=el.getAttribute('data-countdown'); if(!raw) return;
    var t=new Date(raw).getTime(); if(isNaN(t)) return;
    function p(n){return (n<10?'0':'')+n}
    function upd(){var s=Math.max(0,Math.floor((t-Date.now())/1000));
      var d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),sec=s%60;
      var q=function(a){return el.querySelector('[data-'+a+']')};
      if(q('d'))q('d').textContent=d; if(q('h'))q('h').textContent=p(h);
      if(q('m'))q('m').textContent=p(m); if(q('s'))q('s').textContent=p(sec);
    } upd(); setInterval(upd,1000);
  });
  document.querySelectorAll('[data-faq]').forEach(function(faq){
    faq.querySelectorAll('details').forEach(function(det){
      det.addEventListener('toggle',function(){
        if(det.open){faq.querySelectorAll('details').forEach(function(o){if(o!==det)o.removeAttribute('open')});}
      });
    });
  });
})();
</script>
</body></html>`;
}
