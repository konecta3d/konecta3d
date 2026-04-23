"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type CustomNames = {
  dashboard: string;
  landing: string;
  leadMagnet: string;
  vipBenefits: string;
  actions: string;
};

const defaultNames: CustomNames = {
  dashboard: "Panel de Control",
  landing: "Landing",
  leadMagnet: "Lead Magnet",
  vipBenefits: "Beneficios VIP",
  actions: "Acciones",
};

export default function AdminPersonalization() {
  const [names, setNames] = useState<CustomNames>(defaultNames);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(false);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadNames();
  }, []);

  const loadNames = async () => {
    setLoading(true);
    
    // Try to load from Supabase first
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "names")
        .single();

      if (data?.value) {
        const savedNames = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        setNames({ ...defaultNames, ...savedNames });
        
        // Also save to localStorage as backup
        localStorage.setItem("konecta-sidebar-names", JSON.stringify(savedNames));
      } else {
        // Fallback to localStorage
        const saved = localStorage.getItem("konecta-sidebar-names");
        if (saved) {
          setNames({ ...defaultNames, ...JSON.parse(saved) });
        }
      }
    } catch (err) {
      // Fallback to localStorage
      const saved = localStorage.getItem("konecta-sidebar-names");
      if (saved) {
        setNames({ ...defaultNames, ...JSON.parse(saved) });
      }
    }
    
    setLoading(false);
  };

  const saveNames = async () => {
    setSaving(true);
    setMsg("Guardando...");

    try {
      // Save to Supabase
      const { error } = await supabase
        .from("settings")
        .upsert({
          key: "names",
          value: JSON.stringify(names),
          updated_at: new Date().toISOString(),
        }, { onConflict: "key" });

      if (error) {
        console.error("Supabase error:", error);
      }

      // Also save to localStorage as backup
      localStorage.setItem("konecta-sidebar-names", JSON.stringify(names));
      
      // Notify sidebar to update
      window.dispatchEvent(new CustomEvent("konecta-sidebar-names-update", { detail: names }));
      
      setMsg("Nombres guardados");
    } catch (err) {
      // Fallback to localStorage only
      localStorage.setItem("konecta-sidebar-names", JSON.stringify(names));
      window.dispatchEvent(new CustomEvent("konecta-sidebar-names-update", { detail: names }));
      setMsg("Guardado (local)");
    }

    setSaving(false);
    setTimeout(() => setMsg(""), 3000);
  };

  const resetNames = async () => {
    setNames(defaultNames);
    
    try {
      await supabase
        .from("settings")
        .upsert({
          key: "names",
          value: JSON.stringify(defaultNames),
          updated_at: new Date().toISOString(),
        }, { onConflict: "key" });
    } catch (err) {
      // Ignore
    }
    
    localStorage.removeItem("konecta-sidebar-names");
    window.dispatchEvent(new CustomEvent("konecta-sidebar-names-update", { detail: defaultNames }));
    setMsg("Restablecido a valores por defecto");
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
        <h1 className="text-2xl font-semibold">Personalización</h1>
        {msg && (
          <div className="text-sm px-3 py-1 rounded bg-green-500/20 text-green-400">
            {msg}
          </div>
        )}
      </div>

      {/* Storage Info */}
      <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-4">
        <p className="text-sm text-blue-400">
          Los nombres se guardan en Supabase y se sincronizan automáticamente.
        </p>
      </div>

      {/* Preview Toggle */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={preview}
            onChange={(e) => setPreview(e.target.checked)}
            className="w-4 h-4 accent-[var(--brand-4)]"
          />
          <span className="text-sm">Vista previa en tiempo real</span>
        </label>
      </div>

      {/* Nomenclature */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Nomenclatura</h2>
          <p className="text-sm text-white mb-4">
            Personaliza los nombres que se muestran en el menú lateral para los negocios.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-[var(--brand-4)] block mb-2">Panel de Control</label>
              <input
                type="text"
                value={names.dashboard}
                onChange={(e) => setNames({ ...names, dashboard: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-[var(--brand-4)] block mb-2">Landing</label>
              <input
                type="text"
                value={names.landing}
                onChange={(e) => setNames({ ...names, landing: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-[var(--brand-4)] block mb-2">Lead Magnet</label>
              <input
                type="text"
                value={names.leadMagnet}
                onChange={(e) => setNames({ ...names, leadMagnet: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-[var(--brand-4)] block mb-2">VIP Benefits</label>
              <input
                type="text"
                value={names.vipBenefits}
                onChange={(e) => setNames({ ...names, vipBenefits: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-[var(--brand-4)] block mb-2">Acciones</label>
              <input
                type="text"
                value={names.actions}
                onChange={(e) => setNames({ ...names, actions: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-lg font-semibold mb-4">Vista Previa</h2>
          <div className="max-w-xs rounded-lg bg-[var(--background)] p-4 border border-[var(--border)]">
            <div className="text-xs uppercase text-[var(--brand-1)] mb-2">Mi Negocio</div>
            <div className="space-y-1 text-sm">
              <div className="px-3 py-2 rounded bg-white/10">Perfil</div>
              <div className="px-3 py-2 rounded hover:bg-white/5">Cliente Ideal</div>
              <div className="px-3 py-2 rounded hover:bg-white/5">Catálogo P/S</div>
            </div>
            <div className="text-xs uppercase text-[var(--brand-1)] mt-4 mb-2">Generadores</div>
            <div className="space-y-1 text-sm">
              <div className="px-3 py-2 rounded hover:bg-white/5">{names.landing}</div>
              <div className="px-3 py-2 rounded hover:bg-white/5">{names.leadMagnet}</div>
              <div className="px-3 py-2 rounded hover:bg-white/5">{names.vipBenefits}</div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={saveNames}
          disabled={saving}
          className="px-6 py-3 rounded-lg bg-[var(--brand-4)] text-black font-medium hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar Personalización"}
        </button>
        <button
          onClick={resetNames}
          className="px-6 py-3 rounded-lg border border-[var(--border)] hover:bg-white/5"
        >
          Restablecer
        </button>
      </div>
    </div>
  );
}
