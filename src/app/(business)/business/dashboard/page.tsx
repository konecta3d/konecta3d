"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function BusinessDashboard() {
  const [name, setName] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: session } = await supabase.auth.getSession();
      const user = session.session?.user;
      
      if (!user) {
        window.location.href = "/business/login";
        return;
      }

      const isFromAdmin = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("from") === "admin";

      let biz: { id: string; name: string | null } | null = null;

      if (isFromAdmin) {
        // Impersonación desde el panel admin: usar el business_id almacenado
        const storedId = typeof window !== "undefined" ? localStorage.getItem("konecta-business-id") : null;
        if (!storedId) {
          window.location.href = "/business/login";
          return;
        }
        const { data } = await supabase
          .from("businesses")
          .select("id,name")
          .eq("id", storedId)
          .single();
        biz = data as any;
      } else {
        // Acceso normal: buscar negocio por user_id o email
        const { data } = await supabase
          .from("businesses")
          .select("id,name")
          .eq("user_id", user.id)
          .single();
        biz = data as any;

        if (!biz && user.email) {
          const { data: bizByEmail } = await supabase
            .from("businesses")
            .select("id,name")
            .eq("contact_email", user.email)
            .single();
          biz = bizByEmail as any;
        }
      }

      if (!biz) {
        window.location.href = "/business/login";
        return;
      }
      
      setBusinessId(biz.id);
      setName(biz.name || "Negocio");
      localStorage.setItem("konecta-business-id", biz.id);
      localStorage.setItem("konecta-role", "business");
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return <div className="p-6 text-white">Cargando...</div>;
  }

  // Una vez autenticado y con businessId, redirigimos directamente a Estadísticas
  if (typeof window !== "undefined" && businessId) {
    window.location.href = "/mi-negocio/estadisticas";
    return null;
  }

  return null;
}
