"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface WhatsAppLink {
  id: string;
  name: string;
  phone: string;
  message: string;
  url: string;
  is_default: boolean;
}

export default function WhatsAppGeneratorPage() {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [linkName, setLinkName] = useState("");
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedLinks, setSavedLinks] = useState<WhatsAppLink[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState("");

  useEffect(() => {
    const bid = localStorage.getItem("konecta-business-id");
    if (bid) {
      setBusinessId(bid);
      loadSavedLinks(bid);
    }
    // Cargar link guardado previamente
    const savedLink = localStorage.getItem("konecta-whatsapp-link");
    if (savedLink) {
      setLink(savedLink);
    }
  }, []);

  const loadSavedLinks = async (bid: string) => {
    const { data, error } = await supabase
      .from("whatsapp_links")
      .select("*")
      .eq("business_id", bid)
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setSavedLinks(data);
    }
  };

  const generate = () => {
    const clean = phone.replace(/\D/g, "");
    const text = encodeURIComponent(message || "Hola, me interesa más información");
    const url = `https://wa.me/${clean}?text=${text}`;
    setLink(url);
    localStorage.setItem("konecta-whatsapp-link", url);
    // Guardar en lista compartida para otros generadores
    const existingLinks = JSON.parse(localStorage.getItem("konecta-whatsapp-links") || "[]");
    const newLink = { url, phone, message, name: linkName || "Link de WhatsApp" };
    const updatedLinks = [...existingLinks.filter((l: any) => l.url !== url), newLink];
    localStorage.setItem("konecta-whatsapp-links", JSON.stringify(updatedLinks));
  };

  const saveToDatabase = async () => {
    if (!businessId || !phone) return;
    
    const clean = phone.replace(/\D/g, "");
    const text = encodeURIComponent(message || "Hola, me interesa más información");
    const url = `https://wa.me/${clean}?text=${text}`;
    
    if (editingId) {
      await supabase
        .from("whatsapp_links")
        .update({ name: linkName, phone, message, url })
        .eq("id", editingId);
    } else {
      await supabase
        .from("whatsapp_links")
        .insert({ business_id: businessId, name: linkName || "Link de WhatsApp", phone, message, url });
    }
    
    setLinkName("");
    setPhone("");
    setMessage("");
    setLink("");
    setEditingId(null);
    loadSavedLinks(businessId);
  };

  const deleteLink = async (id: string) => {
    await supabase.from("whatsapp_links").delete().eq("id", id);
    loadSavedLinks(businessId);
  };

  const editLink = (savedLink: WhatsAppLink) => {
    setEditingId(savedLink.id);
    setLinkName(savedLink.name);
    setPhone(savedLink.phone);
    setMessage(savedLink.message || "");
    setLink(savedLink.url);
  };

  const useLink = (url: string) => {
    setLink(url);
    localStorage.setItem("konecta-whatsapp-link", url);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Generador de link de WhatsApp</h1>
      
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
        <div>
          <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">Nombre del link (para identificarlo)</label>
          <input
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
            value={linkName}
            onChange={(e) => setLinkName(e.target.value)}
            placeholder="Ej: Contacto general, Soporte técnico..."
          />
        </div>
        
        <div>
          <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">Teléfono (con prefijo)</label>
          <input
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Ej: 34600000000"
          />
        </div>
        
        <div>
          <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">Mensaje inicial</label>
          <input
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hola, quiero más información"
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button onClick={generate} className="rounded-lg bg-[var(--brand-4)] px-4 py-2 font-semibold text-black">
            Generar link
          </button>
          
          {link && (
            <>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(link);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="rounded-lg border border-[var(--border)] px-4 py-2"
              >
                Copiar
              </button>
              
              <button
                onClick={saveToDatabase}
                className="rounded-lg bg-[var(--brand-1)] px-4 py-2 font-semibold text-white"
              >
                {editingId ? "Actualizar" : "Guardar"}
              </button>
              
              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setLinkName("");
                    setPhone("");
                    setMessage("");
                    setLink("");
                  }}
                  className="rounded-lg border border-red-500 text-red-500 px-4 py-2"
                >
                  Cancelar
                </button>
              )}
            </>
          )}
        </div>
        
        {link && (
          <div className="text-sm break-all p-3 bg-[var(--background)] rounded-lg">{link}</div>
        )}
        {copied && <div className="text-sm text-green-500">Copiado.</div>}
      </div>

      {/* Links guardados */}
      {savedLinks.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
          <h2 className="text-lg font-semibold">Links guardados</h2>
          <div className="space-y-3">
            {savedLinks.map((savedLink) => (
              <div key={savedLink.id} className="flex items-center justify-between p-3 bg-[var(--background)] rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{savedLink.name}</div>
                  <div className="text-xs text-gray-500 truncate">{savedLink.phone} - {savedLink.message}</div>
                </div>
                <div className="flex gap-2 ml-3">
                  <button
                    onClick={() => useLink(savedLink.url)}
                    className="text-xs px-2 py-1 bg-[var(--brand-4)] text-black rounded"
                  >
                    Usar
                  </button>
                  <button
                    onClick={() => editLink(savedLink)}
                    className="text-xs px-2 py-1 border border-[var(--border)] rounded"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deleteLink(savedLink.id)}
                    className="text-xs px-2 py-1 border border-red-500 text-red-500 rounded"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info para otros generadores */}
      <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm">
        <strong className="text-yellow-500">Información:</strong> Los links de WhatsApp guardados se pueden usar en otros generadores (como Lead Magnet) Pegando la URL en el campo de enlace del botón CTA.
      </div>
    </div>
  );
}
