"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function PerfilPage() {
  const router = useRouter();
  const [businessId, setBusinessId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState("datos");

  // Datos del negocio
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  // Stats
  const [stats, setStats] = useState({
    landings: 0,
    leadMagnets: 0,
    benefits: 0,
    leads: 0,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/business/login?redirect=/mi-negocio/perfil");
        return;
      }

      const userEmail = session.user?.email || "";
      if (!userEmail) {
        router.push("/business/login?redirect=/mi-negocio/perfil");
        return;
      }

      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("contact_email", userEmail)
        .single();

      if (!biz?.id) {
        router.push("/business/login?redirect=/mi-negocio/perfil");
        return;
      }

      setBusinessId(biz.id);
      setCheckingAuth(false);
      loadData(biz.id);
    };

    checkAuth();
  }, [router]);

  const loadData = async (bid: string) => {
    // Cargar datos del negocio
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", bid)
      .single();

    if (data) {
      setName(data.name || "");
      setSlug(data.slug || "");
      setDescription(data.description || "");
      setPhone(data.phone || "");
      setEmail(data.contact_email || "");
      setAddress(data.address || "");
      setLogoUrl(data.logo_url || "");
    }

    // Cargar estadísticas
    const [landingsRes, leadsRes, benefitsRes] = await Promise.all([
      supabase.from("landing_configs").select("id", { count: "exact" }).eq("business_id", bid),
      supabase.from("leads").select("id", { count: "exact" }).eq("business_id", bid),
      supabase.from("benefits").select("id", { count: "exact" }).eq("business_id", bid),
    ]);

    setStats({
      landings: landingsRes.count || 0,
      leadMagnets: 0,
      benefits: benefitsRes.count || 0,
      leads: leadsRes.count || 0,
    });
  };

  const saveBusiness = async () => {
    if (!businessId) return;
    setLoading(true);

    const { error } = await supabase
      .from("businesses")
      .update({
        name,
        slug,
        description,
        phone,
        address,
      })
      .eq("id", businessId);

    setLoading(false);
    if (!error) {
      setSaved(true);
      setMsg("Datos guardados correctamente");
      setTimeout(() => setSaved(false), 2000);
    } else {
      setMsg("Error al guardar: " + error.message);
    }
    setTimeout(() => setMsg(""), 3000);
  };

  const handleLogoUpload = async (file: File) => {
    if (!businessId) return;
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", "logo");
    formData.append("businessId", businessId);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/landing/upload", {
        method: "POST",
        headers: { "Authorization": `Bearer ${session?.access_token || ""}` },
        body: formData,
      });
      const data = await res.json();
      
      if (data.url) {
        await supabase.from("businesses").update({ logo_url: data.url }).eq("id", businessId);
        setLogoUrl(data.url);
        setMsg("Logo actualizado");
      } else if (data.error) {
        setMsg("Error: " + data.error);
      }
    } catch (err) {
      setMsg("Error al subir logo");
    }
    setTimeout(() => setMsg(""), 3000);
  };

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-4)] mx-auto mb-4"></div>
          <p className="text-white">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-xl md:text-2xl font-bold">Mi Perfil</h1>
        <p className="text-sm text-white">Gestiona los datos de tu negocio</p>
      </div>

      {/* Mensaje */}
      {msg && (
        <div className={`rounded-lg p-3 text-center ${msg.includes("Error") || msg.includes("error") || msg.includes("no") ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-2">
        <button
          onClick={() => setActiveTab("datos")}
          className={`px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${activeTab === "datos" ? "bg-[var(--brand-4)] text-black" : "text-[var(--foreground)] hover:text-[var(--brand-1)]"}`}
        >
          Datos del Negocio
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${activeTab === "stats" ? "bg-[var(--brand-4)] text-black" : "text-[var(--foreground)] hover:text-[var(--brand-1)]"}`}
        >
          Estadísticas
        </button>
      </div>

      {/* Tab: Datos del Negocio */}
      {activeTab === "datos" && (
        <div className="space-y-6">
          {/* Logo */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-semibold mb-4">Logo</h2>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-[var(--border)] flex items-center justify-center overflow-hidden bg-[var(--background)]">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : name ? (
                  <span className="text-3xl font-bold text-[var(--brand-1)]">{name.charAt(0).toUpperCase()}</span>
                ) : (
                  <span className="text-2xl">+</span>
                )}
              </div>
              <div className="flex-1">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] hover:bg-white/5 transition-colors">
                  <span>Subir logo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} />
                </label>
                <p className="text-xs text-white mt-2">PNG, JPG o SVG. Máximo 2MB.</p>
              </div>
            </div>
          </div>

          {/* Datos básicos */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
            <h2 className="text-lg font-semibold">Datos básicos</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-wide font-bold text-[var(--brand-4)] block mb-2">Nombre del negocio</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide font-bold text-[var(--brand-4)] block mb-2">Slug (enlace)</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                  <span className="text-xs text-white whitespace-nowrap">konecta3d.com/l/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full flex-1 rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide font-bold text-[var(--brand-4)] block mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide font-bold text-[var(--brand-4)] block mb-2">Email de contacto</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 opacity-50"
                />
                <p className="text-xs text-white mt-1">El email no se puede cambiar</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide font-bold text-[var(--brand-4)] block mb-2">Descripción</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
                  placeholder="Descripción de tu negocio..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide font-bold text-[var(--brand-4)] block mb-2">Dirección</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
                />
              </div>
            </div>

            <button
              onClick={saveBusiness}
              disabled={loading}
              className="px-6 py-3 rounded-lg bg-[var(--brand-4)] text-black font-medium hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Guardando..." : saved ? "Guardado" : "Guardar cambios"}
            </button>
          </div>

          {/* Info de contraseña */}
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-6">
            <h2 className="text-lg font-semibold mb-2">Contraseña de acceso</h2>
            <p className="text-sm text-white mb-4">
              Si necesitas cambiar tu contraseña, contacta con el administrador de Konecta3D.
            </p>
            <a
              href="https://wa.me/34623759451"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1ebe5d] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Contactar con Konecta3D
            </a>
          </div>
        </div>
      )}

      {/* Tab: Estadísticas */}
      {activeTab === "stats" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-center">
              <div className="text-3xl font-bold text-[var(--brand-1)]">{stats.landings}</div>
              <div className="text-xs text-white">Landings</div>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-center">
              <div className="text-3xl font-bold text-green-500">{stats.leadMagnets}</div>
              <div className="text-xs text-white">Lead Magnets</div>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-center">
              <div className="text-3xl font-bold text-blue-500">{stats.benefits}</div>
              <div className="text-xs text-white">Beneficios VIP</div>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-center">
              <div className="text-3xl font-bold text-purple-500">{stats.leads}</div>
              <div className="text-xs text-white">Leads</div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-semibold mb-4">Tus enlaces públicos</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--background)]">
                <div>
                  <div className="font-medium">Landing pública</div>
                  <div className="text-xs text-white">konecta3d.vercel.app/l/{slug}/NFC</div>
                </div>
                <a href={`/l/${slug}/NFC`} target="_blank" className="px-3 py-1 rounded-lg border border-[var(--border)] text-xs hover:bg-white/5">
                  Ver
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
