"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useContextoSection<T>(sectionKey: string, defaultValue: T) {
  const [data, setData] = useState<T>(defaultValue);
  const [businessId, setBusinessId] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
    };
    load();
  }, [sectionKey]);

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
