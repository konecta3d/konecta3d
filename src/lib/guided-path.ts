// ─── Ruta guiada — orden recomendado de secciones para el negocio ───────────────
// El admin define, por perfil, qué secciones forman el camino y con qué etiqueta
// ("Primer paso", "Paso 2"…). En la barra lateral esas secciones muestran el punto
// naranja parpadeante + la etiqueta MIENTRAS estén incompletas; al completarlas, el
// punto se apaga solo (detección por sección). Se guarda en settings (key guided_path).

import type { SupabaseClient } from "@supabase/supabase-js";

export type GuidedProfile = "fidelizacion" | "captacion";

export interface GuidedStep {
  href: string;
  hint: string; // etiqueta visible bajo el nombre (ej. "Primer paso", "Paso 2")
}

export interface GuidedPathConfig {
  fidelizacion: GuidedStep[];
  captacion: GuidedStep[];
}

// Config por defecto: preserva el comportamiento actual (los dos Contexto = Primer paso).
export const DEFAULT_GUIDED_PATH: GuidedPathConfig = {
  fidelizacion: [{ href: "/mi-contexto", hint: "Primer paso" }],
  captacion: [{ href: "/captacion/contexto", hint: "Primer paso" }],
};

// Secciones que el admin puede añadir a la ruta (las que tienen un "completado" detectable).
export const SELECTABLE_SECTIONS: Record<GuidedProfile, { href: string; label: string }[]> = {
  fidelizacion: [
    { href: "/mi-contexto", label: "Contexto del negocio" },
    { href: "/landing/new", label: "Página de bienvenida" },
    { href: "/lead-magnet", label: "Recursos de valor" },
    { href: "/vip-benefits", label: "Beneficios VIP" },
    { href: "/formularios", label: "Formularios" },
  ],
  captacion: [
    { href: "/captacion/contexto", label: "Contexto del negocio" },
    { href: "/captacion/campanas", label: "Campañas" },
    { href: "/captacion/formularios", label: "Formularios" },
    { href: "/captacion/lead-magnets", label: "Recursos de valor" },
  ],
};

// Comprobación de "completado" por sección: existe al menos una pieza creada.
// Los dos Contexto se calculan aparte (se pasan ya resueltos).
const COUNT_TABLE: Record<string, string> = {
  "/landing/new": "landing_configs",
  "/lead-magnet": "lead_magnets",
  "/vip-benefits": "benefits",
  "/formularios": "fidelizacion_forms",
  "/captacion/campanas": "captacion_campaigns",
  "/captacion/formularios": "captacion_forms",
  "/captacion/lead-magnets": "captacion_lead_magnets",
};

/**
 * Devuelve el conjunto de hrefs YA completados por el negocio, entre los `hrefs`
 * dados. Los Contexto se pasan ya resueltos (el layout ya los calcula).
 */
export async function getCompletedHrefs(
  supabase: SupabaseClient,
  bid: string,
  hrefs: string[],
  ctx: { contextDone: boolean; captacionContextDone: boolean }
): Promise<Set<string>> {
  const done = new Set<string>();
  if (ctx.contextDone) done.add("/mi-contexto");
  if (ctx.captacionContextDone) done.add("/captacion/contexto");

  const toCheck = hrefs.filter((h) => COUNT_TABLE[h]);
  await Promise.all(
    toCheck.map(async (h) => {
      try {
        const { count } = await supabase
          .from(COUNT_TABLE[h])
          .select("id", { count: "exact", head: true })
          .eq("business_id", bid);
        if ((count ?? 0) > 0) done.add(h);
      } catch {
        /* si falla, se trata como incompleto (sigue guiando) */
      }
    })
  );
  return done;
}
