"use client";

/**
 * SectionVideoButton — botón "Vídeo tutorial" en la cabecera (hero) de cada
 * pantalla del panel del negocio. Se coloca una sola vez en el layout, detecta la
 * sección por la ruta y carga sus vídeos. Si la sección no tiene vídeos activos,
 * no renderiza nada (no ocupa espacio). El negocio abre, ve y cierra sin salir.
 */

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getSectionKey, SECTION_LABELS } from "@/lib/section-videos";
import { toEmbedUrl, isDirectVideo } from "@/lib/video-embed";

interface SectionVideo {
  id: string;
  title: string;
  video_url: string;
  sort_order: number;
  enabled: boolean;
}

export default function SectionVideoButton() {
  const pathname = usePathname();
  const sectionKey = getSectionKey(pathname || "");

  const [videos, setVideos] = useState<SectionVideo[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!sectionKey) { setVideos([]); return; }
    let cancelled = false;
    setOpen(false);
    setSelected(0);
    supabase
      .from("section_videos")
      .select("id, title, video_url, sort_order, enabled")
      .eq("section_key", sectionKey)
      .eq("enabled", true)
      .order("sort_order")
      .then(({ data }) => {
        if (cancelled) return;
        setVideos(((data as SectionVideo[]) || []).filter((v) => v.video_url && v.video_url.trim()));
      });
    return () => { cancelled = true; };
  }, [sectionKey]);

  if (!sectionKey || videos.length === 0) return null;

  const current = videos[Math.min(selected, videos.length - 1)];
  const embed = current ? toEmbedUrl(current.video_url) : null;
  const sectionLabel = SECTION_LABELS[sectionKey] || "esta sección";

  return (
    <div className="flex justify-end mb-4">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[var(--brand-1)] text-white hover:opacity-90 transition"
      >
        <span className="text-[11px]">▶</span>
        Vídeo tutorial
        {videos.length > 1 && (
          <span className="ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-white/20">{videos.length}</span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[88vh] flex flex-col bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
              <h3 className="text-sm font-bold text-[var(--foreground)]">Vídeo tutorial — {sectionLabel}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[var(--foreground)]/60 hover:text-[var(--foreground)] text-xl leading-none"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto p-4 space-y-4">
              <div>
                {embed ? (
                  <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
                    <iframe
                      src={embed}
                      title={current.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0, borderRadius: 10 }}
                    />
                  </div>
                ) : isDirectVideo(current.video_url) ? (
                  <video key={current.id} src={current.video_url} controls className="w-full rounded-lg" />
                ) : (
                  <a href={current.video_url} target="_blank" rel="noreferrer" className="inline-block text-xs px-3 py-1.5 rounded-lg font-semibold bg-[var(--brand-4)] text-black">
                    Abrir vídeo →
                  </a>
                )}
                <div className="text-sm font-semibold text-[var(--foreground)] mt-2">{current.title}</div>
              </div>

              {videos.length > 1 && (
                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-widest text-[var(--foreground)]/40 mb-1">Todos los vídeos</div>
                  {videos.map((v, i) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelected(i)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        i === selected ? "bg-[var(--brand-1)]/10 border border-[var(--brand-1)]/40" : "border border-[var(--border)] hover:bg-[var(--border)]/20"
                      }`}
                    >
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: "var(--brand-1)", color: "#fff" }}>
                        {i + 1}
                      </span>
                      <span className="text-xs font-medium text-[var(--foreground)] flex-1">{v.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
