"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DEFAULT_LANDING_HTML } from "@/lib/landing-template";
import { renderLandingHtml } from "@/lib/landing/render";
import {
  LandingBlock, LandingTheme, BlockStyle, RowBlock,
  DEFAULT_THEME, newBlock, BLOCK_LABELS, CHILD_BLOCK_TYPES,
  SECTION_TEMPLATES, sectionTemplate,
} from "@/lib/landing/blocks";
import { SiteConfig, SiteHeader, SiteFooter, NavLink, DEFAULT_SITE } from "@/lib/landing/site";
import { importHtmlToBlocks } from "@/lib/landing/import";

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${data.session?.access_token || ""}`, "Content-Type": "application/json" };
}

interface LandingRow { id: string; slug: string; name: string; published: boolean; updated_at: string; }
interface LandingFull extends LandingRow {
  mode: "visual" | "code";
  html: string;
  blocks: LandingBlock[] | null;
  theme: LandingTheme | null;
}

// ─── Helpers de formulario ────────────────────────────────────────────────────
const Lbl = ({ children }: { children: React.ReactNode }) =>
  <label className="block text-[11px] uppercase tracking-wide text-[var(--foreground)]/50 mb-1">{children}</label>;
const inputCls = "w-full rounded-lg border border-[var(--border)] bg-transparent px-2.5 py-1.5 text-sm";

// Tipos de bloque agrupados por categoría para el selector "Añadir bloque".
const BLOCK_GROUPS: { label: string; types: LandingBlock["type"][] }[] = [
  { label: "Texto", types: ["heading", "paragraph", "bullets"] },
  { label: "Llamada a la acción", types: ["button", "socials"] },
  { label: "Multimedia", types: ["image", "video"] },
  { label: "Secciones", types: ["steps", "cards", "faq", "logos", "countdown"] },
  { label: "Estructura", types: ["row", "spacer", "html"] },
];

function Seg<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { v: T; l: string }[] }) {
  return (
    <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
      {options.map((o) => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)}
          className={`flex-1 px-2 py-1.5 text-xs ${value === o.v ? "bg-[var(--brand-1)] text-white" : "hover:bg-[var(--border)]/20"}`}>{o.l}</button>
      ))}
    </div>
  );
}

// Selector de archivo (sube a Supabase Storage vía /api/admin/upload y guarda la URL)
function ImagePicker({ value, onChange, kind, label }: { value?: string; onChange: (url: string) => void; kind?: string; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (ref.current) ref.current.value = "";
    if (!file) return;
    setBusy(true); setErr(null);
    try {
      const { data } = await supabase.auth.getSession();
      const fd = new FormData(); fd.append("file", file); fd.append("kind", kind || "landing");
      const res = await fetch("/api/admin/upload", { method: "POST", headers: { Authorization: `Bearer ${data.session?.access_token || ""}` }, body: fd });
      const json = await res.json();
      if (json.url) onChange(json.url); else setErr(json.error || "Error al subir");
    } catch { setErr("Error al subir"); }
    setBusy(false);
  }
  return (
    <div>
      {label && <Lbl>{label}</Lbl>}
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {value
          ? <img src={value} alt="" className="h-10 w-10 object-contain rounded border border-[var(--border)] bg-[var(--background)] flex-shrink-0" />
          : <div className="h-10 w-10 rounded border border-dashed border-[var(--border)] flex items-center justify-center text-[10px] text-[var(--foreground)]/30 flex-shrink-0">img</div>}
        <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/10 disabled:opacity-50">{busy ? "Subiendo…" : value ? "Cambiar" : "Seleccionar archivo"}</button>
        {value && <button type="button" onClick={() => onChange("")} className="text-xs px-2 py-1.5 text-red-500/70 hover:text-red-500">Quitar</button>}
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={pick} />
      </div>
      {err && <p className="text-[11px] text-red-500 mt-1">{err}</p>}
    </div>
  );
}

// Selector de color opcional (vacío = usa el color del tema)
function ColorField({ label, value, onChange, fallback = "#ffffff" }: { label: string; value?: string; onChange: (v: string | undefined) => void; fallback?: string }) {
  return (
    <div>
      <Lbl>{label}</Lbl>
      <div className="flex items-center gap-1.5">
        <input type="color" value={value || fallback} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 rounded-lg border border-[var(--border)] bg-transparent flex-shrink-0" />
        {value
          ? <button type="button" onClick={() => onChange(undefined)} className="text-[11px] px-2 py-1 rounded border border-[var(--border)] hover:bg-[var(--border)]/10">Tema</button>
          : <span className="text-[11px] text-[var(--foreground)]/40">Color del tema</span>}
      </div>
    </div>
  );
}

export default function LandingsAdminPage() {
  const [list, setList] = useState<LandingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<LandingFull | null>(null);
  const [selId, setSelId] = useState<string | null>(null);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [site, setSite] = useState<SiteConfig>(DEFAULT_SITE);
  const [siteEditing, setSiteEditing] = useState<SiteConfig | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiForm, setAiForm] = useState({ objective: "", audience: "", mentor: "ambos", notes: "" });
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [themeOpen, setThemeOpen] = useState(true);
  const [addType, setAddType] = useState<LandingBlock["type"]>("heading");
  const [addSectionKey, setAddSectionKey] = useState("hero");
  const previewRef = useRef<HTMLIFrameElement>(null);
  const previewHtmlRef = useRef("");

  useEffect(() => { setOrigin(window.location.origin); load(); loadSite(); }, []);

  async function loadSite() {
    try {
      const res = await fetch("/api/admin/landings/site", { headers: await authHeaders() });
      const json = await res.json();
      if (json.site) setSite({ ...DEFAULT_SITE, ...json.site });
    } catch { /* */ }
  }

  async function saveSite(cfg: SiteConfig) {
    setSaving(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/landings/site", {
        method: "PUT", headers: await authHeaders(), body: JSON.stringify({ site: cfg }),
      });
      const json = await res.json();
      if (json.error) setMsg(json.error);
      else { setSite(cfg); setSiteEditing(null); setMsg("Cabecera y pie guardados"); }
    } catch { setMsg("No se pudo guardar el sitio"); }
    setSaving(false);
  }

  // Vista previa en vivo (con pequeño debounce)
  useEffect(() => {
    if (!editing) return;
    const id = setTimeout(() => {
      if (editing.mode === "visual") {
        setPreviewHtml(renderLandingHtml(editing.theme || DEFAULT_THEME, editing.blocks || [], editing.name, site));
      } else {
        setPreviewHtml(editing.html || "");
      }
    }, 250);
    return () => clearTimeout(id);
  }, [editing, site]);

  // Pinta la vista previa en el iframe SIN recargarlo (evita el parpadeo y el salto al inicio)
  useEffect(() => {
    previewHtmlRef.current = previewHtml;
    paintPreview();
  }, [previewHtml]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/landings", { headers: await authHeaders() });
      const json = await res.json();
      if (json.landings) setList(json.landings);
    } catch { /* */ }
    setLoading(false);
  }

  async function createNew() {
    const name = prompt("Nombre de la landing (p. ej. Presentación negocios):");
    if (!name?.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/landings", {
        method: "POST", headers: await authHeaders(),
        body: JSON.stringify({ name: name.trim(), mode: "visual" }),
      });
      const json = await res.json();
      if (json.error) setMsg(json.error);
      else { await load(); openEditor(json.landing.id); }
    } catch { setMsg("No se pudo crear"); }
    setSaving(false);
  }

  async function openEditor(id: string) {
    setMsg(null); setSelId(null);
    try {
      const res = await fetch(`/api/admin/landings/${id}`, { headers: await authHeaders() });
      const json = await res.json();
      if (json.landing) {
        const l = json.landing as LandingFull;
        setEditing({
          ...l,
          mode: l.mode === "code" ? "code" : "visual",
          blocks: Array.isArray(l.blocks) ? l.blocks : [],
          theme: { ...DEFAULT_THEME, ...(l.theme || {}) },
          html: l.html || "",
        });
      } else setMsg(json.error || "No se pudo abrir");
    } catch { setMsg("No se pudo abrir"); }
  }

  async function save() {
    if (!editing) return;
    setSaving(true); setMsg(null);
    try {
      const res = await fetch(`/api/admin/landings/${editing.id}`, {
        method: "PUT", headers: await authHeaders(),
        body: JSON.stringify({
          name: editing.name, slug: editing.slug, published: editing.published,
          mode: editing.mode, html: editing.html, blocks: editing.blocks, theme: editing.theme,
        }),
      });
      const json = await res.json();
      if (json.error) setMsg(json.error);
      else { setMsg("Guardado"); await load(); if (json.landing) setEditing({ ...editing, slug: json.landing.slug }); }
    } catch { setMsg("No se pudo guardar"); }
    setSaving(false);
  }

  async function remove(id: string, name: string) {
    if (!confirm(`¿Eliminar la landing "${name}"?`)) return;
    try { await fetch(`/api/admin/landings/${id}`, { method: "DELETE", headers: await authHeaders() }); await load(); }
    catch { setMsg("No se pudo eliminar"); }
  }

  function copyLink(slug: string) {
    navigator.clipboard.writeText(`${origin}/p/${slug}`);
    setMsg(`Link copiado: ${origin}/p/${slug}`); setTimeout(() => setMsg(null), 2500);
  }

  // ── Operaciones de bloques ──────────────────────────────────────────────────
  function setBlocks(blocks: LandingBlock[]) { if (editing) setEditing({ ...editing, blocks }); }
  function updateBlock(id: string, patch: Partial<LandingBlock>) {
    if (!editing?.blocks) return;
    setBlocks(editing.blocks.map((b) => (b.id === id ? { ...b, ...patch } as LandingBlock : b)));
  }
  function addBlock(type: LandingBlock["type"]) {
    if (!editing) return;
    const b = newBlock(type);
    const arr = [...(editing.blocks || [])];
    const idx = selId ? arr.findIndex((x) => x.id === selId) : -1;
    if (idx >= 0) arr.splice(idx + 1, 0, b); else arr.push(b);
    setBlocks(arr); setSelId(b.id);
  }
  function addSection(key: string) {
    if (!editing) return;
    const blocks = sectionTemplate(key);
    if (blocks.length === 0) return;
    const arr = [...(editing.blocks || [])];
    const idx = selId ? arr.findIndex((x) => x.id === selId) : -1;
    if (idx >= 0) arr.splice(idx + 1, 0, ...blocks); else arr.push(...blocks);
    setBlocks(arr); setSelId(blocks[0].id);
  }
  function duplicateBlock(id: string) {
    if (!editing?.blocks) return;
    const arr = [...editing.blocks];
    const idx = arr.findIndex((x) => x.id === id);
    if (idx < 0) return;
    const copy = { ...JSON.parse(JSON.stringify(arr[idx])), id: Math.random().toString(36).slice(2, 10) };
    arr.splice(idx + 1, 0, copy); setBlocks(arr); setSelId(copy.id);
  }
  /** Selecciona un bloque y desplaza la vista previa hasta esa sección. */
  function selectBlock(id: string) {
    setSelId(id);
    setThemeOpen(false);
    setTimeout(() => {
      try {
        const doc = previewRef.current?.contentDocument;
        const el = doc?.querySelector(`[data-bid="${id}"]`) as HTMLElement | null;
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.style.transition = "outline .2s";
          el.style.outline = "3px solid #ffb400";
          el.style.outlineOffset = "-3px";
          setTimeout(() => { el.style.outline = "none"; }, 1400);
        }
      } catch { /* iframe no accesible */ }
    }, 40);
  }
  /** Engancha (una sola vez por documento) el clic para seleccionar un bloque desde la vista previa. */
  function attachPreviewClick(doc: Document) {
    const d = doc as Document & { __k3dClick?: boolean };
    if (d.__k3dClick) return;
    d.__k3dClick = true;
    doc.addEventListener("click", (e) => {
      const start = (e.target as HTMLElement)?.closest?.("[data-bid]") as HTMLElement | null;
      if (!start) return;
      // subir al data-bid más externo = bloque de nivel superior
      let outer = start;
      let p: HTMLElement | null = start.parentElement;
      while (p) {
        const a = p.closest("[data-bid]") as HTMLElement | null;
        if (!a) break;
        outer = a; p = a.parentElement;
      }
      const bid = outer.getAttribute("data-bid");
      if (!bid) return;
      e.preventDefault();
      e.stopPropagation();
      setSelId(bid);
      setThemeOpen(false);
      outer.style.outline = "3px solid #ffb400";
      outer.style.outlineOffset = "-3px";
      setTimeout(() => { outer.style.outline = "none"; }, 1200);
    }, true);
  }
  /** Pinta el HTML en el iframe parcheando head/body, sin recargarlo (sin parpadeo ni salto). */
  function paintPreview() {
    const iframe = previewRef.current;
    const doc = iframe?.contentDocument;
    const html = previewHtmlRef.current;
    if (!iframe || !doc || !doc.body || !html) return;
    const y = iframe.contentWindow?.scrollY ?? 0;
    try {
      const parsed = new DOMParser().parseFromString(html, "text/html");
      doc.head.innerHTML = parsed.head.innerHTML;
      Array.from(doc.body.attributes).forEach((a) => doc.body.removeAttribute(a.name));
      Array.from(parsed.body.attributes).forEach((a) => doc.body.setAttribute(a.name, a.value));
      doc.body.innerHTML = parsed.body.innerHTML;
      // En el editor mostramos todos los bloques visibles (la animación de aparición
      // por scroll necesita JS que aquí no se ejecuta; sin esto saldrían a opacity:0).
      doc.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("in"));
      attachPreviewClick(doc);
    } catch { return; }
    iframe.contentWindow?.scrollTo(0, y);
  }
  /** Al cargar la vista previa: pinta el contenido y engancha el clic de selección. */
  function onPreviewLoad() {
    paintPreview();
  }
  function moveBlock(idx: number, dir: -1 | 1) {
    if (!editing?.blocks) return;
    const arr = [...editing.blocks]; const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]]; setBlocks(arr);
  }
  function deleteBlock(id: string) {
    if (!editing?.blocks) return;
    setBlocks(editing.blocks.filter((b) => b.id !== id));
    if (selId === id) setSelId(null);
  }
  function runImport(mode: "replace" | "append") {
    if (!editing) return;
    const imported = importHtmlToBlocks(importText);
    if (imported.length === 0) { setMsg("No se reconoció contenido en el código pegado."); return; }
    const base = mode === "replace" ? [] : (editing.blocks || []);
    setEditing({ ...editing, blocks: [...base, ...imported] });
    setImportOpen(false); setImportText(""); setSelId(null);
    setMsg(`Importados ${imported.length} bloques. Revísalos y ajusta lo necesario.`);
  }
  async function runAi() {
    if (!editing) return;
    if (!aiForm.objective.trim()) { setMsg("Escribe el objetivo de la landing."); return; }
    setAiBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/landings/ai", {
        method: "POST", headers: await authHeaders(), body: JSON.stringify(aiForm),
      });
      const json = await res.json();
      if (json.error) { setMsg(json.error); }
      else if (Array.isArray(json.blocks) && json.blocks.length > 0) {
        setEditing({ ...editing, mode: "visual", blocks: json.blocks });
        setSelId(null); setAiOpen(false);
        setMsg(`Landing generada con IA (${json.blocks.length} bloques). Revísala y ajústala.`);
      } else setMsg("No se generó contenido. Reformula el objetivo.");
    } catch { setMsg("No se pudo generar (¿está la clave de Anthropic configurada en Vercel?)."); }
    setAiBusy(false);
  }

  // ── EDITOR DEL SITIO (cabecera/pie) ─────────────────────────────────────────
  if (siteEditing) {
    return <SiteEditor initial={siteEditing} pages={list} saving={saving} onSave={saveSite} onCancel={() => setSiteEditing(null)} />;
  }

  // ── EDITOR ──────────────────────────────────────────────────────────────────
  if (editing) {
    const publicUrl = `${origin}/p/${editing.slug}`;
    const theme = editing.theme || DEFAULT_THEME;
    const sel = editing.blocks?.find((b) => b.id === selId) || null;

    return (
      <div className="max-w-[1600px] mx-auto pb-12">
        {/* Modal: importar desde código */}
        {importOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setImportOpen(false)}>
            <div className="w-full max-w-2xl rounded-xl border border-[var(--border)] p-4" style={{ background: "var(--card)" }} onClick={(e) => e.stopPropagation()}>
              <h3 className="font-bold mb-1">Importar desde código</h3>
              <p className="text-xs text-[var(--foreground)]/50 mb-3">Pega HTML. Lo reconocible (titulares, textos, listas, botones, imágenes) se convierte en bloques editables; el resto se guarda en bloques HTML. La maquetación compleja no se conserva: se extrae el contenido.</p>
              <textarea value={importText} onChange={(e) => setImportText(e.target.value)} spellCheck={false} placeholder="<h1>...</h1>" className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 font-mono text-xs" style={{ minHeight: "38vh" }} />
              <div className="flex items-center justify-end gap-2 mt-3">
                <button onClick={() => setImportOpen(false)} className="text-sm px-3 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/10">Cancelar</button>
                <button onClick={() => runImport("append")} className="text-sm px-3 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/10">Añadir al final</button>
                <button onClick={() => runImport("replace")} className="text-sm px-4 py-2 rounded-lg font-semibold text-black" style={{ background: "var(--brand-4)" }}>Reemplazar todo</button>
              </div>
            </div>
          </div>
        )}
        {/* Modal: generar con IA */}
        {aiOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => !aiBusy && setAiOpen(false)}>
            <div className="w-full max-w-lg rounded-xl border border-[var(--border)] p-4" style={{ background: "var(--card)" }} onClick={(e) => e.stopPropagation()}>
              <h3 className="font-bold mb-1">Generar landing con IA</h3>
              <p className="text-xs text-[var(--foreground)]/50 mb-3">Describe el objetivo y la IA genera la landing completa en bloques (usa tu cliente ideal, el producto y el fundamento de copy). Reemplaza el contenido actual.</p>
              <div className="space-y-3">
                <div><Lbl>Objetivo de la landing *</Lbl><textarea value={aiForm.objective} onChange={(e) => setAiForm({ ...aiForm, objective: e.target.value })} rows={3} className={inputCls} placeholder="Ej: convencer a clínicas dentales de probar gratis el sistema antes de su próxima feria" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Lbl>Público (opcional)</Lbl><input value={aiForm.audience} onChange={(e) => setAiForm({ ...aiForm, audience: e.target.value })} className={inputCls} placeholder="dentistas, abogados…" /></div>
                  <div><Lbl>Mentor / estilo</Lbl>
                    <select value={aiForm.mentor} onChange={(e) => setAiForm({ ...aiForm, mentor: e.target.value })} className={inputCls}>
                      <option value="ambos">Hormozi + Isra Bravo</option>
                      <option value="hormozi">Alex Hormozi</option>
                      <option value="isra-bravo">Isra Bravo</option>
                      <option value="ninguno">Sin mentor</option>
                    </select>
                  </div>
                </div>
                <div><Lbl>Notas (opcional)</Lbl><textarea value={aiForm.notes} onChange={(e) => setAiForm({ ...aiForm, notes: e.target.value })} rows={2} className={inputCls} placeholder="tono, ángulo concreto, algo a destacar…" /></div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-3">
                <button onClick={() => setAiOpen(false)} disabled={aiBusy} className="text-sm px-3 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/10 disabled:opacity-50">Cancelar</button>
                <button onClick={runAi} disabled={aiBusy} className="text-sm px-4 py-2 rounded-lg font-semibold text-black disabled:opacity-50" style={{ background: "var(--brand-4)" }}>{aiBusy ? "Generando… (puede tardar ~30s)" : "Generar landing"}</button>
              </div>
            </div>
          </div>
        )}

        {/* Barra superior */}
        <button onClick={() => setEditing(null)} className="text-sm text-[var(--foreground)]/50 hover:text-[var(--foreground)] mb-3">← Volver a la lista</button>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            className="text-lg font-bold bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-[var(--brand-1)] outline-none px-1" />
          <div className="flex items-center gap-2 flex-wrap">
            <Seg value={editing.mode} onChange={(v) => setEditing({ ...editing, mode: v })}
              options={[{ v: "visual", l: "Visual" }, { v: "code", l: "Código" }]} />
            <Seg value={device} onChange={setDevice} options={[{ v: "desktop", l: "Escritorio" }, { v: "mobile", l: "Móvil" }]} />
            {editing.mode === "visual" && (
              <>
                <button onClick={() => setLeftCollapsed((v) => !v)} title="Mostrar/ocultar estructura" className={`text-sm px-2.5 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/10 ${leftCollapsed ? "opacity-50" : ""}`}>☰</button>
                <button onClick={() => setRightCollapsed((v) => !v)} title="Mostrar/ocultar panel de edición" className={`text-sm px-2.5 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/10 ${rightCollapsed ? "opacity-50" : ""}`}>⚙</button>
              </>
            )}
            <a href={`${publicUrl}?v=${Date.now()}`} target="_blank" rel="noopener noreferrer" className="text-sm px-3 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/10">Ver ↗</a>
            <button onClick={save} disabled={saving} className="text-sm px-4 py-2 rounded-lg font-semibold text-black disabled:opacity-50" style={{ background: "var(--brand-4)" }}>{saving ? "Guardando…" : "Guardar"}</button>
          </div>
        </div>

        {/* slug + publicada */}
        <div className="flex items-center gap-4 flex-wrap mb-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-[var(--foreground)]/40">{origin}/p/</span>
            <input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
              className="rounded-lg border border-[var(--border)] bg-transparent px-2 py-1" />
          </div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} />Publicada</label>
          {editing.mode === "visual" && (
            <label className="flex items-center gap-2"><input type="checkbox" checked={!(editing.theme?.noChrome)} onChange={(e) => setEditing({ ...editing, theme: { ...(editing.theme || DEFAULT_THEME), noChrome: !e.target.checked } })} />Cabecera y pie</label>
          )}
          <button onClick={() => copyLink(editing.slug)} className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/10">Copiar link</button>
          {msg && <span className="text-[var(--brand-1)]">{msg}</span>}
        </div>

        {editing.mode === "code" ? (
          <div className="grid lg:grid-cols-[1fr_1fr] gap-5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Lbl>Código HTML</Lbl>
                <button onClick={() => { if (confirm("¿Reemplazar por la plantilla de ejemplo?")) setEditing({ ...editing, html: DEFAULT_LANDING_HTML }); }}
                  className="text-[11px] px-2 py-1 rounded border border-[var(--border)] hover:bg-[var(--border)]/10">Cargar plantilla</button>
              </div>
              <textarea value={editing.html} onChange={(e) => setEditing({ ...editing, html: e.target.value })} spellCheck={false}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 font-mono text-xs" style={{ minHeight: "82vh" }} />
            </div>
            <div className="lg:sticky lg:top-4 h-fit">
              <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-black/20" style={{ height: "82vh" }}>
                <div className="flex items-center justify-center h-full p-2">
                  <iframe ref={previewRef} title="preview" onLoad={onPreviewLoad} className="bg-white rounded-lg shadow-2xl transition-all" style={{ width: device === "mobile" ? 390 : "100%", height: "100%", border: "none", maxWidth: "100%" }} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:grid gap-4 space-y-4 lg:space-y-0" style={{ gridTemplateColumns: [!leftCollapsed ? "300px" : null, "1fr", !rightCollapsed ? "360px" : null].filter(Boolean).join(" ") }}>
            {/* IZQUIERDA — Estructura */}
            {!leftCollapsed && (
              <aside className="space-y-3 min-w-0">
                <div className="rounded-xl border border-[var(--border)] p-3" style={{ background: "var(--card)" }}>
                  <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                    <Lbl>Añadir bloque</Lbl>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setAiOpen(true)} className="text-[11px] px-2 py-1 rounded font-semibold text-black" style={{ background: "var(--brand-4)" }}>✦ IA</button>
                      <button onClick={() => { setImportText(""); setImportOpen(true); }} className="text-[11px] px-2 py-1 rounded border border-[var(--border)] hover:bg-[var(--border)]/10">Importar</button>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <select value={addType} onChange={(e) => setAddType(e.target.value as LandingBlock["type"])} className={inputCls}>
                      {BLOCK_GROUPS.map((g) => (
                        <optgroup key={g.label} label={g.label}>
                          {g.types.map((t) => <option key={t} value={t}>{BLOCK_LABELS[t]}</option>)}
                        </optgroup>
                      ))}
                    </select>
                    <button onClick={() => addBlock(addType)} className="text-sm px-3 py-1.5 rounded-lg font-semibold text-black flex-shrink-0" style={{ background: "var(--brand-4)" }}>Añadir</button>
                  </div>
                  <p className="text-[10px] text-[var(--foreground)]/40 mt-1.5">Eliges el tipo y pulsas Añadir. Se inserta tras el bloque seleccionado.</p>
                  <div className="mt-2 pt-2 border-t border-[var(--border)] flex gap-1.5">
                    <select value={addSectionKey} onChange={(e) => setAddSectionKey(e.target.value)} className={inputCls}>
                      {SECTION_TEMPLATES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                    <button onClick={() => addSection(addSectionKey)} className="text-sm px-3 py-1.5 rounded-lg border border-[var(--brand-1)] text-[var(--brand-1)] font-semibold flex-shrink-0 hover:bg-[var(--brand-1)]/10">+ Sección</button>
                  </div>
                  <p className="text-[10px] text-[var(--foreground)]/40 mt-1">Inserta una sección entera (varios bloques) lista para editar.</p>
                </div>
                <div className="rounded-xl border border-[var(--border)]" style={{ background: "var(--card)" }}>
                  <div className="px-3 py-2 border-b border-[var(--border)]"><Lbl>Bloques ({(editing.blocks || []).length})</Lbl></div>
                  <div className="overflow-y-auto p-2 space-y-1" style={{ maxHeight: "29vh" }}>
                    {(editing.blocks || []).length === 0 && <p className="text-xs text-[var(--foreground)]/40 px-1 py-2">Sin bloques. Añádelos arriba o genera con IA.</p>}
                    {(editing.blocks || []).map((b, i) => (
                      <div key={b.id} onClick={() => selectBlock(b.id)}
                        className={`rounded-lg border px-2.5 py-2 flex items-center justify-between gap-1 cursor-pointer ${selId === b.id ? "border-[var(--brand-1)]" : "border-[var(--border)]"}`}
                        style={{ background: "var(--background)" }}>
                        <span className="text-xs truncate">{BLOCK_LABELS[b.type]}{b.type === "heading" || b.type === "paragraph" ? <span className="text-[var(--foreground)]/40"> · {String((b as { text?: string }).text || "").slice(0, 16)}</span> : null}</span>
                        <span className="flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => moveBlock(i, -1)} className="px-1 text-[var(--foreground)]/50 hover:text-[var(--foreground)]">↑</button>
                          <button onClick={() => moveBlock(i, 1)} className="px-1 text-[var(--foreground)]/50 hover:text-[var(--foreground)]">↓</button>
                          <button onClick={() => duplicateBlock(b.id)} title="Duplicar" className="px-1 text-[var(--foreground)]/50 hover:text-[var(--foreground)]">⧉</button>
                          <button onClick={() => deleteBlock(b.id)} className="px-1 text-red-500/70 hover:text-red-500">✕</button>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            )}

            {/* CENTRO — Vista previa */}
            <div className="lg:sticky lg:top-4 h-fit min-w-0">
              <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-black/20" style={{ height: "82vh" }}>
                <div className="flex items-center justify-center h-full p-2">
                  <iframe ref={previewRef} title="preview" onLoad={onPreviewLoad} className="bg-white rounded-lg shadow-2xl transition-all" style={{ width: device === "mobile" ? 390 : "100%", height: "100%", border: "none", maxWidth: "100%" }} />
                </div>
              </div>
              <p className="text-[11px] text-[var(--foreground)]/40 mt-1 text-center">Vista previa — clic en un bloque (izquierda) para ir a su sección.</p>
            </div>

            {/* DERECHA — Estilo del bloque + Tema (desplegable) */}
            {!rightCollapsed && (
              <aside className="lg:sticky lg:top-4 h-fit space-y-3 min-w-0 overflow-y-auto" style={{ maxHeight: "86vh" }}>
                {sel && (
                  <div className="rounded-xl border border-[var(--brand-1)]/40 p-3" style={{ background: "var(--card)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold truncate">Contenido · {BLOCK_LABELS[sel.type]}</p>
                      <button onClick={() => { setSelId(null); setThemeOpen(true); }} className="text-[11px] text-[var(--foreground)]/50 hover:text-[var(--foreground)] flex-shrink-0">Cerrar</button>
                    </div>
                    <BlockControls block={sel} update={(patch) => updateBlock(sel.id, patch)} section="content" />
                  </div>
                )}
                {sel && (
                  <div className="rounded-xl border border-[var(--brand-1)]/40 p-3" style={{ background: "var(--card)" }}>
                    <p className="text-sm font-semibold mb-2 truncate">Estilo · {BLOCK_LABELS[sel.type]}</p>
                    <BlockControls block={sel} update={(patch) => updateBlock(sel.id, patch)} section="style" />
                  </div>
                )}
                <details className="rounded-xl border border-[var(--border)] p-3" style={{ background: "var(--card)" }} open={themeOpen} onToggle={(e) => setThemeOpen((e.currentTarget as HTMLDetailsElement).open)}>
                  <summary className="cursor-pointer text-sm font-semibold">Tema de la página</summary>
                  <div className="mt-3 space-y-3">
                    <div><Lbl>Fondo</Lbl>
                      <Seg value={theme.bgType} onChange={(v) => setEditing({ ...editing, theme: { ...theme, bgType: v } })} options={[{ v: "gradient", l: "Degradado" }, { v: "solid", l: "Sólido" }]} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><Lbl>Color 1</Lbl><input type="color" value={theme.bg1} onChange={(e) => setEditing({ ...editing, theme: { ...theme, bg1: e.target.value } })} className="w-full h-9 rounded-lg border border-[var(--border)] bg-transparent" /></div>
                      {theme.bgType === "gradient" && <div><Lbl>Color 2</Lbl><input type="color" value={theme.bg2} onChange={(e) => setEditing({ ...editing, theme: { ...theme, bg2: e.target.value } })} className="w-full h-9 rounded-lg border border-[var(--border)] bg-transparent" /></div>}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div><Lbl>Marca</Lbl><input type="color" value={theme.brand} onChange={(e) => setEditing({ ...editing, theme: { ...theme, brand: e.target.value } })} className="w-full h-9 rounded-lg border border-[var(--border)] bg-transparent" /></div>
                      <div><Lbl>Texto</Lbl><input type="color" value={theme.text} onChange={(e) => setEditing({ ...editing, theme: { ...theme, text: e.target.value } })} className="w-full h-9 rounded-lg border border-[var(--border)] bg-transparent" /></div>
                      <div><Lbl>Suave</Lbl><input type="color" value={theme.muted} onChange={(e) => setEditing({ ...editing, theme: { ...theme, muted: e.target.value } })} className="w-full h-9 rounded-lg border border-[var(--border)] bg-transparent" /></div>
                    </div>
                    <div><Lbl>Fuente</Lbl>
                      <select value={theme.font} onChange={(e) => setEditing({ ...editing, theme: { ...theme, font: e.target.value as LandingTheme["font"] } })} className={inputCls}>
                        <option>Inter</option><option>Outfit</option><option>Poppins</option><option>Montserrat</option>
                      </select>
                    </div>
                    <div className="pt-2 border-t border-[var(--border)]">
                      <button onClick={() => setSiteEditing({ ...DEFAULT_SITE, ...site })} className="text-xs text-[var(--brand-1)] hover:underline">Editar cabecera y pie del sitio →</button>
                    </div>
                  </div>
                </details>
              </aside>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── LISTA ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[1000px] mx-auto pb-12">
      <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Landings de presentación</h1>
          <p className="text-sm text-[var(--foreground)]/50 mt-0.5">Crea páginas visuales, genera un link y compártelo con los negocios.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSiteEditing({ ...DEFAULT_SITE, ...site })} className="text-sm px-3 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/10">Cabecera y pie del sitio</button>
          <button onClick={createNew} disabled={saving} className="text-sm px-4 py-2 rounded-lg font-semibold text-black disabled:opacity-50" style={{ background: "var(--brand-4)" }}>+ Nueva landing</button>
        </div>
      </div>
      {msg && <div className="my-3 text-sm text-[var(--brand-1)]">{msg}</div>}

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]"><div className="animate-spin rounded-full h-9 w-9 border-b-2" style={{ borderColor: "var(--brand-1)" }} /></div>
      ) : list.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-[var(--border)] mt-4">
          <p className="text-sm text-[var(--foreground)]/40">Aún no hay landings.</p>
          <button onClick={createNew} className="text-sm text-[var(--brand-1)] hover:underline mt-1">Crear la primera →</button>
        </div>
      ) : (
        <div className="space-y-2.5 mt-4">
          {list.map((l) => (
            <div key={l.id} className="rounded-xl border border-[var(--border)] p-4 flex items-center justify-between gap-3 flex-wrap" style={{ background: "var(--card)" }}>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold truncate">{l.name}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${l.published ? "text-green-600 bg-green-500/10" : "text-[var(--foreground)]/40 bg-[var(--foreground)]/5"}`}>{l.published ? "Publicada" : "Borrador"}</span>
                </div>
                <p className="text-xs text-[var(--foreground)]/45 truncate">{origin}/p/{l.slug}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => copyLink(l.slug)} className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/10">Copiar link</button>
                <a href={`${origin}/p/${l.slug}?v=${Date.now()}`} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/10">Abrir ↗</a>
                <button onClick={() => openEditor(l.id)} className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/10">Editar</button>
                <button onClick={() => remove(l.id, l.name)} className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Controles por tipo de bloque ─────────────────────────────────────────────
function BlockControls({ block, update, section = "all" }: { block: LandingBlock; update: (patch: Partial<LandingBlock>) => void; section?: "content" | "style" | "all" }) {
  const us = (patch: Partial<BlockStyle>) => update({ s: { ...(block.s || {}), ...patch } } as Partial<LandingBlock>);

  if (block.type === "spacer") {
    if (section === "style") return <p className="text-xs text-[var(--foreground)]/40">El espacio no tiene opciones de estilo.</p>;
    return <div className="space-y-3"><div><Lbl>Altura (px)</Lbl><input type="number" value={block.height} onChange={(e) => update({ height: Number(e.target.value) })} className={inputCls} /></div></div>;
  }

  const common = (
    <div className="grid grid-cols-3 gap-2">
      <div><Lbl>Alineado</Lbl><Seg value={block.align || "left"} onChange={(v) => update({ align: v })} options={[{ v: "left", l: "Izq" }, { v: "center", l: "Centro" }, { v: "right", l: "Der" }]} /></div>
      <div><Lbl>Espaciado</Lbl>
        <select value={block.padY || "md"} onChange={(e) => update({ padY: e.target.value as LandingBlock["padY"] })} className={inputCls}>
          <option value="none">Ninguno</option><option value="sm">S</option><option value="md">M</option><option value="lg">L</option><option value="xl">XL</option>
        </select>
      </div>
      <div><Lbl>Fondo</Lbl>
        <select value={block.bg || "none"} onChange={(e) => update({ bg: e.target.value as LandingBlock["bg"] })} className={inputCls}>
          <option value="none">Sin fondo</option><option value="card">Tarjeta</option><option value="brandSoft">Marca suave</option>
        </select>
      </div>
    </div>
  );

  const adv = (
    <details className="rounded-lg border border-[var(--border)] p-2.5">
      <summary className="cursor-pointer text-xs font-semibold text-[var(--foreground)]/70">Estilo avanzado</summary>
      <div className="mt-2 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div><Lbl>Fuente</Lbl>
            <select value={block.s?.fontFamily || ""} onChange={(e) => us({ fontFamily: (e.target.value || undefined) as BlockStyle["fontFamily"] })} className={inputCls}>
              <option value="">Por defecto</option><option>Inter</option><option>Outfit</option><option>Poppins</option><option>Montserrat</option>
            </select></div>
          <div><Lbl>Grosor</Lbl>
            <select value={block.s?.fontWeight || ""} onChange={(e) => us({ fontWeight: e.target.value ? Number(e.target.value) : undefined })} className={inputCls}>
              <option value="">Auto</option><option value="400">Normal</option><option value="600">Semi</option><option value="700">Bold</option><option value="900">Black</option>
            </select></div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div><Lbl>Tamaño px</Lbl><input type="number" value={block.s?.fontSize || ""} onChange={(e) => us({ fontSize: e.target.value ? Number(e.target.value) : undefined })} className={inputCls} /></div>
          <div><Lbl>Ancho máx</Lbl><input type="number" value={block.s?.maxWidth || ""} onChange={(e) => us({ maxWidth: e.target.value ? Number(e.target.value) : undefined })} className={inputCls} /></div>
          <div><Lbl>Redondeo</Lbl><input type="number" value={block.s?.radius || ""} onChange={(e) => us({ radius: e.target.value ? Number(e.target.value) : undefined })} className={inputCls} /></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <ColorField label="Color de fondo" value={block.s?.bgColor} onChange={(v) => us({ bgColor: v })} fallback="#0a2422" />
          <div><Lbl>Borde px</Lbl><input type="number" value={block.s?.borderWidth || ""} onChange={(e) => us({ borderWidth: e.target.value ? Number(e.target.value) : undefined })} className={inputCls} /></div>
        </div>
        <ImagePicker label="Imagen de fondo" value={block.s?.bgImage} onChange={(url) => us({ bgImage: url || undefined })} kind="landing-bg" />
        <div className="grid grid-cols-3 gap-2">
          <div><Lbl>Pad. arriba</Lbl><input type="number" value={block.s?.padT ?? ""} onChange={(e) => us({ padT: e.target.value !== "" ? Number(e.target.value) : undefined })} className={inputCls} /></div>
          <div><Lbl>Pad. abajo</Lbl><input type="number" value={block.s?.padB ?? ""} onChange={(e) => us({ padB: e.target.value !== "" ? Number(e.target.value) : undefined })} className={inputCls} /></div>
          <div><Lbl>Pad. lados</Lbl><input type="number" value={block.s?.padX ?? ""} onChange={(e) => us({ padX: e.target.value !== "" ? Number(e.target.value) : undefined })} className={inputCls} /></div>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!block.s?.shadow} onChange={(e) => us({ shadow: e.target.checked || undefined })} />Sombra</label>
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--border)]">
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!block.s?.hideMobile} onChange={(e) => us({ hideMobile: e.target.checked || undefined })} />Ocultar en móvil</label>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!block.s?.hideDesktop} onChange={(e) => us({ hideDesktop: e.target.checked || undefined })} />Ocultar en escritorio</label>
        </div>
      </div>
    </details>
  );

  let specific: React.ReactNode = null;

  if (block.type === "heading") {
    specific = <>
      <div><Lbl>Texto (Enter = salto de línea)</Lbl><textarea value={block.text} onChange={(e) => update({ text: e.target.value })} className={inputCls} rows={3} /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><Lbl>Tamaño</Lbl><Seg value={String(block.level)} onChange={(v) => update({ level: Number(v) as 1 | 2 | 3 })} options={[{ v: "1", l: "Grande" }, { v: "2", l: "Medio" }, { v: "3", l: "Pequeño" }]} /></div>
        <label className="flex items-center gap-2 text-sm mt-5"><input type="checkbox" checked={!!block.accent} onChange={(e) => update({ accent: e.target.checked })} />Última línea en dorado</label>
      </div>
    </>;
  } else if (block.type === "paragraph") {
    specific = <>
      <div><Lbl>Texto</Lbl><textarea value={block.text} onChange={(e) => update({ text: e.target.value })} className={inputCls} rows={4} /></div>
      <div><Lbl>Tamaño</Lbl><Seg value={block.size || "md"} onChange={(v) => update({ size: v })} options={[{ v: "sm", l: "S" }, { v: "md", l: "M" }, { v: "lg", l: "L" }]} /></div>
    </>;
  } else if (block.type === "bullets") {
    specific = <>
      <Lbl>Puntos</Lbl>
      {block.items.map((it, i) => (
        <div key={i} className="flex gap-1">
          <input value={it} onChange={(e) => { const items = [...block.items]; items[i] = e.target.value; update({ items }); }} className={inputCls} />
          <button onClick={() => update({ items: block.items.filter((_, j) => j !== i) })} className="px-2 text-red-500/70 hover:text-red-500">✕</button>
        </div>
      ))}
      <button onClick={() => update({ items: [...block.items, "Nuevo punto"] })} className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/10">+ Añadir punto</button>
    </>;
  } else if (block.type === "button") {
    specific = <>
      <div><Lbl>Texto del botón</Lbl><input value={block.label} onChange={(e) => update({ label: e.target.value })} className={inputCls} /></div>
      <div><Lbl>Acción</Lbl>
        <select value={block.linkType} onChange={(e) => update({ linkType: e.target.value as typeof block.linkType })} className={inputCls}>
          <option value="whatsapp">WhatsApp</option><option value="url">Abrir URL</option><option value="tel">Llamar</option><option value="email">Email</option><option value="anchor">Ir a sección</option>
        </select>
      </div>
      <div><Lbl>{block.linkType === "whatsapp" ? "Número (con prefijo, sin +)" : block.linkType === "tel" ? "Teléfono" : block.linkType === "email" ? "Email" : block.linkType === "anchor" ? "ID de sección" : "URL"}</Lbl>
        <input value={block.value} onChange={(e) => update({ value: e.target.value })} className={inputCls} placeholder={block.linkType === "whatsapp" ? "34600000000" : block.linkType === "url" ? "https://..." : ""} />
      </div>
      {block.linkType === "whatsapp" && <div><Lbl>Mensaje predefinido</Lbl><input value={block.waMessage || ""} onChange={(e) => update({ waMessage: e.target.value })} className={inputCls} /></div>}
      <div className="grid grid-cols-2 gap-2">
        <div><Lbl>Estilo</Lbl><Seg value={block.style} onChange={(v) => update({ style: v })} options={[{ v: "gold", l: "Marca" }, { v: "ghost", l: "Contorno" }]} /></div>
        <div><Lbl>Tamaño</Lbl><Seg value={block.size || "md"} onChange={(v) => update({ size: v })} options={[{ v: "md", l: "Normal" }, { v: "lg", l: "Grande" }]} /></div>
      </div>
      {block.linkType === "url" && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!block.newTab} onChange={(e) => update({ newTab: e.target.checked })} />Abrir en pestaña nueva</label>}
    </>;
  } else if (block.type === "image") {
    specific = <>
      <ImagePicker label="Imagen" value={block.src} onChange={(url) => update({ src: url })} kind="landing-img" />
      <div><Lbl>Texto alternativo</Lbl><input value={block.alt || ""} onChange={(e) => update({ alt: e.target.value })} className={inputCls} /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><Lbl>Ancho (px, vacío=auto)</Lbl><input type="number" value={block.width || ""} onChange={(e) => update({ width: e.target.value ? Number(e.target.value) : undefined })} className={inputCls} /></div>
        <label className="flex items-center gap-2 text-sm mt-5"><input type="checkbox" checked={!!block.rounded} onChange={(e) => update({ rounded: e.target.checked })} />Esquinas redondeadas</label>
      </div>
    </>;
  } else if (block.type === "logos") {
    specific = <>
      <div><Lbl>Título (opcional)</Lbl><input value={block.title || ""} onChange={(e) => update({ title: e.target.value })} className={inputCls} /></div>
      <Lbl>Logos</Lbl>
      {block.items.map((it, i) => (
        <div key={i} className="rounded-lg border border-[var(--border)] p-2 space-y-1">
          <ImagePicker value={it.src} onChange={(url) => { const items = [...block.items]; items[i] = { ...items[i], src: url }; update({ items }); }} kind="landing-logo" />
          <div className="flex gap-1">
            <input value={it.alt || ""} placeholder="Nombre del negocio" onChange={(e) => { const items = [...block.items]; items[i] = { ...items[i], alt: e.target.value }; update({ items }); }} className={inputCls} />
            <button onClick={() => update({ items: block.items.filter((_, j) => j !== i) })} className="px-2 text-red-500/70 hover:text-red-500">✕</button>
          </div>
        </div>
      ))}
      <button onClick={() => update({ items: [...block.items, { src: "", alt: "" }] })} className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/10">+ Añadir logo</button>
    </>;
  } else if (block.type === "steps") {
    specific = <>
      <Lbl>Pasos</Lbl>
      {block.items.map((it, i) => (
        <div key={i} className="rounded-lg border border-[var(--border)] p-2 space-y-1">
          <div className="flex gap-1">
            <input value={it.title} placeholder="Título" onChange={(e) => { const items = [...block.items]; items[i] = { ...items[i], title: e.target.value }; update({ items }); }} className={inputCls} />
            <button onClick={() => update({ items: block.items.filter((_, j) => j !== i) })} className="px-2 text-red-500/70 hover:text-red-500">✕</button>
          </div>
          <textarea value={it.text} placeholder="Descripción" rows={2} onChange={(e) => { const items = [...block.items]; items[i] = { ...items[i], text: e.target.value }; update({ items }); }} className={inputCls} />
        </div>
      ))}
      <button onClick={() => update({ items: [...block.items, { title: "Nuevo paso", text: "" }] })} className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/10">+ Añadir paso</button>
    </>;
  } else if (block.type === "cards") {
    specific = <>
      <div><Lbl>Columnas</Lbl><Seg value={String(block.columns)} onChange={(v) => update({ columns: Number(v) as 2 | 3 })} options={[{ v: "2", l: "2" }, { v: "3", l: "3" }]} /></div>
      <Lbl>Tarjetas</Lbl>
      {block.items.map((it, i) => (
        <div key={i} className="rounded-lg border border-[var(--border)] p-2 space-y-1">
          <div className="flex gap-1">
            <input value={it.icon || ""} placeholder="🌟" onChange={(e) => { const items = [...block.items]; items[i] = { ...items[i], icon: e.target.value }; update({ items }); }} className={`${inputCls} max-w-[60px]`} />
            <input value={it.title} placeholder="Título" onChange={(e) => { const items = [...block.items]; items[i] = { ...items[i], title: e.target.value }; update({ items }); }} className={inputCls} />
            <button onClick={() => update({ items: block.items.filter((_, j) => j !== i) })} className="px-2 text-red-500/70 hover:text-red-500">✕</button>
          </div>
          <textarea value={it.text} placeholder="Texto" rows={2} onChange={(e) => { const items = [...block.items]; items[i] = { ...items[i], text: e.target.value }; update({ items }); }} className={inputCls} />
        </div>
      ))}
      <button onClick={() => update({ items: [...block.items, { icon: "", title: "Nueva tarjeta", text: "" }] })} className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/10">+ Añadir tarjeta</button>
    </>;
  } else if (block.type === "faq") {
    specific = <>
      <Lbl>Preguntas</Lbl>
      {block.items.map((it, i) => (
        <div key={i} className="rounded-lg border border-[var(--border)] p-2 space-y-1">
          <div className="flex gap-1">
            <input value={it.q} placeholder="Pregunta" onChange={(e) => { const items = [...block.items]; items[i] = { ...items[i], q: e.target.value }; update({ items }); }} className={inputCls} />
            <button onClick={() => update({ items: block.items.filter((_, j) => j !== i) })} className="px-2 text-red-500/70 hover:text-red-500">✕</button>
          </div>
          <textarea value={it.a} placeholder="Respuesta" rows={2} onChange={(e) => { const items = [...block.items]; items[i] = { ...items[i], a: e.target.value }; update({ items }); }} className={inputCls} />
        </div>
      ))}
      <button onClick={() => update({ items: [...block.items, { q: "Nueva pregunta", a: "" }] })} className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/10">+ Añadir pregunta</button>
    </>;
  } else if (block.type === "countdown") {
    specific = <>
      <div><Lbl>Fecha y hora objetivo</Lbl><input type="datetime-local" value={block.target} onChange={(e) => update({ target: e.target.value })} className={inputCls} /></div>
      <div><Lbl>Texto (opcional)</Lbl><input value={block.label || ""} onChange={(e) => update({ label: e.target.value })} className={inputCls} /></div>
    </>;
  } else if (block.type === "video") {
    specific = <div><Lbl>URL del vídeo (YouTube, Vimeo o MP4)</Lbl><input value={block.url} onChange={(e) => update({ url: e.target.value })} className={inputCls} placeholder="https://youtube.com/watch?v=..." /></div>;
  } else if (block.type === "socials") {
    specific = <>
      <Lbl>Redes</Lbl>
      {block.items.map((it, i) => (
        <div key={i} className="flex gap-1">
          <select value={it.network} onChange={(e) => { const items = [...block.items]; items[i] = { ...items[i], network: e.target.value }; update({ items }); }} className={`${inputCls} max-w-[120px]`}>
            <option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="whatsapp">WhatsApp</option><option value="tiktok">TikTok</option><option value="linkedin">LinkedIn</option><option value="youtube">YouTube</option><option value="web">Web</option><option value="email">Email</option>
          </select>
          <input value={it.url} placeholder="URL" onChange={(e) => { const items = [...block.items]; items[i] = { ...items[i], url: e.target.value }; update({ items }); }} className={inputCls} />
          <button onClick={() => update({ items: block.items.filter((_, j) => j !== i) })} className="px-2 text-red-500/70 hover:text-red-500">✕</button>
        </div>
      ))}
      <button onClick={() => update({ items: [...block.items, { network: "web", url: "" }] })} className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/10">+ Añadir red</button>
    </>;
  } else if (block.type === "html") {
    specific = <div><Lbl>Código HTML</Lbl><textarea value={block.html} onChange={(e) => update({ html: e.target.value })} spellCheck={false} className={`${inputCls} font-mono text-xs`} rows={8} /></div>;
  } else if (block.type === "row") {
    specific = <RowControls block={block} update={update} />;
  }

  const colorField = <ColorField label="Color del texto" value={block.s?.color} onChange={(v) => us({ color: v })} fallback="#ffffff" />;
  if (section === "content") return <div className="space-y-3">{specific}</div>;
  if (section === "style") return <div className="space-y-3">{colorField}{common}{adv}</div>;
  return <div className="space-y-3">{specific}{colorField}{common}{adv}</div>;
}

// ─── Controles de Fila / Columnas (bloques anidados) ──────────────────────────
function RowControls({ block, update }: { block: RowBlock; update: (patch: Partial<LandingBlock>) => void }) {
  const [sel, setSel] = useState<{ col: number; idx: number } | null>(null);
  const setColumns = (columns: LandingBlock[][]) => update({ columns } as Partial<LandingBlock>);

  function setRatio(ratio: string) {
    const parts = ratio.split("-").length;
    const cols = [...(block.columns || [])];
    if (parts > cols.length) { while (cols.length < parts) cols.push([]); }
    else if (parts < cols.length) {
      const extra = cols.slice(parts).flat();
      cols.length = parts;
      cols[parts - 1] = [...cols[parts - 1], ...extra];
    }
    update({ ratio, columns: cols } as Partial<LandingBlock>);
  }
  function addChild(col: number, type: LandingBlock["type"]) {
    const cols = block.columns.map((c, i) => (i === col ? [...c, newBlock(type)] : c));
    setColumns(cols); setSel({ col, idx: cols[col].length - 1 });
  }
  function updateChild(col: number, idx: number, patch: Partial<LandingBlock>) {
    setColumns(block.columns.map((c, i) => (i === col ? c.map((b, j) => (j === idx ? { ...b, ...patch } as LandingBlock : b)) : c)));
  }
  function moveChild(col: number, idx: number, dir: -1 | 1) {
    const arr = [...block.columns[col]]; const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    setColumns(block.columns.map((c, i) => (i === col ? arr : c))); setSel({ col, idx: j });
  }
  function deleteChild(col: number, idx: number) {
    setColumns(block.columns.map((c, i) => (i === col ? c.filter((_, j) => j !== idx) : c))); setSel(null);
  }

  return <div className="space-y-3">
    <div className="grid grid-cols-2 gap-2">
      <div><Lbl>Columnas</Lbl>
        <select value={block.ratio} onChange={(e) => setRatio(e.target.value)} className={inputCls}>
          <option value="1-1">2 · iguales</option>
          <option value="1-2">2 · 1/3 + 2/3</option>
          <option value="2-1">2 · 2/3 + 1/3</option>
          <option value="1-1-1">3 · iguales</option>
          <option value="1-1-1-1">4 · iguales</option>
        </select>
      </div>
      <div><Lbl>Separación px</Lbl><input type="number" value={block.gap ?? 24} onChange={(e) => update({ gap: Number(e.target.value) } as Partial<LandingBlock>)} className={inputCls} /></div>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div><Lbl>Alineado vertical</Lbl><Seg value={block.vAlign || "center"} onChange={(v) => update({ vAlign: v } as Partial<LandingBlock>)} options={[{ v: "top", l: "Arriba" }, { v: "center", l: "Centro" }, { v: "bottom", l: "Abajo" }]} /></div>
      <label className="flex items-center gap-2 text-sm mt-5"><input type="checkbox" checked={block.stackMobile !== false} onChange={(e) => update({ stackMobile: e.target.checked } as Partial<LandingBlock>)} />Apilar en móvil</label>
    </div>

    {block.columns.map((col, ci) => (
      <div key={ci} className="rounded-lg border border-[var(--border)] p-2.5 space-y-2">
        <span className="text-xs font-semibold text-[var(--foreground)]/70">Columna {ci + 1}</span>
        <div className="flex flex-wrap gap-1">
          {CHILD_BLOCK_TYPES.map((t) => (
            <button key={t} onClick={() => addChild(ci, t)} className="text-[11px] px-2 py-1 rounded border border-[var(--border)] hover:border-[var(--brand-1)] hover:bg-[var(--brand-1)]/10 transition-colors">+ {BLOCK_LABELS[t]}</button>
          ))}
        </div>
        {col.length === 0 && <p className="text-[11px] text-[var(--foreground)]/40">Columna vacía.</p>}
        {col.map((cb, bi) => (
          <div key={cb.id}>
            <div className={`rounded border px-2 py-1.5 flex items-center justify-between gap-2 cursor-pointer ${sel?.col === ci && sel?.idx === bi ? "border-[var(--brand-1)]" : "border-[var(--border)]"}`}
              style={{ background: "var(--background)" }}
              onClick={() => setSel(sel?.col === ci && sel?.idx === bi ? null : { col: ci, idx: bi })}>
              <span className="text-xs truncate">{BLOCK_LABELS[cb.type]}</span>
              <span className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => moveChild(ci, bi, -1)} className="px-1 text-[var(--foreground)]/50 hover:text-[var(--foreground)]">↑</button>
                <button onClick={() => moveChild(ci, bi, 1)} className="px-1 text-[var(--foreground)]/50 hover:text-[var(--foreground)]">↓</button>
                <button onClick={() => deleteChild(ci, bi)} className="px-1 text-red-500/70 hover:text-red-500">✕</button>
              </span>
            </div>
            {sel?.col === ci && sel?.idx === bi && (
              <div className="mt-2 pl-2 border-l-2 border-[var(--brand-1)]/30">
                <BlockControls block={cb} update={(patch) => updateChild(ci, bi, patch)} />
              </div>
            )}
          </div>
        ))}
      </div>
    ))}
  </div>;
}

// ─── Editor de enlaces de navegación ──────────────────────────────────────────
function LinkList({ links, pages, onChange }: { links: NavLink[]; pages: LandingRow[]; onChange: (l: NavLink[]) => void }) {
  return (
    <div className="space-y-1.5">
      {links.map((l, i) => (
        <div key={i} className="flex gap-1 items-center">
          <input value={l.label} placeholder="Texto" onChange={(e) => { const a = [...links]; a[i] = { ...a[i], label: e.target.value }; onChange(a); }} className={`${inputCls} max-w-[100px]`} />
          <select value={l.type} onChange={(e) => { const a = [...links]; a[i] = { ...a[i], type: e.target.value as NavLink["type"], value: "" }; onChange(a); }} className={`${inputCls} max-w-[88px]`}>
            <option value="page">Página</option><option value="anchor">Sección</option><option value="url">URL</option>
          </select>
          {l.type === "page" ? (
            <select value={l.value} onChange={(e) => { const a = [...links]; a[i] = { ...a[i], value: e.target.value }; onChange(a); }} className={inputCls}>
              <option value="">— elige página —</option>
              {pages.map((p) => <option key={p.id} value={p.slug}>{p.name}</option>)}
            </select>
          ) : (
            <input value={l.value} placeholder={l.type === "anchor" ? "id de sección" : "https://..."} onChange={(e) => { const a = [...links]; a[i] = { ...a[i], value: e.target.value }; onChange(a); }} className={inputCls} />
          )}
          <button onClick={() => onChange(links.filter((_, j) => j !== i))} className="px-2 text-red-500/70 hover:text-red-500">✕</button>
        </div>
      ))}
      <button onClick={() => onChange([...links, { label: "Enlace", type: "page", value: "" }])} className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/10">+ Añadir enlace</button>
    </div>
  );
}

// ─── Editor del sitio (cabecera / pie / menú) ─────────────────────────────────
function SiteEditor({ initial, pages, saving, onSave, onCancel }: {
  initial: SiteConfig; pages: LandingRow[]; saving: boolean;
  onSave: (c: SiteConfig) => void; onCancel: () => void;
}) {
  const [cfg, setCfg] = useState<SiteConfig>(initial);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [preview, setPreview] = useState("");
  const h = cfg.header, f = cfg.footer;
  const setHeader = (patch: Partial<SiteHeader>) => setCfg({ ...cfg, header: { ...cfg.header, ...patch } });
  const setFooter = (patch: Partial<SiteFooter>) => setCfg({ ...cfg, footer: { ...cfg.footer, ...patch } });

  useEffect(() => {
    const id = setTimeout(() => {
      const sample: LandingBlock[] = [
        { id: "s1", type: "heading", level: 1, align: "center", padY: "xl", text: "Vista previa del sitio" },
        { id: "s2", type: "paragraph", align: "center", padY: "md", size: "lg", text: "Así se ven tu cabecera y tu pie en todas las páginas." },
        { id: "s3", type: "heading", level: 2, align: "center", padY: "lg", bg: "card", text: "Contacto" },
      ];
      setPreview(renderLandingHtml(DEFAULT_THEME, sample, "Vista previa", cfg));
    }, 200);
    return () => clearTimeout(id);
  }, [cfg]);

  return (
    <div className="max-w-[1300px] mx-auto pb-12">
      <button onClick={onCancel} className="text-sm text-[var(--foreground)]/50 hover:text-[var(--foreground)] mb-3">← Volver a la lista</button>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h1 className="text-lg font-bold">Cabecera y pie del sitio</h1>
        <div className="flex items-center gap-2">
          <Seg value={device} onChange={setDevice} options={[{ v: "desktop", l: "Escritorio" }, { v: "mobile", l: "Móvil" }]} />
          <button onClick={() => onSave(cfg)} disabled={saving} className="text-sm px-4 py-2 rounded-lg font-semibold text-black disabled:opacity-50" style={{ background: "var(--brand-4)" }}>{saving ? "Guardando…" : "Guardar"}</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[400px_1fr] gap-5">
        <div className="space-y-4">
          {/* CABECERA */}
          <div className="rounded-xl border border-[var(--border)] p-3 space-y-3" style={{ background: "var(--card)" }}>
            <label className="flex items-center gap-2 font-semibold text-sm"><input type="checkbox" checked={h.enabled} onChange={(e) => setHeader({ enabled: e.target.checked })} />Mostrar cabecera</label>
            <div className="grid grid-cols-2 gap-2">
              <div><Lbl>Logo</Lbl><Seg value={h.logoType} onChange={(v) => setHeader({ logoType: v })} options={[{ v: "text", l: "Texto" }, { v: "image", l: "Imagen" }]} /></div>
              <label className="flex items-center gap-2 text-sm mt-5"><input type="checkbox" checked={h.sticky} onChange={(e) => setHeader({ sticky: e.target.checked })} />Fija al scroll</label>
            </div>
            {h.logoType === "text"
              ? <div><Lbl>Texto del logo</Lbl><input value={h.logoText} onChange={(e) => setHeader({ logoText: e.target.value })} className={inputCls} /></div>
              : <div className="space-y-2">
                  <ImagePicker label="Logo (imagen)" value={h.logoImg} onChange={(url) => setHeader({ logoImg: url })} kind="site-logo" />
                  <div><Lbl>Alto px</Lbl><input type="number" value={h.logoHeight} onChange={(e) => setHeader({ logoHeight: Number(e.target.value) })} className={inputCls} /></div>
                </div>}
            <div><Lbl>Menú</Lbl><LinkList links={h.links} pages={pages} onChange={(links) => setHeader({ links })} /></div>
            <div className="border-t border-[var(--border)] pt-2 space-y-2">
              <Lbl>Botón (CTA)</Lbl>
              <div className="grid grid-cols-2 gap-2">
                <select value={h.ctaType} onChange={(e) => setHeader({ ctaType: e.target.value as SiteHeader["ctaType"] })} className={inputCls}>
                  <option value="none">Sin botón</option><option value="whatsapp">WhatsApp</option><option value="url">URL</option><option value="page">Página</option><option value="anchor">Sección</option>
                </select>
                <input value={h.ctaLabel} placeholder="Texto del botón" onChange={(e) => setHeader({ ctaLabel: e.target.value })} className={inputCls} />
              </div>
              {h.ctaType !== "none" && (h.ctaType === "page"
                ? <select value={h.ctaValue} onChange={(e) => setHeader({ ctaValue: e.target.value })} className={inputCls}><option value="">— elige página —</option>{pages.map((p) => <option key={p.id} value={p.slug}>{p.name}</option>)}</select>
                : <input value={h.ctaValue} placeholder={h.ctaType === "whatsapp" ? "34600000000" : h.ctaType === "anchor" ? "id de sección" : "https://..."} onChange={(e) => setHeader({ ctaValue: e.target.value })} className={inputCls} />)}
              {h.ctaType === "whatsapp" && <input value={h.ctaMessage || ""} placeholder="Mensaje predefinido" onChange={(e) => setHeader({ ctaMessage: e.target.value })} className={inputCls} />}
            </div>
          </div>

          {/* PIE */}
          <div className="rounded-xl border border-[var(--border)] p-3 space-y-3" style={{ background: "var(--card)" }}>
            <label className="flex items-center gap-2 font-semibold text-sm"><input type="checkbox" checked={f.enabled} onChange={(e) => setFooter({ enabled: e.target.checked })} />Mostrar pie</label>
            <div><Lbl>Texto</Lbl><input value={f.text} onChange={(e) => setFooter({ text: e.target.value })} className={inputCls} /></div>
            <div><Lbl>Enlaces</Lbl><LinkList links={f.links} pages={pages} onChange={(links) => setFooter({ links })} /></div>
            <div><Lbl>Redes</Lbl>
              {f.socials.map((sc, i) => (
                <div key={i} className="flex gap-1 mb-1">
                  <select value={sc.network} onChange={(e) => { const a = [...f.socials]; a[i] = { ...a[i], network: e.target.value }; setFooter({ socials: a }); }} className={`${inputCls} max-w-[110px]`}>
                    <option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="whatsapp">WhatsApp</option><option value="tiktok">TikTok</option><option value="linkedin">LinkedIn</option><option value="youtube">YouTube</option><option value="web">Web</option><option value="email">Email</option>
                  </select>
                  <input value={sc.url} placeholder="URL" onChange={(e) => { const a = [...f.socials]; a[i] = { ...a[i], url: e.target.value }; setFooter({ socials: a }); }} className={inputCls} />
                  <button onClick={() => setFooter({ socials: f.socials.filter((_, j) => j !== i) })} className="px-2 text-red-500/70 hover:text-red-500">✕</button>
                </div>
              ))}
              <button onClick={() => setFooter({ socials: [...f.socials, { network: "web", url: "" }] })} className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/10">+ Añadir red</button>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-4 h-fit">
          <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-black/20" style={{ height: "78vh" }}>
            <div className="flex items-center justify-center h-full p-2">
              <iframe title="preview-site" srcDoc={preview} className="bg-white rounded-lg shadow-2xl" style={{ width: device === "mobile" ? 390 : "100%", height: "100%", border: "none", maxWidth: "100%" }} />
            </div>
          </div>
          <p className="text-[11px] text-[var(--foreground)]/40 mt-1 text-center">La cabecera y el pie se aplican a las páginas que tengan activada la opción “Cabecera y pie”.</p>
        </div>
      </div>
    </div>
  );
}
