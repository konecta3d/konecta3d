"use client";

import { useEffect, useRef, useState } from "react";
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
  const [savingId, setSavingId] = useState<string | null>(null); // negocio guardándose
  const [savedId, setSavedId] = useState<string | null>(null);   // negocio recién guardado
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"ok" | "error" | "info">("ok");
  const [missingCols, setMissingCols] = useState<string[]>([]);
  const [showSql, setShowSql] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);

  // Ref para auto-save por negocio: id → timer
  const autoSaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Timer para bulk-save (acciones masivas)
  const bulkSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref para leer businesses actual sin stale closure
  const businessesRef = useRef<Business[]>([]);
  const missingColsRef = useRef<string[]>([]);

  useEffect(() => { businessesRef.current = businesses; }, [businesses]);
  useEffect(() => { missingColsRef.current = missingCols; }, [missingCols]);

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

  // ── Auto-save por negocio ────────────────────────────────────────────────

  const ALL_MODULE_FIELDS: (keyof Business)[] = [
    "module_lead_magnet", "module_vip_benefits", "module_whatsapp",
    "module_tools", "module_forms", "module_gpt",
    "module_ai_landing", "module_ai_recursos", "module_captacion",
  ];

  const saveOneBusiness = async (id: string) => {
    const biz = businessesRef.current.find((b) => b.id === id);
    if (!biz) return;

    setSavingId(id);
    setSavedId(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";
      if (!token) {
        showMsg("Sesión expirada — recarga la página", "error");
        setSavingId(null);
        return;
      }

      const payload: Record<string, unknown> = { id };
      for (const field of ALL_MODULE_FIELDS) {
        if (!missingColsRef.current.includes(field as string)) {
          payload[field as string] = biz[field];
        }
      }

      let resOk = false;
      let resStatus = 0;
      let resData: Record<string, unknown> = {};
      try {
        const res = await fetch("/api/admin/update-business", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        resOk = res.ok;
        resStatus = res.status;
        const text = await res.text();
        try { resData = JSON.parse(text); } catch { resData = { raw: text }; }
      } catch (fetchErr) {
        showMsg(`Error de red: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`, "error");
        setSavingId(null);
        return;
      }

      if (!resOk) {
        const errMsg = (resData.error as string) ?? `HTTP ${resStatus}`;
        showMsg(`Error al guardar "${biz.name}": ${errMsg}`, "error");
        setSavingId(null);
        return;
      }

      setSavedId(id);
      setTimeout(() => setSavedId((prev) => prev === id ? null : prev), 2000);
    } catch (err) {
      showMsg(`Error inesperado: ${err instanceof Error ? err.message : String(err)}`, "error");
    } finally {
      setSavingId(null);
    }
  };

  // Programa auto-save para un negocio (debounce 800ms)
  const scheduleAutoSave = (id: string) => {
    if (autoSaveTimers.current[id]) clearTimeout(autoSaveTimers.current[id]);
    autoSaveTimers.current[id] = setTimeout(() => saveOneBusiness(id), 800);
  };

  // ── Acciones ──────────────────────────────────────────────────────────────

  const toggleModule = (id: string, key: keyof Business) => {
    setBusinesses((prev) =>
      prev.map((b) => b.id === id ? { ...b, [key]: !b[key] } : b)
    );
    scheduleAutoSave(id);
  };

  const toggleFidelizacion = (id: string) => {
    setBusinesses((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const isActive = isFidActive(b);
        if (isActive) {
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
    scheduleAutoSave(id);
  };

  const toggleExpanded = (id: string) => {
    setBusinesses((prev) =>
      prev.map((b) => b.id === id ? { ...b, expanded: !b.expanded } : b)
    );
  };

  // Programa un guardado masivo de todos los negocios (debounce 600ms)
  // Necesita un pequeño delay para que businessesRef se actualice tras el re-render
  const scheduleBulkSave = () => {
    if (bulkSaveTimer.current) clearTimeout(bulkSaveTimer.current);
    bulkSaveTimer.current = setTimeout(() => saveAll(), 600);
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
    scheduleBulkSave();
  };

  const toggleAllCaptacion = (value: boolean) => {
    setBusinesses((prev) => prev.map((b) => ({ ...b, module_captacion: value })));
    scheduleBulkSave();
  };

  const toggleAllModule = (key: keyof Business, value: boolean) => {
    setBusinesses((prev) => prev.map((b) => ({ ...b, [key]: value })));
    scheduleBulkSave();
  };

  // Mostrar mensaje temporal
  const showMsg = (text: string, type: "ok" | "error" | "info" = "ok", ms = 5000) => {
    setMsg(text);
    setMsgType(type);
    if (ms > 0) setTimeout(() => setMsg(""), ms);
  };

  const saveAll = async () => {
    setSaving(true);
    showMsg("Guardando todos...", "info", 0);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";
      if (!token) {
        showMsg("Sesión expirada — recarga la página", "error");
        return;
      }
      for (const b of businessesRef.current) {
        const payload: Record<string, unknown> = { id: b.id };
        for (const field of ALL_MODULE_FIELDS) {
          if (!missingColsRef.current.includes(field as string)) {
            payload[field as string] = b[field];
          }
        }
        let resOk = false; let resStatus = 0; let resData: Record<string, unknown> = {};
        try {
          const res = await fetch("/api/admin/update-business", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload),
          });
          resOk = res.ok; resStatus = res.status;
          const text = await res.text();
          try { resData = JSON.parse(text); } catch { resData = { raw: text }; }
        } catch (fetchErr) {
          showMsg(`Error de red: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`, "error");
          return;
        }
        if (!resOk) {
          showMsg(`Error al guardar "${b.name}": ${(resData.error as string) ?? `HTTP ${resStatus}`}`, "error");
          return;
        }
      }
      const skipped = missingColsRef.current.length;
      showMsg(skipped > 0 ? `Guardado ✓ (${skipped} col. pendientes)` : "Guardado ✓", "ok");
    } catch (err) {
      showMsg(`Error inesperado: ${err instanceof Error ? err.message : String(err)}`, "error");
    } finally {
      setSaving(false);
    }
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
            <span className={`text-sm px-3 py-1.5 rounded-lg max-w-xs text-center leading-snug ${
              msgType === "error" ? "bg-red-500/20 text-red-400" :
              msgType === "info"  ? "bg-blue-500/20 text-blue-300" :
              "bg-green-500/20 text-green-400"
            }`}>
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
      {(() => {
        // Estado de cada módulo: 'on' = todos activos, 'off' = todos inactivos, 'mix' = mixto
        const colState = (key: keyof Business): 'on' | 'off' | 'mix' => {
          if (businesses.length === 0) return 'off';
          const allOn  = businesses.every(b => Boolean(b[key]));
          const allOff = businesses.every(b => !Boolean(b[key]));
          return allOn ? 'on' : allOff ? 'off' : 'mix';
        };
        const fidAllState = (): 'on' | 'off' | 'mix' => {
          if (businesses.length === 0) return 'off';
          const allOn  = businesses.every(b => isFidActive(b));
          const allOff = businesses.every(b => !isFidActive(b));
          return allOn ? 'on' : allOff ? 'off' : 'mix';
        };
        const capAllState = colState('module_captacion');
        const fidSt = fidAllState();

        // Segmented control: dos botones (ON / OFF) que reflejan estado actual
        const Seg = ({
          labelOn, labelOff,
          state, colorOn,
          onOn, onOff,
        }: {
          labelOn: string; labelOff: string;
          state: 'on' | 'off' | 'mix';
          colorOn: string;
          onOn: () => void; onOff: () => void;
        }) => (
          <div className="flex rounded-lg overflow-hidden border border-[var(--border)] shrink-0">
            <button
              onClick={onOn}
              disabled={saving}
              title="Activar para todos los negocios"
              className={`px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 ${
                state === 'on'
                  ? `${colorOn} text-white`
                  : state === 'mix'
                  ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                  : 'bg-transparent text-[var(--foreground)]/40 hover:bg-white/5'
              }`}
            >
              {state === 'on' ? '● ' : state === 'mix' ? '◑ ' : '○ '}{labelOn}
            </button>
            <div className="w-px bg-[var(--border)]" />
            <button
              onClick={onOff}
              disabled={saving}
              title="Desactivar para todos los negocios"
              className={`px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 ${
                state === 'off'
                  ? 'bg-gray-500/40 text-[var(--foreground)]/70'
                  : 'bg-transparent text-[var(--foreground)]/30 hover:bg-white/5'
              }`}
            >
              {state === 'off' ? '● ' : '○ '}{labelOff}
            </button>
          </div>
        );

        return (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-3">
            {/* Cabecera */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground)]/40">
                Aplicar a todos los negocios
              </span>
              {saving && (
                <span className="flex items-center gap-1.5 text-xs text-blue-300">
                  <span className="w-3 h-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                  Guardando…
                </span>
              )}
            </div>

            {/* Perfiles */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-[var(--foreground)]/50 w-28 shrink-0">Fidelización</span>
              <Seg
                labelOn="Todos activos" labelOff="Todos inactivos"
                state={fidSt} colorOn="bg-[var(--brand-3)]"
                onOn={() => toggleAllFid(true)} onOff={() => toggleAllFid(false)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-[var(--foreground)]/50 w-28 shrink-0">Captación</span>
              <Seg
                labelOn="Todos activos" labelOff="Todos inactivos"
                state={capAllState} colorOn="bg-[var(--brand-4)]"
                onOn={() => toggleAllCaptacion(true)} onOff={() => toggleAllCaptacion(false)}
              />
            </div>

            <div className="border-t border-[var(--border)]" />

            {/* Módulos individuales */}
            {FID_MODULES.map((m) => {
              const st = colState(m.key);
              return (
                <div key={m.key} className="flex flex-wrap items-center gap-3">
                  <span className="text-xs text-[var(--foreground)]/50 w-28 shrink-0 truncate">{m.label}</span>
                  <Seg
                    labelOn="Activo" labelOff="Inactivo"
                    state={st} colorOn={m.color}
                    onOn={() => toggleAllModule(m.key, true)}
                    onOff={() => toggleAllModule(m.key, false)}
                  />
                  {st === 'mix' && (
                    <span className="text-[10px] text-amber-400/70">
                      {businesses.filter(b => Boolean(b[m.key])).length}/{businesses.length} activos
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* ── Tabla principal ── */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        {/* Cabecera — oculta en móvil, visible en sm+ */}
        <div className="hidden sm:grid sm:grid-cols-[1fr_160px_160px_44px] bg-[var(--background)] px-4 py-2.5 text-xs uppercase tracking-widest text-[var(--foreground)]/40 border-b border-[var(--border)]">
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
          const isSavingThis = savingId === b.id;
          const isSavedThis  = savedId  === b.id;

          return (
            <div key={b.id} className="border-t border-[var(--border)]">

              {/* ── Fila principal: layout adaptativo ── */}
              <div
                className="cursor-pointer hover:bg-white/[0.02] px-4 py-3"
                onClick={() => toggleExpanded(b.id)}
              >
                {/* Mobile: flex horizontal compacto */}
                <div className="flex items-center gap-3 sm:hidden">
                  {/* Nombre + sector + indicador de guardado */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm truncate">{b.name}</span>
                      {isSavingThis && <span className="w-3 h-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin shrink-0" />}
                      {isSavedThis  && <span className="text-green-400 text-xs shrink-0">✓</span>}
                    </div>
                    {b.sector && (
                      <div className="text-xs text-[var(--foreground)]/40 mt-0.5 truncate">{b.sector}</div>
                    )}
                  </div>

                  {/* Fidelización toggle */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <Toggle
                      checked={fidActive}
                      activeColor="bg-[var(--brand-3)]"
                      onChange={() => toggleFidelizacion(b.id)}
                    />
                    <span className={`text-[10px] font-medium ${fidActive ? "text-[var(--brand-3)]" : "text-[var(--foreground)]/30"}`}>
                      {fidActive ? `${activeModules.length} mód.` : "Inactivo"}
                    </span>
                  </div>

                  {/* Flecha expandir — siempre visible */}
                  <svg
                    className={`w-4 h-4 text-[var(--foreground)]/40 transition-transform shrink-0 ${b.expanded ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Desktop: grid de 4 columnas */}
                <div className="hidden sm:grid sm:grid-cols-[1fr_160px_160px_44px] sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{b.name}</span>
                      {isSavingThis && <span className="w-3 h-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />}
                      {isSavedThis  && <span className="text-green-400 text-xs">✓ guardado</span>}
                    </div>
                    {b.sector && (
                      <div className="text-xs text-[var(--foreground)]/40 mt-0.5">{b.sector}</div>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <Toggle
                      checked={fidActive}
                      activeColor="bg-[var(--brand-3)]"
                      onChange={() => toggleFidelizacion(b.id)}
                    />
                    <span className={`text-[10px] font-medium ${fidActive ? "text-[var(--brand-3)]" : "text-[var(--foreground)]/30"}`}>
                      {fidActive ? `${activeModules.length} módulo${activeModules.length !== 1 ? "s" : ""}` : "Inactivo"}
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <Toggle
                      checked={b.module_captacion}
                      activeColor="bg-[var(--brand-4)]"
                      onChange={() => toggleModule(b.id, "module_captacion")}
                    />
                    <span className={`text-[10px] font-medium ${b.module_captacion ? "text-[var(--brand-4)]" : "text-[var(--foreground)]/30"}`}>
                      {b.module_captacion ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  <div className="flex justify-center">
                    <svg
                      className={`w-4 h-4 text-[var(--foreground)]/30 transition-transform ${b.expanded ? "rotate-180" : ""}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Panel expandido: módulos individuales */}
              {b.expanded && (
                <div className="px-4 pb-4 bg-[var(--background)]/40 border-t border-[var(--border)]/50">

                  {/* Captación en móvil (en desktop está en la fila) */}
                  <div className="sm:hidden pt-3 pb-2 flex items-center justify-between">
                    <span className="text-xs text-[var(--foreground)]/50 font-semibold uppercase tracking-widest">Captación</span>
                    <div className="flex items-center gap-2">
                      <Toggle
                        checked={b.module_captacion}
                        activeColor="bg-[var(--brand-4)]"
                        onChange={() => toggleModule(b.id, "module_captacion")}
                      />
                      <span className={`text-xs font-medium ${b.module_captacion ? "text-[var(--brand-4)]" : "text-[var(--foreground)]/30"}`}>
                        {b.module_captacion ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--foreground)]/40 uppercase tracking-widest py-3">
                    Módulos de Fidelización
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {FID_MODULES.map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleModule(b.id, m.key); }}
                        className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 border text-xs font-medium transition-colors ${
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

      {/* ── Botón guardar sticky en móvil ── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-[var(--background)]/95 backdrop-blur border-t border-[var(--border)] flex items-center gap-3">
        {msg && (
          <span className={`flex-1 text-xs px-2 py-1.5 rounded-lg leading-snug ${
            msgType === "error" ? "bg-red-500/20 text-red-400" :
            msgType === "info"  ? "bg-blue-500/20 text-blue-300" :
            "bg-green-500/20 text-green-400"
          }`}>
            {msg}
          </span>
        )}
        <button
          onClick={saveAll}
          disabled={saving}
          className="ml-auto px-5 py-2.5 rounded-lg bg-[var(--brand-4)] text-black text-sm font-semibold hover:opacity-90 disabled:opacity-50 shrink-0"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
      {/* Espacio para el sticky bar en móvil */}
      <div className="sm:hidden h-20" />

      {/* Nota al pie */}
      {noneCount > 0 && (
        <p className="text-xs text-[var(--foreground)]/30 text-center">
          {noneCount} negocio{noneCount !== 1 ? "s" : ""} sin ningún perfil activo
        </p>
      )}

    </div>
  );
}
