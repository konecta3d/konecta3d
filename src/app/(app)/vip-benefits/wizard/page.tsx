"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import ActionLinkPicker from "@/components/ActionLinkPicker";

type BenefitObjective = "captar" | "fidelizar" | "ventas" | "referidos";
type BenefitType = "percent_discount" | "fixed_discount" | "two_for_one" | "free_gift" | "upgrade" | "free_service";
type WizardStep = "bienvenida" | "objetivo" | "tipo" | "contenido" | "personalizacion";

const OBJECTIVE_INFO = {
  captar: { title: "Captar clientes", description: "Atrae nuevos clientes con ofertas exclusivas", example: "10% descuento en primera compra", color: "#10B981" },
  fidelizar: { title: "Fidelizar clientes", description: "Recompensa a tus clientes actuales para que vuelvan", example: "2x1 en tu próximo servicio", color: "#3B82F6" },
  ventas: { title: "Aumentar ventas", description: "Incrementa el ticket medio o cantidad de compra", example: "Envío gratis a partir de 50€", color: "#F59E0B" },
  referidos: { title: "Referidos", description: "Que tus clientes traigan nuevos clientes", example: "Descuento para ambos", color: "#8B5CF6" }
};

const TYPE_INFO = {
  percent_discount: { title: "Descuento %", description: "Porcentaje de descuento", example: "20% descuento" },
  fixed_discount: { title: "Descuento fijo", description: "Cantidad fija de descuento", example: "20€ de descuento" },
  two_for_one: { title: "2x1 / Combo", description: "Dos productos o servicios por el precio de uno", example: "2x1 en servicios" },
  free_gift: { title: "Regalo", description: "Producto o servicio gratuito", example: "Producto de regalo" },
  upgrade: { title: "Upgrade", description: "Mejora gratuita del producto o servicio", example: "Categoría superior gratis" },
  free_service: { title: "Servicio gratis", description: "Envío o servicio sin coste", example: "Envío gratis" }
};

// Plantillas por tipo de beneficio
const TYPE_TEMPLATES: Record<BenefitType, { title: string; value: string; code: string }> = {
  percent_discount: { title: "20% Descuento", value: "20% Descuento", code: "VIP20" },
  fixed_discount: { title: "20€ Descuento", value: "20€ Descuento", code: "DESCUENTO20" },
  two_for_one: { title: "2x1 Servicio", value: "2x1 Servicio", code: "2X1" },
  free_gift: { title: "Producto de regalo", value: "Producto de regalo", code: "REGALO" },
  upgrade: { title: "Upgrade gratuito", value: "Upgrade gratuito", code: "UPGRADE" },
  free_service: { title: "Envío gratis", value: "Envío sin coste", code: "ENVIOGRATIS" }
};

export default function VipBenefitsWizard() {
  return (
    <div className="vb-wizard">
      <VipBenefitsWizardInner />
    </div>
  );
}

function VipBenefitsWizardInner() {
  const [businessId, setBusinessId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [step, setStep] = useState<WizardStep>("bienvenida");
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Datos del beneficio
  const [objective, setObjective] = useState<BenefitObjective>("fidelizar");
  const [type, setType] = useState<BenefitType>("percent_discount");
  
  // Contenido
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [clientName, setClientName] = useState("");
  const [productService, setProductService] = useState("");
  const [instructions, setInstructions] = useState("");
  const [finalNote, setFinalNote] = useState("");
  
  // Personalización visual
  const [docBg, setDocBg] = useState("#ffffff");
  const [docText, setDocText] = useState("#1f2937");
  const [docAccent, setDocAccent] = useState("#6b7280");
  const [docBorder, setDocBorder] = useState("#e5e7eb");
  const [docButtonBg, setDocButtonBg] = useState("#ffb400");
  const [docButtonText, setDocButtonText] = useState("#000000");
  const [docRadius, setDocRadius] = useState(12);
  const [docTitleSize, setDocTitleSize] = useState(24);
  const [docBodySize, setDocBodySize] = useState(14);
  const [codeWidth, setCodeWidth] = useState(260);
  
  // CTA Button
  const [ctaEnabled, setCtaEnabled] = useState(true);
  const [ctaText, setCtaText] = useState("Reservar cita");
  const [ctaLink, setCtaLink] = useState("");
  
  // Logo
  const [docLogo, setDocLogo] = useState("");

  // Cargar datos del negocio
  useEffect(() => {
    const bid = localStorage.getItem("konecta-business-id") || "";
    if (!bid) return;
    setBusinessId(bid);
    
    const loadBiz = async () => {
      const { data } = await supabase
        .from("businesses")
        .select("name, logo_url")
        .eq("id", bid)
        .single();
      if (data?.name) setBusinessName(data.name);
      if (data?.logo_url) {
        setDocLogo(data.logo_url);
      }
    };
    loadBiz();
  }, []);

  // Aplicar plantilla según tipo
  useEffect(() => {
    const template = TYPE_TEMPLATES[type];
    if (template) {
      setTitle(template.title);
      setValue(template.value);
    }
  }, [type]);

  const steps: WizardStep[] = ["bienvenida", "objetivo", "tipo", "contenido", "personalizacion"];

  const generatePdf = async () => {
    if (!businessId) return alert("Falta businessId");
    setPdfGenerating(true);
    
    const conditions: any = {
      showLogo: true,
      showTitle: true,
      showClient: true,
      showValue: true,
      showCode: true,
      showGeneratedDate: true,
      showValidUntil: true,
      showNote: true,
      doc_bg: docBg,
      doc_text: docText,
      doc_accent: docAccent,
      doc_border: docBorder,
      doc_button_bg: docButtonBg,
      doc_button_text: docButtonText,
      doc_radius: docRadius,
      doc_title_size: docTitleSize,
      doc_body_size: docBodySize,
      code_width: codeWidth,
      logo_url: docLogo,
      biz_name: businessName,
      client_name: clientName,
      personal_code: TYPE_TEMPLATES[type]?.code || "VIP",
      generated_at: new Date().toLocaleDateString("es-ES"),
      valid_text: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("es-ES"),
      final_note: finalNote,
      instructions: instructions,
      cta_enabled: ctaEnabled,
      cta_text: ctaText,
      cta_link: ctaLink,
    };

    try {
      const res = await fetch("/api/benefits/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          benefitId: "temp-wizard-" + Date.now(),
          businessId,
          title: title || businessName || "",
          value: value || "",
          description: "",
          conditions,
          instructions,
        }),
      });
      if (!res.ok) throw new Error("Error generando PDF");
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (e) {
      alert("Error al generar PDF");
    }
    setPdfGenerating(false);
  };

  // Render steps
  const renderStep = () => {
    switch (step) {
      case "bienvenida":
        return (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-white mb-4">Crea beneficios exclusivos para tus clientes</h2>
                <p className="text-gray-400 text-lg max-w-xl mx-auto">
                  Genera documentos PDF con descuentos, regalos y ofertas especiales que tus clientes daran usar.
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#0a323c] to-[#001e3c] rounded-xl p-6 border border-[#39a1a9]/30">
              <h3 className="text-lg font-bold text-white mb-3">Qué vas a crear?</h3>
              <p className="text-gray-300 text-sm mb-4">
                Un documento PDF profesional que puedes entregar a tus clientes. Incluye el beneficio, código de descuento y llamada a la acción.
              </p>
              <ul className="text-sm text-gray-300 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-[#ffb400]">✓</span> Descuentos y ofertas exclusivas
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#ffb400]">✓</span> 2x1 y productos de regalo
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#ffb400]">✓</span> Upgrades y servicios gratis
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#ffb400]">✓</span> Botones de acción directa
                </li>
              </ul>
            </div>

            <div className="flex justify-center mt-8">
              <button onClick={() => setStep("objetivo")} className="px-10 py-4 rounded-full bg-[#ffb400] text-black font-bold text-lg">
                Comenzar a crear mi beneficio
              </button>
            </div>
          </div>
        );

      case "objetivo":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Cuál es tu objetivo?</h2>
              <p className="text-gray-400">Selecciona el propósito de tu beneficio</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(OBJECTIVE_INFO).map(([key, info]) => (
                <button 
                  key={key} 
                  onClick={() => setObjective(key as BenefitObjective)} 
                  className="p-6 rounded-xl text-left transition-all border-2"
                  style={{ 
                    borderColor: objective === key ? info.color : "rgba(255,255,255,0.1)", 
                    backgroundColor: objective === key ? `${info.color}15` : "rgba(255,255,255,0.05)" 
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: info.color }}></div>
                    <h3 className="text-lg font-bold text-white">{info.title}</h3>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{info.description}</p>
                  <div className="text-xs text-gray-500 italic">Ej: {info.example}</div>
                </button>
              ))}
            </div>

            <div className="flex justify-end mt-8">
              <button onClick={() => setStep("tipo")} className="px-8 py-3 rounded-full bg-[#ffb400] text-black font-bold">
                Continuar
              </button>
            </div>
          </div>
        );

      case "tipo":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Qué tipo de beneficio es?</h2>
              <p className="text-gray-400">Elige el formato de tu oferta</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(TYPE_INFO).map(([key, info]) => (
                <button 
                  key={key} 
                  onClick={() => setType(key as BenefitType)} 
                  className="p-4 rounded-xl text-center transition-all border-2"
                  style={{ 
                    borderColor: type === key ? "#ffb400" : "rgba(255,255,255,0.1)", 
                    backgroundColor: type === key ? "rgba(255,180,0,0.1)" : "rgba(255,255,255,0.05)" 
                  }}
                >
                  <h3 className="font-bold text-white mb-1">{info.title}</h3>
                  <p className="text-xs text-gray-400">{info.description}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={() => setStep("objetivo")} className="px-6 py-3 rounded-full border border-white/20 text-white">
                Atrás
              </button>
              <button onClick={() => setStep("contenido")} className="px-8 py-3 rounded-full bg-[#ffb400] text-black font-bold">
                Continuar
              </button>
            </div>
          </div>
        );

      case "contenido":
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Personaliza el contenido</h2>
              <p className="text-gray-400">Define los detalles de tu beneficio</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-[#39a1a9] mb-2">
                  Título del beneficio
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white"
                  placeholder="Ej: 20% Descuento en tu próxima compra"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-[#39a1a9] mb-2">
                  Valor del beneficio
                </label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white"
                  placeholder="Ej: 20% Descuento"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-[#39a1a9] mb-2">
                  Producto o servicio aplicable (opcional)
                </label>
                <input
                  type="text"
                  value={productService}
                  onChange={(e) => setProductService(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white"
                  placeholder="Ej: En todos los servicios de peluquería"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-[#39a1a9] mb-2">
                  Cómo canjear el beneficio
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white"
                  placeholder="Instrucciones para canjear el beneficio..."
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-[#39a1a9] mb-2">
                  Nota final (opcional)
                </label>
                <textarea
                  value={finalNote}
                  onChange={(e) => setFinalNote(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white"
                  placeholder="Texto adicional que aparece al final..."
                />
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={() => setStep("tipo")} className="px-6 py-3 rounded-full border border-white/20 text-white">
                Atrás
              </button>
              <button onClick={() => setStep("personalizacion")} className="px-8 py-3 rounded-full bg-[#ffb400] text-black font-bold">
                Continuar
              </button>
            </div>
          </div>
        );

      case "personalizacion":
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Personalización</h2>
              <p className="text-gray-400">Configura los colores y el botón de acción</p>
            </div>
            
            {/* Colores básicos */}
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-white font-bold mb-4">Colores del documento</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Fondo</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={docBg} onChange={(e) => setDocBg(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                    <span className="text-xs text-gray-400">{docBg}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Texto</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={docText} onChange={(e) => setDocText(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                    <span className="text-xs text-gray-400">{docText}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Acento</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={docAccent} onChange={(e) => setDocAccent(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                    <span className="text-xs text-gray-400">{docAccent}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Borde</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={docBorder} onChange={(e) => setDocBorder(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                    <span className="text-xs text-gray-400">{docBorder}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Botón fondo</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={docButtonBg} onChange={(e) => setDocButtonBg(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                    <span className="text-xs text-gray-400">{docButtonBg}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Botón texto</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={docButtonText} onChange={(e) => setDocButtonText(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                    <span className="text-xs text-gray-400">{docButtonText}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="bg-white/5 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">Botón de acción (CTA)</h3>
                <label className="flex items-center gap-2 text-sm text-gray-400">
                  <input 
                    type="checkbox" 
                    checked={ctaEnabled} 
                    onChange={(e) => setCtaEnabled(e.target.checked)} 
                    className="w-4 h-4 accent-[#ffb400]" 
                  />
                  Activar
                </label>
              </div>
              
              {ctaEnabled && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Texto del botón</label>
                    <input
                      type="text"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm"
                      placeholder="Reservar cita"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Enlace</label>
                    <ActionLinkPicker 
                      value={ctaLink} 
                      onChange={setCtaLink}
                      label=""
                    />
                    <input
                      type="text"
                      value={ctaLink}
                      onChange={(e) => setCtaLink(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm mt-2"
                      placeholder="O escribe una URL..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Vista previa */}
            <div className="mb-6">
              <div className="text-xs uppercase tracking-widest text-[#39a1a9] mb-3">VISTA PREVIA</div>
              <div className="flex justify-center overflow-auto" style={{ minHeight: "400px" }}>
                <div 
                  style={{
                    width: "210mm",
                    minHeight: "297mm",
                    padding: "20mm",
                    background: docBg,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                  }}
                >
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `2px solid ${docBorder}`, paddingBottom: "15px", marginBottom: "20px" }}>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: docText, textTransform: "uppercase" }}>
                      {(businessName || "MI NEGOCIO").toUpperCase()}
                    </div>
                  </div>
                  
                  {/* Title */}
                  <div style={{ fontSize: `${docTitleSize}px`, fontWeight: 700, color: docText, marginBottom: "20px", textTransform: "uppercase" }}>
                    {title || "TÍTULO DEL BENEFICIO"}
                  </div>
                  
                  {/* Value */}
                  <div style={{ 
                    border: `2px solid ${docBorder}`, 
                    borderRadius: `${docRadius}px`, 
                    padding: "20px", 
                    textAlign: "center",
                    fontSize: "24px",
                    fontWeight: 700,
                    color: docText,
                    marginBottom: "20px"
                  }}>
                    {value || "VALOR"}
                  </div>
                  
                  {/* Product/Service */}
                  {productService && (
                    <div style={{ fontSize: `${docBodySize}px`, color: docAccent, marginBottom: "20px" }}>
                      {productService}
                    </div>
                  )}
                  
                  {/* CTA Button */}
                  {ctaEnabled && ctaText && (
                    <div style={{ marginTop: "30px", textAlign: "center" }}>
                      <a 
                        href={ctaLink || "#"}
                        style={{
                          display: "inline-block",
                          background: docButtonBg,
                          color: docButtonText,
                          borderRadius: `${docRadius}px`,
                          padding: "12px 30px",
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        {ctaText}
                      </a>
                    </div>
                  )}
                  
                  {/* Instructions */}
                  {instructions && (
                    <div style={{ marginTop: "30px", fontSize: `${docBodySize}px`, color: docAccent, borderTop: `1px solid ${docBorder}`, paddingTop: "15px" }}>
                      <strong>Cómo canjear:</strong> {instructions}
                    </div>
                  )}
                  
                  {/* Final Note */}
                  {finalNote && (
                    <div style={{ marginTop: "20px", fontSize: `${docBodySize}px`, color: docAccent, textAlign: "center" }}>
                      {finalNote}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={() => setStep("contenido")} className="px-6 py-3 rounded-full border border-white/20 text-white">
                Atrás
              </button>
              <button onClick={generatePdf} disabled={pdfGenerating} className="px-8 py-3 rounded-full bg-[#ffb400] text-black font-bold">
                {pdfGenerating ? "Generando..." : "Descargar PDF"}
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1720] p-4 md:p-6 lg:p-8 overflow-x-auto">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[#ffb400] text-lg font-extrabold tracking-widest uppercase">Asistente Beneficios VIP</h1>
            <p className="text-gray-400 text-sm">Crea ofertas exclusivas para tus clientes</p>
          </div>
          <a href="/vip-benefits" className="text-gray-400 hover:text-white text-sm">Volver al panel</a>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step === s 
                    ? "bg-[#ffb400] text-black" 
                    : steps.indexOf(step) > i 
                      ? "bg-green-500 text-white"
                      : "bg-white/10 text-gray-400"
                }`}
              >
                {i + 1}
              </div>
              {i < 4 && (
                <div 
                  className={`w-12 h-0.5 mx-1 ${
                    steps.indexOf(step) > i ? "bg-green-500" : "bg-white/10"
                  }`} 
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="max-w-3xl mx-auto">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
