"use client";

import { useEffect, useState } from "react";
import LandingRenderer from "@/components/LandingRenderer";
import { supabase } from "@/lib/supabase";

export default function PreviewClient() {
  const [config, setConfig] = useState<any>(null);
  const [toolsEnabled, setToolsEnabled] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("konecta-landing-preview");
    if (stored) {
      setConfig(JSON.parse(stored));
    }

    const bid = localStorage.getItem("konecta-business-id");
    if (bid) {
      supabase
        .from("businesses")
        .select("module_tools")
        .eq("id", bid)
        .single()
        .then(({ data }) => {
          if (data) setToolsEnabled(!!data.module_tools);
        })
        .catch(() => setToolsEnabled(true));
    }
  }, []);

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[var(--brand-1)]">
        No hay datos de vista previa.
      </div>
    );
  }

  return <LandingRenderer config={config} toolsEnabled={toolsEnabled} />;
}
