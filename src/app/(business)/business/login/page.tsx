"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function BusinessLogin() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    setMsg(null);

    if (!identifier.trim()) {
      setMsg("Introduce tu email, teléfono o ID de negocio");
      return;
    }
    if (!password.trim()) {
      setMsg("Introduce tu contraseña");
      return;
    }

    let email = identifier.trim();
    
    // Verificar si es un ID de negocio (K3D-xxx)
    if (identifier.startsWith("K3D-")) {
      const { data } = await supabase
        .from("businesses")
        .select("contact_email")
        .eq("public_id", identifier)
        .single();
      email = data?.contact_email || "";
    }
    // Verificar si es un número de teléfono
    else if (/^\+?[\d\s-]{9,}$/.test(identifier.replace(/\s/g, ""))) {
      const { data } = await supabase
        .from("businesses")
        .select("contact_email")
        .eq("phone", identifier.replace(/\s/g, ""))
        .single();
      email = data?.contact_email || "";
    }
    // Si no tiene @, podría ser un email parcial - buscar por nombre
    else if (!identifier.includes("@")) {
      const { data } = await supabase
        .from("businesses")
        .select("contact_email")
        .eq("slug", identifier.toLowerCase().replace(/\s+/g, "-"))
        .single();
      email = data?.contact_email || "";
    }
    // Otherwise assume it's an email
    else {
      email = identifier;
    }

    if (!email) {
      setMsg("Negocio no encontrado. Verifica el identificador usado.");
      return;
    }

    setMsg("Verificando...");
    
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("Login error:", error);
      // Mostrar mensaje más específico
      if (error.message.includes("Invalid login credentials")) {
        setMsg("Contraseña incorrecta. Usa el botón '🔑' en Admin para generar una nueva contraseña.");
      } else if (error.message.includes("User not found")) {
        setMsg("Usuario no existe. Contacta al administrador para crear tu acceso.");
      } else {
        setMsg("Error: " + error.message);
      }
      return;
    }

    // Login exitoso
    const businessId = localStorage.getItem("konecta-business-id");
    
    if (!remember) {
      await supabase.auth.setSession({ access_token: (await supabase.auth.getSession()).data.session?.access_token || "", refresh_token: "" });
    }

    localStorage.setItem("konecta-role", "business");
    window.location.href = "/business/dashboard";
  };

  return (
    <div className="max-w-md mx-auto rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Acceso negocios</h1>
      <div>
        <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">EMAIL, TELÉFONO O ID</label>
        <input className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="ej@email.com / +34 600 000 000 / K3D-XXXXX" />
      </div>
      <div>
        <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">Contraseña</label>
        <input type="password" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        Recordar sesión
      </label>
      <button onClick={handleLogin} className="rounded-lg bg-[var(--brand-4)] px-4 py-2 font-semibold text-black w-full">Entrar</button>
      {msg && <div className="text-sm text-red-400">{msg}</div>}
    </div>
  );
}
