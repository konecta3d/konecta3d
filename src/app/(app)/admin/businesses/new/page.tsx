"use client";

import { useState } from "react";

export default function NewBusinessPage() {
  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const generarPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }
    setPassword(pass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const res = await fetch("/api/admin/create-business", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, sector, email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Error al crear negocio");
    } else {
      setSuccess("Negocio creado. Copia la contraseña y envíala al cliente.");
      setTimeout(() => (window.location.href = "/admin/businesses"), 1200);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Crear negocio</h1>
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div>
          <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">Nombre</label>
          <input className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">Sector o empresa</label>
          <input className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2" value={sector} onChange={(e) => setSector(e.target.value)} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">Email del negocio</label>
          <input className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-[var(--brand-1)]">Contraseña</label>
          <div className="flex gap-2">
            <input className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" onClick={generarPassword} className="mt-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
              Generar
            </button>
          </div>
        </div>
        <div className="md:col-span-2">
          <button disabled={saving} className="rounded-lg bg-[var(--brand-4)] px-4 py-2 font-semibold text-black">
            {saving ? "Creando…" : "Crear"}
          </button>
          {error && <div className="mt-2 text-sm text-red-500">{error}</div>}
          {success && <div className="mt-2 text-sm text-green-600">{success}</div>}
        </div>
      </form>
    </div>
  );
}
