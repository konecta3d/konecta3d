"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { DEFAULT_LOGIN_CONFIG, LoginPageConfig } from "@/lib/login-page-config";

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if (isNaN(r)) return `rgba(0,0,0,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function BusinessLoginPage() {
  const router = useRouter();
  const [cfg, setCfg] = useState<LoginPageConfig>(DEFAULT_LOGIN_CONFIG);

  // Carga la config desde el servidor (sin auth)
  useEffect(() => {
    fetch("/api/login-page-config")
      .then((r) => r.json())
      .then((json) => {
        if (json.config) setCfg({ ...DEFAULT_LOGIN_CONFIG, ...json.config });
      })
      .catch(() => {});
  }, []);

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

  // Calcula el fondo según la config
  let pageBg: string;
  if (cfg.bg_type === "solid") pageBg = cfg.bg_color_1;
  else if (cfg.bg_type === "image" && cfg.bg_image_url)
    pageBg = `url('${cfg.bg_image_url}') center/cover no-repeat fixed`;
  else
    pageBg = `linear-gradient(${cfg.bg_angle}deg, ${cfg.bg_color_1} 0%, ${cfg.bg_color_2} 100%)`;

  const brandColor  = cfg.brand_color || "#C5A059";
  const btnBg       = cfg.button_color || brandColor;
  const btnTxt      = cfg.button_text_color || "#0f3d3a";
  const subtextRgba = hexToRgba(cfg.subtext_color || "#ffffff", cfg.subtext_opacity ?? 0.45);
  const headlineLines = (cfg.headline || "").split("\n");

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative"
      style={{ background: pageBg }}
    >
      {/* Overlay cuando es imagen */}
      {cfg.bg_type === "image" && cfg.bg_image_url && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: hexToRgba(cfg.bg_overlay_color || "#000", cfg.bg_overlay ?? 0.45)
        }} />
      )}

      {/* ── Card ── */}
      <div
        className="w-full max-w-sm rounded-2xl p-8 space-y-6 relative overflow-hidden z-10"
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
          style={{ background: hexToRgba(brandColor, 0.08) }}
        />

        {/* Logo */}
        {cfg.logo_type === "image" && cfg.logo_url ? (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cfg.logo_url}
              alt={cfg.brand_name || "Logo"}
              style={{ height: cfg.logo_height || 40, maxWidth: "100%", objectFit: "contain", display: "block" }}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
              style={{ background: brandColor, color: btnTxt }}
            >
              {(cfg.brand_name || "K").charAt(0)}
            </div>
            <span className="text-sm font-bold tracking-widest uppercase" style={{ color: brandColor }}>
              {cfg.brand_name || "KONECTA3D"}
            </span>
          </div>
        )}

        {/* Headline */}
        <div>
          <h1 className="text-2xl font-bold leading-tight" style={{ color: cfg.headline_color || "#ffffff" }}>
            {headlineLines.map((line, i) => (
              <span key={i}>{line}{i < headlineLines.length - 1 && <br />}</span>
            ))}
          </h1>
          <p className="text-sm mt-1.5" style={{ color: subtextRgba }}>
            {cfg.subtext}
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
              background: loading ? hexToRgba(btnBg, 0.5) : btnBg,
              color: btnTxt,
              boxShadow: loading ? "none" : `0 4px 20px ${hexToRgba(btnBg, 0.3)}`,
            }}
          >
            {loading ? "Verificando…" : cfg.button_text || "Entrar →"}
          </button>
        </form>

        {/* Help text */}
        <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
          ¿Problemas de acceso? Contacta con{" "}
          <a
            href={`https://wa.me/${cfg.support_phone}?text=Hola, necesito ayuda para acceder a mi panel`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-colors"
            style={{ color: hexToRgba(brandColor, 0.7) }}
          >
            {cfg.support_label || "soporte"}
          </a>
          .
        </p>
      </div>

      {/* Admin access — very discreet */}
      <a
        href="/login"
        className="mt-8 text-xs transition-colors z-10"
        style={{ color: "rgba(255,255,255,0.15)" }}
        onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.35)")}
        onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.15)")}
      >
        Acceso administrador
      </a>
    </div>
  );
}
