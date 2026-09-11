"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useContextoSection<T>(sectionKey: string, defaultValue: T) {
  const [data, setData] = useState<T>(defaultValue);
  const [businessId, setBusinessId] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // Evita autoguardar durante la carga inicial (solo cuando el usuario edita)
  const initialLoadDone = useRef(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: s } = await supabase.auth.getSession();
      const tok = s?.session?.access_token;
      const email = s?.session?.user?.email;
      if (!email || !tok) { setLoading(false); return; }
      setToken(tok);
      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("contact_email", email)
        .single();
      if (!biz) { setLoading(false); return; }
      setBusinessId(biz.id);
      const res = await fetch(`/api/captacion/context?businessId=${biz.id}`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const json = await res.json();
      if (json.context?.[sectionKey] !== undefined) {
        setData(json.context[sectionKey] as T);
      }
      setLoading(false);
      // Marcar carga completada en el siguiente tick para que el efecto de
      // autoguardado no dispare por el setData de la carga.
      setTimeout(() => { initialLoadDone.current = true; }, 0);
    };
    load();
  }, [sectionKey]);

  // Autoguardado con debounce: 1.2s tras el último cambio del usuario.
  useEffect(() => {
    if (!initialLoadDone.current || !businessId) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => { void save(); }, 1200);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
    // save es estable (no depende de render); solo re-disparamos con data
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, businessId]);

  const save = async (dataToSave?: T) => {
    if (!businessId || !token) return;
    setSaving(true);
    try {
      await fetch("/api/captacion/context", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ businessId, sectionKey, sectionData: dataToSave ?? data }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return { data, setData, businessId, token, loading, saving, saved, save };
}
