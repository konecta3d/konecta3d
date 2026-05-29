// ─── Configuración de la página de acceso de negocios ─────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if (isNaN(r)) return `rgba(0,0,0,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}

export type LoginPageConfig = {
  // ── Fondo ──────────────────────────────────────────────────────────────────
  bg_type: "gradient" | "solid" | "image";
  bg_color_1: string;
  bg_color_2: string;
  bg_angle: number;
  bg_image_url: string;
  bg_overlay: number;
  bg_overlay_color: string;

  // ── Marca ──────────────────────────────────────────────────────────────────
  brand_name: string;           // nombre (badge y alt del logo)
  brand_color: string;          // color del badge K y acento decorativo
  logo_type: "badge" | "image"; // badge = letra+nombre, image = imagen subida
  logo_url: string;             // URL de imagen de logo (logo_type=image)
  logo_height: number;          // altura en px del logo imagen (20–120)

  // ── Textos y colores ───────────────────────────────────────────────────────
  headline: string;
  headline_color: string;       // color del titular (#ffffff por defecto)
  subtext: string;
  subtext_color: string;        // color del subtítulo
  subtext_opacity: number;      // opacidad del subtítulo (0–1)

  // ── Botón ──────────────────────────────────────────────────────────────────
  button_text: string;
  button_color: string;         // fondo del botón (por defecto = brand_color)
  button_text_color: string;    // texto del botón

  // ── Soporte ────────────────────────────────────────────────────────────────
  support_phone: string;
  support_label: string;
};

export const DEFAULT_LOGIN_CONFIG: Required<LoginPageConfig> = {
  bg_type: "gradient",
  bg_color_1: "#0a2422",
  bg_color_2: "#0f3d3a",
  bg_angle: 145,
  bg_image_url: "",
  bg_overlay: 0.45,
  bg_overlay_color: "#000000",

  brand_name: "KONECTA3D",
  brand_color: "#C5A059",
  logo_type: "badge",
  logo_url: "",
  logo_height: 40,

  headline: "Accede a tu\npanel de negocio",
  headline_color: "#ffffff",
  subtext: "Gestiona tu presencia digital y captación de leads.",
  subtext_color: "#ffffff",
  subtext_opacity: 0.45,

  button_text: "Entrar →",
  button_color: "",             // vacío = usa brand_color
  button_text_color: "#0f3d3a",

  support_phone: "34623759451",
  support_label: "soporte",
};

// ─── Generador de HTML estático para preview ──────────────────────────────────

export function buildLoginPageHtml(cfg: LoginPageConfig): string {
  const c: Required<LoginPageConfig> = { ...DEFAULT_LOGIN_CONFIG, ...cfg };

  // Fondo
  let bg: string;
  if (c.bg_type === "solid") bg = c.bg_color_1;
  else if (c.bg_type === "image" && c.bg_image_url)
    bg = `url('${c.bg_image_url}') center/cover no-repeat`;
  else
    bg = `linear-gradient(${c.bg_angle}deg, ${c.bg_color_1} 0%, ${c.bg_color_2} 100%)`;

  const brand       = c.brand_color  || "#C5A059";
  const btnBg       = c.button_color || brand;
  const btnTxt      = c.button_text_color || "#0f3d3a";
  const brandRgba8  = hexToRgba(brand, 0.08);
  const brandShadow = hexToRgba(btnBg, 0.3);
  const subtextRgba = hexToRgba(c.subtext_color || "#ffffff", c.subtext_opacity ?? 0.45);
  const supportLink = hexToRgba(brand, 0.75);

  const overlayStyle = c.bg_type === "image" && c.bg_image_url
    ? `<div style="position:fixed;inset:0;background:${hexToRgba(c.bg_overlay_color, c.bg_overlay)};pointer-events:none;z-index:0;"></div>`
    : "";

  const headlineHtml = (c.headline || "").split("\n").join("<br/>");

  // Logo HTML
  const logoHtml = c.logo_type === "image" && c.logo_url
    ? `<div class="logo"><img src="${c.logo_url}" alt="${c.brand_name}" style="height:${c.logo_height}px;max-width:200px;object-fit:contain;display:block;"/></div>`
    : `<div class="logo">
        <div class="logo-badge">${(c.brand_name || "K").charAt(0)}</div>
        <span class="logo-name">${c.brand_name || "KONECTA3D"}</span>
       </div>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{
      font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;
      min-height:100vh;
      background:${bg};
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      padding:24px;position:relative;
    }
    .card{
      width:100%;max-width:360px;border-radius:20px;padding:32px;
      background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);
      backdrop-filter:blur(12px);box-shadow:0 24px 64px rgba(0,0,0,0.4);
      position:relative;overflow:hidden;z-index:1;
    }
    .deco{
      position:absolute;top:-64px;right:-64px;width:160px;height:160px;border-radius:50%;
      background:${brandRgba8};pointer-events:none;
    }
    .logo{display:flex;align-items:center;gap:10px;margin-bottom:24px;}
    .logo-badge{
      width:36px;height:36px;border-radius:12px;
      display:flex;align-items:center;justify-content:center;
      font-size:14px;font-weight:900;flex-shrink:0;
      background:${brand};color:${btnTxt};
    }
    .logo-name{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${brand};}
    .headline{font-size:26px;font-weight:800;color:${c.headline_color || "#fff"};line-height:1.2;margin-bottom:6px;}
    .subtext{font-size:13px;color:${subtextRgba};margin-bottom:24px;line-height:1.5;}
    .field-label{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:6px;}
    .field{
      width:100%;padding:12px 16px;border-radius:12px;
      background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);
      color:#fff;font-size:14px;font-family:inherit;outline:none;margin-bottom:16px;
    }
    .field::placeholder{color:rgba(255,255,255,0.2);}
    .btn{
      width:100%;padding:14px;border-radius:12px;border:none;cursor:pointer;
      background:${btnBg};color:${btnTxt};
      font-size:14px;font-weight:800;font-family:inherit;
      box-shadow:0 4px 20px ${brandShadow};
      margin-top:4px;margin-bottom:20px;
    }
    .help{text-align:center;font-size:12px;color:rgba(255,255,255,0.25);}
    .help a{color:${supportLink};text-decoration:underline;}
    .admin-link{margin-top:32px;font-size:12px;color:rgba(255,255,255,0.15);text-decoration:none;z-index:1;position:relative;}
  </style>
</head>
<body>
  ${overlayStyle}
  <div class="card">
    <div class="deco"></div>
    ${logoHtml}
    <h1 class="headline">${headlineHtml}</h1>
    <p class="subtext">${c.subtext || ""}</p>
    <div class="field-label">Email</div>
    <input class="field" type="text" placeholder="tu@email.com"/>
    <div class="field-label">Contraseña</div>
    <input class="field" type="password" placeholder="••••••••"/>
    <button class="btn">${c.button_text || "Entrar →"}</button>
    <p class="help">¿Problemas de acceso? Contacta con <a href="#">${c.support_label || "soporte"}</a>.</p>
  </div>
  <a class="admin-link" href="#">Acceso administrador</a>
</body>
</html>`;
}
