"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type Business = {
  id: string;
  name: string;
  sector: string | null;
  slug: string | null;
  contact_email: string | null;
  phone: string | null;
  font_family: string | null;
  module_vip_benefits: boolean;
  module_lead_magnet: boolean;
  module_whatsapp: boolean;
  multi_landing_enabled: boolean;
};

export default function BusinessDetail() {
  const params = useParams();
  const id = params?.id as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    sector: "",
    slug: "",
    contact_email: "",
    phone: "",
    font_family: ""
  });
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", id)
        .single();
      if (data) {
        setBusiness(data);
      }
    };
    load();
  }, [id]);

  const updateModule = async (module: string, value: boolean) => {
    if (!business) return;
    const { error } = await supabase
      .from("businesses")
      .update({ [module]: value })
      .eq("id", id);

    if (!error) {
      setBusiness({ ...business, [module]: value });
      setMsg(`${module} ${value ? "activado" : "desactivado"}`);
    } else {
      setMsg("Error al actualizar");
    }
    setTimeout(() => setMsg(null), 2000);
  };

  const toggleEditMode = () => {
    if (!editMode && business) {
      setEditData({
        name: business.name || "",
        sector: business.sector || "",
        slug: business.slug || "",
        contact_email: business.contact_email || "",
        phone: business.phone || "",
        font_family: business.font_family || ""
      });
    }
    setEditMode(!editMode);
  };

  const saveBusinessInfo = async () => {
    if (!business) return;
    const { error } = await supabase
      .from("businesses")
      .update({
        name: editData.name,
        sector: editData.sector || null,
        slug: editData.slug || null,
        contact_email: editData.contact_email || null,
        phone: editData.phone || null,
        font_family: editData.font_family || null
      })
      .eq("id", id);

    if (!error) {
      setBusiness({ ...business, ...editData });
      setEditMode(false);
      setMsg("Información actualizada");
    } else {
      setMsg("Error al guardar");
    }
    setTimeout(() => setMsg(null), 2000);
  };

  const handlePasswordReset = async () => {
    if (!newPassword || !business?.contact_email) return;
    setIsResetting(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: business.contact_email, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setMsg("Contraseña actualizada con éxito");
        setNewPassword("");
      } else {
        setMsg(data.error || "Error al actualizar la contraseña");
      }
    } catch (e) {
      setMsg("Error de red al actualizar contraseña");
    }
    setIsResetting(false);
    setTimeout(() => setMsg(null), 3000);
  };

  if (!business) {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  return (
    <div className="min-h-[70vh] rounded-xl border border-[var(--border)] bg-[var(--card)]">
      {/* Breadcrumb */}
      <div className="border-b border-[var(--border)] p-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <a className="text-[var(--brand-1)]" href="/admin/configuracion">← Admin</a>
          <span className="text-gray-500">/</span>
          <span className="text-gray-400">{business.name}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-[280px_1fr]">
        {/* SIDEBAR ADMIN */}
        <aside className="border-b border-[var(--border)] p-4 md:border-b-0 md:border-r bg-[var(--card)]">
          <div className="mb-6">
            <div className="text-xs uppercase tracking-wide text-[var(--brand-1)] mb-2">Negocio</div>
            <div className="font-semibold text-lg">{business.name}</div>
            <div className="text-xs text-gray-500">{business.sector || "Sin sector"}</div>
          </div>

          <nav className="space-y-1 text-sm">
            {/* INFO BÁSICA */}
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wide text-[var(--brand-1)] mt-4 mb-2">Información</div>
              <button onClick={toggleEditMode} className="text-xs text-[var(--brand-3)] hover:underline">
                {editMode ? "Cerrar" : "Editar"}
              </button>
            </div>
            <div className="px-2 py-1 text-xs text-gray-500">
              <div>Slug: {business.slug || "—"}</div>
              <div>Email: {business.contact_email || "—"}</div>
              <div>Teléfono: {business.phone || "—"}</div>
              <div>Fuente: {business.font_family || "—"}</div>
            </div>

            {/* MÓDULOS */}
            <div className="text-xs uppercase tracking-wide text-[var(--brand-1)] mt-4 mb-2">Módulos</div>
            <label className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-white/5">
              <input
                type="checkbox"
                checked={business.module_lead_magnet}
                onChange={(e) => updateModule("module_lead_magnet", e.target.checked)}
                className="accent-green-500"
              />
              <span className={business.module_lead_magnet ? "" : "opacity-50"}>Lead Magnet</span>
            </label>
            <label className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-white/5">
              <input
                type="checkbox"
                checked={business.module_vip_benefits}
                onChange={(e) => updateModule("module_vip_benefits", e.target.checked)}
                className="accent-blue-500"
              />
              <span className={business.module_vip_benefits ? "" : "opacity-50"}>VIP Beneficios</span>
            </label>
            <label className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-white/5">
              <input
                type="checkbox"
                checked={business.module_whatsapp}
                onChange={(e) => updateModule("module_whatsapp", e.target.checked)}
                className="accent-purple-500"
              />
              <span className={business.module_whatsapp ? "" : "opacity-50"}>WhatsApp</span>
            </label>

            {/* VER COMO NEGOCIO */}
            <div className="text-xs uppercase tracking-wide text-[var(--brand-1)] mt-6 mb-2">Ver como el negocio</div>
            <a
              href={`/dashboard?businessId=${id}`}
              target="_blank"
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 text-[var(--brand-1)]"
            >
              <span>📊</span> Dashboard
            </a>
            <a
              href={`/landing/new?businessId=${id}`}
              target="_blank"
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5"
            >
              <span>🎨</span> Landing
            </a>
            {business.module_lead_magnet && (
              <a
                href={`/lead-magnet/new?businessId=${id}`}
                target="_blank"
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5"
              >
                <span>📄</span> Lead Magnet
              </a>
            )}
            {business.module_vip_benefits && (
              <a
                href={`/vip-benefits/new?businessId=${id}`}
                target="_blank"
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5"
              >
                <span>⭐</span> VIP Benefits
              </a>
            )}
            {business.module_whatsapp && (
              <a
                href={`/whatsapp-generator?businessId=${id}`}
                target="_blank"
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5"
              >
                <span>💬</span> WhatsApp
              </a>
            )}

            {/* LANDING PÚBLICA */}
            <div className="text-xs uppercase tracking-wide text-[var(--brand-1)] mt-6 mb-2">Landing Pública</div>
            <a
              href={business.slug ? `/l/${business.slug}/NFC` : "#"}
              target="_blank"
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 text-green-500"
            >
              <span>🌐</span> Ver landing
            </a>
          </nav>

          {msg && (
            <div className="mt-4 p-2 rounded bg-green-500/20 text-green-500 text-xs text-center">
              {msg}
            </div>
          )}
        </aside>

        {/* MAIN CONTENT - INFORMACIÓN DEL NEGOCIO */}
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold">{business.name}</h1>
            <button
              onClick={toggleEditMode}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border)] hover:bg-white/5"
            >
              {editMode ? "Cancelar" : "Editar"}
            </button>
          </div>

          {/* Formulario de edición */}
          {editMode ? (
            <div className="rounded-xl border border-[var(--border)] p-4 mb-6">
              <h2 className="text-sm font-semibold mb-4">Editar Información</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Sector</label>
                  <input
                    type="text"
                    value={editData.sector}
                    onChange={(e) => setEditData({ ...editData, sector: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Slug (URL)</label>
                  <input
                    type="text"
                    value={editData.slug}
                    onChange={(e) => setEditData({ ...editData, slug: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm"
                    placeholder="mi-negocio"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={editData.contact_email}
                    onChange={(e) => setEditData({ ...editData, contact_email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Fuente (Font)</label>
                  <input
                    type="text"
                    value={editData.font_family}
                    onChange={(e) => setEditData({ ...editData, font_family: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm"
                    placeholder="Inter, Roboto, etc."
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={saveBusinessInfo}
                  className="px-4 py-2 rounded-lg bg-[var(--brand-4)] text-black text-sm font-medium"
                >
                  Guardar Cambios
                </button>
                <button
                  onClick={toggleEditMode}
                  className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : null}

          <div className="grid md:grid-cols-2 gap-4">
            {/* Estado de módulos */}
            <div className="rounded-xl border border-[var(--border)] p-4">
              <h2 className="text-sm font-semibold mb-3">Estado de Módulos</h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Lead Magnet</span>
                  <span className={`text-xs px-2 py-1 rounded ${business.module_lead_magnet ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>
                    {business.module_lead_magnet ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">VIP Beneficios</span>
                  <span className={`text-xs px-2 py-1 rounded ${business.module_vip_benefits ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>
                    {business.module_vip_benefits ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">WhatsApp</span>
                  <span className={`text-xs px-2 py-1 rounded ${business.module_whatsapp ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>
                    {business.module_whatsapp ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
            </div>

            {/* Landing múltiple */}
            <div className="rounded-xl border border-[var(--border)] p-4">
              <h2 className="text-sm font-semibold mb-3">Configuración Landing</h2>
              <div className="flex justify-between items-center">
                <span className="text-sm">Landing Multiple</span>
                <span className={`text-xs px-2 py-1 rounded ${business.multi_landing_enabled ? "bg-green-500/20 text-green-500" : "bg-gray-500/20 text-gray-500"}`}>
                  {business.multi_landing_enabled ? "Activado" : "Desactivado"}
                </span>
              </div>
            </div>

            {/* Control de Contraseña */}
            <div className="rounded-xl border border-[var(--border)] p-4 col-span-1 md:col-span-2">
              <h2 className="text-sm font-semibold mb-3 text-red-400">Control de Acceso (Peligro)</h2>
              <div className="flex flex-col md:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-xs text-gray-400 mb-1">Nueva Contraseña para {business.contact_email || "usuario"}</label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm"
                    placeholder="Escribe la nueva clave..."
                  />
                </div>
                <button
                  onClick={handlePasswordReset}
                  disabled={isResetting || !newPassword || !business.contact_email}
                  className="px-4 py-2 w-full md:w-auto rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 text-sm font-medium hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                >
                  {isResetting ? "Actualizando..." : "Actualizar Contraseña"}
                </button>
              </div>
              {!business.contact_email && (
                <p className="text-xs text-red-400 mt-2">El negocio debe tener un Email guardado para poder operar su contraseña.</p>
              )}
            </div>
          </div>

          {/* ACCESOS RÁPIDOS */}
          <div className="mt-6">
            <h2 className="text-sm font-semibold mb-3">Accesos Rápidos</h2>
            <div className="grid md:grid-cols-3 gap-3">
              <a href={`/dashboard?businessId=${id}`} target="_blank" className="p-4 rounded-lg border border-[var(--border)] hover:bg-white/5 text-center">
                <div className="text-2xl mb-1">📊</div>
                <div className="text-sm">Dashboard</div>
              </a>
              <a href={`/landing/new?businessId=${id}`} target="_blank" className="p-4 rounded-lg border border-[var(--border)] hover:bg-white/5 text-center">
                <div className="text-2xl mb-1">🎨</div>
                <div className="text-sm">Generar Landing</div>
              </a>
              <a href={business.slug ? `/l/${business.slug}/NFC` : "#"} target="_blank" className="p-4 rounded-lg border border-[var(--border)] hover:bg-white/5 text-center">
                <div className="text-2xl mb-1">🌐</div>
                <div className="text-sm">Ver Landing</div>
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
