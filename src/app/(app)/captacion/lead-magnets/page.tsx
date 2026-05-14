"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { CaptacionLeadMagnet } from "@/types/captacion";

const TYPE_LABELS: Record<string, string> = { pdf: "PDF", url: "Enlace", code: "Código" };

// ── Modal de creación guiada (Asistente) ──────────────────────
function WizardModal({
  businessId, token, onClose, onSaved,
}: { businessId: string; token: string; onClose: () => void; onSaved: () => void }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({
    name: "", type: "pdf" as "pdf" | "url" | "code",
    file_url: "", external_url: "", code_value: "",
    title: "", description: "", cta_text: "Obtener recurso gratis",
  });

  const save = async () => {
    if (!data.name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/captacion/lead-magnets", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ businessId, ...data }),
    });
    if (res.ok) { onSaved(); onClose(); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="w-full max-w-md rounded-2xl border p-6 space-y-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg">Asistente</h2>
            <p className="text-xs text-[var(--foreground)]/50">Paso {step} de 3</p>
          </div>
          <button onClick={onClose} className="text-[var(--foreground)]/40 hover:text-[var(--foreground)] text-xl leading-none">×</button>
        </div>

        {/* Barra de progreso */}
        <div className="flex gap-1">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex-1 h-1 rounded-full transition-all"
              style={{ background: s <= step ? "var(--brand-1)" : "var(--border)" }} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">¿Qué tipo de recurso vas a ofrecer?</label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {(["pdf", "url", "code"] as const).map(t => (
                  <button key={t} onClick={() => setData(d => ({ ...d, type: t }))}
                    className={`rounded-lg border py-3 text-xs font-semibold transition-colors ${data.type === t ? "border-[var(--brand-1)]" : "border-[var(--border)]"}`}
                    style={{ background: data.type === t ? "rgba(57,161,169,0.08)" : "transparent" }}>
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[var(--foreground)]/40 mt-2">
                {data.type === "pdf" && "Documento descargable: guía, checklist, ebook..."}
                {data.type === "url" && "Enlace externo: vídeo, página, recurso online..."}
                {data.type === "code" && "Cupón de descuento o código de acceso"}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Nombre interno *</label>
              <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
                value={data.name} onChange={e => setData(d => ({ ...d, name: e.target.value }))}
                placeholder="Ej: Guía captación dental 2026" autoFocus />
            </div>
            <button onClick={() => setStep(2)} disabled={!data.name.trim()}
              className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40"
              style={{ background: "var(--brand-1)", color: "white" }}>
              Siguiente →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Título visible para el cliente</label>
              <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
                value={data.title} onChange={e => setData(d => ({ ...d, title: e.target.value }))}
                placeholder="Ej: Los 5 errores que ahuyentan clientes" />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Descripción breve</label>
              <textarea rows={2} className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent resize-none" style={{ borderColor: "var(--border)" }}
                value={data.description} onChange={e => setData(d => ({ ...d, description: e.target.value }))}
                placeholder="Qué aprenderá o ganará quien lo descargue" />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Texto del botón</label>
              <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
                value={data.cta_text} onChange={e => setData(d => ({ ...d, cta_text: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-lg border text-sm font-medium" style={{ borderColor: "var(--border)" }}>← Atrás</button>
              <button onClick={() => setStep(3)} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "var(--brand-1)", color: "white" }}>Siguiente →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-xs text-[var(--foreground)]/50">
              {data.type === "pdf" && "Pega la URL del PDF (súbelo primero a Supabase Storage)"}
              {data.type === "url" && "Pega el enlace al que redirigir al cliente"}
              {data.type === "code" && "Escribe el código o cupón que verá el cliente"}
            </p>
            {data.type === "pdf" && (
              <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
                value={data.file_url} onChange={e => setData(d => ({ ...d, file_url: e.target.value }))}
                placeholder="https://..." />
            )}
            {data.type === "url" && (
              <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
                value={data.external_url} onChange={e => setData(d => ({ ...d, external_url: e.target.value }))}
                placeholder="https://..." />
            )}
            {data.type === "code" && (
              <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent font-mono tracking-widest" style={{ borderColor: "var(--border)" }}
                value={data.code_value} onChange={e => setData(d => ({ ...d, code_value: e.target.value }))}
                placeholder="Ej: BIENVENIDO20" />
            )}
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-lg border text-sm font-medium" style={{ borderColor: "var(--border)" }}>← Atrás</button>
              <button onClick={save} disabled={saving || !data.name.trim()} className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40" style={{ background: "var(--brand-1)", color: "white" }}>
                {saving ? "Guardando..." : "Crear recurso"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Modal avanzado ────────────────────────────────────────────
function AdvancedModal({
  businessId, token, editingLM, onClose, onSaved,
}: { businessId: string; token: string; editingLM: CaptacionLeadMagnet | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: editingLM?.name || "",
    type: (editingLM?.type || "pdf") as "pdf" | "url" | "code",
    file_url: editingLM?.file_url || "",
    external_url: editingLM?.external_url || "",
    code_value: editingLM?.code_value || "",
    title: editingLM?.title || "",
    description: editingLM?.description || "",
    cta_text: editingLM?.cta_text || "Obtener recurso gratis",
  });

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    let res;
    if (editingLM) {
      res = await fetch(`/api/captacion/lead-magnets/${editingLM.id}`, {
        method: "PUT", headers, body: JSON.stringify({ ...form, status: "active" }),
      });
    } else {
      res = await fetch("/api/captacion/lead-magnets", {
        method: "POST", headers, body: JSON.stringify({ businessId, ...form }),
      });
    }
    if (res.ok) { onSaved(); onClose(); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="w-full max-w-lg rounded-2xl border p-6 space-y-4 overflow-y-auto max-h-[90vh]" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">{editingLM ? "Editar recurso" : "Nuevo recurso — Avanzado"}</h2>
          <button onClick={onClose} className="text-[var(--foreground)]/40 hover:text-[var(--foreground)] text-xl leading-none">×</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Nombre interno *</label>
            <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Tipo</label>
            <div className="grid grid-cols-3 gap-2">
              {(["pdf", "url", "code"] as const).map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`rounded-lg border py-2.5 text-xs font-semibold transition-colors ${form.type === t ? "border-[var(--brand-1)]" : "border-[var(--border)]"}`}
                  style={{ background: form.type === t ? "rgba(57,161,169,0.08)" : "transparent" }}>
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          {form.type === "pdf" && (
            <div>
              <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">URL del PDF</label>
              <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
                value={form.file_url} onChange={e => setForm(f => ({ ...f, file_url: e.target.value }))} placeholder="https://..." />
            </div>
          )}
          {form.type === "url" && (
            <div>
              <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">URL de destino</label>
              <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
                value={form.external_url} onChange={e => setForm(f => ({ ...f, external_url: e.target.value }))} placeholder="https://..." />
            </div>
          )}
          {form.type === "code" && (
            <div>
              <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Código o cupón</label>
              <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent font-mono" style={{ borderColor: "var(--border)" }}
                value={form.code_value} onChange={e => setForm(f => ({ ...f, code_value: e.target.value }))} placeholder="Ej: KONECTA20" />
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Título visible para el cliente</label>
            <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ej: Los 5 errores que ahuyentan clientes" />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Descripción</label>
            <textarea rows={2} className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent resize-none" style={{ borderColor: "var(--border)" }}
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--foreground)]/60 block mb-1">Texto del botón CTA</label>
            <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" style={{ borderColor: "var(--border)" }}
              value={form.cta_text} onChange={e => setForm(f => ({ ...f, cta_text: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border text-sm font-medium" style={{ borderColor: "var(--border)" }}>Cancelar</button>
          <button onClick={save} disabled={saving || !form.name.trim()} className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50" style={{ background: "var(--brand-1)", color: "white" }}>
            {saving ? "Guardando..." : editingLM ? "Guardar cambios" : "Crear recurso"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function LeadMagnetsPage() {
  const [leadMagnets, setLeadMagnets] = useState<CaptacionLeadMagnet[]>([]);
  const [businessId, setBusinessId] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editingLM, setEditingLM] = useState<CaptacionLeadMagnet | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: s } = await supabase.auth.getSession();
      const t = s?.session?.access_token;
      const email = s?.session?.user?.email;
      if (!email || !t) { setLoading(false); return; }
      setToken(t);
      const { data: biz } = await supabase.from("businesses").select("id").eq("contact_email", email).single();
      if (!biz) { setLoading(false); return; }
      setBusinessId(biz.id);
      await loadLMs(biz.id, t);
    };
    load();
  }, []);

  const loadLMs = async (bid: string, tok: string) => {
    const res = await fetch(`/api/captacion/lead-magnets?businessId=${bid}`, {
      headers: { Authorization: `Bearer ${tok}` },
    });
    const data = await res.json();
    setLeadMagnets(data.leadMagnets || []);
    setLoading(false);
  };

  const openEdit = (lm: CaptacionLeadMagnet) => {
    setEditingLM(lm);
    setShowAdvanced(true);
  };

  const deleteLM = async (id: string) => {
    if (!confirm("¿Archivar este recurso?")) return;
    await fetch(`/api/captacion/lead-magnets/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await loadLMs(businessId, token);
  };

  const handleSaved = () => loadLMs(businessId, token);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Recurso de Captación</h1>
        <p className="text-sm mt-1" style={{ color: "var(--brand-1)" }}>
          Crea contenido útil para atraer y captar clientes nuevos
        </p>
      </div>

      {/* Opciones de creación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Asistente */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 md:p-6">
          <div className="text-center mb-4">
            <h2 className="text-lg md:text-xl font-bold">Asistente</h2>
            <p className="text-xs md:text-sm text-[var(--foreground)]/60 mt-2">
              Creación guiada paso a paso. Ideal para empezar rápido.
            </p>
          </div>
          <ul className="text-xs md:text-sm text-[var(--foreground)]/70 space-y-2 mb-6">
            <li className="flex items-center gap-2">
              <span style={{ color: "var(--brand-1)" }}>✓</span> 3 pasos guiados
            </li>
            <li className="flex items-center gap-2">
              <span style={{ color: "var(--brand-1)" }}>✓</span> Tipo, descripción y entrega
            </li>
            <li className="flex items-center gap-2">
              <span style={{ color: "var(--brand-1)" }}>✓</span> Listo en 2 minutos
            </li>
            <li className="flex items-center gap-2">
              <span style={{ color: "var(--brand-1)" }}>✓</span> Fácil de usar
            </li>
          </ul>
          <button
            onClick={() => setShowWizard(true)}
            className="block w-full py-3 text-center rounded-lg font-semibold hover:opacity-90 transition-opacity"
            style={{ background: "var(--brand-4)", color: "black" }}
          >
            Crear Recurso con Asistente
          </button>
        </div>

        {/* Avanzado */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 md:p-6">
          <div className="text-center mb-4">
            <h2 className="text-lg md:text-xl font-bold">Avanzado</h2>
            <p className="text-xs md:text-sm text-[var(--foreground)]/60 mt-2">
              Control total sobre todos los campos del recurso.
            </p>
          </div>
          <ul className="text-xs md:text-sm text-[var(--foreground)]/70 space-y-2 mb-6">
            <li className="flex items-center gap-2">
              <span style={{ color: "var(--brand-1)" }}>✓</span> Todos los campos editables
            </li>
            <li className="flex items-center gap-2">
              <span style={{ color: "var(--brand-1)" }}>✓</span> PDF, enlace o código
            </li>
            <li className="flex items-center gap-2">
              <span style={{ color: "var(--brand-1)" }}>✓</span> Título y CTA personalizados
            </li>
            <li className="flex items-center gap-2">
              <span style={{ color: "var(--brand-1)" }}>✓</span> Control total
            </li>
          </ul>
          <button
            onClick={() => { setEditingLM(null); setShowAdvanced(true); }}
            className="block w-full py-3 text-center rounded-lg font-semibold hover:opacity-90 transition-opacity"
            style={{ background: "var(--brand-1)", color: "white" }}
          >
            Crear Recurso en modo Avanzado
          </button>
        </div>
      </div>

      {/* Lista de recursos generados */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h2 className="text-base md:text-lg font-bold">Recursos de Captación generados</h2>
          <span className="text-xs px-2 py-1 rounded" style={{ background: "rgba(57,161,169,0.15)", color: "var(--brand-1)" }}>
            {leadMagnets.length} recurso{leadMagnets.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-8 text-[var(--foreground)]/50 text-sm">Cargando...</div>
        ) : leadMagnets.length === 0 ? (
          <div className="text-center py-8 text-[var(--foreground)]/50">
            <p>No hay recursos todavía</p>
            <p className="text-sm mt-1">Crea uno usando el Asistente o el modo Avanzado</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[48rem] overflow-y-auto">
            {leadMagnets.map((lm) => (
              <div key={lm.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border"
                style={{ background: "var(--background)", borderColor: "var(--border)" }}>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{lm.title || lm.name}</div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                    <span className="px-2 py-0.5 rounded" style={{ background: "rgba(57,161,169,0.15)", color: "var(--brand-1)" }}>
                      {TYPE_LABELS[lm.type]}
                    </span>
                    <span className={`px-2 py-0.5 rounded ${lm.status === "active" ? "bg-green-500/15 text-green-400" : "bg-yellow-500/15 text-yellow-400"}`}>
                      {lm.status === "active" ? "Activo" : "Borrador"}
                    </span>
                    <span className="text-[var(--foreground)]/40">
                      {lm.delivered_count} entregado{lm.delivered_count !== 1 ? "s" : ""}
                    </span>
                    <span className="text-[var(--foreground)]/40">
                      {new Date(lm.created_at).toLocaleDateString("es-ES")}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:ml-3">
                  {(lm.file_url || lm.external_url) && (
                    <button
                      onClick={() => window.open((lm.file_url || lm.external_url) as string, "_blank")}
                      className="text-xs px-3 py-1 rounded font-bold hover:opacity-90"
                      style={{ background: "var(--brand-4)", color: "black" }}>
                      {lm.type === "pdf" ? "Ver PDF" : "Abrir enlace"}
                    </button>
                  )}
                  {lm.type === "code" && lm.code_value && (
                    <span className="text-xs px-3 py-1 rounded border font-mono" style={{ borderColor: "var(--border)" }}>
                      {lm.code_value}
                    </span>
                  )}
                  <button onClick={() => openEdit(lm)}
                    className="text-xs px-3 py-1 border rounded hover:bg-white/5 transition-colors"
                    style={{ borderColor: "var(--border)" }}>
                    Editar
                  </button>
                  <button onClick={() => deleteLM(lm.id)}
                    className="text-xs px-2 py-1 border border-red-500 text-red-500 rounded hover:bg-red-500/10 transition-colors">
                    Archivar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showWizard && (
        <WizardModal businessId={businessId} token={token} onClose={() => setShowWizard(false)} onSaved={handleSaved} />
      )}
      {showAdvanced && (
        <AdvancedModal businessId={businessId} token={token} editingLM={editingLM} onClose={() => { setShowAdvanced(false); setEditingLM(null); }} onSaved={handleSaved} />
      )}
    </div>
  );
}
