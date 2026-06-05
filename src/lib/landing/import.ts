// ─── Importador "best-effort" de HTML → bloques ───────────────────────────────
// Convierte el HTML reconocible (titulares, textos, listas, botones, imágenes)
// en bloques editables. Lo que no se puede mapear cae en un bloque "html"
// (editable como código). Pierde la maquetación compleja: extrae el CONTENIDO.
// Se ejecuta en el navegador (usa DOMParser).

import { LandingBlock } from "./blocks";

const uid = () => Math.random().toString(36).slice(2, 10);

const SKIP = new Set(["SCRIPT", "STYLE", "LINK", "META", "HEAD", "NOSCRIPT", "TITLE"]);
const CONTAINERS = new Set(["DIV", "SECTION", "HEADER", "FOOTER", "MAIN", "ARTICLE", "ASIDE", "NAV", "SPAN", "CENTER", "FORM", "BODY", "HTML"]);

/** Texto de un elemento conservando los saltos de <br> como \n. */
function elText(el: Element): string {
  const tmp = el.cloneNode(true) as Element;
  tmp.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
  return (tmp.textContent || "").replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").trim();
}

function heading(el: Element, level: 1 | 2 | 3): LandingBlock | null {
  const text = elText(el);
  return text ? { id: uid(), type: "heading", level, align: "left", padY: "md", text } : null;
}

function mapLeaf(el: Element, tag: string): LandingBlock | null {
  switch (tag) {
    case "H1": return heading(el, 1);
    case "H2": return heading(el, 2);
    case "H3": case "H4": case "H5": case "H6": return heading(el, 3);
    case "P": case "BLOCKQUOTE": {
      const text = elText(el);
      return text ? { id: uid(), type: "paragraph", align: "left", padY: "sm", text } : null;
    }
    case "UL": case "OL": {
      const items = Array.from(el.querySelectorAll(":scope > li")).map((li) => elText(li)).filter(Boolean);
      return items.length ? { id: uid(), type: "bullets", align: "left", padY: "sm", items } : null;
    }
    case "IMG": {
      const src = el.getAttribute("src") || "";
      return src ? { id: uid(), type: "image", align: "center", padY: "sm", src, alt: el.getAttribute("alt") || "", rounded: false } : null;
    }
    case "A": case "BUTTON": {
      const label = elText(el);
      if (!label) return null; // (p. ej. <a> que envuelve una imagen) → caerá a bloque html
      const href = el.getAttribute("href") || "";
      let linkType: "url" | "whatsapp" | "tel" | "email" | "anchor" = "url";
      let value = href;
      if (href.startsWith("#")) { linkType = "anchor"; value = href.slice(1); }
      else if (href.startsWith("tel:")) { linkType = "tel"; value = href.slice(4); }
      else if (href.startsWith("mailto:")) { linkType = "email"; value = href.slice(7); }
      else if (href.includes("wa.me/") || href.includes("api.whatsapp.com")) {
        linkType = "whatsapp"; value = (href.match(/(\d{6,})/) || ["", ""])[1];
      }
      return { id: uid(), type: "button", align: "center", padY: "sm", label, linkType, value, style: "gold", size: "md" };
    }
    case "HR": return { id: uid(), type: "spacer", height: 32, padY: "none" };
    case "BR": return null;
    default: return null;
  }
}

function walk(parent: Node, out: LandingBlock[]) {
  parent.childNodes.forEach((node) => {
    if (node.nodeType === 3) { // texto
      const text = (node.textContent || "").trim();
      if (text) out.push({ id: uid(), type: "paragraph", align: "left", padY: "sm", text });
      return;
    }
    if (node.nodeType !== 1) return; // solo elementos
    const el = node as Element;
    const tag = el.tagName.toUpperCase();
    if (SKIP.has(tag)) return;

    const mapped = mapLeaf(el, tag);
    if (mapped) { out.push(mapped); return; }

    if (CONTAINERS.has(tag)) { walk(el, out); return; }

    // desconocido (svg, video, iframe, table, etc.) → bloque HTML editable
    const outer = (el as HTMLElement).outerHTML?.trim();
    if (outer) out.push({ id: uid(), type: "html", align: "center", padY: "md", html: outer });
  });
}

/** Convierte un string de HTML en una lista de bloques editables. */
export function importHtmlToBlocks(html: string): LandingBlock[] {
  if (typeof window === "undefined" || !html.trim()) return [];
  const doc = new DOMParser().parseFromString(html, "text/html");
  const root = doc.body || doc.documentElement;
  const out: LandingBlock[] = [];
  walk(root, out);
  return out;
}
