"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";

interface ActionLinkConfig {
  icon?: string;
  tracking_id?: string;
  [key: string]: unknown;
}

interface ActionLink {
  id: string;
  type: string;
  name: string;
  url: string;
  config: ActionLinkConfig;
}

interface ActionLinkPickerProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  filterType?: string | string[];
}

const TYPE_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  calendar: "Citas",
  location: "Ubicación",
  reviews: "Reseñas",
  payment: "Pagos",
  video: "Videollamadas",
  form: "Formularios",
  catalog: "Catálogos",
  social: "Redes sociales",
  web: "Web / Landing",
};

const TYPE_ICONS: Record<string, string> = {
  whatsapp: "💬",
  calendar: "📅",
  location: "📍",
  reviews: "⭐",
  payment: "💳",
  video: "🎥",
  form: "📋",
  catalog: "📦",
  social: "📱",
  web: "🌐",
};

export default function ActionLinkPicker({
  value,
  onChange,
  label,
  filterType,
}: ActionLinkPickerProps) {
  const [links, setLinks] = useState<ActionLink[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userEmail = sessionData?.session?.user?.email || "";
      if (!userEmail) { setLoading(false); return; }
      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("contact_email", userEmail)
        .single();
      const bid = biz?.id || "";
      if (bid) {
        const { data: dbLinks } = await supabase
          .from("action_links")
          .select("*")
          .eq("business_id", bid)
          .order("created_at", { ascending: false });
        setLinks((dbLinks || []) as ActionLink[]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setSearch("");
  }, []);

  // Filtrar por tipo si se indica
  const baseLinks = Array.isArray(filterType)
    ? links.filter((l) => filterType.includes(l.type))
    : filterType
    ? links.filter((l) => l.type === filterType)
    : links;

  const filteredLinks = search
    ? baseLinks.filter(
        (l) =>
          l.name.toLowerCase().includes(search.toLowerCase()) ||
          l.url.toLowerCase().includes(search.toLowerCase())
      )
    : baseLinks;

  const groupedLinks = filteredLinks.reduce((acc, link) => {
    if (!acc[link.type]) acc[link.type] = [];
    acc[link.type].push(link);
    return acc;
  }, {} as Record<string, ActionLink[]>);

  const selectedLink = links.find((l) => l.url === value);

  const modal = isOpen && mounted
    ? createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          {/* Fondo oscuro */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />

          {/* Panel */}
          <div className="relative z-10 w-full sm:max-w-md mx-auto bg-[#0f172a] border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">

            {/* Cabecera */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/10 flex-shrink-0">
              <div>
                <p className="font-semibold text-white text-sm">Seleccionar acción</p>
                {label && <p className="text-xs text-white/50 mt-0.5">{label}</p>}
              </div>
              <button
                type="button"
                onClick={close}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            {/* Buscador */}
            <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
              <input
                type="text"
                placeholder="Buscar por nombre o URL..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-[#39a1a9]"
              />
            </div>

            {/* Lista */}
            <div className="overflow-y-auto flex-1 px-2 py-2">
              {loading ? (
                <div className="py-8 text-center text-white/40 text-sm">Cargando...</div>
              ) : links.length === 0 ? (
                <div className="py-8 text-center text-sm text-white/50 space-y-2">
                  <p>No tienes acciones guardadas.</p>
                  <a
                    href="/acciones"
                    target="_blank"
                    className="inline-block text-[#39a1a9] hover:underline"
                    onClick={close}
                  >
                    Crear en Acciones →
                  </a>
                </div>
              ) : Object.keys(groupedLinks).length === 0 ? (
                <div className="py-8 text-center text-white/40 text-sm">Sin resultados</div>
              ) : (
                Object.entries(groupedLinks).map(([type, typeLinks]) => (
                  <div key={type} className="mb-3">
                    {/* Cabecera de grupo */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 mb-1">
                      <span>{TYPE_ICONS[type] || "🔗"}</span>
                      <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                        {TYPE_LABELS[type] || type}
                      </span>
                    </div>
                    {typeLinks.map((link) => (
                      <button
                        key={link.id}
                        type="button"
                        onClick={() => { onChange(link.url); close(); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors mb-0.5 ${
                          value === link.url
                            ? "bg-[#39a1a9]/20 border border-[#39a1a9]/40"
                            : "hover:bg-white/8 border border-transparent"
                        }`}
                      >
                        <span className="text-base flex-shrink-0">{TYPE_ICONS[link.type] || "🔗"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{link.name}</p>
                          <p className="text-xs text-white/40 truncate">{link.url}</p>
                        </div>
                        {value === link.url && (
                          <span className="text-[#39a1a9] text-base flex-shrink-0">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Pie */}
            <div className="px-4 py-3 border-t border-white/10 flex-shrink-0 flex items-center justify-between">
              <a
                href="/acciones"
                target="_blank"
                className="text-xs text-[#39a1a9] hover:underline"
                onClick={close}
              >
                + Crear nueva acción
              </a>
              {value && (
                <button
                  type="button"
                  onClick={() => { onChange(""); close(); }}
                  className="text-xs text-red-400 hover:underline"
                >
                  Quitar selección
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="relative">
      {label && (
        <label className="block text-xs uppercase tracking-widest text-[#39a1a9] mb-1.5">
          {label}
        </label>
      )}

      {/* Botón disparador */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        title={selectedLink ? `Acción: ${selectedLink.name}` : "Seleccionar acción"}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap ${
          selectedLink
            ? "border-[#39a1a9]/60 bg-[#39a1a9]/10 text-[#39a1a9]"
            : "border-white/20 bg-white/5 text-white/60 hover:bg-white/10"
        }`}
      >
        <span>{selectedLink ? TYPE_ICONS[selectedLink.type] || "🔗" : "🔗"}</span>
        <span className="max-w-[90px] truncate">
          {selectedLink ? selectedLink.name : "Acción"}
        </span>
        <span className="opacity-50 text-[10px]">▼</span>
      </button>

      {modal}
    </div>
  );
}

// Hook reutilizable
export function useActionLinks() {
  const [links, setLinks] = useState<ActionLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userEmail = sessionData?.session?.user?.email || "";
      if (!userEmail) { setLoading(false); return; }
      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("contact_email", userEmail)
        .single();
      const bid = biz?.id || "";
      if (bid) {
        const { data: dbLinks } = await supabase
          .from("action_links")
          .select("*")
          .eq("business_id", bid)
          .order("created_at", { ascending: false });
        setLinks((dbLinks || []) as ActionLink[]);
      }
      setLoading(false);
    };
    load();
  }, []);

  return {
    links,
    loading,
    getLinksByType: (type: string) => links.filter((l) => l.type === type),
    getLinkByUrl: (url: string) => links.find((l) => l.url === url),
  };
}
