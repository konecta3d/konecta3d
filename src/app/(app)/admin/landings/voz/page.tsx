"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { AiBrain, DEFAULT_AI_BRAIN } from "@/lib/landing/ai-brain";

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${data.session?.access_token || ""}`, "Content-Type": "application/json" };
}

const Lbl = ({ children }: { children: React.ReactNode }) =>
  <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/50 mb-1">{children}</label>;
const ta = "w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm";

export default function VozPage() {
  const [brain, setBrain] = useState<AiBrain>(DEFAULT_AI_BRAIN);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/landings/ai-brain", { headers: await authHeaders() });
        const json = await res.json();
        if (json.brain) setBrain({ ...DEFAULT_AI_BRAIN, ...json.brain });
      } catch { /* */ }
      setLoading(false);
    })();
  }, []);

  async function save() {
    setSaving(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/landings/ai-brain", { method: "PUT", headers: await authHeaders(), body: JSON.stringify({ brain }) });
      const json = await res.json();
      setMsg(json.error ? json.error : "Guardado ✓");
    } catch { setMsg("No se pudo guardar"); }
    setSaving(false);
  }
  async function restore() {
    if (!confirm("¿Restaurar la voz por defecto? Perderás tus cambios.")) return;
    setBrain(DEFAULT_AI_BRAIN);
    await fetch("/api/admin/landings/ai-brain", { method: "DELETE", headers: await authHeaders() });
    setMsg("Restaurado a valores por defecto");
  }

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><div className="animate-spin rounded-full h-9 w-9 border-b-2" style={{ borderColor: "var(--brand-1)" }} /></div>;

  return (
    <div className="max-w-[820px] mx-auto pb-12 space-y-5">
      <div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-xl font-bold">Voz y copy de Konecta (IA)</h1>
          <div className="flex items-center gap-2">
            <button onClick={restore} className="text-xs px-3 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/10">Restaurar</button>
            <button onClick={save} disabled={saving} className="text-sm px-4 py-2 rounded-lg font-semibold text-black disabled:opacity-50" style={{ background: "var(--brand-4)" }}>{saving ? "Guardando…" : "Guardar"}</button>
          </div>
        </div>
        <p className="text-sm text-[var(--foreground)]/50 mt-1">Esto es lo que el generador de IA usa para que las landings suenen a Konecta y le hablen a tu cliente ideal. Cuanto más concreto, menos genérico el resultado.</p>
        {msg && <p className="text-sm text-[var(--brand-1)] mt-1">{msg}</p>}
      </div>

      <div className="rounded-xl border border-[var(--border)] p-4 space-y-3" style={{ background: "var(--card)" }}>
        <div><Lbl>Producto / servicio (en tus palabras)</Lbl><textarea value={brain.product} onChange={(e) => setBrain({ ...brain, product: e.target.value })} rows={4} className={ta} /></div>
        <div><Lbl>A quién le hablamos</Lbl><textarea value={brain.audience} onChange={(e) => setBrain({ ...brain, audience: e.target.value })} rows={3} className={ta} /></div>
        <div><Lbl>Voz y tono (personalidad de Konecta)</Lbl><textarea value={brain.voice} onChange={(e) => setBrain({ ...brain, voice: e.target.value })} rows={4} className={ta} /></div>
      </div>

      <div className="rounded-xl border border-[var(--border)] p-4 space-y-3" style={{ background: "var(--card)" }}>
        <div><Lbl>Palabras que SÍ usamos (separadas por comas)</Lbl>
          <input value={brain.wordsYes.join(", ")} onChange={(e) => setBrain({ ...brain, wordsYes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} className={ta} />
        </div>
        <div><Lbl>Palabras que EVITAMOS (separadas por comas)</Lbl>
          <input value={brain.wordsNo.join(", ")} onChange={(e) => setBrain({ ...brain, wordsNo: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} className={ta} />
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] p-4 space-y-2" style={{ background: "var(--card)" }}>
        <Lbl>Reglas de estilo</Lbl>
        {brain.rules.map((r, i) => (
          <div key={i} className="flex gap-1">
            <input value={r} onChange={(e) => { const rules = [...brain.rules]; rules[i] = e.target.value; setBrain({ ...brain, rules }); }} className={ta} />
            <button onClick={() => setBrain({ ...brain, rules: brain.rules.filter((_, j) => j !== i) })} className="px-2 text-red-500/70 hover:text-red-500">✕</button>
          </div>
        ))}
        <button onClick={() => setBrain({ ...brain, rules: [...brain.rules, ""] })} className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/10">+ Añadir regla</button>
      </div>

      <div className="rounded-xl border border-[var(--border)] p-4 space-y-3" style={{ background: "var(--card)" }}>
        <div>
          <Lbl>Ejemplos &quot;así sí / así no&quot;</Lbl>
          <p className="text-[11px] text-[var(--foreground)]/40 mb-2">Lo más potente para que no suene genérico: muéstrale cómo NO y cómo SÍ.</p>
        </div>
        {brain.examples.map((ex, i) => (
          <div key={i} className="rounded-lg border border-[var(--border)] p-2 space-y-1" style={{ background: "var(--background)" }}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--foreground)]/40">Ejemplo {i + 1}</span>
              <button onClick={() => setBrain({ ...brain, examples: brain.examples.filter((_, j) => j !== i) })} className="text-red-500/70 hover:text-red-500 text-xs">✕</button>
            </div>
            <input value={ex.malo} placeholder="❌ Genérico / corporativo" onChange={(e) => { const examples = [...brain.examples]; examples[i] = { ...examples[i], malo: e.target.value }; setBrain({ ...brain, examples }); }} className={ta} />
            <input value={ex.bueno} placeholder="✅ Cómo lo dice Konecta" onChange={(e) => { const examples = [...brain.examples]; examples[i] = { ...examples[i], bueno: e.target.value }; setBrain({ ...brain, examples }); }} className={ta} />
          </div>
        ))}
        <button onClick={() => setBrain({ ...brain, examples: [...brain.examples, { malo: "", bueno: "" }] })} className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]/10">+ Añadir ejemplo</button>
      </div>

      <p className="text-xs text-[var(--foreground)]/40">El detalle de tu cliente ideal (dolores, deseos, objeciones) se edita en <Link href="/admin/crm/cliente-ideal" className="text-[var(--brand-1)] hover:underline">Cliente ideal</Link> y también lo usa el generador.</p>
    </div>
  );
}
