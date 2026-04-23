/**
 * Shared Puppeteer browser factory.
 *
 * - En Vercel/producción → usa @sparticuz/chromium-min (descarga binario remoto).
 * - En desarrollo local (Windows/Mac) → busca Chrome instalado en el sistema.
 *
 * Configura CHROMIUM_REMOTE_EXEC_URL en las variables de entorno de Vercel
 * apuntando a la release tar de https://github.com/Sparticuz/chromium/releases
 */

import puppeteer, { Browser } from "puppeteer-core";

const CHROMIUM_REMOTE_URL =
  process.env.CHROMIUM_REMOTE_EXEC_URL ||
  "https://github.com/Sparticuz/chromium/releases/download/v147.0.0/chromium-v147.0.0-pack.tar";

const LOCAL_CHROME_PATHS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Chromium\\Application\\chromium.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  process.env.CHROME_PATH,
].filter(Boolean) as string[];

async function getLocalChromePath(): Promise<string | null> {
  // Dynamic require to avoid bundler issues
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("fs") as typeof import("fs");
  for (const p of LOCAL_CHROME_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export async function launchBrowser(): Promise<Browser> {
  const isProduction = !!process.env.VERCEL || process.env.NODE_ENV === "production";

  if (isProduction) {
    // Vercel / serverless → chromium-min
    const chromium = await import("@sparticuz/chromium-min");
    const executablePath = await chromium.default.executablePath(CHROMIUM_REMOTE_URL);
    return puppeteer.launch({
      args: chromium.default.args,
      executablePath,
      headless: true,
    });
  }

  // Desarrollo local
  const executablePath = await getLocalChromePath();
  if (!executablePath) {
    throw new Error(
      "Chrome no encontrado en rutas locales. Instala Chrome o define CHROME_PATH en .env.local"
    );
  }
  return puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
}
