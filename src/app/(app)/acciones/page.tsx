"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type ActionType =
  | "whatsapp"
  | "calendar"
  | "location"
  | "reviews"
  | "payment"
  | "video"
  | "form"
  | "catalog"
  | "social"
  | "web";

interface ActionLink {
  id: string;
  type: ActionType;
  name: string;
  url: string;
  config: any;
  is_default: boolean;
}

const ACTION_CATEGORIES = {
  whatsapp: {
    title: "WhatsApp",
    description: "Chat directo con tu negocio",
    icon: "💬",
    color: "#25D366",
    tools: ["WhatsApp Direct"],
    placeholder: "34600000000",
    messagePlaceholder: "Hola, me interesa..."
  },
  calendar: {
    title: "Agendar Citas",
    description: "Reservar reuniones y citas",
    icon: "📅",
    color: "#4285F4",
    tools: ["Calendly", "Google Calendar", "Bookity"],
    placeholder: "https://calendly.com/...",
    example: "https://calendly.com/tuempresa/consulta"
  },
  location: {
    title: "Ubicación",
    description: "Direcciones y mapas",
    icon: "📍",
    color: "#EA4335",
    tools: ["Google Maps", "Waze"],
    placeholder: "https://maps.google.com/...",
    example: "https://maps.google.com/?q=tu+negocio"
  },
  reviews: {
    title: "Reseñas",
    description: "Valoraciones y opiniones",
    icon: "⭐",
    color: "#FBBC04",
    tools: ["Google Reviews", "TripAdvisor"],
    placeholder: "https://maps.google.com/...",
    example: "https://search.google.com/reviews?..."
  },
  payment: {
    title: "Pagos",
    description: "Process payments securely",
    icon: "💳",
    color: "#6772E5",
    tools: ["Stripe", "PayPal", "Bizum"],
    placeholder: "https://paypal.me/...",
    example: "https://paypal.me/tuempresa"
  },
  video: {
    title: "Videollamada",
    description: "Reuniones por video",
    icon: "📹",
    color: "#2D8CFF",
    tools: ["Zoom", "Google Meet"],
    placeholder: "https://zoom.us/...",
    example: "https://zoom.us/j/123456789"
  },
  form: {
    title: "Formularios",
    description: "Encuestas y solicitudes",
    icon: "📋",
    color: "#7248B9",
    tools: ["Google Forms", "Typeform"],
    placeholder: "https://forms.google.com/...",
    example: "https://forms.gle/..."
  },
  catalog: {
    title: "Catálogo",
    description: "Tus productos y servicios",
    icon: "🛍️",
    color: "#FF6B6B",
    tools: ["Catálogo propio"],
    placeholder: "https://tu-negocio.com/catalogo",
    example: "https://tu-negocio.com/productos"
  },
  social: {
    title: "Redes Sociales",
    description: "Conectar en redes",
    icon: "📱",
    color: "#E4405F",
    tools: ["Instagram", "Facebook", "YouTube"],
    placeholder: "https://instagram.com/...",
    example: "https://instagram.com/tuempresa"
  },
  web: {
    title: "Web / Landing",
    description: "Página principal o landing específica",
    icon: "🌐",
    color: "#0ea5e9",
    tools: ["Web del negocio", "Landing Konecta3D"],
    placeholder: "https://tu-negocio.com",
    example: "https://tu-negocio.com/landing"
  }
};

export default function AccionesPage() {
  const [activeCategory, setActiveCategory] = useState<ActionType | null>(null);
  const [savedLinks, setSavedLinks] = useState<ActionLink[]>([]);
  const [businessId, setBusinessId] = useState("");
  
  // Form state
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const bid = localStorage.getItem("konecta-business-id");
    if (bid) {
      setBusinessId(bid);
      loadSavedLinks(bid);
    }
  }, []);

  const loadSavedLinks = async (bid: string) => {
    const { data, error } = await supabase
      .from("action_links")
      .select("*")
      .eq("business_id", bid)
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setSavedLinks(data as any);
    }
  };

  const generate = () => {
    let finalUrl = url;
    
    if (activeCategory === "whatsapp") {
      const clean = phone.replace(/\D/g, "");
      const text = encodeURIComponent(message || "Hola, me interesa más información");
      finalUrl = `https://wa.me/${clean}?text=${text}`;
    }
    
    if (!finalUrl) return;
    
    // Solo calculamos y mostramos el link en el formulario; el guardado real se hace en Supabase
    setUrl(finalUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saveToDatabase = async () => {
    if (!businessId || !url) {
      alert("Falta el negocio o la URL para guardar la herramienta. Vuelve al panel del negocio y asegúrate de que estás entrando desde un negocio válido.");
      return;
    }

    let finalUrl = url;
    let config: any = {};

    if (activeCategory === "whatsapp") {
      const clean = phone.replace(/\D/g, "");
      const text = encodeURIComponent(message || "Hola, me interesa más información");
      finalUrl = `https://wa.me/${clean}?text=${text}`;
      config = { phone, message };
    }

    const linkName = name || ACTION_CATEGORIES[activeCategory!].title;

    let error;
    if (editingId) {
      const { error: updateError } = await supabase
        .from("action_links")
        .update({ name: linkName, url: finalUrl, config, type: activeCategory })
        .eq("id", editingId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("action_links")
        .insert({
          business_id: businessId,
          name: linkName,
          url: finalUrl,
          config,
          type: activeCategory,
        });
      error = insertError;
    }

    if (error) {
      console.error("Error guardando action_link:", error);
      alert("Error al guardar la herramienta en Supabase: " + error.message);
      return;
    }

    resetForm();
    loadSavedLinks(businessId);
  };

  const deleteLink = async (id: string) => {
    await supabase.from("action_links").delete().eq("id", id);
    loadSavedLinks(businessId);
  };

  const editLink = (link: ActionLink) => {
    setActiveCategory(link.type as ActionType);
    setEditingId(link.id);
    setName(link.name);
    setUrl(link.url);
    if (link.config) {
      setPhone(link.config.phone || "");
      setMessage(link.config.message || "");
    }
  };

  const useLink = (urlToUse: string) => {
    // Rellenar el formulario con un link ya guardado
    setUrl(urlToUse);
  };

  const copyLink = async (urlToCopy: string) => {
    await navigator.clipboard.writeText(urlToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const resetForm = () => {
    setName("");
    setUrl("");
    setPhone("");
    setMessage("");
    setEditingId(null);
    setSaved(false);
  };

  const closeCategory = () => {
    setActiveCategory(null);
    resetForm();
  };

  const filteredLinks = activeCategory 
    ? savedLinks.filter(l => l.type === activeCategory)
    : [];

  // Render category selector
  if (!activeCategory) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Herramientas del Negocio</h1>
          <p className="text-gray-400">Genera y guarda links de acción para usar en tus recursos</p>
        </div>

        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-200">
          <strong>Consejo:</strong> Si ya usas una o varias de estas herramientas, pega el link generado y centralízalas en una página con un objetivo concreto.
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
          {Object.entries(ACTION_CATEGORIES).map(([key, category]) => {
            const count = savedLinks.filter(l => l.type === key).length;
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key as ActionType)}
                className="p-6 rounded-xl border border-[var(--border)] bg-[var(--card)] text-left hover:border-[var(--brand-1)] transition-all"
              >
                <h3 className="font-bold text-lg mb-1">{category.title}</h3>
                <p className="text-sm text-gray-400 mb-3">{category.description}</p>
                <div className="flex flex-wrap gap-1">
                  {category.tools.slice(0, 3).map(tool => (
                    <span key={tool} className="text-xs px-2 py-1 bg-[var(--background)] rounded">
                      {tool}
                    </span>
                  ))}
                </div>
                {count > 0 && (
                  <div className="mt-3 text-xs text-[var(--brand-1)]">
                    {count} link{count > 1 ? 's' : ''} guardad{count > 1 ? 'os' : 'o'}s
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* All saved links */}
        {savedLinks.length > 0 && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-bold mb-4">Todos los links guardados ({savedLinks.length})</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {savedLinks.map(link => (
                <div key={link.id} className="flex items-center justify-between p-3 bg-[var(--background)] rounded-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{link.name}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">{link.url}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-3">
                    <button onClick={() => copyLink(link.url)} className="text-xs px-2 py-1 border border-[var(--border)] rounded hover:bg-white/5">
                      Copiar
                    </button>
                    <button onClick={() => editLink(link)} className="text-xs px-2 py-1 border border-[var(--border)] rounded hover:bg-white/5">
                      Editar
                    </button>
                    <button onClick={() => deleteLink(link.id)} className="text-xs px-2 py-1 border border-red-500 text-red-500 rounded hover:bg-red-500/10">
                      X
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render specific category
  const category = ACTION_CATEGORIES[activeCategory];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={closeCategory} className="p-2 hover:bg-white/10 rounded-lg">
          ← Volver
        </button>
        <div>
          <h1 className="text-2xl font-bold">
            {category.title}
          </h1>
          <p className="text-gray-400">{category.description}</p>
        </div>
      </div>

      {/* Tools info */}
      <div className="flex flex-wrap gap-2">
        {category.tools.map(tool => (
          <span key={tool} className="text-xs px-3 py-1 bg-[var(--brand-1)]/20 text-[var(--brand-1)] rounded-full">
            {tool}
          </span>
        ))}
      </div>

      {/* Form */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
        <div>
          <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">Nombre del link</label>
          <input
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`Ej: ${category.title} - Principal`}
          />
        </div>

        {activeCategory === "whatsapp" && (
          <>
            <div>
              <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">Teléfono (con prefijo)</label>
              <input
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={category.placeholder}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">Mensaje inicial</label>
              <input
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={category.messagePlaceholder}
              />
            </div>
          </>
        )}

        {activeCategory !== "whatsapp" && (
          <div>
            <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">URL de {category.title}</label>
            <input
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={category.placeholder}
            />
            <p className="text-xs text-gray-500 mt-1">Ej: {category.example}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button 
            onClick={generate} 
            className="rounded-lg bg-[var(--brand-4)] px-4 py-2 font-semibold text-black"
          >
            Generar link
          </button>
          
          {url && (
            <>
              <button
                onClick={() => copyLink(url)}
                className="rounded-lg border border-[var(--border)] px-4 py-2"
              >
                {copied ? "Copiado" : "Copiar"}
              </button>
              
              <button
                onClick={saveToDatabase}
                className="rounded-lg bg-[var(--brand-1)] px-4 py-2 font-semibold text-white"
              >
                {editingId ? "Actualizar" : "Guardar"}
              </button>
            </>
          )}
          
          {editingId && (
            <button
              onClick={resetForm}
              className="rounded-lg border border-red-500 text-red-500 px-4 py-2"
            >
              Cancelar
            </button>
          )}
        </div>

        {saved && (
          <div className="p-3 bg-green-500/20 text-green-500 rounded-lg text-sm">
            Link generado y listo para usar
          </div>
        )}
      </div>

      {/* Contenedor de opciones guardadas */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Opciones guardadas de {category.title}</h2>
          <span className="text-xs px-2 py-1 bg-[var(--brand-1)]/20 text-[var(--brand-1)] rounded">
            {filteredLinks.length} opción{filteredLinks.length !== 1 ? 'es' : ''}
          </span>
        </div>
        
        {filteredLinks.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No hay opciones guardadas todavía</p>
            <p className="text-sm mt-1">Genera y guarda una opción para verla aquí</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {filteredLinks.map(link => (
              <div key={link.id} className="flex items-center justify-between p-4 bg-[var(--background)] rounded-lg border border-[var(--border)]">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{link.name}</div>
                  <div className="text-xs text-gray-500 truncate">{link.url}</div>
                </div>
                <div className="flex gap-2 ml-3">
                  <button
                    onClick={() => useLink(link.url)}
                    className="text-xs px-3 py-1 bg-[var(--brand-4)] text-black rounded font-medium"
                  >
                    Usar
                  </button>
                  <button
                    onClick={() => editLink(link)}
                    className="text-xs px-2 py-1 border border-[var(--border)] rounded hover:bg-white/5"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deleteLink(link.id)}
                    className="text-xs px-2 py-1 border border-red-500 text-red-500 rounded hover:bg-red-500/10"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm">
        <strong className="text-yellow-500">Tip:</strong> Los links guardados se pueden usar en los generadores de Lead Magnet y Beneficios VIP en los botones CTA.
      </div>
    </div>
  );
}
