"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DEFAULT_LANDING_HTML } from "@/lib/landing-template";
import { renderLandingHtml } from "@/lib/landing/render";
import {
  LandingBlock, LandingTheme, BlockStyle, RowBlock,
  DEFAULT_THEME, newBlock, BLOCK_LABELS, CHILD_BLOCK_TYPES,
} from "@/lib/landing/blocks";

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

  useEffect(() => { setOrigin(window.location.origin); load(); }, []);

  // Vista previa en vivo (con pequeño debounce)
  useEffect(() => {
    if (!editing) return;
    const id = setTimeout(() => {
      if (editing.mode === "visual") {
        setPreviewHtml(renderLandingHtml(editing.theme || DEFAULT_THEME, editing.blocks || [], editing.name));
      } else {
        setPreviewHtml(editing.html || "");
      }
    }, 250);
    return () => clearTimeout(id);
  }, [editing]);

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
    setBlocks([...(editing.blocks || []), b]); setSelId(b.id);
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

  // ── EDITOR ──────────────────────────────────────────────────────────────────
  if (editing) {
    const publicUrl = `${origin}/p/${editing.slug}`;
    const theme = editing.theme || DEFAULT_THEME;
    const sel = editing.blocks?.find((b) => b.id === selId) || null;

    return (
      <div className="max-w-[1300px] mx-auto pb-12">
        {/* Barra superior */}
        <button onClick={() => setEditing(null)} className="text-sm text-[var(--foreground)]/50 hover:text-[var(--foreground)] mb-3">← Volver a la lista</button>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            className="text-lg font-bold bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-[var(--brand-1)] outline-none px-1" />
          <div className="flex items-center gap-2 flex-wrap">
            <Seg value={editing.mode} onChange={(v) => setEditing({ ...editing, mode: v })}
              options={[{ v: "visual", l: "Visual" }, { v: "code", l: "Código" }]} />
            <Seg value={device} onChange={setDevice} options={[{ v: "desktop", l: "Escritorio" }, { v: "mobile", l: "Móvil" }]} />
            <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-sm px-3 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/10">Ver ↗</a>
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
          <button onClick={() => copyLink(editing.slug)} className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/10">Copiar link</button>
          {msg && <span className="text-[var(--brand-1)]">{msg}</span>}
        </div>

        <div className="grid lg:grid-cols-[380px_1fr] gap-5">
          {/* Panel izquierdo */}
          <div className="space-y-4">
            {editing.mode === "code" ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Lbl>Código HTML</Lbl>
                  <button onClick={() => { if (confirm("¿Reemplazar por la plantilla de ejemplo?")) setEditing({ ...editing, html: DEFAULT_LANDING_HTML }); }}
                    className="text-[11px] px-2 py-1 rounded border border-[var(--border)] hover:bg-[var(--border)]/10">Cargar plantilla</button>
                </div>
                <textarea value={editing.html} onChange={(e) => setEditing({ ...editing, html: e.target.value })} spellCheck={false}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 font-mono text-xs" style={{ minHeight: "60vh" }} />
              </div>
            ) : (
              <>
                {/* Tema */}
                <details className="rounded-xl border border-[var(--border)] p-3" style={{ background: "var(--card)" }}>
                  <summary className="cursor-pointer text-sm font-semibold">Tema de la página</summary>
                  <div className="mt-3 space-y-3">
                    <div><Lbl>Fondo</Lbl>
                      <Seg value={theme.bgType} onChange={(v) => setEditing({ ...editing, theme: { ...theme, bgType: v } })}
                        options={[{ v: "gradient", l: "Degradado" }, { v: "solid", l: "Sólido" }]} />
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
                  </div>
                </details>

                {/* Añadir bloque */}
                <div className="rounded-xl border border-[var(--border)] p-3" style={{ background: "var(--card)" }}>
                  <Lbl>Añadir bloque</Lbl>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(BLOCK_LABELS) as LandingBlock["type"][]).map((t) => (
                      <button key={t} onClick={() => addBlock(t)} className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--brand-1)] hover:text-white transition-colors">+ {BLOCK_LABELS[t]}</button>
                    ))}
                  </div>
                </div>

                {/* Lista de bloques */}
                <div className="space-y-1.5">
                  {(editing.blocks || []).length === 0 && <p className="text-xs text-[var(--foreground)]/40 px-1">Sin bloques. Añade el primero arriba.</p>}
                  {(editing.blocks || []).map((b, i) => (
                    <div key={b.id} className={`rounded-lg border px-3 py-2 flex items-center justify-between gap-2 cursor-pointer ${selId === b.id ? "border-[var(--brand-1)]" : "border-[var(--border)]"}`}
                      style={{ background: "var(--card)" }} onClick={() => setSelId(selId === b.id ? null : b.id)}>
                      <span className="text-sm truncate">{BLOCK_LABELS[b.type]}{b.type === "heading" || b.type === "paragraph" ? <span className="text-[var(--foreground)]/40"> · {String((b as { text?: string }).text || "").slice(0, 24)}</span> : null}</span>
                      <span className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => moveBlock(i, -1)} className="px-1.5 text-[var(--foreground)]/50 hover:text-[var(--foreground)]">↑</button>
                        <button onClick={() => moveBlock(i, 1)} className="px-1.5 text-[var(--foreground)]/50 hover:text-[var(--foreground)]">↓</button>
                        <button onClick={() => deleteBlock(b.id)} className="px-1.5 text-red-500/70 hover:text-red-500">✕</button>
                      </span>
                    </div>
                  ))}
                </div>

                {/* Controles del bloque seleccionado */}
                {sel && (
                  <div className="rounded-xl border border-[var(--brand-1)]/40 p-3 space-y-3" style={{ background: "var(--card)" }}>
                    <p className="text-sm font-semibold">Editar: {BLOCK_LABELS[sel.type]}</p>
                    <BlockControls block={sel} update={(patch) => updateBlock(sel.id, patch)} />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Vista previa */}
          <div className="lg:sticky lg:top-4 h-fit">
            <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-black/20" style={{ height: "78vh" }}>
              <div className="flex items-center justify-center h-full p-2">
                <iframe title="preview" srcDoc={previewHtml}
                  className="bg-white rounded-lg shadow-2xl transition-all"
                  style={{ width: device === "mobile" ? 390 : "100%", height: "100%", border: "none", maxWidth: "100%" }} />
              </div>
            </div>
            <p className="text-[11px] text-[var(--foreground)]/40 mt-1 text-center">Vista previa en vivo — lo que ves es lo que se publica.</p>
          </div>
        </div>
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
        <button onClick={createNew} disabled={saving} className="text-sm px-4 py-2 rounded-lg font-semibold text-black disabled:opacity-50" style={{ background: "var(--brand-4)" }}>+ Nueva landing</button>
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
                <a href={`${origin}/p/${l.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/10">Abrir ↗</a>
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
function BlockControls({ block, update }: { block: LandingBlock; update: (patch: Partial<LandingBlock>) => void }) {
  const us = (patch: Partial<BlockStyle>) => update({ s: { ...(block.s || {}), ...patch } } as Partial<LandingBlock>);

  if (block.type === "spacer") {
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
        <div className="grid grid-cols-3 gap-2">
          <div><Lbl>Color texto</Lbl><input value={block.s?.color || ""} placeholder="#ffffff" onChange={(e) => us({ color: e.target.value || undefined })} className={inputCls} /></div>
          <div><Lbl>Color fondo</Lbl><input value={block.s?.bgColor || ""} placeholder="#0a2422" onChange={(e) => us({ bgColor: e.target.value || undefined })} className={inputCls} /></div>
          <div><Lbl>Borde px</Lbl><input type="number" value={block.s?.borderWidth || ""} onChange={(e) => us({ borderWidth: e.target.value ? Number(e.target.value) : undefined })} className={inputCls} /></div>
        </div>
        <div><Lbl>Imagen de fondo (URL)</Lbl><input value={block.s?.bgImage || ""} placeholder="https://..." onChange={(e) => us({ bgImage: e.target.value || undefined })} className={inputCls} /></div>
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
      <div><Lbl>URL de la imagen</Lbl><input value={block.src} onChange={(e) => update({ src: e.target.value })} className={inputCls} placeholder="https://..." /></div>
      <div><Lbl>Texto alternativo</Lbl><input value={block.alt || ""} onChange={(e) => update({ alt: e.target.value })} className={inputCls} /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><Lbl>Ancho (px, vacío=auto)</Lbl><input type="number" value={block.width || ""} onChange={(e) => update({ width: e.target.value ? Number(e.target.value) : undefined })} className={inputCls} /></div>
        <label className="flex items-center gap-2 text-sm mt-5"><input type="checkbox" checked={!!block.rounded} onChange={(e) => update({ rounded: e.target.checked })} />Esquinas redondeadas</label>
      </div>
    </>;
  } else if (block.type === "logos") {
    specific = <>
      <div><Lbl>Título (opcional)</Lbl><input value={block.title || ""} onChange={(e) => update({ title: e.target.value })} className={inputCls} /></div>
      <Lbl>Logos (URL de imagen + nombre)</Lbl>
      {block.items.map((it, i) => (
        <div key={i} className="flex gap-1">
          <input value={it.src} placeholder="URL del logo" onChange={(e) => { const items = [...block.items]; items[i] = { ...items[i], src: e.target.value }; update({ items }); }} className={inputCls} />
          <input value={it.alt || ""} placeholder="Nombre" onChange={(e) => { const items = [...block.items]; items[i] = { ...items[i], alt: e.target.value }; update({ items }); }} className={`${inputCls} max-w-[110px]`} />
          <button onClick={() => update({ items: block.items.filter((_, j) => j !== i) })} className="px-2 text-red-500/70 hover:text-red-500">✕</button>
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
  } else if (block.type === "row") {
    specific = <RowControls block={block} update={update} />;
  }

  return <div className="space-y-3">{specific}{common}{adv}</div>;
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
            <button key={t} onClick={() => addChild(ci, t)} className="text-[11px] px-2 py-1 rounded border border-[var(--border)] hover:bg-[var(--brand-1)] hover:text-white transition-colors">+ {BLOCK_LABELS[t]}</button>
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
