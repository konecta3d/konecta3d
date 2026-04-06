"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    const userEmail = data.user?.email || "";
    if (userEmail.toLowerCase() !== "info@konecta3d.com") {
      // No permitimos acceso al panel admin a otros usuarios
      setError("Este usuario no tiene acceso al panel de administración.");
      setLoading(false);
      await supabase.auth.signOut();
      return;
    }

    localStorage.setItem("konecta-role", "admin");
    router.push("/admin/dashboard");
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[var(--brand-2)]">Konecta3D</h1>
        <p className="mt-2 text-sm text-[var(--brand-1)]">Acceso a herramientas</p>
      </div>
      <form className="space-y-4" onSubmit={handleLogin}>
        <div>
          <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">Email</label>
          <input
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">Contraseña</label>
          <input
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--brand-4)] px-4 py-2 font-semibold text-black disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
