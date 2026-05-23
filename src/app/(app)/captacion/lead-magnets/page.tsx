"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { CaptacionLeadMagnet } from "@/types/captacion";
import CaptacionChatPanel from "@/components/captacion/CaptacionChatPanel";
import ErrorBanner from "@/components/ui/ErrorBanner";

const TYPE_LABELS: Record<string, string> = { pdf: "PDF", url: "Enlace", code: "Código" };

export default function LeadMagnetsPage() {
  const [leadMagnets, setLeadMagnets] = useState<CaptacionLeadMagnet[]>([]);
  const [businessId, setBusinessId] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: s } = await supabase.auth.getSession();
      const t = s?.session?.access_token;
      const email = s?.session?.user?.email;
      if (!email || !t) { setLoading(false); return; }
      setToken(t);
      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("contact_email", email)
        .single();
      if (!biz) { setLoading(false); return; }
      setBusinessId(biz.id);
      await loadLMs(biz.id, t);
    };
    load();
  }, []);

  const loadLMs = async (bid: string, tok: string) => {
    try {
      const res = await fetch(`/api/captacion/lead-magnets?businessId=${bid}`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (!res.ok) throw new Error("No se pudieron cargar los recursos. Recarga la página.");
      const data = await res.json();
      setLeadMagnets(data.leadMagnets || []);
    } catch (e) {
      setPageError(e instanceof Error ? e.message : "Error al cargar los recursos.");
    } finally {
      setLoading(false);
    }
  };

  const deleteLM = async (id: string) => {
    if (!confirm("¿Archivar este recurso?")) return;
    try {
      const res = await fetch(`/api/captacion/lead-magnets/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudo eliminar el recurso.");
      await loadLMs(businessId, token);
    } catch (e) {
      setPageError(e instanceof Error ? e.message : "Error al eliminar el recurso.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <ErrorBanner message={pageError} onDismiss={() => setPageError(null)} />

      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold">Lead Magnets de Captación</h1>
        <p className="text-sm mt-1" style={{ color: "var(--brand-1)" }}>
          Crea recursos para atraer y captar clientes nuevos
        </p>
      </div>

      {/* CTA Asistente */}
      <div
        className="rounded-xl p-4 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        style={{ border: "1px solid var(--border)", background: "var(--card)" }}
      >
        <div>
          <h2 className="text-lg font-bold mb-1">Crear nuevo recurso</h2>
          <p className="text-xs text-[var(--foreground)]/60">
            El asistente te guía en 4 pasos: tipo de recurso, contenido, vista previa y publicación.
          </p>
        </div>
        <Link
          href="/captacion/lead-magnets/wizard"
          className="shrink-0 px-6 py-3 text-center rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm"
          style={{ background: "var(--brand-4)", color: "black" }}
        >
          + Nuevo recurso
        </Link>
      </div>

      {/* List section */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h2 className="text-base md:text-lg font-bold">Recursos creados</h2>
          <span
            className="text-xs px-2 py-1 rounded self-start sm:self-auto"
            style={{ background: "rgba(57,161,169,0.2)", color: "var(--brand-1)" }}
          >
            {leadMagnets.length} recurso{leadMagnets.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-8 text-[var(--foreground)]/50 text-sm">
            Cargando...
          </div>
        ) : leadMagnets.length === 0 ? (
          <div className="text-center py-8 text-[var(--foreground)]/50">
            <p>No hay recursos todavía</p>
            <p className="text-sm mt-1">Crea tu primer recurso con el Asistente</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[48rem] overflow-y-auto">
            {leadMagnets.map((lm) => (
              <div
                key={lm.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border"
                style={{ background: "var(--background)", borderColor: "var(--border)" }}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{lm.title || lm.name}</div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                    <span
                      className="px-2 py-0.5 rounded"
                      style={{ background: "rgba(57,161,169,0.15)", color: "var(--brand-1)" }}
                    >
                      {TYPE_LABELS[lm.type]}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded ${
                        lm.status === "active"
                          ? "bg-green-500/15 text-green-400"
                          : "bg-yellow-500/15 text-yellow-400"
                      }`}
                    >
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
                  {lm.type !== "code" && (lm.file_url || lm.external_url) && (
                    <button
                      onClick={() =>
                        window.open((lm.file_url || lm.external_url) as string, "_blank")
                      }
                      className="text-xs px-3 py-1 rounded font-bold hover:opacity-90 transition-opacity"
                      style={{ background: "var(--brand-4)", color: "black" }}
                    >
                      {lm.type === "pdf" ? "Ver PDF" : "Abrir enlace"}
                    </button>
                  )}
                  {lm.type === "code" && lm.code_value && (
                    <span
                      className="text-xs px-3 py-1 rounded border font-mono"
                      style={{ borderColor: "var(--border)" }}
                    >
                      {lm.code_value}
                    </span>
                  )}
                  <Link
                    href={`/captacion/lead-magnets/wizard?edit=${lm.id}`}
                    className="text-xs px-3 py-1 border rounded hover:bg-white/5 transition-colors"
                    style={{ borderColor: "var(--border)" }}
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => deleteLM(lm.id)}
                    className="text-xs px-2 py-1 border border-red-500 text-red-500 rounded hover:bg-red-500/10 transition-colors"
                  >
                    Archivar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Asistente IA ── */}
      {businessId && token && (
        <CaptacionChatPanel
          section="lead_magnets"
          businessId={businessId}
          token={token}
        />
      )}
    </div>
  );
}
