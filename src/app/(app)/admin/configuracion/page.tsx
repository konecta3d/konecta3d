"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Business = {
  id: string;
  name: string;
  sector: string | null;
  module_vip_benefits: boolean;
  module_lead_magnet: boolean;
  module_whatsapp: boolean;
  created_at: string;
  slug: string | null;
  contact_email: string | null;
  phone: string | null;
  public_id: string | null;
};

// Helper function removed. We will use useSearchParams instead

function AdminConfigContent() {
  const [tab, setTab] = useState("negocios");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");
  const [customNames, setCustomNames] = useState<Record<string, string>>({});

  // Modal crear negocio
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newBusiness, setNewBusiness] = useState({
    name: "",
    email: "",
    phone: "",
    sector: "",
    module_vip_benefits: true,
    module_lead_magnet: true,
    module_whatsapp: true,
  });

// Modal editar negocio
const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
const [showEditModal, setShowEditModal] = useState(false);

// Modal reset password
const [resetPasswordBusiness, setResetPasswordBusiness] = useState<Business | null>(null);
const [showResetModal, setShowResetModal] = useState(false);
const [newPassword, setNewPassword] = useState("");
const [showResetPassword, setShowResetPassword] = useState(false);
const [copiedResetMsg, setCopiedResetMsg] = useState("");
const [resetting, setResetting] = useState(false);

const searchParams = useSearchParams();
const rawTab = searchParams.get("tab");
const validTabs = ["dashboard", "negocios", "modulos", "configuracion", "actividad", "personalizacion"];

  useEffect(() => {
    setTab(validTabs.includes(rawTab || "") ? (rawTab || "negocios") : "negocios");
  }, [rawTab]);

  useEffect(() => {
    loadBusinesses();
    loadActivity();
    loadCustomNames();
  }, []);

  const loadBusinesses = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .order("created_at", { ascending: false });
    setBusinesses(data || []);
    setLoading(false);
  };

  const loadActivity = async () => {
    const { data } = await supabase
      .from("activity_logs")
      .select("*, businesses(name)")
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      setActivity(data.map(d => ({
        ...d,
        business_name: d.businesses?.name
      })));
    }
  };

  const loadCustomNames = () => {
    const saved = localStorage.getItem("konecta-sidebar-names");
    if (saved) setCustomNames(JSON.parse(saved));
  };

  const saveCustomName = (key: string, value: string) => {
    const updated = { ...customNames, [key]: value };
    setCustomNames(updated);
    localStorage.setItem("konecta-sidebar-names", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("konecta-sidebar-names-update", { detail: updated }));
    setMsg("Actualizado");
    setTimeout(() => setMsg(""), 2000);
  };

  // Crear negocio con usuario en Auth
  const createBusiness = async () => {
    if (!newBusiness.name.trim() || !newBusiness.email.trim()) {
      setMsg("Nombre y email son obligatorios");
      return;
    }

    setCreating(true);
    setMsg("Creando...");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      const res = await fetch("/api/admin/create-business", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(newBusiness),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.error || "Error al crear");
      } else {
        setMsg(data.message || "Negocio creado");
        setShowModal(false);
        setNewBusiness({
          name: "",
          email: "",
          phone: "",
          sector: "",
          module_vip_benefits: true,
          module_lead_magnet: true,
          module_whatsapp: true,
        });
        loadBusinesses();
      }
    } catch (err) {
      setMsg("Error de conexión");
    }

    setCreating(false);
    setTimeout(() => setMsg(""), 4000);
  };

// Reset password
const resetPassword = async () => {
  if (!resetPasswordBusiness?.contact_email || !newPassword) return;
  setResetting(true);
  setMsg("Reseteando...");

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token || "";

    const res = await fetch("/api/admin/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
body: JSON.stringify({
  email: resetPasswordBusiness.contact_email,
  businessId: resetPasswordBusiness.id,
  newPassword,
}),
    });

    const data = await res.json();

    if (!res.ok) {
      setMsg(data.error || "Error al resetear");
    } else {
      setMsg(data.isNewUser ? "Usuario creado con password" : "Password actualizado");

      // Actualiza el negocio en memoria (para que no vuelva a mostrar el DNI)
      setBusinesses((prev) =>
        prev.map((b) => b.id === resetPasswordBusiness.id ? { ...b } : b)
      );

      setShowResetModal(false);
      setNewPassword("");
    }
  } catch (err) {
    setMsg("Error de conexión");
  }

  setResetting(false);
  setTimeout(() => setMsg(""), 4000);
};
  // Actualizar negocio
  const updateBusiness = async () => {
    if (!editingBusiness) return;

    const { error } = await supabase
      .from("businesses")
      .update({
        name: editingBusiness.name,
        sector: editingBusiness.sector,
        phone: editingBusiness.phone,
        contact_email: editingBusiness.contact_email,
        module_vip_benefits: editingBusiness.module_vip_benefits,
        module_lead_magnet: editingBusiness.module_lead_magnet,
        module_whatsapp: editingBusiness.module_whatsapp,
      })
      .eq("id", editingBusiness.id);

    if (error) {
      setMsg("Error: " + error.message);
    } else {
      setMsg("Negocio actualizado");
      setShowEditModal(false);
      loadBusinesses();
    }
    setTimeout(() => setMsg(""), 3000);
  };

  // Eliminar negocio
  const deleteBusiness = async (id: string) => {
    if (!confirm("¿Eliminar este negocio?")) return;

    const { error } = await supabase.from("businesses").delete().eq("id", id);

    if (error) {
      setMsg("Error: " + error.message);
    } else {
      setMsg("Negocio eliminado");
      loadBusinesses();
    }
    setTimeout(() => setMsg(""), 3000);
  };

  // Toggle módulo
  const toggleModule = async (id: string, module: string, value: boolean) => {
    await supabase
      .from("businesses")
      .update({ [module]: value })
      .eq("id", id);

    setBusinesses(businesses.map(b => b.id === id ? { ...b, [module]: value } : b));
  };

  const filtered = businesses.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

  // Tema admin (independiente del negocio)
  const [adminDarkMode, setAdminDarkMode] = useState(true);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("konecta-theme-admin") : null;
    const isDark = saved ? saved === "dark" : true;
    setAdminDarkMode(isDark);
  }, []);

  const toggleAdminTheme = () => {
    const next = !adminDarkMode;
    setAdminDarkMode(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("konecta-theme-admin", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("konecta-theme-admin", "light");
    }
  };

  const openBusinessAsClient = (b: Business) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("konecta-business-id", b.id);
    localStorage.setItem("konecta-role", "business");
    // Marcamos que este acceso al negocio viene desde el panel admin
    localStorage.setItem("konecta-from-admin-business", "true");
    window.location.href = "/business/dashboard?from=admin";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">
          {tab === "negocios" && "Gestión de Negocios"}
          {tab === "actividad" && "Registro de Actividad"}
          {tab === "dashboard" && "Panel de Control"}
          {tab === "modulos" && "Gestión de Módulos"}
          {tab === "configuracion" && "Configuración"}
          {tab === "personalizacion" && "Personalización"}
        </h1>
        <div className="flex items-center gap-3">
          {msg && (
            <div className={`text-sm px-3 py-1 rounded ${msg.includes("Error") || msg.includes("error") ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
              {msg}
            </div>
          )}
          {tab === "negocios" && (
            <button
              type="button"
              onClick={toggleAdminTheme}
              className="px-3 py-1 rounded-lg border border-[var(--border)] text-xs hover:bg-white/5"
            >
              {adminDarkMode ? "Modo claro" : "Modo oscuro"}
            </button>
          )}
        </div>
      </div>

      {/* TAB: NEGOCIOS */}
      {tab === "negocios" && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <input
              type="text"
              placeholder="Buscar negocios..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-md rounded-lg border border-[var(--border)] bg-transparent px-4 py-2"
            />
            <button onClick={() => setShowModal(true)} className="px-4 py-2 rounded-lg bg-[var(--brand-4)] text-black font-medium hover:opacity-90">
              + Nuevo Negocio
            </button>
          </div>

          {/* Grid de tarjetas */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No hay negocios</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((b) => (
                <div key={b.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                  <div className="flex items-start justify-between mb-3">
<button
  type="button"
  onClick={() => window.open(`/business/select-profile?businessId=${b.id}&fromAdmin=1`, "_blank")}
  className="w-12 h-12 rounded-lg bg-[var(--brand-1)] flex items-center justify-center text-xl font-bold text-black hover:opacity-80 transition-opacity"
  title="Abrir selector de perfil"
>
  {b.name.charAt(0).toUpperCase()}
</button>
                    <div className="flex gap-1">
                      <button
  onClick={() => {
    setResetPasswordBusiness(b);
    setNewPassword("");
    setShowResetPassword(false);
    setCopiedResetMsg("");
    setShowResetModal(true);
  }}
  className="text-xs px-2 py-1 rounded border border-[var(--brand-4)] text-[var(--brand-4)] hover:bg-[var(--brand-4)]/10"
  title="Cambiar contraseña"
>
  Reset
</button>
<button
  onClick={() => {
    setEditingBusiness(b);
    setShowEditModal(true);
  }}
  className="text-xs px-2 py-1 rounded border border-[var(--border)] hover:bg-white/5"
  title="Editar"
>
  Editar
</button>
<button
  onClick={() => deleteBusiness(b.id)}
  className="text-xs px-2 py-1 rounded border border-red-500/50 text-red-500 hover:bg-red-500/10"
  title="Eliminar"
>
  Eliminar
</button>
                    </div>
                  </div>

                  <h3 className="font-semibold mb-1">{b.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{b.sector || "Sin sector"}</p>
                  <p className="text-xs text-gray-400 mb-3">{b.contact_email}</p>

                  <div className="text-xs bg-[var(--background)] px-2 py-1 rounded mb-3 font-mono">
                    ID: {b.public_id || "Sin ID"}
                  </div>

                  {/* Módulos */}
                  <div className="flex gap-1 mb-2">
                    <button onClick={() => toggleModule(b.id, "module_lead_magnet", !b.module_lead_magnet)} className={`text-xs px-2 py-0.5 rounded ${b.module_lead_magnet ? "bg-green-500/20 text-green-500" : "bg-gray-500/20 text-gray-500"}`}>
                      LM {b.module_lead_magnet ? "✓" : "✕"}
                    </button>
                    <button onClick={() => toggleModule(b.id, "module_vip_benefits", !b.module_vip_benefits)} className={`text-xs px-2 py-0.5 rounded ${b.module_vip_benefits ? "bg-blue-500/20 text-blue-500" : "bg-gray-500/20 text-gray-500"}`}>
                      VIP {b.module_vip_benefits ? "✓" : "✕"}
                    </button>
                    <button onClick={() => toggleModule(b.id, "module_whatsapp", !b.module_whatsapp)} className={`text-xs px-2 py-0.5 rounded ${b.module_whatsapp ? "bg-purple-500/20 text-purple-500" : "bg-gray-500/20 text-gray-500"}`}>
                      WA {b.module_whatsapp ? "✓" : "✕"}
                    </button>
                  </div>

                  <p className="text-xs text-gray-500">
                    {new Date(b.created_at).toLocaleDateString("es-ES")}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Modal: Crear Negocio */}
          {showModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                  <h3 className="text-lg font-semibold">Nuevo Negocio</h3>
                  <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white">✕</button>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="text-xs uppercase tracking-wide text-[var(--brand-4)] block mb-2">Nombre *</label>
                    <input
                      type="text"
                      value={newBusiness.name}
                      onChange={(e) => setNewBusiness({ ...newBusiness, name: e.target.value })}
                      placeholder="Nombre del negocio"
                      className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-[var(--brand-4)] block mb-2">Email *</label>
                    <input
                      type="email"
                      value={newBusiness.email}
                      onChange={(e) => setNewBusiness({ ...newBusiness, email: e.target.value })}
                      placeholder="email@ejemplo.com"
                      className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-[var(--brand-4)] block mb-2">Teléfono</label>
                    <input
                      type="tel"
                      value={newBusiness.phone}
                      onChange={(e) => setNewBusiness({ ...newBusiness, phone: e.target.value })}
                      placeholder="+34 600 000 000"
                      className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-[var(--brand-4)] block mb-2">Sector</label>
                    <input
                      type="text"
                      value={newBusiness.sector}
                      onChange={(e) => setNewBusiness({ ...newBusiness, sector: e.target.value })}
                      placeholder="Salud, Restaurante, etc."
                      className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
                    />
                  </div>

                  <div className="border-t border-[var(--border)] pt-4">
                    <p className="text-xs text-gray-400 mb-3">Módulos activos</p>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={newBusiness.module_lead_magnet} onChange={(e) => setNewBusiness({ ...newBusiness, module_lead_magnet: e.target.checked })} />
                        <span className="text-sm">Lead Magnet</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={newBusiness.module_vip_benefits} onChange={(e) => setNewBusiness({ ...newBusiness, module_vip_benefits: e.target.checked })} />
                        <span className="text-sm">VIP</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={newBusiness.module_whatsapp} onChange={(e) => setNewBusiness({ ...newBusiness, module_whatsapp: e.target.checked })} />
                        <span className="text-sm">WA</span>
                      </label>
                    </div>
                  </div>

                  <button onClick={createBusiness} disabled={creating} className="w-full py-3 rounded-lg bg-[var(--brand-4)] text-black font-medium hover:opacity-90 disabled:opacity-50">
                    {creating ? "Creando..." : "Crear Negocio"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal: Editar Negocio */}
          {showEditModal && editingBusiness && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                  <h3 className="text-lg font-semibold">Editar Negocio</h3>
                  <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-white">✕</button>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="text-xs uppercase tracking-wide text-[var(--brand-4)] block mb-2">Nombre</label>
                    <input
                      type="text"
                      value={editingBusiness.name}
                      onChange={(e) => setEditingBusiness({ ...editingBusiness, name: e.target.value })}
                      className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-[var(--brand-4)] block mb-2">Email</label>
                    <input
                      type="email"
                      value={editingBusiness.contact_email || ""}
                      onChange={(e) => setEditingBusiness({ ...editingBusiness, contact_email: e.target.value })}
                      className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-[var(--brand-4)] block mb-2">Teléfono</label>
                    <input
                      type="tel"
                      value={editingBusiness.phone || ""}
                      onChange={(e) => setEditingBusiness({ ...editingBusiness, phone: e.target.value })}
                      className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-[var(--brand-4)] block mb-2">Sector</label>
                    <input
                      type="text"
                      value={editingBusiness.sector || ""}
                      onChange={(e) => setEditingBusiness({ ...editingBusiness, sector: e.target.value })}
                      className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
                    />
                  </div>

                  <div className="flex gap-4 pt-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={editingBusiness.module_lead_magnet} onChange={(e) => setEditingBusiness({ ...editingBusiness, module_lead_magnet: e.target.checked })} />
                      <span className="text-sm">LM</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={editingBusiness.module_vip_benefits} onChange={(e) => setEditingBusiness({ ...editingBusiness, module_vip_benefits: e.target.checked })} />
                      <span className="text-sm">VIP</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={editingBusiness.module_whatsapp} onChange={(e) => setEditingBusiness({ ...editingBusiness, module_whatsapp: e.target.checked })} />
                      <span className="text-sm">WA</span>
                    </label>
                  </div>

                  <button onClick={updateBusiness} className="w-full py-3 rounded-lg bg-[var(--brand-4)] text-black font-medium hover:opacity-90">
                    Guardar Cambios
                  </button>
                </div>
              </div>
</div>
          )}

          {/* Modal: Reset Password */}
          {showResetModal && resetPasswordBusiness && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                  <h3 className="text-lg font-semibold">Cambiar Contraseña</h3>
                  <button onClick={() => setShowResetModal(false)} className="text-gray-500 hover:text-white">✕</button>
                </div>
                <div className="p-4 space-y-4">
                  <div className="text-sm text-gray-400">
                    <p>Negocio: <span className="text-white">{resetPasswordBusiness.name}</span></p>
                    <p>Email: <span className="text-white">{resetPasswordBusiness.contact_email}</span></p>
                  </div>

<div>
  <label className="text-xs uppercase tracking-wide text-[var(--brand-4)] block mb-2">Nueva Contraseña</label>
  <div className="flex items-center gap-2">
    <input
      type={showResetPassword ? "text" : "password"}
      value={newPassword}
      onChange={(e) => setNewPassword(e.target.value)}
      placeholder="Mínimo 6 caracteres"
      className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
    />
    <button
      type="button"
      onClick={() => setShowResetPassword((v) => !v)}
      className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm"
    >
      {showResetPassword ? "Ocultar" : "Ver"}
    </button>
    <button
      type="button"
      onClick={() => {
        if (!newPassword) return;
        navigator.clipboard.writeText(newPassword);
        setCopiedResetMsg("Copiada");
        setTimeout(() => setCopiedResetMsg(""), 1500);
      }}
      className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm"
    >
      Copiar
    </button>
    <button
      type="button"
      onClick={() => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
        let pwd = "";
        for (let i = 0; i < 8; i++) {
          pwd += chars[Math.floor(Math.random() * chars.length)];
        }
        setNewPassword(pwd);
      }}
      className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm"
    >
      Generar
    </button>
  </div>
  {copiedResetMsg && <div className="text-xs text-green-500 mt-1">{copiedResetMsg}</div>}
</div>

                  <button
                    onClick={resetPassword}
                    disabled={resetting || newPassword.length < 6}
                    className="w-full py-3 rounded-lg bg-[var(--brand-4)] text-black font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    {resetting ? "Guardando..." : "Guardar Contraseña"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB: ACTIVIDAD */}
      {tab === "actividad" && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <h2 className="text-lg font-semibold mb-4">Registro de Actividad Reciente</h2>

          {activity.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No hay actividad registrada</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-400 uppercase bg-[var(--background)]">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Fecha</th>
                    <th className="px-4 py-3">Negocio</th>
                    <th className="px-4 py-3">Acción</th>
                    <th className="px-4 py-3">Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.map((log) => (
                    <tr key={log.id} className="border-b border-[var(--border)] hover:bg-white/5 last:border-0">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-400">
                        {new Date(log.created_at).toLocaleString("es-ES")}
                      </td>
                      <td className="px-4 py-3">{log.business_name || "Sistema"}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-white/10 rounded">{log.action}</span>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate text-gray-400">
                        {log.details ? JSON.stringify(log.details) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TABS VACIOS (PLACEHOLDERS) */}
      {(["dashboard", "modulos", "configuracion", "personalizacion"].includes(tab)) && (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-12 text-center text-gray-500 flex flex-col items-center">
          <div className="text-4xl mb-4">🚧</div>
          <h3 className="text-lg font-medium text-white mb-2">Módulo en Construcción</h3>
          <p className="max-w-md">Esta sección ({tab}) se encuentra actualmente en desarrollo y sus opciones estarán disponibles muy pronto.</p>
        </div>
      )}
    </div>
  );
}

export default function AdminConfigWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Cargando Preferencias...</div>}>
      <AdminConfigContent />
    </Suspense>
  );
}
