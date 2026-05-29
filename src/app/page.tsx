"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function BusinessLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) { setError("Introduce tu email, teléfono o ID de negocio"); return; }
    if (!password.trim()) { setError("Introduce tu contraseña"); return; }

    setLoading(true);

    let email = identifier.trim();

    // Resolver identificador → email
    if (identifier.startsWith("K3D-")) {
      const { data } = await supabase.from("businesses").select("contact_email").eq("public_id", identifier).single();
      email = data?.contact_email || "";
    } else if (/^\+?[\d\s-]{9,}$/.test(identifier.replace(/\s/g, ""))) {
      const { data } = await supabase.from("businesses").select("contact_email").eq("phone", identifier.replace(/\s/g, "")).single();
      email = data?.contact_email || "";
    } else if (!identifier.includes("@")) {
      const { data } = await supabase.from("businesses").select("contact_email").eq("slug", identifier.toLowerCase().replace(/\s+/g, "-")).single();
      email = data?.contact_email || "";
    }

    if (!email) {
      setError("Negocio no encontrado. Verifica el identificador.");
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      if (authError.message.includes("Invalid login credentials")) {
        setError("Contraseña incorrecta. Contacta con tu gestor de Konecta3D.");
      } else {
        setError("Error de acceso: " + authError.message);
      }
      setLoading(false);
      return;
    }

    router.push("/business/select-profile");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        background: "linear-gradient(145deg, #0a2422 0%, #0f3d3a 50%, #122e2c 100%)",
      }}
    >
      {/* ── Card ── */}
      <div
        className="w-full max-w-sm rounded-2xl p-8 space-y-6 relative overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.10)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        }}
      >
        {/* Decorative circle */}
        <div
          className="absolute -top-16 -right-16 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: "rgba(197,160,89,0.08)" }}
        />

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
            style={{ background: "#C5A059", color: "#0f3d3a" }}
          >
            K
          </div>
          <span
            className="text-sm font-bold tracking-widest uppercase"
            style={{ color: "#C5A059" }}
          >
            Konecta3D
          </span>
        </div>

        {/* Headline */}
        <div>
          <h1 className="text-2xl font-bold text-white leading-tight">
            Accede a tu<br />panel de negocio
          </h1>
          <p className="text-sm mt-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
            Gestiona tu presencia digital y captación de leads.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
              Email
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && passwordRef.current?.focus()}
              placeholder="tu@email.com"
              autoComplete="email"
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 transition-all"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                caretColor: "#C5A059",
              }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(197,160,89,0.6)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
              Contraseña
            </label>
            <div className="relative">
              <input
                ref={passwordRef}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full px-4 py-3 pr-14 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  caretColor: "#C5A059",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(197,160,89,0.6)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
              />
              <button
                type="button"
                onMouseDown={() => setShowPassword(true)}
                onMouseUp={() => setShowPassword(false)}
                onMouseLeave={() => setShowPassword(false)}
                onTouchStart={() => setShowPassword(true)}
                onTouchEnd={() => setShowPassword(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs rounded-lg transition-colors select-none"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                {showPassword ? "Ocultar" : "Ver"}
              </button>
            </div>
          </div>

          {error && (
            <div
              className="text-sm px-4 py-3 rounded-xl"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#fca5a5",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 active:scale-[0.98]"
            style={{
              background: loading ? "rgba(197,160,89,0.5)" : "#C5A059",
              color: "#0f3d3a",
              boxShadow: loading ? "none" : "0 4px 20px rgba(197,160,89,0.3)",
            }}
          >
            {loading ? "Verificando…" : "Entrar →"}
          </button>
        </form>

        {/* Help text */}
        <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
          ¿Problemas de acceso? Contacta con{" "}
          <a
            href="https://wa.me/34623759451?text=Hola, necesito ayuda para acceder a mi panel"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-colors hover:text-white/50"
            style={{ color: "rgba(197,160,89,0.6)" }}
          >
            soporte
          </a>
          .
        </p>
      </div>

      {/* Admin access — very discreet */}
      <a
        href="/login"
        className="mt-8 text-xs transition-colors"
        style={{ color: "rgba(255,255,255,0.15)" }}
        onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.35)")}
        onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.15)")}
      >
        Acceso administrador
      </a>
    </div>
  );
}
