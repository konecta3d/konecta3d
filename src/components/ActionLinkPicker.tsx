"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

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
  // Opcional: filtrar por tipo de herramienta (whatsapp, web, social, etc.)
  filterType?: string | string[];
}

export default function ActionLinkPicker({ value, onChange, label = "Seleccionar link de acción", filterType }: ActionLinkPickerProps) {
  const [links, setLinks] = useState<ActionLink[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [businessId, setBusinessId] = useState("");
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
    setBusinessId(bid);
    if (bid) loadLinks(bid);
    setLoading(false);
  };
  load();
}, []);

  const loadLinks = async (bid: string) => {
    // Cargar únicamente desde Supabase
    const { data: dbLinks } = await supabase
      .from("action_links")
      .select("*")
      .eq("business_id", bid)
      .order("created_at", { ascending: false });
    setLinks((dbLinks || []) as ActionLink[]);
  };

  // Aplicar filtro por tipo si se indica
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

  const getIcon = (type: string) => {
    const icons: Record<string, string> = {
      whatsapp: "",
      calendar: "",
      location: "",
      reviews: "",
      payment: "",
      video: "",
      form: "",
      catalog: "",
      social: ""
    };
    return icons[type] || "";
  };

  const selectedLink = links.find(l => l.url === value);

  return (
    <div className="space-y-2">
      {label && <label className="block text-xs uppercase tracking-widest text-[#39a1a9]">{label}</label>}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white text-left flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            {selectedLink ? (
              <>
                <span>{getIcon(selectedLink.type)}</span>
                <span className="truncate text-slate-100">{selectedLink.name}</span>
              </>
            ) : (
              <span className="text-white">Seleccionar link...</span>
            )}
          </span>
          <span className="text-white">{isOpen ? "▲" : "▼"}</span>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-[#1e293b] border border-white/10 rounded-lg shadow-xl max-h-80 overflow-hidden">
            <div className="p-2 border-b border-white/10">
              <input
                type="text"
                placeholder="Buscar link..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 rounded bg-white/10 border border-white/10 text-white text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            <div className="max-h-60 overflow-y-auto">
              {links.length === 0 ? (
                <div className="p-4 text-center text-white text-sm">
                  No hay links guardados. <br />
                  <a href="/acciones" target="_blank" className="text-[#39a1a9] hover:underline">
                    Crear en Acciones →
                  </a>
                </div>
              ) : Object.entries(groupedLinks).map(([type, typeLinks]) => (
                <div key={type}>
                  <div className="px-3 py-2 text-xs text-white uppercase bg-white/5 flex items-center gap-2">
                    <span>{getIcon(type)}</span>
                    <span>{type}</span>
                  </div>
                  {typeLinks.map(link => (
                    <button
                      key={link.id}
                      type="button"
                      onClick={() => {
                        onChange(link.url);
                        setIsOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-2 ${
                        value === link.url ? "bg-[#39a1a9]/20 text-[#39a1a9]" : "text-white"
                      }`}
                    >
                      <span className="truncate flex-1 text-slate-100">{link.name}</span>
                      <span className="text-xs text-white truncate max-w-[100px]">{link.url}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
            
            <div className="p-2 border-t border-white/10">
              <a href="/acciones" target="_blank" className="block text-center text-xs text-[#39a1a9] hover:underline py-1">
                + Crear nuevo link en Acciones
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook para obtener todos los links de acción
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
    if (bid) loadLinks(bid);
    setLoading(false);
  };
  load();
}, []);

  const loadLinks = async (bid: string) => {
    setLoading(true);

    // Cargar únicamente desde Supabase
    const { data: dbLinks } = await supabase
      .from("action_links")
      .select("*")
      .eq("business_id", bid)
      .order("created_at", { ascending: false });

    setLinks((dbLinks || []) as ActionLink[]);
    setLoading(false);
  };

  const getLinksByType = (type: string) => links.filter(l => l.type === type);
  
  const getLinkByUrl = (url: string) => links.find(l => l.url === url);

  return { links, loading, getLinksByType, getLinkByUrl, reload: () => {
    const [bid, setBid] = useState("");

useEffect(() => {
  const load = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userEmail = sessionData?.session?.user?.email || "";
    if (!userEmail) { setBid(""); return; }
    const { data: biz } = await supabase
      .from("businesses")
      .select("id")
      .eq("contact_email", userEmail)
      .single();
    setBid(biz?.id || "");
  };
  load();
}, []);
    if (bid) loadLinks(bid);
  }};
}
