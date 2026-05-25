"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Settings = {
  email_from: string;
  email_name: string;
  notify_new_business: boolean;
  notify_new_leads: boolean;
  min_password_length: number;
  require_special_chars: boolean;
  force_password_change: boolean;
};

type Features = Record<string, boolean>;

const defaultSettings: Settings = {
  email_from: "noreply@konecta3d.com",
  email_name: "Konecta3D",
  notify_new_business: true,
  notify_new_leads: true,
  min_password_length: 6,
  require_special_chars: false,
  force_password_change: false,
};

const defaultFeatures: Features = {};

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [features, setFeatures] = useState<Features>(defaultFeatures);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [activeSection, setActiveSection] = useState("email");
  const [saving, setSaving] = useState(false);
  const [savingFeatures, setSavingFeatures] = useState(false);
  const [migrationResult, setMigrationResult] = useState<null | { results: Record<string, string>; hasMissing: boolean; sql?: string | null }>(null);
  const [migrationLoading, setMigrationLoading] = useState(false);

  // Banner de mantenimiento
  const [banner, setBanner] = useState<{ active: boolean; message: string }>({ active: false, message: "" });
  const [savingBanner, setSavingBanner] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "global")
        .single();

      if (data?.value) {
        const savedSettings = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        setSettings({ ...defaultSettings, ...savedSettings });
      }

      // Load features flag
      const { data: featuresData } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "features")
        .single();
      if (featuresData?.value) {
        const saved = typeof featuresData.value === 'string' ? JSON.parse(featuresData.value) : featuresData.value;
        setFeatures({ ...defaultFeatures, ...saved });
      }

      // Load maintenance banner
      const { data: bannerData } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "maintenance_banner")
        .single();
      if (bannerData?.value) {
        const saved = typeof bannerData.value === 'string' ? JSON.parse(bannerData.value) : bannerData.value;
        setBanner({ active: saved.active ?? false, message: saved.message ?? "" });
      }
    } catch (err) {
      console.error("Error cargando configuración:", err);
    }

    setLoading(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    setMsg("Guardando...");

    try {
      const { error } = await supabase
        .from("settings")
        .upsert({
          key: "global",
          value: JSON.stringify(settings),
          updated_at: new Date().toISOString(),
        }, { onConflict: "key" });

      if (error) {
        console.error("Supabase error:", error);
        setMsg("Error al guardar");
        setSaving(false);
        return;
      }

      setMsg("Configuración guardada");
    } catch (err) {
      console.error("Error guardando configuración:", err);
      setMsg("Error al guardar");
    }

    setSaving(false);
    setTimeout(() => setMsg(""), 3000);
  };

  const saveFeatures = async () => {
    setSavingFeatures(true);
    setMsg("Guardando funcionalidades...");
    try {
      await supabase
        .from("settings")
        .upsert(
          { key: "features", value: JSON.stringify(features), updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );
      setMsg("Funcionalidades guardadas");
    } catch (e) {
      setMsg("Error al guardar");
    }
    setSavingFeatures(false);
    setTimeout(() => setMsg(""), 3000);
  };

  const saveBanner = async () => {
    setSavingBanner(true);
    setMsg("Guardando aviso...");
    try {
      await supabase
        .from("settings")
        .upsert(
          { key: "maintenance_banner", value: JSON.stringify(banner), updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );
      setMsg(banner.active ? "✓ Aviso activado — los clientes ya lo ven" : "✓ Aviso desactivado");
    } catch {
      setMsg("Error al guardar el aviso");
    }
    setSavingBanner(false);
    setTimeout(() => setMsg(""), 4000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-4)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Configuración</h1>
        {msg && (
          <div className="text-sm px-3 py-1 rounded bg-green-500/20 text-green-400">
            {msg}
          </div>
        )}
      </div>

      {/* Storage Info */}
      <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-4">
        <p className="text-sm text-blue-400">
          La configuración se guarda en Supabase y se sincroniza automáticamente.
        </p>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-[var(--border)] pb-2">
        <button
          onClick={() => setActiveSection("email")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === "email" ? "bg-[var(--brand-4)] text-black" : "text-white hover:text-white"}`}
        >
          Email
        </button>
        <button
          onClick={() => setActiveSection("security")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === "security" ? "bg-[var(--brand-4)] text-black" : "text-white hover:text-white"}`}
        >
          Seguridad
        </button>
        <button
          onClick={() => setActiveSection("subscription")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === "subscription" ? "bg-[var(--brand-4)] text-black" : "text-white hover:text-white"}`}
        >
          Suscripciones
        </button>
        <button
          onClick={() => setActiveSection("database")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === "database" ? "bg-[var(--brand-4)] text-black" : "text-white hover:text-white"}`}
        >
          Base de datos
        </button>
        <button
          onClick={() => setActiveSection("features")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === "features" ? "bg-[var(--brand-4)] text-black" : "text-white hover:text-white"}`}
        >
          Funcionalidades
        </button>
        <button
          onClick={() => setActiveSection("avisos")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${activeSection === "avisos" ? "bg-[var(--brand-4)] text-black" : "text-white hover:text-white"}`}
        >
          Avisos
          {banner.active && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400" />
          )}
        </button>
      </div>

      {/* Email Section */}
      {activeSection === "email" && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Configuración de Email</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-[var(--brand-4)] block mb-2">Email remitente</label>
                <input
                  type="email"
                  value={settings.email_from}
                  onChange={(e) => setSettings({ ...settings, email_from: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-[var(--brand-4)] block mb-2">Nombre remitente</label>
                <input
                  type="text"
                  value={settings.email_name}
                  onChange={(e) => setSettings({ ...settings, email_name: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3">Notificaciones</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notify_new_business}
                  onChange={(e) => setSettings({ ...settings, notify_new_business: e.target.checked })}
                  className="w-4 h-4 accent-[var(--brand-4)]"
                />
                <span className="text-sm">Notificar cuando se crea un nuevo negocio</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notify_new_leads}
                  onChange={(e) => setSettings({ ...settings, notify_new_leads: e.target.checked })}
                  className="w-4 h-4 accent-[var(--brand-4)]"
                />
                <span className="text-sm">Notificar cuando se capturan nuevos leads</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Security Section */}
      {activeSection === "security" && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Políticas de Contraseña</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-[var(--brand-4)] block mb-2">
                  Longitud mínima de contraseña
                </label>
                <select
                  value={settings.min_password_length}
                  onChange={(e) => setSettings({ ...settings, min_password_length: parseInt(e.target.value) })}
                  className="w-full max-w-xs rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
                >
                  <option value={6}>6 caracteres</option>
                  <option value={8}>8 caracteres</option>
                  <option value={10}>10 caracteres</option>
                  <option value={12}>12 caracteres</option>
                </select>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.require_special_chars}
                  onChange={(e) => setSettings({ ...settings, require_special_chars: e.target.checked })}
                  className="w-4 h-4 accent-[var(--brand-4)]"
                />
                <span className="text-sm">Requerir mayúsculas, minúsculas y números</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.force_password_change}
                  onChange={(e) => setSettings({ ...settings, force_password_change: e.target.checked })}
                  className="w-4 h-4 accent-[var(--brand-4)]"
                />
                <span className="text-sm">Forzar cambio de contraseña cada 90 días</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Section */}
      {activeSection === "subscription" && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Planes de Suscripción</h2>
            <p className="text-sm text-white mb-4">
              Configura los límites para cada plan de suscripción. Esta funcionalidad estará disponible en futuras actualizaciones.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-[var(--border)] p-4">
              <h3 className="font-semibold mb-2">Gratis</h3>
              <ul className="text-sm text-white space-y-1">
                <li>1 negocio</li>
                <li>3 landings</li>
                <li>10 leads/mes</li>
                <li>Soporte básico</li>
              </ul>
            </div>
            <div className="rounded-lg border border-[var(--brand-4)] bg-[var(--brand-4)]/10 p-4">
              <h3 className="font-semibold mb-2">Básico</h3>
              <ul className="text-sm text-white space-y-1">
                <li>5 negocios</li>
                <li>Landings ilimitadas</li>
                <li>100 leads/mes</li>
                <li>Soporte prioritario</li>
              </ul>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-4">
              <h3 className="font-semibold mb-2">Pro</h3>
              <ul className="text-sm text-white space-y-1">
                <li>Negocios ilimitados</li>
                <li>Todo incluido</li>
                <li>Leads ilimitados</li>
                <li>Soporte 24/7</li>
              </ul>
            </div>
          </div>

          <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-4">
            <p className="text-sm text-yellow-500">
              Los planes de suscripción y el sistema de facturación se implementarán en futuras actualizaciones.
            </p>
          </div>
        </div>
      )}

      {/* Database Section */}
      {activeSection === "database" && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Diagnóstico de tablas</h2>
            <p className="text-sm text-white mb-4">
              Comprueba que todas las tablas necesarias existen en Supabase.
              Si falta alguna, se mostrará el SQL que debes ejecutar en el Editor SQL de Supabase.
            </p>
            <button
              onClick={async () => {
                setMigrationLoading(true);
                setMigrationResult(null);
                try {
                  const { data: { session } } = await supabase.auth.getSession();
                  const res = await fetch("/api/admin/run-migration", {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${session?.access_token || ""}` },
                  });
                  const json = await res.json();
                  setMigrationResult(json);
                } catch (e) {
                  alert("Error: " + String(e));
                }
                setMigrationLoading(false);
              }}
              disabled={migrationLoading}
              className="px-4 py-2 rounded-lg bg-[var(--brand-4)] text-black font-semibold disabled:opacity-50"
            >
              {migrationLoading ? "Comprobando..." : "Comprobar tablas"}
            </button>
          </div>

          {migrationResult && (
            <div className="space-y-4">
              <div className="grid gap-2">
                {Object.entries(migrationResult.results).map(([table, status]) => (
                  <div key={table} className="flex items-center gap-3 rounded-lg border border-[var(--border)] p-3">
                    <span className={`w-3 h-3 rounded-full flex-shrink-0 ${status === "OK" ? "bg-green-500" : "bg-red-500"}`} />
                    <span className="font-mono text-sm font-semibold">{table}</span>
                    <span className={`text-sm ${status === "OK" ? "text-green-400" : "text-red-400"}`}>{status}</span>
                  </div>
                ))}
              </div>

              {migrationResult.hasMissing && migrationResult.sql && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-yellow-400">
                    ⚠ Tablas faltantes detectadas. Copia el SQL de abajo y ejecútalo en
                    Supabase Dashboard → SQL Editor → New query.
                  </p>
                  <textarea
                    readOnly
                    className="w-full rounded-lg border border-[var(--border)] bg-black p-3 font-mono text-xs text-green-400"
                    rows={30}
                    value={migrationResult.sql}
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  />
                  <button
                    onClick={() => { navigator.clipboard.writeText(migrationResult.sql!); }}
                    className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm"
                  >
                    Copiar SQL al portapapeles
                  </button>
                </div>
              )}

              {!migrationResult.hasMissing && (
                <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-3 text-sm text-green-400">
                  ✓ Todas las tablas están presentes y accesibles.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Features Section */}
      {activeSection === "features" && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-1">Funcionalidades</h2>
            <p className="text-sm text-[var(--foreground)]/60 mb-4">
              Activa o desactiva funcionalidades para todos los negocios de la plataforma.
            </p>
          </div>

          <div className="rounded-lg border border-[var(--border)] border-dashed p-6 text-center">
            <p className="text-sm text-[var(--foreground)]/40">Próximamente — controles globales de funcionalidades</p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveFeatures}
              disabled={savingFeatures}
              className="px-6 py-3 rounded-lg bg-[var(--brand-4)] text-black font-medium hover:opacity-90 disabled:opacity-50"
            >
              {savingFeatures ? "Guardando..." : "Guardar Funcionalidades"}
            </button>
          </div>
        </div>
      )}

      {/* Avisos / Maintenance Banner Section */}
      {activeSection === "avisos" && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-1">Banner de aviso a clientes</h2>
            <p className="text-sm text-[var(--foreground)]/60">
              Cuando está activo, todos los clientes verán este mensaje en la parte superior de su panel al iniciar sesión.
              Úsalo antes de hacer cambios importantes para que puedan guardar su información.
            </p>
          </div>

          {/* Toggle activo */}
          <div className="rounded-lg border border-[var(--border)] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-medium text-sm">Estado del aviso</div>
                <div className="text-xs text-[var(--foreground)]/60 mt-1">
                  {banner.active ? "Los clientes ven el aviso ahora mismo" : "El aviso está desactivado — los clientes no lo ven"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBanner(b => ({ ...b, active: !b.active }))}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                  banner.active ? "bg-amber-500" : "bg-[var(--border)]"
                }`}
                role="switch"
                aria-checked={banner.active}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${banner.active ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
            <div className="mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${banner.active ? "bg-amber-500/15 text-amber-400" : "bg-[var(--border)]/40 text-[var(--foreground)]/40"}`}>
                {banner.active ? "⚠ Activo — visible para clientes" : "Inactivo"}
              </span>
            </div>
          </div>

          {/* Mensaje */}
          <div>
            <label className="text-xs uppercase tracking-wide text-[var(--brand-4)] block mb-2">Mensaje del aviso</label>
            <textarea
              rows={3}
              value={banner.message}
              onChange={e => setBanner(b => ({ ...b, message: e.target.value }))}
              placeholder="Ej: El próximo martes 28 realizaremos una actualización de la plataforma entre las 02:00 y las 04:00. Guarda tu información antes de esa hora."
              className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm resize-none"
            />
            <p className="text-xs text-[var(--foreground)]/40 mt-1">{banner.message.length} / 300 caracteres</p>
          </div>

          {/* Preview */}
          {banner.message && (
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--foreground)]/40 mb-2">Vista previa del aviso</p>
              <div className="flex items-start gap-3 px-4 py-3 text-sm font-medium rounded-lg"
                style={{ background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.3)", color: "#fbbf24" }}>
                <span className="flex-shrink-0 mt-0.5">⚠️</span>
                <span>{banner.message}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={saveBanner}
              disabled={savingBanner}
              className="px-6 py-3 rounded-lg bg-[var(--brand-4)] text-black font-medium hover:opacity-90 disabled:opacity-50"
            >
              {savingBanner ? "Guardando..." : banner.active ? "Activar aviso" : "Guardar cambios"}
            </button>
          </div>
        </div>
      )}

      {/* Save Button (hidden on features and avisos tabs — those sections have their own button) */}
      {activeSection !== "features" && activeSection !== "avisos" && (
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-6 py-3 rounded-lg bg-[var(--brand-4)] text-black font-medium hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar Configuración"}
          </button>
        </div>
      )}
    </div>
  );
}
