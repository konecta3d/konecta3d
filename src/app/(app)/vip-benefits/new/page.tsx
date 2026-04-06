"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ActionLinkPicker from "@/components/ActionLinkPicker";
import { useRouter } from "next/navigation";

const TYPES = [
  { value: "percent_discount", label: "Descuento porcentual" },
  { value: "fixed_discount", label: "Descuento fijo" },
  { value: "two_for_one", label: "2x1 / Combo" },
  { value: "free_gift", label: "Regalo" },
  { value: "upgrade", label: "Upgrade" },
  { value: "free_service", label: "Servicio/Envío gratis" },
];

export default function VipBenefitsNew() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [businessId, setBusinessId] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [type, setType] = useState("percent_discount");
  const [value, setValue] = useState("");
  const [clientName, setClientName] = useState("");
  const [personalCode, setPersonalCode] = useState("");
  const [generatedAt, setGeneratedAt] = useState("");
  const [validText, setValidText] = useState("");
  const [finalNote, setFinalNote] = useState("");
  const [active, setActive] = useState(true);
  const [bizName, setBizName] = useState("");
  const [docLogo, setDocLogo] = useState("");
  const [showLogo, setShowLogo] = useState(true);
  const [showTitle, setShowTitle] = useState(true);
  const [showClient, setShowClient] = useState(true);
  const [showValue, setShowValue] = useState(true);
  const [showCode, setShowCode] = useState(true);

  const [ctaEnabled, setCtaEnabled] = useState(false);
  const [ctaText, setCtaText] = useState("");
  const [ctaLink, setCtaLink] = useState("");
  const [bottomTitleEnabled, setBottomTitleEnabled] = useState(false);
  const [bottomTitle, setBottomTitle] = useState("");

  const [docBg, setDocBg] = useState("#ffffff");
  const [docText, setDocText] = useState("#1f2937");
  const [docAccent, setDocAccent] = useState("#6b7280");
  const [docBorder, setDocBorder] = useState("#e5e7eb");
  const [docButtonBg, setDocButtonBg] = useState("#ffb400");
  const [docButtonText, setDocButtonText] = useState("#000000");
  const [docRadius, setDocRadius] = useState(12);

  const plantillas = [
    { title: "10% Descuento", value: "10% Descuento", code: "VIP10", type: "percent_discount" },
    { title: "20% Descuento", value: "20% Descuento", code: "VIP20", type: "percent_discount" },
    { title: "30% Descuento", value: "30% Descuento", code: "VIP30", type: "percent_discount" },
    { title: "20€ Descuento", value: "20€ Descuento", code: "DESCUENTO20", type: "fixed_discount" },
    { title: "50€ Descuento", value: "50€ Descuento", code: "DESCUENTO50", type: "fixed_discount" },
    { title: "2x1 Servicio", value: "2x1 Servicio", code: "2X1", type: "two_for_one" },
    { title: "Producto gratis", value: "Producto gratuito", code: "REGALO", type: "free_gift" },
    { title: "Upgrade", value: "Upgrade gratuito", code: "UPGRADE", type: "upgrade" },
    { title: "Envío gratis", value: "Envío sin coste", code: "ENVIOGRATIS", type: "free_service" },
  ];

  const aplicarPlantilla = (p: typeof plantillas[0]) => {
    setType(p.type);
    setTitle(p.title);
    setValue(p.value);
    setPersonalCode(p.code);
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    if (!businessId) return null;
    const form = new FormData();
    form.append("file", file);
    form.append("kind", "logo");
    form.append("businessId", businessId);
    const res = await fetch("/api/landing/upload", { method: "POST", body: form });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url as string;
  };

  const load = async () => {
    if (!businessId) return;
    const { data } = await supabase
      .from("benefits")
      .select("id,title,type,value,conditions,active,created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    setItems(data || []);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/business/login?redirect=/vip-benefits/new");
        return;
      }
      
      const role = localStorage.getItem("konecta-role");
      if (role !== "business") {
        router.push("/business/login?redirect=/vip-benefits/new");
        return;
      }

      const bid = localStorage.getItem("konecta-business-id") || "";
      if (!bid) {
        router.push("/business/login?redirect=/vip-benefits/new");
        return;
      }
      
      setBusinessId(bid);
      setCheckingAuth(false);
      load();
    };

    checkAuth();
  }, [router]);

  const saveBenefit = async () => {
    if (!businessId) return alert("Falta businessId");
    if (!title.trim()) return alert("Título requerido");
    setLoading(true);
    
    const conditions: any = {
      showLogo, showTitle, showClient, showValue, showCode,
      doc_bg: docBg, doc_text: docText, doc_accent: docAccent,
      doc_border: docBorder, doc_button_bg: docButtonBg,
      doc_button_text: docButtonText, doc_radius: docRadius,
      logo_url: docLogo,
      cta_enabled: ctaEnabled, cta_text: ctaText, cta_link: ctaLink,
      bottom_title_enabled: bottomTitleEnabled, bottom_title: bottomTitle,
    };

    const payload = { business_id: businessId, title, type, value, conditions, active };

    if (editingId) {
      await supabase.from("benefits").update(payload).eq("id", editingId);
    } else {
      await supabase.from("benefits").insert(payload);
    }
    
    setLoading(false);
    setEditingId(null);
    load();
  };

  const downloadPdf = async () => {
    if (!businessId) return alert("Falta businessId");
    const conditions: any = {
      showLogo, showTitle, showClient, showValue, showCode,
      doc_bg: docBg, doc_text: docText, doc_accent: docAccent,
      doc_border: docBorder, doc_button_bg: docButtonBg,
      doc_button_text: docButtonText, doc_radius: docRadius,
      logo_url: docLogo, biz_name: bizName, client_name: clientName,
      personal_code: personalCode || "VIP-CODE",
      generated_at: generatedAt || new Date().toLocaleDateString("es-ES"),
      valid_text: validText || new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString("es-ES"),
      final_note: finalNote,
      cta_enabled: ctaEnabled, cta_text: ctaText, cta_link: ctaLink,
      bottom_title_enabled: bottomTitleEnabled, bottom_title: bottomTitle,
    };

    try {
      const res = await fetch("/api/benefits/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ benefitId: "temp-" + Date.now(), businessId, title: title || bizName || "", value, conditions }),
      });
      if (!res.ok) throw new Error("Error");
      const data = await res.json();
      if (data.url) window.open(data.url, "_blank");
    } catch (e) {
      alert("Error al generar PDF");
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-4)] mx-auto mb-4"></div>
          <p className="text-gray-400">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Generador de Beneficios VIP</h1>
        <p className="text-sm text-gray-400">Crea ofertas exclusivas para tus clientes</p>
      </div>

      {/* Plantillas rápidas */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="text-xs uppercase tracking-wide text-[var(--brand-4)] mb-3">Plantillas rápidas</div>
        <div className="flex flex-wrap gap-2">
          {plantillas.map((p, i) => (
            <button key={i} onClick={() => aplicarPlantilla(p)} className="rounded-lg border border-[var(--border)] px-3 py-1 text-xs hover:border-[var(--brand-3)]">
              {p.title}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Editor */}
        <div className="space-y-4">
          
          {/* Contenedor 1: Datos básicos */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-4">
            <div className="text-sm font-semibold text-[var(--brand-1)]">Datos básicos</div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wide text-[var(--brand-4)]">Logo</div>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={showLogo} onChange={(e) => setShowLogo(e.target.checked)} />
                  Mostrar
                </label>
              </div>
              <label className="flex items-center justify-center w-full h-14 rounded-lg border-2 border-dashed border-[var(--border)] cursor-pointer hover:border-[var(--brand-4)]">
                <span className="text-xs text-[var(--brand-4)]">Subir logo</span>
                <input type="file" className="hidden" accept="image/*" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; const url = await uploadLogo(file); if (url) setDocLogo(url); }} />
              </label>
              {docLogo && <img src={docLogo} alt="logo" className="h-10 w-auto" />}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wide text-[var(--brand-4)]">Nombre del negocio</div>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={showTitle} onChange={(e) => setShowTitle(e.target.checked)} />
                  Mostrar
                </label>
              </div>
              <input className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2" value={bizName} onChange={(e) => { setBizName(e.target.value); setTitle(e.target.value); }} placeholder="Nombre del negocio" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wide text-[var(--brand-4)]">Nombre del cliente</div>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={showClient} onChange={(e) => setShowClient(e.target.checked)} />
                  Mostrar
                </label>
              </div>
              <input className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Cliente (opcional)" />
            </div>
          </div>

          {/* Contenedor 2: Contenido */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-4">
            <div className="text-sm font-semibold text-[var(--brand-1)]">Contenido del beneficio</div>

            <select className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2" value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wide text-[var(--brand-4)]">Valor</div>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={showValue} onChange={(e) => setShowValue(e.target.checked)} />
                  Mostrar
                </label>
              </div>
              <input className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Ej: 20% Descuento" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wide text-[var(--brand-4)]">Código</div>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={showCode} onChange={(e) => setShowCode(e.target.checked)} />
                  Mostrar
                </label>
              </div>
              <div className="flex gap-2">
                <input className="flex-1 rounded-lg border border-[var(--border)] bg-transparent px-3 py-2" value={personalCode} onChange={(e) => setPersonalCode(e.target.value)} placeholder="Código" />
                <button onClick={() => setPersonalCode("VIP" + Math.random().toString(36).substring(2, 6).toUpperCase())} className="px-3 py-2 rounded-lg bg-[var(--brand-4)] text-black text-xs">Generar</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-wide text-[var(--brand-4)]">Generado</div>
                <input className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm" value={generatedAt} onChange={(e) => setGeneratedAt(e.target.value)} placeholder="Fecha" />
              </div>
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-wide text-[var(--brand-4)]">Válido hasta</div>
                <input className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm" value={validText} onChange={(e) => setValidText(e.target.value)} placeholder="Fecha" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wide text-[var(--brand-4)]">Nota final</div>
              <textarea className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2" rows={2} value={finalNote} onChange={(e) => setFinalNote(e.target.value)} placeholder="Texto al final..." />
            </div>
          </div>

          {/* Contenedor 3: CTA */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-4">
            <div className="text-sm font-semibold text-[var(--brand-1)]">Botón de acción (CTA)</div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={ctaEnabled} onChange={(e) => setCtaEnabled(e.target.checked)} />
              <span>Activar botón</span>
            </label>
            
            {ctaEnabled && (
              <div className="space-y-3">
                <input type="text" value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="Texto del botón" className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2" />
                <ActionLinkPicker value={ctaLink} onChange={setCtaLink} label="" />
                <input type="text" value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} placeholder="URL" className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2" />
              </div>
            )}

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={bottomTitleEnabled} onChange={(e) => setBottomTitleEnabled(e.target.checked)} />
              <span>Activar título inferior</span>
            </label>
            
            {bottomTitleEnabled && (
              <input type="text" value={bottomTitle} onChange={(e) => setBottomTitle(e.target.value)} placeholder="Texto del título" className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2" />
            )}
          </div>

          {/* Contenedor 4: Colores + Guardar */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-4">
            <div className="text-sm font-semibold text-[var(--brand-1)]">Diseño y colores</div>

            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs text-gray-400">Fondo</label><div className="flex items-center gap-2 mt-1"><input type="color" value={docBg} onChange={(e) => setDocBg(e.target.value)} className="w-8 h-8 rounded cursor-pointer" /></div></div>
              <div><label className="text-xs text-gray-400">Texto</label><div className="flex items-center gap-2 mt-1"><input type="color" value={docText} onChange={(e) => setDocText(e.target.value)} className="w-8 h-8 rounded cursor-pointer" /></div></div>
              <div><label className="text-xs text-gray-400">Acento</label><div className="flex items-center gap-2 mt-1"><input type="color" value={docAccent} onChange={(e) => setDocAccent(e.target.value)} className="w-8 h-8 rounded cursor-pointer" /></div></div>
              <div><label className="text-xs text-gray-400">Borde</label><div className="flex items-center gap-2 mt-1"><input type="color" value={docBorder} onChange={(e) => setDocBorder(e.target.value)} className="w-8 h-8 rounded cursor-pointer" /></div></div>
              <div><label className="text-xs text-gray-400">Botón</label><div className="flex items-center gap-2 mt-1"><input type="color" value={docButtonBg} onChange={(e) => setDocButtonBg(e.target.value)} className="w-8 h-8 rounded cursor-pointer" /></div></div>
              <div><label className="text-xs text-gray-400">Texto botón</label><div className="flex items-center gap-2 mt-1"><input type="color" value={docButtonText} onChange={(e) => setDocButtonText(e.target.value)} className="w-8 h-8 rounded cursor-pointer" /></div></div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button onClick={saveBenefit} disabled={loading} className="flex-1 rounded-lg bg-[var(--brand-4)] py-3 font-semibold text-black">
                {loading ? "Guardando..." : editingId ? "Guardar cambios" : "Guardar"}
              </button>
              <button onClick={downloadPdf} className="px-6 py-3 rounded-lg border border-[var(--border)]">PDF</button>
            </div>

            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              Activo
            </label>
          </div>
        </div>

        {/* Vista previa */}
        <div className="lg:sticky lg:top-6">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="text-sm font-semibold mb-4">Vista previa</div>
            <div className="flex justify-center">
              <div className="rounded-[30px] border-4 overflow-hidden" style={{ borderColor: docBorder, background: docBg, width: "280px", minHeight: "500px", padding: "20px", color: docText }}>
                {showLogo && docLogo && <div className="flex justify-center mb-4"><img src={docLogo} alt="logo" className="h-12" /></div>}
                {showTitle && <div className="text-center font-bold text-lg mb-2">{bizName || "NOMBRE"}</div>}
                {showClient && clientName && <div className="text-center text-sm mb-2" style={{ color: docAccent }}>Beneficio: <span style={{ color: docText, fontWeight: 600 }}>{clientName}</span></div>}
                {showValue && value && <div className="border-2 rounded-lg p-3 text-center font-bold mb-3" style={{ borderColor: docBorder, color: docText }}>{value}</div>}
                {showCode && personalCode && <div className="rounded-lg p-3 text-center font-bold" style={{ background: docButtonBg, color: docButtonText, borderRadius: docRadius }}>{personalCode}</div>}
                {ctaEnabled && ctaText && <a href={ctaLink || "#"} className="block text-center mt-3 py-2 rounded" style={{ background: docButtonBg, color: docButtonText, borderRadius: docRadius }}>{ctaText}</a>}
                {finalNote && <div className="text-center text-xs mt-3" style={{ color: docAccent }}>{finalNote}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="text-sm font-semibold mb-4">Beneficios creados ({items.length})</div>
        {items.length === 0 ? <div className="text-sm text-gray-400">No hay beneficios</div> : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {items.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-3 bg-[var(--background)] rounded-lg">
                <div>
                  <div className="font-medium">{b.title}</div>
                  <div className="text-xs text-[var(--brand-4)]">{b.type} - {b.active ? "Activo" : "Inactivo"}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingId(b.id); setTitle(b.title); setType(b.type || "percent_discount"); setValue(b.value || ""); }} className="px-2 py-1 text-xs border border-[var(--border)] rounded">Editar</button>
                  <button onClick={() => { if (confirm("¿Eliminar?")) { (async () => { await supabase.from("benefits").delete().eq("id", b.id); load(); })(); } }} className="px-2 py-1 text-xs border border-red-500 text-red-500 rounded">X</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
