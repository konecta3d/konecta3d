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

const defaultSettings: Settings = {
  email_from: "noreply@konecta3d.com",
  email_name: "Konecta3D",
  notify_new_business: true,
  notify_new_leads: true,
  min_password_length: 6,
  require_special_chars: false,
  force_password_change: false,
};

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [activeSection, setActiveSection] = useState("email");
  const [saving, setSaving] = useState(false);
  const [migrationResult, setMigrationResult] = useState<null | { results: Record<string, string>; hasMissing: boolean; sql?: string | null }>(null);
  const [migrationLoading, setMigrationLoading] = useState(false);

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
        
        // Backup to localStorage
        localStorage.setItem("konecta-settings", JSON.stringify(savedSettings));
      } else {
        // Fallback to localStorage
        const saved = localStorage.getItem("konecta-settings");
        if (saved) {
          setSettings({ ...defaultSettings, ...JSON.parse(saved) });
        }
      }
    } catch (err) {
      // Fallback to localStorage
      const saved = localStorage.getItem("konecta-settings");
      if (saved) {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      }
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
      }

      // Also save to localStorage as backup
      localStorage.setItem("konecta-settings", JSON.stringify(settings));
      
      setMsg("Configuración guardada");
    } catch (err) {
      // Fallback to localStorage only
      localStorage.setItem("konecta-settings", JSON.stringify(settings));
      setMsg("Guardado (local)");
    }

    setSaving(false);
    setTimeout(() => setMsg(""), 3000);
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

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-6 py-3 rounded-lg bg-[var(--brand-4)] text-black font-medium hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar Configuración"}
        </button>
      </div>
    </div>
  );
}
