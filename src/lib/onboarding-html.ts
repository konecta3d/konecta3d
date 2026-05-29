import { escapeHtml } from "@/lib/sanitize";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type HeroConfig = {
  bg_type?: "gradient" | "solid" | "image";
  bg_color_1?: string;
  bg_color_2?: string;
  bg_angle?: number;
  bg_image_url?: string;
  bg_image_position?: string;   // e.g. "center", "top", "bottom center"
  bg_image_size?: "cover" | "contain" | "auto";
  bg_overlay?: number;
  bg_overlay_color?: string;    // hex color for the tint overlay
  text_color?: string;
  accent_color?: string;
  logo_show?: boolean;
  logo_type?: "badge" | "image";
  logo_url?: string;
  logo_text?: string;
  logo_dot_color?: string;
  logo_dot_text_color?: string;
  logo_dot_char?: string;
  welcome_text?: string;
  greeting_prefix?: string;
};

export type OnboardingStep = {
  title: string;
  time: string;
  where: string;
  bullets: string[];
};

export type OnboardingFeature = {
  label: string;
  desc: string;
};

export type OnboardingTemplate = {
  header_subtitle?: string;
  notice_text?: string;
  platform_url?: string;
  hero?: HeroConfig;
  steps?: [OnboardingStep, OnboardingStep, OnboardingStep];
  show_features?: boolean;
  features?: OnboardingFeature[];
  support_text?: string;
  support_phone?: string;
  support_btn_text?: string;
  footer_text?: string;
};

// ─── Valores por defecto ──────────────────────────────────────────────────────

export const DEFAULT_HERO: Required<HeroConfig> = {
  bg_type: "gradient",
  bg_color_1: "#0f3d3a",
  bg_color_2: "#1e5c57",
  bg_angle: 140,
  bg_image_url: "",
  bg_image_position: "center center",
  bg_image_size: "cover",
  bg_overlay: 0.45,
  bg_overlay_color: "#000000",
  text_color: "#ffffff",
  accent_color: "#C5A059",
  logo_show: true,
  logo_type: "badge",
  logo_url: "",
  logo_text: "Konecta3D",
  logo_dot_color: "#C5A059",
  logo_dot_text_color: "#0f3d3a",
  logo_dot_char: "K",
  welcome_text: "Bienvenido a la plataforma",
  greeting_prefix: "¡Ya estás dentro,",
};

const DEFAULT: Required<OnboardingTemplate> = {
  header_subtitle: "Tu presencia digital está lista. Sigue los 3 pasos para activarla.",
  notice_text: "Guarda bien estos datos. No compartas este documento con terceros.",
  platform_url: "konecta3d.vercel.app",
  hero: { ...DEFAULT_HERO },
  steps: [
    {
      title: "Perfil de negocio",
      time: "~5 min",
      where: "Mi Negocio → Perfil",
      bullets: [
        "Sube tu logo",
        "Añade nombre, descripción y teléfono",
        "Configura tu enlace único del llavero",
      ],
    },
    {
      title: "Landing de fidelización",
      time: "~10 min",
      where: "Fidelización → Landing",
      bullets: [
        "Diseña la página que ven al escanear el llavero",
        "Añade servicios, WhatsApp y colores de tu negocio",
        "Escanea el llavero al terminar para comprobarlo",
      ],
    },
    {
      title: "Primera campaña de captación",
      time: "~15 min",
      where: "Captación → Campañas → Nueva campaña",
      bullets: [
        "Crea una campaña para tu próxima feria o evento",
        "Vincula un formulario y un recurso gratuito",
        "El llavero empieza a captar contactos automáticamente",
      ],
    },
  ],
  show_features: true,
  features: [
    { label: "Mi Negocio", desc: "tu identidad digital y enlace NFC" },
    { label: "Fidelización", desc: "landing, recursos de valor y comunicación" },
    { label: "Captación", desc: "formularios, campañas y gestión de leads" },
  ],
  support_text: "Si tienes cualquier pregunta durante la configuración, escríbenos.",
  support_phone: "34623759451",
  support_btn_text: "Equipo Konecta3D",
  footer_text: "Documento personal con credenciales de acceso. No lo compartas con terceros.",
};

// ─── Helper: hex → rgba ───────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(255,255,255,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Builder ──────────────────────────────────────────────────────────────────

export function buildOnboardingHtml(
  businessName: string,
  email: string,
  password: string,
  tpl: OnboardingTemplate = {}
): string {
  const t: Required<OnboardingTemplate> = { ...DEFAULT, ...tpl };

  // ── Strings escapados ──
  const name       = escapeHtml(businessName);
  const mail       = escapeHtml(email);
  const pass       = escapeHtml(password);
  const subtitle   = escapeHtml(t.header_subtitle);
  const notice     = escapeHtml(t.notice_text);
  const platformUrl = escapeHtml(t.platform_url || DEFAULT.platform_url);
  const supText    = escapeHtml(t.support_text);
  const supPhone   = escapeHtml(t.support_phone);
  const supBtn     = escapeHtml(t.support_btn_text);
  const footer     = escapeHtml(t.footer_text);

  // ── Hero config ──
  const h: Required<HeroConfig> = { ...DEFAULT_HERO, ...(t.hero ?? {}) };

  const textColor   = h.text_color || "#ffffff";
  const accentColor = h.accent_color || "#C5A059";

  // Background CSS
  const imgPos  = h.bg_image_position || "center center";
  const imgSize = h.bg_image_size     || "cover";
  let headerBg: string;
  if (h.bg_type === "solid") {
    headerBg = h.bg_color_1;
  } else if (h.bg_type === "image" && h.bg_image_url) {
    headerBg = `url('${h.bg_image_url}') ${imgPos}/${imgSize} no-repeat`;
  } else {
    headerBg = `linear-gradient(${h.bg_angle}deg, ${h.bg_color_1} 0%, ${h.bg_color_2} 100%)`;
  }

  // Overlay (solo cuando imagen) — usa el color + opacidad configurados
  const overlayColor = h.bg_overlay_color || "#000000";
  const overlayRgba  = hexToRgba(overlayColor, h.bg_overlay ?? 0.45);
  const overlayHtml  =
    h.bg_type === "image" && h.bg_image_url
      ? `<div style="position:absolute;inset:0;background:${overlayRgba};pointer-events:none;z-index:0;"></div>`
      : "";

  // Decorative circles (usan accent_color)
  const deco1 = hexToRgba(accentColor, 0.07);
  const deco2 = `rgba(255,255,255,0.04)`;

  // Logo HTML
  let logoHtml = "";
  if (h.logo_show) {
    if (h.logo_type === "image" && h.logo_url) {
      logoHtml = `<div style="margin-bottom:14px;">
        <img src="${escapeHtml(h.logo_url)}" alt="logo"
          style="max-height:36px;max-width:160px;object-fit:contain;display:block;" />
      </div>`;
    } else {
      const badgeBg     = hexToRgba(accentColor, 0.15);
      const badgeBorder = hexToRgba(accentColor, 0.3);
      logoHtml = `<div class="logo-badge" style="background:${badgeBg};border-color:${badgeBorder};margin-bottom:14px;">
        <div class="logo-dot" style="background:${h.logo_dot_color};color:${h.logo_dot_text_color};">${escapeHtml(h.logo_dot_char)}</div>
        <span class="logo-text" style="color:${accentColor};">${escapeHtml(h.logo_text)}</span>
      </div>`;
    }
  }

  // ── Pasos ──
  const steps = (t.steps ?? DEFAULT.steps) as [OnboardingStep, OnboardingStep, OnboardingStep];

  const renderStep = (step: OnboardingStep, idx: number) => `
    <div class="step">
      <div class="step-number">${idx + 1}</div>
      <div class="step-content">
        <div class="step-header">
          <span class="step-title">${escapeHtml(step.title)}</span>
          <span class="step-time" style="color:${accentColor};background:${hexToRgba(accentColor,0.1)};">${escapeHtml(step.time)}</span>
        </div>
        <p class="step-where">${escapeHtml(step.where)}</p>
        <ul class="step-bullets">
          ${(step.bullets || []).map((b) => `<li>${escapeHtml(b)}</li>`).join("")}
        </ul>
      </div>
    </div>`;

  const stepsConnected = [
    renderStep(steps[0], 0),
    `<div class="step-connector"></div>`,
    renderStep(steps[1], 1),
    `<div class="step-connector"></div>`,
    renderStep(steps[2], 2),
  ].join("\n");

  // ── Features ──
  const showFeatures = t.show_features !== false;
  const features = (t.features ?? DEFAULT.features) as OnboardingFeature[];
  const featuresHtml = features
    .map(
      (f) => `
      <div class="feature-item">
        <span>→</span>
        <div><strong>${escapeHtml(f.label)}</strong> — ${escapeHtml(f.desc)}</div>
      </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      background: #ffffff;
      color: #1a1a1a;
      font-size: 13px;
      line-height: 1.55;
      width: 210mm;
      height: 297mm;
      display: flex;
      flex-direction: column;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header {
      padding: 28px 32px 26px;
      position: relative;
      overflow: hidden;
    }
    .header-inner {
      display: flex; align-items: flex-start;
      justify-content: space-between; gap: 24px;
      position: relative; z-index: 1;
    }
    .header-left { flex: 1; }
    .logo-badge {
      display: inline-flex; align-items: center; gap: 7px;
      border: 1px solid transparent;
      border-radius: 20px; padding: 4px 12px 4px 4px;
    }
    .logo-dot {
      width: 24px; height: 24px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 800;
    }
    .logo-text { font-size: 10.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
    .header-welcome { font-size: 11px; font-weight: 500; margin-bottom: 4px; }
    .header-name { font-size: 23px; font-weight: 800; line-height: 1.15; margin-bottom: 10px; }
    .header-sub { font-size: 11.5px; line-height: 1.55; }
    .header-credentials {
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 12px; padding: 14px 16px; min-width: 210px; flex-shrink: 0;
    }
    .hc-title { font-size: 9.5px; font-weight: 700; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
    .hc-row { margin-bottom: 9px; }
    .hc-row:last-child { margin-bottom: 0; }
    .hc-label { font-size: 9px; font-weight: 700; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 3px; }
    .hc-value-wrap { display: flex; align-items: center; gap: 6px; }
    .hc-value { font-size: 12px; font-weight: 600; color: #ffffff; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 5px 9px; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .hc-value.accent { font-size: 11px; }
    .copy-btn {
      background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.14);
      color: rgba(255,255,255,0.6); border-radius: 5px; padding: 4px 8px;
      font-size: 9px; font-weight: 700; cursor: pointer; flex-shrink: 0;
      font-family: inherit; letter-spacing: 0.04em; text-transform: uppercase; transition: all 0.15s;
    }
    .copy-btn:hover { background: rgba(255,255,255,0.16); color: #fff; }
    .copy-btn.ok { background: rgba(37,211,102,0.2); color: #4ade80; border-color: rgba(37,211,102,0.35); }
    .notice {
      margin: 14px 28px;
      background: rgba(197,160,89,0.07); border: 1px solid rgba(197,160,89,0.22);
      border-radius: 8px; padding: 9px 14px;
      display: flex; gap: 9px; align-items: center;
    }
    .notice-text { font-size: 11.5px; color: #7a6030; line-height: 1.45; }
    .divider { height: 1px; background: #efefef; margin: 0 28px; }
    .section-title {
      font-size: 9px; font-weight: 700; color: #1A4D4A;
      text-transform: uppercase; letter-spacing: 0.12em;
      margin-bottom: 16px;
      display: flex; align-items: center; gap: 8px;
    }
    .section-title::after { content: ''; flex: 1; height: 1px; background: #e8f0ef; }
    .body-grid {
      display: grid; gap: 0;
      padding: 20px 28px;
      flex: 1;
    }
    .col-left { padding-right: 20px; border-right: 1px solid #efefef; }
    .col-right { padding-left: 20px; }
    .step { display: flex; gap: 12px; margin-bottom: 20px; }
    .step:last-child { margin-bottom: 0; }
    .step-number {
      width: 28px; height: 28px; border-radius: 50%;
      background: #1A4D4A; color: white;
      font-size: 12px; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; margin-top: 1px;
    }
    .step-content { flex: 1; }
    .step-header { display: flex; align-items: baseline; justify-content: space-between; gap: 6px; margin-bottom: 4px; flex-wrap: wrap; }
    .step-title { font-size: 13px; font-weight: 700; color: #1a1a1a; }
    .step-time { font-size: 9.5px; font-weight: 600; border-radius: 20px; padding: 2px 8px; white-space: nowrap; }
    .step-where { font-size: 10.5px; font-weight: 600; color: #2D7A74; margin-bottom: 6px; }
    .step-bullets { list-style: none; display: flex; flex-direction: column; gap: 3px; }
    .step-bullets li { font-size: 11.5px; color: #555; display: flex; gap: 6px; align-items: flex-start; line-height: 1.45; }
    .step-bullets li::before { content: '·'; color: #C5A059; font-weight: 900; font-size: 16px; line-height: 1; flex-shrink: 0; }
    .step-connector { width: 1px; background: linear-gradient(to bottom, #1A4D4A40, #e0eeec); margin: 3px 0 3px 13px; height: 10px; }
    .features-box { background: #f7fbfa; border: 1.5px solid #d0e8e5; border-radius: 12px; overflow: hidden; }
    .features-header { background: linear-gradient(135deg, #1A4D4A, #2D7A74); padding: 9px 14px; display: flex; align-items: center; gap: 7px; }
    .features-header-text { font-size: 10px; font-weight: 700; color: white; text-transform: uppercase; letter-spacing: 0.07em; }
    .features-body { padding: 10px 14px; }
    .feature-item { display: flex; align-items: flex-start; gap: 8px; padding: 6px 0; border-bottom: 1px solid #e8f2f0; font-size: 12px; color: #333; }
    .feature-item:last-child { border-bottom: none; padding-bottom: 0; }
    .feature-item span { color: #2D7A74; font-weight: 700; flex-shrink: 0; }
    .support-box {
      background: linear-gradient(135deg, #1A4D4A 0%, #0f3d3a 100%);
      border-radius: 12px; padding: 16px 20px;
      display: flex; align-items: center; gap: 16px;
      margin: 16px 28px;
    }
    .support-text { flex: 1; font-size: 12px; color: rgba(255,255,255,0.75); line-height: 1.45; }
    .support-text strong { color: #ffffff; font-size: 13px; display: block; margin-bottom: 2px; }
    .support-btn {
      display: inline-flex; align-items: center; gap: 7px;
      background: #25D366; color: white; font-size: 12px; font-weight: 700;
      padding: 10px 16px; border-radius: 50px; text-decoration: none;
      white-space: nowrap; flex-shrink: 0;
    }
    .footer { text-align: center; padding: 12px 28px 20px; border-top: 1px solid #f0f0f0; }
    .footer-logo { font-size: 10px; font-weight: 800; color: #1A4D4A; letter-spacing: 0.08em; margin-bottom: 3px; }
    .footer-text { font-size: 10px; color: #bbb; line-height: 1.5; }
  </style>
</head>
<body>

  <!-- ═══ HERO ═══ -->
  <div class="header" style="background:${headerBg};">
    <!-- Overlay (solo imagen) -->
    ${overlayHtml}
    <!-- Decorativo círculo top-right -->
    <div style="position:absolute;top:-50px;right:-50px;width:200px;height:200px;border-radius:50%;background:${deco1};pointer-events:none;"></div>
    <!-- Decorativo círculo bottom-left -->
    <div style="position:absolute;bottom:-30px;left:-30px;width:120px;height:120px;border-radius:50%;background:${deco2};pointer-events:none;"></div>

    <div class="header-inner">
      <div class="header-left">
        ${logoHtml}
        <p class="header-welcome" style="color:${hexToRgba(textColor,0.55)};">${escapeHtml(h.welcome_text)}</p>
        <h1 class="header-name" style="color:${textColor};">${escapeHtml(h.greeting_prefix)}<br>${name}!</h1>
        <p class="header-sub" style="color:${hexToRgba(textColor,0.65)};">${subtitle}</p>
      </div>

      <div class="header-credentials">
        <div class="hc-title">🔑 Tus datos de acceso</div>
        <div class="hc-row">
          <div class="hc-label">Plataforma</div>
          <div class="hc-value-wrap">
            <div class="hc-value accent" style="color:${accentColor};">${platformUrl}</div>
            <button class="copy-btn" data-v="${platformUrl}" onclick="copyVal(this)">Copiar</button>
          </div>
        </div>
        <div class="hc-row">
          <div class="hc-label">Email</div>
          <div class="hc-value-wrap">
            <div class="hc-value">${mail}</div>
            <button class="copy-btn" data-v="${mail}" onclick="copyVal(this)">Copiar</button>
          </div>
        </div>
        <div class="hc-row">
          <div class="hc-label">Contraseña</div>
          <div class="hc-value-wrap">
            <div class="hc-value">${pass}</div>
            <button class="copy-btn" data-v="${pass}" onclick="copyVal(this)">Copiar</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="notice" style="margin-top:14px;">
    <p class="notice-text"><strong>⚠</strong> ${notice}</p>
  </div>

  <div class="divider" style="margin-top:14px;"></div>

  <div class="body-grid" style="grid-template-columns:${showFeatures ? "1fr 1fr" : "1fr"};">
    <div class="col-left" style="${showFeatures ? "" : "border-right:none;padding-right:0;"}">
      <div class="section-title">Tus 3 primeros pasos</div>
      ${stepsConnected}
    </div>
    ${showFeatures ? `
    <div class="col-right">
      <div class="section-title">Qué encontrarás</div>
      <div class="features-box">
        <div class="features-header">
          <span style="font-size:13px;">✦</span>
          <span class="features-header-text">Tres perfiles de trabajo</span>
        </div>
        <div class="features-body">${featuresHtml}</div>
      </div>
    </div>` : ""}
  </div>

  <div class="divider"></div>

  <div class="support-box">
    <div class="support-text">
      <strong>¿Tienes dudas?</strong>
      ${supText}
    </div>
    <a class="support-btn" href="https://wa.me/${supPhone}?text=Konecta3d">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.856L.057 24l6.305-1.654A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.7 9.7 0 01-4.948-1.352l-.355-.21-3.676 1.025 1.025-3.676-.21-.355A9.693 9.693 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
      </svg>
      ${supBtn}
    </a>
  </div>

  <div class="footer">
    <p class="footer-logo">KONECTA3D</p>
    <p class="footer-text">${footer}</p>
  </div>

  <script>
    function copyVal(btn) {
      var text = btn.getAttribute('data-v');
      var done = function() {
        btn.textContent = '✓ OK'; btn.classList.add('ok');
        setTimeout(function() { btn.textContent = 'Copiar'; btn.classList.remove('ok'); }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function() { fallbackCopy(text); done(); });
      } else { fallbackCopy(text); done(); }
    }
    function fallbackCopy(text) {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0;';
      document.body.appendChild(ta); ta.focus(); ta.select();
      try { document.execCommand('copy'); } catch(e) {}
      document.body.removeChild(ta);
    }
  </script>
</body>
</html>`;
}
