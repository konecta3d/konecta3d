// ─── 50 tipografías para los PDFs (Google Fonts) ─────────────────────────────
// Se cargan por Google Fonts en el HTML del PDF (Puppeteer las descarga con
// waitUntil networkidle0) y en la vista previa. Nombre = familia de Google Fonts.

export interface PdfFont {
  name: string;
  category: "Sans serif" | "Serif" | "Display" | "Manuscrita" | "Monoespaciada";
}

export const PDF_FONTS: PdfFont[] = [
  // Sans serif (24)
  { name: "Inter", category: "Sans serif" },
  { name: "Roboto", category: "Sans serif" },
  { name: "Open Sans", category: "Sans serif" },
  { name: "Lato", category: "Sans serif" },
  { name: "Montserrat", category: "Sans serif" },
  { name: "Poppins", category: "Sans serif" },
  { name: "Nunito", category: "Sans serif" },
  { name: "Nunito Sans", category: "Sans serif" },
  { name: "Raleway", category: "Sans serif" },
  { name: "Work Sans", category: "Sans serif" },
  { name: "Source Sans 3", category: "Sans serif" },
  { name: "Noto Sans", category: "Sans serif" },
  { name: "Ubuntu", category: "Sans serif" },
  { name: "Rubik", category: "Sans serif" },
  { name: "Mulish", category: "Sans serif" },
  { name: "Manrope", category: "Sans serif" },
  { name: "DM Sans", category: "Sans serif" },
  { name: "Karla", category: "Sans serif" },
  { name: "Quicksand", category: "Sans serif" },
  { name: "Barlow", category: "Sans serif" },
  { name: "PT Sans", category: "Sans serif" },
  { name: "Fira Sans", category: "Sans serif" },
  { name: "Kanit", category: "Sans serif" },
  { name: "Josefin Sans", category: "Sans serif" },
  // Serif (14)
  { name: "Merriweather", category: "Serif" },
  { name: "Playfair Display", category: "Serif" },
  { name: "Lora", category: "Serif" },
  { name: "PT Serif", category: "Serif" },
  { name: "Noto Serif", category: "Serif" },
  { name: "Roboto Slab", category: "Serif" },
  { name: "Bitter", category: "Serif" },
  { name: "Crimson Text", category: "Serif" },
  { name: "EB Garamond", category: "Serif" },
  { name: "Cormorant Garamond", category: "Serif" },
  { name: "Libre Baskerville", category: "Serif" },
  { name: "Zilla Slab", category: "Serif" },
  { name: "Domine", category: "Serif" },
  { name: "Slabo 27px", category: "Serif" },
  // Display (7)
  { name: "Oswald", category: "Display" },
  { name: "Bebas Neue", category: "Display" },
  { name: "Abril Fatface", category: "Display" },
  { name: "Archivo Black", category: "Display" },
  { name: "Anton", category: "Display" },
  { name: "Comfortaa", category: "Display" },
  { name: "Questrial", category: "Display" },
  // Manuscrita (3)
  { name: "Pacifico", category: "Manuscrita" },
  { name: "Dancing Script", category: "Manuscrita" },
  { name: "Caveat", category: "Manuscrita" },
  // Monoespaciada (2)
  { name: "Roboto Mono", category: "Monoespaciada" },
  { name: "Source Code Pro", category: "Monoespaciada" },
];

/** URL de Google Fonts para una familia (sin ejes de peso, robusto para todas). */
export function googleFontHref(name: string): string {
  return `https://fonts.googleapis.com/css2?family=${name.replace(/ /g, "+")}&display=swap`;
}

/** URL de Google Fonts que carga TODAS las familias en una sola petición (para el modal de selección). */
export function allFontsHref(): string {
  const families = PDF_FONTS.map((f) => `family=${f.name.replace(/ /g, "+")}`).join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

export const FONT_CATEGORIES: PdfFont["category"][] = [
  "Sans serif",
  "Serif",
  "Display",
  "Manuscrita",
  "Monoespaciada",
];
