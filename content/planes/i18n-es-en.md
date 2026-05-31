# Plan de implementación: Sistema de traducción ES/EN

> Estado: **PENDIENTE DE EJECUCIÓN**  
> Fecha del plan: 2026-05-31  
> Estimación: ~16-18 horas de trabajo  
> Prioridad: Alta — cliente anglófono sin acceso a la plataforma

---

## Contexto

Un cliente inglés no puede usar la plataforma porque su navegador no puede traducirla automáticamente (probable causa: contenido renderizado dinámicamente por React que Chrome no intercepta). Se decidió implementar un sistema propio ES/EN en lugar de depender de la traducción del navegador.

---

## Decisiones de arquitectura tomadas

| Decisión | Elección | Razón |
|---|---|---|
| Librería i18n | Ninguna — React Context puro | Sin complejidad extra, fácil de mantener por una persona |
| Routing | Sin cambios de rutas (/en/ etc.) | Demasiado disruptivo, no necesario para ES/EN |
| Detección de idioma | navigator.language + localStorage | Automático en primer acceso, persistente después |
| Flash prevention | Script inline en `<head>` | Lee localStorage antes de que React renderice, sin flash |
| Panel admin | NO se traduce | Solo lo usa Miguel (español) |
| Landings públicas `/l/[slug]` | NO se traducen | Siempre en español, son del negocio |

**Botón de idioma:** ⚠️ PENDIENTE DECISIÓN — Miguel debe elegir:
- A) Solo texto: `ES | EN` (discreto, footer sidebar)
- B) Banderas + texto: 🇪🇸 ES | 🇬🇧 EN
- C) Solo banderas: 🇪🇸 | 🇬🇧

---

## Archivos a crear (nuevos)

```
src/lib/i18n/
  types.ts          — interfaz TypeScript completa (~380 strings tipados)
  es.ts             — diccionario español (fuente de verdad)
  en.ts             — diccionario inglés (traducción completa)
  context.tsx       — LanguageProvider + useTranslation() hook
  index.ts          — barrel export

src/components/
  LanguageToggle.tsx — botón ES | EN en sidebar y header móvil
```

---

## Interfaz TypeScript completa (`Translations`)

```typescript
export interface Translations {

  common: {
    loading: string;
    saving: string;
    saved: string;
    saveChanges: string;
    cancel: string;
    close: string;
    edit: string;
    delete: string;
    create: string;
    new: string;
    back: string;
    confirm: string;
    search: string;
    filter: string;
    noResults: string;
    errorGeneric: string;
    reload: string;
    viewAll: string;
    seeList: string;
    manage: string;
    contactNow: string;
    copy: string;
    copied: string;
    activate: string;
    deactivate: string;
    active: string;
    inactive: string;
    required: string;
    optional: string;
    preview: string;
    download: string;
    upload: string;
    thisWeek: string;
  };

  layout: {
    mobileMenu: string;
    mobileClose: string;
    darkMode: string;
    lightMode: string;
    signOut: string;
    backToAdmin: string;
    switchTo: string;
    profiles: {
      fidelizacion: string;
      captacion: string;
      miNegocio: string;
    };
    accountPaused: {
      title: string;
      description: string;
      contactSupport: string;
    };
  };

  sidebar: {
    profileLabels: {
      captacion: string;
      miNegocio: string;
      fidelizacion: string;
    };
    dashboard: string;
    home: string;
    fidelizacion: {
      categoryContext: string;
      categoryGeneradores: string;
      categoryAvanzado: string;
      contextoFidelizacion: string;
      landing: string;
      recursoDeValor: string;
      beneficiosVip: string;
      formularios: string;
      gptExterno: string;
    };
    captacion: {
      categoryCaptacion: string;
      contextoCaptacion: string;
      campanas: string;
      formularios: string;
      leadMagnets: string;
      recorrido: string;
    };
    negocio: {
      categoryMiNegocio: string;
      perfil: string;
      herramientas: string;
      clientes: string;
    };
  };

  fidelizacion: {
    dashboard: {
      editProfile: string;
      generatorsTitle: string;
      businessNameFallback: string;
      modules: {
        landing: { label: string; description: string; countLabel: string; countLabelPlural: string };
        leadMagnet: { label: string; description: string; countLabel: string; countLabelPlural: string };
        vipBenefits: { label: string; description: string; countLabel: string; countLabelPlural: string };
        forms: { label: string; description: string; countLabel: string; countLabelPlural: string };
        tools: { label: string; description: string };
      };
    };
    leadMagnet: {
      pageTitle: string;
      createNew: string;
      noItems: string;
      typeLabels: { pdf: string; url: string; text: string };
    };
    vipBenefits: {
      pageTitle: string;
      createNew: string;
      confirmDelete: string;
      noItems: string;
    };
    forms: {
      pageTitle: string;
      createNew: string;
      noItems: string;
      objectives: {
        general: { label: string; description: string };
        nps: { label: string; description: string };
        product: { label: string; description: string };
        service: { label: string; description: string };
      };
    };
    context: {
      pageTitle: string;
      copyText: string;
      downloadPdf: string;
      incomplete: string;
    };
    tools: {
      pageTitle: string;
      categories: {
        whatsapp: { title: string; description: string };
        calendar: { title: string; description: string };
        location: { title: string; description: string };
        reviews: { title: string; description: string };
        payment: { title: string; description: string };
        video: { title: string; description: string };
        form: { title: string; description: string };
        catalog: { title: string; description: string };
        social: { title: string; description: string };
        web: { title: string; description: string };
      };
    };
  };

  captacion: {
    home: {
      newCampaign: string;
      viewLeads: string;
      manage: string;
      profileTitle: string;
      businessNameFallback: string;
      activeCampaignBadge: string;
      leadsCaptured: string;
      leadCaptured: string;
      metricsTitle: string;
      lmPendingAlert: { message: string; sub: string; action: string };
      metrics: {
        leadsCaptured: string;
        uncontacted: string;
        followUp: string;
        lmDownloaded: string;
        conversion: string;
      };
      trafficLights: { green: string; yellow: string; red: string };
      urgency: {
        over48h: string;
        uncontacted: string;
        pendingTime: string;
        upToDate: string;
        thisWeek: string;
      };
      sections: {
        campaigns: { label: string; description: string };
        forms: { label: string; description: string };
        leadMagnets: { label: string; description: string };
        leads: { label: string; description: string };
      };
      countLabels: {
        campaign: string; campaigns: string;
        form: string; forms: string;
        resource: string; resources: string;
        lead: string; leads: string;
      };
    };
    campaigns: {
      pageTitle: string;
      createNew: string;
      noItems: string;
      statusLabels: { draft: string; active: string; finished: string };
      pipeline: {
        title: string;
        stations: { contexto: string; formulario: string; leadMagnet: string; recorrido: string };
        notAssigned: string; assigned: string; notDefined: string; defined: string;
        activateButton: string;
      };
      form: {
        name: string; type: string; typeEvent: string; typePermanent: string;
        startsAt: string; endsAt: string; targetClient: string;
        objective: string; keychainsDistributed: string;
      };
    };
    leads: {
      pageTitle: string;
      statusLabels: { new: string; contacted: string; active: string; discarded: string };
      lmStatus: { pending: string; downloaded: string };
      fields: {
        phone: string; email: string; company: string; position: string;
        segment: string; campaign: string; capturedAt: string;
      };
      whatsappContact: string;
      sendLmLink: string;
      noLeads: string;
      tabAll: string;
      tabSinLm: string;
    };
    leadMagnets: {
      pageTitle: string;
      createNew: string;
      noItems: string;
      typeLabels: { pdf: string; url: string };
      copyLink: string;
    };
    forms: {
      pageTitle: string;
      createNew: string;
      noItems: string;
      objectives: {
        quick: { label: string; description: string };
        diagnostic: { label: string; description: string };
        full: { label: string; description: string };
      };
    };
    context: {
      pageTitle: string;
      saveBlock: string;
      blocks: {
        identity: { title: string; shortDesc: string; sideTitle: string; sideExplain: string; sideWithout: string; sideWith: string; fields: Record<string, { label: string; placeholder: string }> };
        idealClient: { title: string; shortDesc: string; sideTitle: string; sideExplain: string; sideWithout: string; sideWith: string; fields: Record<string, { label: string; placeholder: string }> };
        offer: { title: string; shortDesc: string; sideTitle: string; sideExplain: string; sideWithout: string; sideWith: string; fields: Record<string, { label: string; placeholder: string }> };
        urgency: { title: string; shortDesc: string; sideTitle: string; sideExplain: string; sideWithout: string; sideWith: string; fields: Record<string, { label: string; placeholder: string }> };
        objections: { title: string; shortDesc: string; sideTitle: string; sideExplain: string; sideWithout: string; sideWith: string; fields: Record<string, { label: string; placeholder: string }> };
        style: { title: string; shortDesc: string; sideTitle: string; sideExplain: string; sideWithout: string; sideWith: string; fields: Record<string, { label: string; placeholder: string }> };
        channels: { title: string; shortDesc: string; sideTitle: string; sideExplain: string; sideWithout: string; sideWith: string; fields: Record<string, { label: string; placeholder: string }> };
      };
    };
    recorrido: { pageTitle: string };
  };

  miNegocio: {
    profile: {
      pageTitle: string; subtitle: string;
      logoTitle: string; uploadLogo: string; logoHint: string;
      basicDataTitle: string;
      fields: {
        businessName: string; slug: string; slugPrefix: string;
        phone: string; email: string; emailHint: string;
        description: string; descriptionPlaceholder: string; address: string;
      };
      publicLinkTitle: string; publicLandingLabel: string;
      passwordTitle: string; passwordDescription: string; contactKonecta3d: string;
      savedOk: string; logoUpdated: string; errorUploadLogo: string;
    };
    stats: { pageTitle: string };
    onboarding: {
      pageTitle: string;
      steps: { businessData: string; idealClient: string; mainOffer: string };
      fields: {
        businessName: string; sector: string; city: string;
        idealClient: string; problems: string; offerName: string;
        offerBenefits: string; offerCta: string;
      };
    };
    historial: { pageTitle: string };
  };

  login: {
    emailLabel: string;
    passwordLabel: string;
    showPassword: string;
    hidePassword: string;
    accessTrouble: string;
    support: string;
    adminAccess: string;
    verifying: string;
    errors: {
      emptyIdentifier: string;
      emptyPassword: string;
      businessNotFound: string;
      wrongPassword: string;
    };
  };
}
```

---

## LanguageProvider + useTranslation (código completo)

```tsx
// src/lib/i18n/context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import type { Translations } from "./types";
import { es } from "./es";
import { en } from "./en";

type Lang = "es" | "en";
const DICT: Record<Lang, Translations> = { es, en };
const STORAGE_KEY = "konecta-lang";

interface LangContextValue {
  t: Translations;
  lang: Lang;
  setLang: (lang: Lang) => void;
  mounted: boolean;
}

const LangContext = createContext<LangContextValue>({
  t: es, lang: "es", setLang: () => {}, mounted: false,
});

function detectBrowserLang(): Lang {
  if (typeof navigator === "undefined") return "es";
  return navigator.language.startsWith("en") ? "en" : "es";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Lee localStorage sincrónicamente en el cliente para evitar flash
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof document !== "undefined") {
      const attr = document.documentElement.getAttribute("data-lang");
      if (attr === "en" || attr === "es") return attr;
    }
    return "es";
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored === "es" || stored === "en") {
      setLangState(stored);
    } else {
      setLangState(detectBrowserLang());
    }
    setMounted(true);
  }, []);

  const setLang = (next: Lang) => {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.setAttribute("data-lang", next);
  };

  const t = useMemo(() => DICT[lang], [lang]);

  return (
    <LangContext.Provider value={{ t, lang, setLang, mounted }}>
      {children}
    </LangContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LangContext);
}
```

**Script inline en `src/app/layout.tsx`** (root layout, dentro de `<head>`):
```tsx
<script dangerouslySetInnerHTML={{ __html: `
  try {
    var l = localStorage.getItem('konecta-lang');
    if (l) document.documentElement.setAttribute('data-lang', l);
  } catch(e){}
` }} />
```

---

## LanguageToggle (código completo)

```tsx
// src/components/LanguageToggle.tsx
"use client";
import { useTranslation } from "@/lib/i18n/context";

export function LanguageToggle() {
  const { lang, setLang, mounted } = useTranslation();
  if (!mounted) return null;

  return (
    <div className="flex items-center rounded-lg border border-[var(--border)] overflow-hidden text-xs font-semibold">
      {(["es", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={`px-3 py-1.5 uppercase transition-colors ${
            lang === l
              ? "bg-[var(--brand-1)] text-white"
              : "text-[var(--foreground)]/50 hover:text-[var(--foreground)]"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
```

**✅ DECISIÓN TOMADA (2026-05-31):** Opción C — solo banderas `🇪🇸 | 🇬🇧`

El código del toggle debe usar emojis de bandera en lugar de texto:
```tsx
const LABELS: Record<Lang, string> = { es: "🇪🇸", en: "🇬🇧" };
// Reemplazar {l.toUpperCase()} por {LABELS[l]}
```

**Dónde colocarlo:**
- Sidebar desktop → sección "Pie del sidebar" de `src/components/Sidebar.tsx` (solo en modo business, no admin)
- Header móvil → junto al botón de tema en `src/app/(app)/layout.tsx`

---

## Fases de implementación

| Fase | Archivos | Strings | Tiempo est. |
|---|---|---|---|
| **1 — Infraestructura** | types.ts, es.ts, en.ts, context.tsx, index.ts | ~380 | 4-6 h |
| **2 — Shell** | layout.tsx, Sidebar.tsx, LanguageToggle.tsx | ~55 | 2 h |
| **3 — Dashboard + captación home + clientes** | 3 páginas | ~105 | 3 h |
| **4 — Captación subpáginas** | campanas, formularios, lead-magnets, contexto | ~100 | 3 h |
| **5 — Mi Negocio subpáginas** | perfil, herramientas, formularios, lead-magnet, vip-benefits | ~80 | 2 h |
| **6 — Resto + login** | onboarding, historial, recorrido, page.tsx raíz | ~50 | 2 h |
| **TOTAL** | 26 archivos | ~370 | ~16-18 h |

### Orden de migración de páginas
```
FASE 1:
  src/lib/i18n/types.ts        (nuevo)
  src/lib/i18n/es.ts           (nuevo — diccionario español completo)
  src/lib/i18n/en.ts           (nuevo — diccionario inglés completo)
  src/lib/i18n/context.tsx     (nuevo)
  src/lib/i18n/index.ts        (nuevo)
  src/app/layout.tsx           (modificar — añadir script inline en <head>)

FASE 2:
  src/components/LanguageToggle.tsx        (nuevo)
  src/app/(app)/layout.tsx                 (modificar — LanguageProvider + strings)
  src/components/Sidebar.tsx               (modificar — strings + LanguageToggle)

FASE 3:
  src/app/(app)/mi-negocio/dashboard/page.tsx
  src/app/(app)/captacion/page.tsx
  src/app/(app)/captacion/clientes/page.tsx (o negocio/clientes)

FASE 4:
  src/app/(app)/captacion/campanas/page.tsx
  src/app/(app)/captacion/formularios/page.tsx
  src/app/(app)/captacion/lead-magnets/page.tsx
  src/app/(app)/captacion/contexto/page.tsx   ← más pesado (BLOCKS array)

FASE 5:
  src/app/(app)/mi-negocio/perfil/page.tsx (o negocio/perfil)
  src/app/(app)/acciones/page.tsx
  src/app/(app)/formularios/page.tsx
  src/app/(app)/lead-magnet/page.tsx
  src/app/(app)/vip-benefits/page.tsx

FASE 6:
  src/app/(app)/mi-negocio/onboarding/page.tsx
  src/app/(app)/mi-negocio/historial/page.tsx
  src/app/(app)/captacion/recorrido/page.tsx
  src/app/page.tsx   ← login de negocios (~12 strings hardcodeadas)
```

---

## Archivos excluidos (NO traducir)

- `src/app/(app)/admin/**` — panel de admin, solo Miguel (español)
- `src/app/(app)/landing/**` — editor de landing, solo Miguel
- `src/app/l/[slug]/**` — landing pública del negocio, siempre en español
- `src/components/HelpDrawer.tsx` — el contenido viene de la BD (help_content), no hardcodeado
- `src/lib/help-content.ts` — contenido de ayuda, gestionado desde el editor admin

---

## Notas para la ejecución

1. Empezar siempre por **Fase 1 completa** antes de tocar ningún componente
2. El archivo `contexto/page.tsx` de captación es el más complejo: el array `BLOCKS` (hardcodeado) debe convertirse en una función que recibe `t` y devuelve el array — mismo patrón que los module cards del dashboard
3. Las strings con interpolación (`{count} leads sin contactar`) se resuelven con `.replace("{count}", String(n))` — sin librería
4. Cualquier componente que use `useTranslation()` debe ser `"use client"` o estar dentro de uno
5. El toggle de idioma **no aparece** en el panel admin (solo en modo business)

---

## Cómo pedirle a Claude que ejecute este plan

> "Ejecuta el plan de i18n que está en `content/planes/i18n-es-en.md`. Empieza por la Fase 1."

O por fases:
> "Ejecuta la Fase 2 del plan de i18n (Sidebar y layout)."

Claude leerá este archivo al inicio y tendrá todo el contexto necesario.
