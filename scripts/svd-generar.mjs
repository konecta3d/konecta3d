// Genera src/app/svd/pagina.ts a partir de content/herramientas/svd/index.html.
// La fuente es la misma página que se revisa como borrador en claude.ai.
// Uso: node scripts/svd-generar.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const fuente = readFileSync(join(raiz, "content/herramientas/svd/index.html"), "utf8");

// Configuración que activa el formulario de contacto (solo en Konecta3D)
const config =
  '<script>window.K3D={endpoint:"/api/svd/lead",whatsapp:"34623759451",whatsappTxt:"+34 623 75 94 51"};</script>\n';

const marca = "<script>\n(function(){";
if (!fuente.includes(marca)) throw new Error("No encuentro el script principal en la fuente");
const cuerpo = fuente.replace(marca, config + marca);

const cabecera = [
  "<!doctype html>",
  '<html lang="es">',
  "<head>",
  '<meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
  '<meta name="description" content="Entiende el Sistema de Ventas Definitivo, monta el tuyo con tus números y crea tu encuesta PERE.">',
  '<meta property="og:title" content="Monta tu Sistema de Ventas Definitivo">',
  '<meta property="og:description" content="Una herramienta práctica para aplicar el SVD a tu negocio, te dediques a lo que te dediques.">',
  '<meta property="og:type" content="website">',
  '<link rel="icon" href="/favicon.ico">',
  "<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>",
].join("\n");

const html = cabecera + "\n" + cuerpo + "\n</html>\n";

const ts =
  "// ARCHIVO GENERADO por scripts/svd-generar.mjs. No editar a mano:\n" +
  "// cambia content/herramientas/svd/index.html y vuelve a generar.\n" +
  "export const SVD_HTML: string = " + JSON.stringify(html) + ";\n";

writeFileSync(join(raiz, "src/app/svd/pagina.ts"), ts, "utf8");
console.log("pagina.ts generado:", Math.round(ts.length / 1024), "KB");
