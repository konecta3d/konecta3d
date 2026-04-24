"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface ProductService {
  id: string;
  name: string;
  description: string;
  price: string;
  price_offer?: string;
  valid_from?: string;
  valid_until?: string;
  category: string;
  images: string[];
  features: { name: string; value: string }[];
  stock?: string;
  featured: boolean;
  sort_order: number;
  active: boolean;
}

async function getToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || "";
}

async function apiCall(url: string, method: string, token: string, body?: object) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export default function CatalogoPage() {
  const [businessId, setBusinessId] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ProductService[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Formulario
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [priceOffer, setPriceOffer] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [category, setCategory] = useState("Producto");
  const [images, setImages] = useState<string[]>([]);
  const [features, setFeatures] = useState<{ name: string; value: string }[]>([]);
  const [stock, setStock] = useState("");
  const [featured, setFeatured] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const CATEGORIES = ["Producto", "Servicio", "Paquete"];

  useEffect(() => {
    const load = async () => {
      const urlBusinessId = new URLSearchParams(window.location.search).get("businessId");
      let bid = urlBusinessId || "";
      if (!bid) {
        const { data: sessionData } = await supabase.auth.getSession();
        const userEmail = sessionData.session?.user?.email || "";
        if (userEmail) {
          const { data: biz } = await supabase.from("businesses").select("id").eq("contact_email", userEmail).single();
          bid = biz?.id || "";
        }
      }
      setBusinessId(bid);
      if (bid) loadData(bid);
      else setLoading(false);
    };
    load();
  }, []);

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  };

  const loadData = async (bid: string) => {
    const token = await getToken();
    const json = await apiCall(`/api/products-services?businessId=${bid}`, "GET", token);
    if (json.error) showMsg("Error al cargar: " + json.error);
    else setItems(json.data || []);
    setLoading(false);
  };

  const save = async () => {
    if (!businessId) return;
    if (!name.trim()) return alert("Nombre requerido");
    setSaving(true);
    setMessage("");

    const token = await getToken();
    const existing = editingId ? items.find(i => i.id === editingId) : null;
    const payload = {
      name, description,
      price, price_offer: priceOffer || null,
      valid_from: validFrom || null, valid_until: validUntil || null,
      category, images, features,
      stock: stock || null, featured,
      sort_order: existing?.sort_order ?? items.length,
      active: true,
    };

    const json = await apiCall("/api/products-services", "POST", token, {
      action: editingId ? "update" : "insert",
      businessId, payload, id: editingId,
    });

    setSaving(false);
    if (json.error) {
      showMsg("Error: " + json.error);
    } else {
      showMsg("Guardado correctamente");
      await loadData(businessId);
      resetForm();
    }
  };

  const resetForm = () => {
    setName(""); setDescription(""); setPrice(""); setPriceOffer("");
    setValidFrom(""); setValidUntil(""); setCategory("Producto");
    setImages([]); setFeatures([]); setStock(""); setFeatured(false); setEditingId(null);
  };

  const edit = (item: ProductService) => {
    setName(item.name); setDescription(item.description || "");
    setPrice(item.price || ""); setPriceOffer(item.price_offer || "");
    setValidFrom(item.valid_from || ""); setValidUntil(item.valid_until || "");
    setCategory(item.category || "Producto"); setImages(item.images || []);
    setFeatures(item.features || []); setStock(item.stock || "");
    setFeatured(item.featured || false); setEditingId(item.id);
  };

  const toggleActive = async (item: ProductService) => {
    const token = await getToken();
    await apiCall("/api/products-services", "POST", token, {
      action: "update", businessId, id: item.id, payload: { active: !item.active },
    });
    await loadData(businessId);
  };

  const toggleFeatured = async (item: ProductService) => {
    const token = await getToken();
    await apiCall("/api/products-services", "POST", token, {
      action: "update", businessId, id: item.id, payload: { featured: !item.featured },
    });
    await loadData(businessId);
  };

  const deleteItem = async (id: string) => {
    if (!confirm("¿Eliminar?")) return;
    const token = await getToken();
    await apiCall("/api/products-services", "POST", token, { action: "delete", businessId, id });
    await loadData(businessId);
  };

  const moveUp = async (item: ProductService, index: number) => {
    if (index === 0) return;
    const prev = items[index - 1];
    const token = await getToken();
    await Promise.all([
      apiCall("/api/products-services", "POST", token, { action: "update", businessId, id: item.id, payload: { sort_order: prev.sort_order } }),
      apiCall("/api/products-services", "POST", token, { action: "update", businessId, id: prev.id, payload: { sort_order: item.sort_order } }),
    ]);
    await loadData(businessId);
  };

  const moveDown = async (item: ProductService, index: number) => {
    if (index === items.length - 1) return;
    const next = items[index + 1];
    const token = await getToken();
    await Promise.all([
      apiCall("/api/products-services", "POST", token, { action: "update", businessId, id: item.id, payload: { sort_order: next.sort_order } }),
      apiCall("/api/products-services", "POST", token, { action: "update", businessId, id: next.id, payload: { sort_order: item.sort_order } }),
    ]);
    await loadData(businessId);
  };

  const addFeature = () => setFeatures([...features, { name: "", value: "" }]);
  const updateFeature = (i: number, field: "name" | "value", val: string) => {
    const updated = [...features]; updated[i][field] = val; setFeatures(updated);
  };
  const removeFeature = (i: number) => setFeatures(features.filter((_, idx) => idx !== i));

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !businessId) return;
    const form = new FormData();
    form.append("file", file);
    form.append("kind", "product");
    form.append("businessId", businessId);
    const token = await getToken();
    const res = await fetch("/api/landing/upload", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body: form,
    });
    if (res.ok) {
      const data = await res.json();
      if (data.url) setImages([...images, data.url]);
      else if (data.error) showMsg("Error subiendo imagen: " + data.error);
    } else {
      showMsg("Error al subir imagen");
    }
  };

  const removeImage = (i: number) => setImages(images.filter((_, idx) => idx !== i));

  if (loading) return <div className="p-8">Cargando...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Catálogo de Productos y Servicios</h1>
        <p className="text-sm text-[var(--brand-1)]">Gestiona tus productos y servicios</p>
      </div>

      {/* Formulario */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
        <div className="text-sm font-semibold">{editingId ? "Editar" : "Nuevo"} producto/servicio</div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">Nombre *</label>
            <input className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
              value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del producto o servicio" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">Categoría</label>
            <select className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
              value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">Descripción</label>
          <textarea className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
            rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción breve" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">Precio</label>
            <input className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
              value={price} onChange={(e) => setPrice(e.target.value)} placeholder="49,99€" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">Precio oferta</label>
            <input className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
              value={priceOffer} onChange={(e) => setPriceOffer(e.target.value)} placeholder="39,99€" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">Stock</label>
            <input className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
              value={stock} onChange={(e) => setStock(e.target.value)} placeholder="10 o 'consultar'" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">Válido desde</label>
            <input type="date" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
              value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">Válido hasta</label>
            <input type="date" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
              value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
          </div>
        </div>

        {/* Imágenes */}
        <div>
          <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">Imágenes</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {images.map((img, i) => (
              <div key={i} className="relative">
                <img src={img} alt="" className="h-20 w-20 object-cover rounded-lg" />
                <button onClick={() => removeImage(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs">&times;</button>
              </div>
            ))}
            <label className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-[var(--border)] cursor-pointer hover:border-[var(--brand-3)]">
              <span className="text-xs">+</span>
              <input type="file" accept="image/*" className="hidden" onChange={uploadImage} />
            </label>
          </div>
        </div>

        {/* Características */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">Características</label>
            <button type="button" onClick={addFeature} className="text-xs underline">+ Añadir</button>
          </div>
          <div className="mt-2 space-y-2">
            {features.map((f, i) => (
              <div key={i} className="flex gap-2">
                <input className="flex-1 rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
                  placeholder="Nombre" value={f.name} onChange={(e) => updateFeature(i, "name", e.target.value)} />
                <input className="flex-1 rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
                  placeholder="Valor" value={f.value} onChange={(e) => updateFeature(i, "value", e.target.value)} />
                <button onClick={() => removeFeature(i)} className="text-red-500">&times;</button>
              </div>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
          <span className="text-sm">Destacado</span>
        </label>

        <div className="flex items-center gap-4 pt-2">
          <button onClick={save} disabled={saving}
            className="rounded-lg bg-[var(--brand-4)] px-6 py-2 font-semibold text-black disabled:opacity-50">
            {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Añadir"}
          </button>
          {editingId && <button onClick={resetForm} className="text-sm underline">Cancelar</button>}
          {message && (
            <span className={`text-sm ${message.startsWith("Error") ? "text-red-400" : "text-green-500"}`}>
              {message}
            </span>
          )}
        </div>
      </div>

      {/* Listado */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
        <div className="text-sm font-semibold">Productos y servicios ({items.length})</div>
        {items.length === 0 && <div className="text-sm text-[var(--brand-1)]">No hay productos o servicios</div>}

        {items.map((item, index) => (
          <div key={item.id} className={`flex items-start justify-between rounded-lg border p-4 ${item.featured ? "border-[var(--brand-3)] bg-[var(--brand-3)]/5" : "border-[var(--border)]"}`}>
            <div className="flex gap-3">
              <div className="flex flex-col gap-1 mt-1">
                <button onClick={() => moveUp(item, index)} className="text-xs text-white hover:opacity-70">▲</button>
                <button onClick={() => moveDown(item, index)} className="text-xs text-white hover:opacity-70">▼</button>
              </div>
              {item.images?.[0] && <img src={item.images[0]} alt="" className="h-16 w-16 object-cover rounded-lg" />}
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${!item.active && "line-through opacity-50"}`}>{item.name}</span>
                  {item.featured && <span className="text-xs bg-[var(--brand-3)] text-white px-2 py-0.5 rounded">Destacado</span>}
                </div>
                {item.description && <div className="text-xs text-[var(--brand-1)] mt-1">{item.description}</div>}
                <div className="flex items-center gap-2 mt-1">
                  <span className="rounded bg-[var(--brand-3)] px-2 py-0.5 text-xs text-white">{item.category}</span>
                  {item.price && <span className={`font-semibold text-sm ${item.price_offer && "line-through opacity-50"}`}>{item.price}</span>}
                  {item.price_offer && <span className="font-semibold text-sm text-green-500">{item.price_offer}</span>}
                </div>
                {item.features?.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {item.features.map((f, i) => (
                      <span key={i} className="text-xs bg-white/10 px-2 py-0.5 rounded">{f.name}: {f.value}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1 text-xs shrink-0">
              <button onClick={() => edit(item)} className="underline">Editar</button>
              <button onClick={() => toggleFeatured(item)} className="underline">{item.featured ? "Quitar destacado" : "Destacar"}</button>
              <button onClick={() => toggleActive(item)} className="underline">{item.active ? "Desactivar" : "Activar"}</button>
              <button onClick={() => deleteItem(item.id)} className="text-red-500">Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
