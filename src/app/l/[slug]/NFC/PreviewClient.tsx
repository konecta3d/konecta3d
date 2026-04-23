"use client";
import { useEffect, useState } from "react";
import LandingRenderer from "@/components/LandingRenderer";
import { supabase } from "@/lib/supabase";
export default function PreviewClient() {
  const [config, setConfig] = useState<any>(null);
  const [toolsEnabled, setToolsEnabled] = useState(true);
  const [bid, setBid] = useState("");
  useEffect(() => {
    const stored = localStorage.getItem("konecta-landing-preview");
    if (stored) {
      setConfig(JSON.parse(stored));
    }
  }, []);
  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userEmail = sessionData?.session?.user?.email || "";
      if (!userEmail) { setBid(""); return; }
      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("contact_email", userEmail)
        .single();
      setBid(biz?.id || "");
    };
    load();
  }, []);
  useEffect(() => {
    if (!bid) return;
    const load = async () => {
      try {
        const { data } = await supabase
          .from("businesses")
          .select("module_tools")
          .eq("id", bid)
          .single();
        if (data) setToolsEnabled(!!data.module_tools);
      } catch {
        setToolsEnabled(true);
      }
    };
    load();
  }, [bid]);
  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[var(--brand-1)]">
        No hay datos de vista previa.
      </div>
    );
  }
  return <LandingRenderer config={config} toolsEnabled={toolsEnabled} />;
}
