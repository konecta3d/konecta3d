"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  tags: string[];
  active: boolean;
  created_at: string;
}

interface Benefit {
  id: string;
  title: string;
  value: string;
}

export default function ClientesPage() {
  const [businessId, setBusinessId] = useState("");
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  
  // Formulario cliente
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Asignar beneficios
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [assignedBenefits, setAssignedBenefits] = useState<string[]>([]);

  const TAG_OPTIONS = ["VIP", "Nuevo", "Frecuente", "Pendiente", "Lead"];

  useEffect(() => {
    const bid = new URLSearchParams(window.location.search).get("businessId") 
      || localStorage.getItem("konecta-business-id") 
      || "";
    setBusinessId(bid);
    if (bid) {
      loadClients(bid);
      loadBenefits(bid);
    } else {
      setLoading(false);
    }
  }, []);

  const loadClients = async (bid: string) => {
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("business_id", bid)
      .order("created_at", { ascending: false });
    setClients(data || []);
    setLoading(false);
  };

  const loadBenefits = async (bid: string) => {
    const { data } = await supabase
      .from("benefits")
      .select("id, title, value")
      .eq("business_id", bid)
      .eq("active", true);
    setBenefits(data || []);
  };

  const saveClient = async () => {
    console.log("Guardando cliente...", { businessId, name, phone, email, notes, tags });
    if (!businessId) {
      alert("Falta businessId. Recarga la página.");
      return;
    }
    if (!name.trim()) return alert("Nombre requerido");
    
    setSaving(true);
    setMessage("");

    const payload = {
      business_id: businessId,
      name,
      phone,
      email,
      notes,
      tags,
      active: true,
    };

    let error = null;
    if (editingId) {
      const result = await supabase.from("clients").update(payload).eq("id", editingId);
      error = result.error;
    } else {
      const result = await supabase.from("clients").insert(payload);
      error = result.error;
    }

    setSaving(false);
    if (error) {
      console.error("Error guardando cliente:", error);
      setMessage("Error: " + error.message);
    } else {
      setMessage("Guardado correctamente");
      loadClients(businessId);
      resetForm();
    }
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setNotes("");
    setTags([]);
    setEditingId(null);
  };

  const editClient = (client: Client) => {
    setName(client.name);
    setPhone(client.phone || "");
    setEmail(client.email || "");
    setNotes(client.notes || "");
    setTags(client.tags || []);
    setEditingId(client.id);
  };

  const toggleActive = async (client: Client) => {
    await supabase.from("clients").update({ active: !client.active }).eq("id", client.id);
    loadClients(businessId);
  };

  const deleteClient = async (id: string) => {
    if (!confirm("¿Eliminar cliente?")) return;
    await supabase.from("clients").delete().eq("id", id);
    loadClients(businessId);
  };

  const openBenefitsModal = (clientId: string) => {
    setSelectedClientId(clientId);
    loadAssignedBenefits(clientId);
    setShowBenefitsModal(true);
  };

  const loadAssignedBenefits = async (clientId: string) => {
    const { data } = await supabase
      .from("client_benefits")
      .select("benefit_id")
      .eq("client_id", clientId);
    setAssignedBenefits(data?.map(d => d.benefit_id) || []);
  };

  const toggleBenefit = async (benefitId: string) => {
    if (!selectedClientId) return;
    
    const exists = assignedBenefits.includes(benefitId);
    if (exists) {
      await supabase
        .from("client_benefits")
        .delete()
        .eq("client_id", selectedClientId)
        .eq("benefit_id", benefitId);
    } else {
      await supabase
        .from("client_benefits")
        .insert({ client_id: selectedClientId, benefit_id: benefitId });
    }
    loadAssignedBenefits(selectedClientId);
  };

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  if (loading) return <div className="p-8">Cargando...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <p className="text-sm text-[var(--brand-1)]">Gestiona tus clientes y asígnales beneficios</p>
      </div>

      {/* Formulario */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
        <div className="text-sm font-semibold">{editingId ? "Editar cliente" : "Nuevo cliente"}</div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">Nombre *</label>
            <input
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del cliente"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">Teléfono</label>
            <input
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+34 600 000 000"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">Email</label>
            <input
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@ejemplo.com"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">Tags</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {TAG_OPTIONS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full px-3 py-1 text-xs ${
                    tags.includes(tag) 
                      ? "bg-[var(--brand-3)] text-white" 
                      : "border border-[var(--border)]"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">Notas privadas</label>
          <textarea
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas internas sobre el cliente..."
          />
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={saveClient}
            disabled={saving}
            className="rounded-lg bg-[var(--brand-4)] px-6 py-2 font-semibold text-black"
          >
            {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Añadir cliente"}
          </button>
          {editingId && (
            <button onClick={resetForm} className="text-sm underline">Cancelar</button>
          )}
          {message && <span className="text-sm text-green-500">{message}</span>}
        </div>
      </div>

      {/* Listado */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
        <div className="text-sm font-semibold">Clientes ({clients.length})</div>
        
        {clients.length === 0 && (
          <div className="text-sm text-[var(--brand-1)]">No hay clientes todavía</div>
        )}

        {clients.map((client) => (
          <div key={client.id} className="flex items-start justify-between rounded-lg border border-[var(--border)] p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${!client.active && "text-gray-400 line-through"}`}>
                  {client.name}
                </span>
                {client.tags?.map(tag => (
                  <span key={tag} className="rounded-full bg-[var(--brand-3)] px-2 py-0.5 text-xs text-white">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-1 text-xs text-[var(--brand-1)]">
                {client.phone && <span>{client.phone}</span>}
                {client.phone && client.email && <span> · </span>}
                {client.email && <span>{client.email}</span>}
              </div>
              {client.notes && (
                <div className="mt-1 text-xs text-gray-500 italic">{client.notes}</div>
              )}
              <div className="mt-1 text-xs text-gray-400">
                Registrado: {new Date(client.created_at).toLocaleDateString("es-ES")}
              </div>
            </div>
            <div className="flex flex-col gap-1 text-xs">
              <button onClick={() => editClient(client)} className="underline">Editar</button>
              <button onClick={() => openBenefitsModal(client.id)} className="underline text-[var(--brand-3)]">
                Asignar beneficios
              </button>
              <button onClick={() => toggleActive(client)} className="underline">
                {client.active ? "Desactivar" : "Activar"}
              </button>
              <button onClick={() => deleteClient(client.id)} className="text-red-500">Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal beneficios */}
      {showBenefitsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-[var(--card)] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Asignar beneficios</h3>
              <button onClick={() => setShowBenefitsModal(false)} className="text-2xl">&times;</button>
            </div>
            
            {benefits.length === 0 ? (
              <div className="text-sm text-[var(--brand-1)]">
                No hay beneficios disponibles. Crea beneficios primero en "Generador Beneficios VIP".
              </div>
            ) : (
              <div className="space-y-2">
                {benefits.map(benefit => (
                  <label key={benefit.id} className="flex items-center gap-3 rounded-lg border border-[var(--border)] p-3">
                    <input
                      type="checkbox"
                      checked={assignedBenefits.includes(benefit.id)}
                      onChange={() => toggleBenefit(benefit.id)}
                    />
                    <div>
                      <div className="font-semibold">{benefit.title}</div>
                      {benefit.value && <div className="text-xs text-[var(--brand-1)]">{benefit.value}</div>}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
