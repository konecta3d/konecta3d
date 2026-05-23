"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Business = {
  id: string;
  name: string;
  sector: string | null;
  // Fidelización
  module_lead_magnet: boolean;
  module_vip_benefits: boolean;
  module_whatsapp: boolean;
  module_tools: boolean;
  module_forms: boolean;
  module_gpt: boolean;
  module_ai_landing: boolean;
  module_ai_recursos: boolean;
  // Captación
  module_captacion: boolean;
  created_at: string;
  // UI state
  expanded: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FID_MODULES: { key: keyof Business; label: string; color: string; defaultOn: boolean }[] = [
  { key: "module_lead_magnet",  label: "Recurso de Valor",  color: "bg-green-500",  defaultOn: true },
  { key: "module_tools",        label: "Herramientas",      color: "bg-yellow-500", defaultOn: true },
  { key: "module_whatsapp",     label: "WhatsApp",          color: "bg-purple-500", defaultOn: true },
  { key: "module_vip_benefits", label: "Beneficios VIP",   color: "bg-blue-500",   defaultOn: false },
  { key: "module_forms",        label: "Formularios",       color: "bg-orange-500", defaultOn: false },
  { key: "module_gpt",          label: "GPT Externo",       color: "bg-amber-500",  defaultOn: false },
  { key: "module_ai_landing",   label: "IA Landing",        color: "bg-cyan-500",   defaultOn: false },
  { key: "module_ai_recursos",  label: "IA Recursos",       color: "bg-pink-500",   defaultOn: false },
];

function isFidActive(b: Business): boolean {
  return FID_MODULES.some((m) => Boolean(b[m.key]));
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  activeColor = "bg-[var(--brand-3)]",
  onChange,
  size = "md",
}: {
  checked: boolean;
  activeColor?: string;
  onChange: () => void;
  size?: "sm" | "md";
}) {
  const track = size === "sm" ? "w-9 h-5" : "w-12 h-6";
  const thumb = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";
  const on    = size === "sm" ? "translate-x-4" : "translate-x-6";
  const off   = size === "sm" ? "translate-x-0.5" : "translate-x-0.5";

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={`${track} rounded-full transition-colors flex-shrink-0 ${checked ? activeColor : "bg-gray-600"}`}
    >
      <div className={`${thumb} rounded-full bg-white transform transition-transform ${checked ? on : off}`} />
    </button>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

const MIGRATION_SQL = `-- Ejecuta esto en Supabase → SQL Editor
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS module_tools        BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS module_forms        BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS module_gpt          BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS module_ai_landing   BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS module_ai_recursos  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS module_captacion    BOOLEAN DEFAULT false;`;

export default function AdminModulos() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [missingCols, setMissingCols] = useState<string[]>([]);
  const [showSql, setShowSql] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);

  useEffect(() => { loadBusinesses(); }, []);

  const loadBusinesses = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";

      // Comprobar columnas que faltan en businesses
      const colRes = await fetch("/api/admin/check-columns", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (colRes.ok) {
        const colData = await colRes.json();
        const missing = Object.entries(colData.columns as Record<string, boolean>)
          .filter(([, exists]) => !exists)
          .map(([col]) => col);
        setMissingCols(missing);
      }

      const res = await fetch("/api/admin/businesses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setLoading(false); return; }
      const json = await res.json();
      const raw: Record<string, unknown>[] = json.businesses ?? [];
      setBusinesses(
        raw.map((b) => ({
          id:                  String(b.id ?? ""),
          name:                String(b.name ?? ""),
          sector:              b.sector != null ? String(b.sector) : null,
          module_lead_magnet:  Boolean(b.module_lead_magnet ?? true),
          module_vip_benefits: Boolean(b.module_vip_benefits ?? false),
          module_whatsapp:     Boolean(b.module_whatsapp ?? true),
          module_tools:        Boolean(b.module_tools ?? true),
          module_forms:        Boolean(b.module_forms ?? false),
          module_gpt:          Boolean(b.module_gpt ?? false),
          module_ai_landing:   Boolean(b.module_ai_landing ?? false),
          module_ai_recursos:  Boolean(b.module_ai_recursos ?? false),
          module_captacion:    Boolean(b.module_captacion ?? false),
          created_at:          String(b.created_at ?? ""),
          expanded:            false,
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Acciones ──────────────────────────────────────────────────────────────

  const toggleModule = (id: string, key: keyof Business) => {
    setBusinesses((prev) =>
      prev.map((b) => b.id === id ? { ...b, [key]: !b[key] } : b)
    );
  };

  const toggleFidelizacion = (id: string) => {
    setBusinesses((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const isActive = isFidActive(b);
        if (isActive) {
          // Desactivar todos los módulos de fidelización
          const off: Partial<Business> = {};
          FID_MODULES.forEach((m) => { (off as Record<string, boolean>)[m.key as string] = false; });
          return { ...b, ...off };
        } else {
          // Activar módulos por defecto
          const on: Partial<Business> = {};
          FID_MODULES.forEach((m) => { (on as Record<string, boolean>)[m.key as string] = m.defaultOn; });
          return { ...b, ...on };
        }
      })
    );
  };

  const toggleExpanded = (id: string) => {
    setBusinesses((prev) =>
      prev.map((b) => b.id === id ? { ...b, expanded: !b.expanded } : b)
    );
  };

  const toggleAllFid = (value: boolean) => {
    setBusinesses((prev) =>
      prev.map((b) => {
        if (!value) {
          const off: Partial<Business> = {};
          FID_MODULES.forEach((m) => { (off as Record<string, boolean>)[m.key as string] = false; });
          return { ...b, ...off };
        } else {
          const on: Partial<Business> = {};
          FID_MODULES.forEach((m) => { (on as Record<string, boolean>)[m.key as string] = m.defaultOn; });
          return { ...b, ...on };
        }
      })
    );
  };

  const toggleAllCaptacion = (value: boolean) => {
    setBusinesses((prev) => prev.map((b) => ({ ...b, module_captacion: value })));
  };

  const toggleAllModule = (key: keyof Business, value: boolean) => {
    setBusinesses((prev) => prev.map((b) => ({ ...b, [key]: value })));
  };

  const saveAll = async () => {
    setSaving(true);
    setMsg("Guardando...");
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? "";

    // Todos los campos de módulo que queremos guardar
    const ALL_MODULE_FIELDS: (keyof Business)[] = [
      "module_lead_magnet", "module_vip_benefits", "module_whatsapp",
      "module_tools", "module_forms", "module_gpt",
      "module_ai_landing", "module_ai_recursos", "module_captacion",
    ];

    for (const b of businesses) {
      // Construir payload dinámico: excluir columnas que no existen en la DB
      const payload: Record<string, unknown> = { id: b.id };
      for (const field of ALL_MODULE_FIELDS) {
        if (!missingCols.includes(field as string)) {
          payload[field as string] = b[field];
        }
      }

      const res = await fetch("/api/admin/update-business", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setMsg("Error: " + (data.error ?? "error desconocido"));
        setSaving(false);
        return;
      }
    }

    const skipped = missingCols.length;
    setMsg(skipped > 0 ? `Guardado ✓ (${skipped} col. pendientes de migración)` : "Guardado ✓");
    setSaving(false);
    setTimeout(() => setMsg(""), 4000);
  };

  // ── Estadísticas ──────────────────────────────────────────────────────────

  const total   = businesses.length;
  const fidCount = businesses.filter(isFidActive).length;
  const capCount = businesses.filter((b) => b.module_captacion).length;
  const bothCount = businesses.filter((b) => isFidActive(b) && b.module_captacion).length;
  const noneCount = businesses.filter((b) => !isFidActive(b) && !b.module_captacion).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-4)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Cabecera ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Perfiles por negocio</h1>
          <p className="text-sm text-[var(--foreground)]/50 mt-0.5">
            Activa o desactiva los perfiles de Fidelización y Captación para cada cliente
          </p>
        </div>
        <div className="flex items-center gap-3">
          {msg && (
            <span className={`text-sm px-3 py-1 rounded ${msg.startsWith("Error") ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
              {msg}
            </span>
          )}
          <button
            onClick={saveAll}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-[var(--brand-4)] text-black text-sm font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>

      {/* ── Estadísticas ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total negocios",    value: total,     color: "text-[var(--foreground)]" },
          { label: "Con Fidelización",  value: fidCount,  color: "text-[var(--brand-3)]" },
          { label: "Con Captación",     value: capCount,  color: "text-[var(--brand-4)]" },
          { label: "Con ambos perfiles",value: bothCount, color: "text-purple-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-center">
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-[var(--foreground)]/50 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Aviso columnas faltantes ── */}
      {missingCols.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-amber-400">
                ⚠ Faltan columnas en la base de datos
              </p>
              <p className="text-xs text-amber-400/70 mt-1">
                Los módulos <strong>{missingCols.join(", ")}</strong> no se pueden guardar hasta ejecutar la migración en Supabase.
              </p>
            </div>
            <button
              onClick={() => setShowSql(!showSql)}
              className="shrink-0 text-xs px-3 py-1.5 rounded-lg font-semibold bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
            >
              {showSql ? "Ocultar SQL" : "Ver SQL"}
            </button>
          </div>
          {showSql && (
            <div className="space-y-2">
              <pre className="text-xs bg-black/40 rounded-lg p-3 overflow-x-auto text-green-300 leading-relaxed">
                {MIGRATION_SQL}
              </pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(MIGRATION_SQL);
                  setSqlCopied(true);
                  setTimeout(() => setSqlCopied(false), 2000);
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors font-semibold"
              >
                {sqlCopied ? "¡Copiado!" : "Copiar SQL"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Acciones masivas ── */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground)]/40">Aplicar a todos los negocios</span>

        {/* Perfiles completos */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[var(--foreground)]/50 w-24 shrink-0">Perfiles</span>
          {[
            { label: "Fidelización ON",  action: () => toggleAllFid(true),           cls: "bg-[var(--brand-3)]/20 text-[var(--brand-3)] hover:bg-[var(--brand-3)]/30" },
            { label: "Fidelización OFF", action: () => toggleAllFid(false),          cls: "bg-gray-500/20 text-[var(--foreground)]/50 hover:bg-gray-500/30" },
            { label: "Captación ON",     action: () => toggleAllCaptacion(true),     cls: "bg-[var(--brand-4)]/20 text-[var(--brand-4)] hover:bg-[var(--brand-4)]/30" },
            { label: "Captación OFF",    action: () => toggleAllCaptacion(false),    cls: "bg-gray-500/20 text-[var(--foreground)]/50 hover:bg-gray-500/30" },
          ].map((btn) => (
            <button key={btn.label} onClick={btn.action} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${btn.cls}`}>
              {btn.label}
            </button>
          ))}
        </div>

        <div className="border-t border-[var(--border)]" />

        {/* Módulos individuales */}
        {FID_MODULES.map((m) => (
          <div key={m.key} className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--foreground)]/50 w-24 shrink-0 truncate">{m.label}</span>
            <button
              onClick={() => toggleAllModule(m.key, true)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${m.color}/20 text-white/70 hover:${m.color}/30`}
            >
              Activar todos
            </button>
            <button
              onClick={() => toggleAllModule(m.key, false)}
              className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-500/20 text-[var(--foreground)]/40 hover:bg-gray-500/30 transition-colors"
            >
              Desactivar
            </button>
          </div>
        ))}
      </div>

      {/* ── Tabla principal ── */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        {/* Cabecera de tabla */}
        <div className="grid grid-cols-[1fr_160px_160px_44px] bg-[var(--background)] px-4 py-2.5 text-xs uppercase tracking-widest text-[var(--foreground)]/40 border-b border-[var(--border)]">
          <div>Negocio</div>
          <div className="text-center">Fidelización</div>
          <div className="text-center">Captación</div>
          <div />
        </div>

        {businesses.length === 0 && (
          <div className="text-center py-10 text-[var(--foreground)]/30 text-sm">No hay negocios registrados</div>
        )}

        {businesses.map((b) => {
          const fidActive = isFidActive(b);
          const activeModules = FID_MODULES.filter((m) => Boolean(b[m.key]));

          return (
            <div key={b.id} className="border-t border-[var(--border)]">

              {/* Fila principal */}
              <div
                className="grid grid-cols-[1fr_160px_160px_44px] items-center px-4 py-3 hover:bg-white/[0.02] cursor-pointer"
                onClick={() => toggleExpanded(b.id)}
              >
                {/* Nombre + sector */}
                <div>
                  <div className="font-medium text-sm">{b.name}</div>
                  {b.sector && (
                    <div className="text-xs text-[var(--foreground)]/40 mt-0.5">{b.sector}</div>
                  )}
                </div>

                {/* Toggle Fidelización */}
                <div className="flex flex-col items-center gap-1.5">
                  <Toggle
                    checked={fidActive}
                    activeColor="bg-[var(--brand-3)]"
                    onChange={() => toggleFidelizacion(b.id)}
                  />
                  {fidActive && (
                    <span className="text-[10px] text-[var(--brand-3)] font-medium">
                      {activeModules.length} módulo{activeModules.length !== 1 ? "s" : ""}
                    </span>
                  )}
                  {!fidActive && (
                    <span className="text-[10px] text-[var(--foreground)]/30">Inactivo</span>
                  )}
                </div>

                {/* Toggle Captación */}
                <div className="flex flex-col items-center gap-1.5">
                  <Toggle
                    checked={b.module_captacion}
                    activeColor="bg-[var(--brand-4)]"
                    onChange={() => toggleModule(b.id, "module_captacion")}
                  />
                  {b.module_captacion ? (
                    <span className="text-[10px] text-[var(--brand-4)] font-medium">Activo</span>
                  ) : (
                    <span className="text-[10px] text-[var(--foreground)]/30">Inactivo</span>
                  )}
                </div>

                {/* Flecha expandir */}
                <div className="flex justify-center">
                  <svg
                    className={`w-4 h-4 text-[var(--foreground)]/30 transition-transform ${b.expanded ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Panel expandido: módulos individuales de fidelización */}
              {b.expanded && (
                <div className="px-4 pb-4 bg-[var(--background)]/40 border-t border-[var(--border)]/50">
                  <p className="text-xs text-[var(--foreground)]/40 uppercase tracking-widest py-3">
                    Módulos de Fidelización
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {FID_MODULES.map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => toggleModule(b.id, m.key)}
                        className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 border text-xs font-medium transition-colors ${
                          b[m.key]
                            ? "border-[var(--brand-3)]/40 bg-[var(--brand-3)]/10 text-[var(--foreground)]"
                            : "border-[var(--border)] bg-transparent text-[var(--foreground)]/40"
                        }`}
                      >
                        <span>{m.label}</span>
                        <Toggle
                          checked={Boolean(b[m.key])}
                          activeColor={m.color}
                          onChange={() => toggleModule(b.id, m.key)}
                          size="sm"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Nota al pie */}
      {noneCount > 0 && (
        <p className="text-xs text-[var(--foreground)]/30 text-center">
          {noneCount} negocio{noneCount !== 1 ? "s" : ""} sin ningún perfil activo
        </p>
      )}

    </div>
  );
}
