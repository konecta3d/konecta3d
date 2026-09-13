"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { SECTION_VIDEO_DEFS, SectionArea } from "@/lib/section-videos";
import { toEmbedUrl, isDirectVideo } from "@/lib/video-embed";

interface SV {
  id: string;
  section_key: string;
  title: string;
  video_url: string;
  sort_order: number;
  enabled: boolean;
}

const AREAS: SectionArea[] = ["Fidelización", "Captación"];

export default function VideosSeccionesAdmin() {
  const [videos, setVideos] = useState<SV[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { title: string; url: string }>>({});
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };

  const token = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/section-videos", { headers: { Authorization: `Bearer ${await token()}` } });
      const data = await res.json();
      if (Array.isArray(data.videos)) setVideos(data.videos);
    } catch { /* noop */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addVideo = async (section_key: string) => {
    const d = drafts[section_key] || { title: "", url: "" };
    if (!d.title.trim() || !d.url.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/section-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
        body: JSON.stringify({ section_key, title: d.title.trim(), video_url: d.url.trim(), sort_order: videos.filter(v => v.section_key === section_key).length }),
      });
      const data = await res.json();
      if (data.video) {
        setVideos(v => [...v, data.video]);
        setDrafts(dd => ({ ...dd, [section_key]: { title: "", url: "" } }));
        showToast("Vídeo añadido");
      } else showToast(data.error || "Error al añadir");
    } catch { showToast("Error de red"); }
    setBusy(false);
  };

  const patchVideo = async (id: string, patch: Partial<SV>) => {
    try {
      const res = await fetch("/api/admin/section-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
        body: JSON.stringify({ id, ...patch }),
      });
      const data = await res.json();
      if (data.video) setVideos(v => v.map(x => x.id === id ? data.video : x));
      else showToast(data.error || "Error al guardar");
    } catch { showToast("Error de red"); }
  };

  const deleteVideo = async (id: string) => {
    if (!confirm("¿Eliminar este vídeo?")) return;
    try {
      await fetch(`/api/admin/section-videos?id=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${await token()}` } });
      setVideos(v => v.filter(x => x.id !== id));
      showToast("Vídeo eliminado");
    } catch { showToast("Error de red"); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--brand-1)]" />
      </div>
    );
  }

  const total = videos.length;

  return (
    <div className="space-y-6 pb-16 max-w-4xl">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[var(--brand-1)] text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium">{toast}</div>
      )}

      <div>
        <h1 className="text-2xl font-semibold">Vídeos por sección</h1>
        <p className="text-sm text-[var(--foreground)]/50 mt-1">
          Vídeos tutoriales para cada pantalla del panel (fuera de Landing y Recursos, que tienen los suyos por paso). {total} vídeos en total.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-xs text-[var(--foreground)]/70 leading-relaxed">
        <b className="text-[var(--foreground)]">Cómo funciona:</b> añade uno o varios vídeos por sección. En esa pantalla del panel, el negocio verá un botón <b>"▶ Vídeo tutorial"</b> arriba que abre el reproductor sin salir de la plataforma. Sube los vídeos a YouTube en modo <b>Oculto</b>. Desactiva un vídeo con su interruptor para ocultarlo sin borrar el enlace.
      </div>

      {AREAS.map(area => (
        <div key={area} className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-widest text-[#39a1a9]">{area}</div>
          {SECTION_VIDEO_DEFS.filter(s => s.area === area).map(section => {
            const list = videos.filter(v => v.section_key === section.key).sort((a, b) => a.sort_order - b.sort_order);
            const d = drafts[section.key] || { title: "", url: "" };
            return (
              <div key={section.key} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[var(--foreground)]">{section.label}</span>
                  <span className="text-[10px] text-[var(--foreground)]/40">{list.length} vídeo{list.length !== 1 ? "s" : ""}</span>
                </div>

                {list.map(v => (
                  <div key={v.id} className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        defaultValue={v.title}
                        onBlur={(e) => { if (e.target.value.trim() !== v.title) patchVideo(v.id, { title: e.target.value.trim() }); }}
                        className="flex-1 px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => patchVideo(v.id, { enabled: !v.enabled })}
                        title={v.enabled ? "Desactivar" : "Activar"}
                        className="relative w-10 h-5 rounded-full flex-shrink-0"
                        style={{ background: v.enabled ? "var(--brand-1)" : "var(--border)" }}
                      >
                        <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: v.enabled ? "22px" : "2px" }} />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        defaultValue={v.video_url}
                        onBlur={(e) => { if (e.target.value.trim() !== v.video_url) patchVideo(v.id, { video_url: e.target.value.trim() }); }}
                        className="flex-1 px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm"
                        placeholder="https://youtu.be/..."
                      />
                      <button type="button" onClick={() => setPreview({ url: v.video_url, title: v.title })} className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-semibold hover:bg-[var(--brand-1)]/10 hover:border-[var(--brand-1)] hover:text-[var(--brand-1)] whitespace-nowrap">▶ Ver</button>
                      <button type="button" onClick={() => deleteVideo(v.id)} className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-xs text-red-400/60 hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400">✕</button>
                    </div>
                    {!v.enabled && <div className="text-[10px] text-amber-500">Desactivado — el negocio no lo ve</div>}
                  </div>
                ))}

                {/* Añadir vídeo */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={d.title}
                    onChange={(e) => setDrafts(dd => ({ ...dd, [section.key]: { ...d, title: e.target.value } }))}
                    placeholder="Título del vídeo"
                    className="flex-1 px-2 py-1.5 rounded-lg border border-dashed border-[var(--border)] bg-[var(--background)] text-sm"
                  />
                  <input
                    type="text"
                    value={d.url}
                    onChange={(e) => setDrafts(dd => ({ ...dd, [section.key]: { ...d, url: e.target.value } }))}
                    placeholder="Enlace (YouTube / .mp4)"
                    className="flex-1 px-2 py-1.5 rounded-lg border border-dashed border-[var(--border)] bg-[var(--background)] text-sm"
                  />
                  <button
                    type="button"
                    disabled={busy || !d.title.trim() || !d.url.trim()}
                    onClick={() => addVideo(section.key)}
                    className="px-3 py-1.5 rounded-lg bg-[var(--brand-1)] text-white text-xs font-semibold disabled:opacity-40 whitespace-nowrap"
                  >
                    + Añadir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setPreview(null)}>
          <div className="w-full max-w-2xl bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
              <h3 className="text-sm font-bold text-[var(--foreground)]">{preview.title || "Previsualización"}</h3>
              <button type="button" onClick={() => setPreview(null)} className="text-[var(--foreground)]/60 hover:text-[var(--foreground)] text-xl leading-none">×</button>
            </div>
            <div className="p-4">
              {toEmbedUrl(preview.url) ? (
                <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
                  <iframe src={toEmbedUrl(preview.url)!} title={preview.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0, borderRadius: 10 }} />
                </div>
              ) : isDirectVideo(preview.url) ? (
                <video src={preview.url} controls className="w-full rounded-lg" />
              ) : (
                <div className="text-sm text-[var(--foreground)]/60">No reconozco este enlace como YouTube, Vimeo ni un archivo de vídeo. <a href={preview.url} target="_blank" rel="noreferrer" className="text-[var(--brand-1)] underline">Abrir →</a></div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
