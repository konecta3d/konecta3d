"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
}

/**
 * Avisos del negocio (referidos, etc.) en el panel.
 * Se sirve por /api/mi-negocio/notifications (service role tras verificar propiedad).
 * Si no hay avisos, no renderiza nada — no ocupa espacio hasta que haya algo que decir.
 */
export default function BusinessNotifications({ businessId }: { businessId: string }) {
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  const token = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || "";
  };

  useEffect(() => {
    if (!businessId) return;
    (async () => {
      try {
        const res = await fetch(`/api/mi-negocio/notifications?businessId=${businessId}`, {
          headers: { Authorization: `Bearer ${await token()}` },
        });
        const data = await res.json();
        if (Array.isArray(data.notifications)) setItems(data.notifications);
        setUnread(data.unread || 0);
      } catch {
        /* silencioso */
      } finally {
        setLoading(false);
      }
    })();
  }, [businessId]);

  const markAllRead = async () => {
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    setUnread(0);
    try {
      await fetch("/api/mi-negocio/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
        body: JSON.stringify({ businessId }),
      });
    } catch {
      /* silencioso */
    }
  };

  if (loading || items.length === 0) return null;

  const shown = expanded ? items : items.slice(0, 4);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 md:p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[var(--foreground)]">Recomendaciones</span>
          {unread > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ea580c] text-white">
              {unread} nueva{unread > 1 ? "s" : ""}
            </span>
          )}
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="text-xs text-[#39a1a9] font-bold whitespace-nowrap">
            Marcar como leídas
          </button>
        )}
      </div>

      <div className="space-y-2">
        {shown.map((n) => (
          <div
            key={n.id}
            className={`rounded-lg border px-3 py-2 ${n.read ? "border-[var(--border)]" : "border-[#ea580c]/40 bg-[#ea580c]/5"}`}
          >
            <div className="text-sm font-semibold text-[var(--foreground)]">{n.title}</div>
            {n.body && <div className="text-xs text-[var(--foreground)]/60 mt-0.5">{n.body}</div>}
          </div>
        ))}
      </div>

      {items.length > 4 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-xs text-[var(--foreground)]/50 hover:text-[var(--foreground)]"
        >
          {expanded ? "Ver menos" : `Ver todas (${items.length})`}
        </button>
      )}
    </div>
  );
}
