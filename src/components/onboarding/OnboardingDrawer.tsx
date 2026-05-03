"use client";

/**
 * OnboardingDrawer — Panel lateral de guía para el editor de Landing.
 *
 * Escritorio: drawer fijo a la derecha que se desliza dentro/fuera.
 * Móvil: banner en la parte superior que abre un modal.
 *
 * Props:
 * - context: "landing" | "resources"  → qué flujo de pasos mostrar
 * - businessId: string
 * - moduleGpt: boolean  → si true, muestra el enlace al GPT al final de cada paso
 * - gptUrl: string       → URL del GPT
 */

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OnboardingContext = "landing" | "resources";

interface DbStep {
  id: string;
  context: OnboardingContext;
  stage: Stage;
  step_order: number;
  title: string;
  body: string;
  tip: string | null;
  active: boolean;
}

interface OnboardingDrawerProps {
  context: OnboardingContext;
  businessId: string;
  moduleGpt?: boolean;
  gptUrl?: string;
  /** Control externo del estado abierto/cerrado (para botón en el header) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type Stage = "contexto" | "primeros-pasos" | "optimizacion" | "maestria";

interface Step {
  title: string;
  body: string;
  tip?: string; // solo si moduleGpt
  stage?: Stage;
}

// ─── Content ──────────────────────────────────────────────────────────────────

const LANDING_STEPS: Record<Stage, Step[]> = {
  "contexto": [
    {
      title: "Completa tu perfil GPT",
      body: "Antes de configurar tu landing, rellena tu perfil GPT. Así el asistente podrá darte consejos personalizados en cada paso.",
      tip: "Tu GPT ya tiene contexto sobre tu negocio si rellenaste el perfil →",
    },
  ],
  "primeros-pasos": [
    {
      title: "¿Cuál es el objetivo de tu landing?",
      body: "Una landing enfocada convierte mejor. Elige UN objetivo principal:\n\n• Que descarguen un recurso de valor\n• Que te contacten por WhatsApp\n• Que agenden una cita",
      tip: "Pídele al GPT que te ayude a elegir el objetivo según tu sector →",
    },
    {
      title: "Configura el título y la descripción",
      body: "El título debe responder a: ¿qué gana el visitante? Usa la sección 'Encabezado' del panel izquierdo.\n\n✓ Claro y directo\n✓ Habla de beneficio, no de función\n✗ Evita el nombre de tu negocio como título",
      tip: "Pídele al GPT un título para tu landing basado en tu perfil →",
    },
    {
      title: "Añade tus botones de acción (CTAs)",
      body: "Los CTAs son los botones que llevan al visitante a hacer algo. Configura al menos uno en la sección 'Botones de acción'.\n\nCTA1 → Acción principal\nCTA2 → Alternativa\nCTA3 → Última oportunidad",
      tip: "Pídele al GPT el texto ideal para tus botones →",
    },
    {
      title: "Personaliza el diseño",
      body: "Ajusta colores, fuentes y logo para que la landing refleje tu marca. Usa las secciones 'Colores' y 'Logo' del panel.\n\nConsistencia visual genera más confianza.",
    },
    {
      title: "Publica tu landing",
      body: "Cuando estés satisfecho, pulsa 'Guardar cambios' y luego 'Previsualizar Landing' para ver el resultado en móvil.\n\nTu landing ya está activa. Compártela o activa el NFC de tu llavero.",
    },
  ],
  "optimizacion": [
    {
      title: "Añade un recurso de valor",
      body: "Las landings con recurso gratuito convierten un 40% mejor. Ve a 'Recurso de Valor' y crea uno.\n\nIdeas según tu sector:\n• Fisio → Guía de ejercicios\n• Dental → Checklist higiene dental\n• Inmobiliaria → Guía compra primera vivienda",
      tip: "Pídele al GPT ideas de recursos para tu sector →",
    },
    {
      title: "Optimiza el CTA principal",
      body: "Revisa el texto de tu botón principal. Los mejores CTAs son:\n\n✓ Verbos de acción ('Descarga', 'Reserva', 'Obtén')\n✓ Mencionan el beneficio ('tu guía gratis')\n✓ Crean urgencia suave ('ahora', 'hoy')",
      tip: "Pídele al GPT alternativas para tu CTA actual →",
    },
    {
      title: "Añade una reseña o prueba social",
      body: "Activa el bloque de reseñas en el panel. Una frase real de un cliente satisfecho puede doblar tu tasa de conversión.",
    },
  ],
  "maestria": [
    {
      title: "Prueba A/B de títulos",
      body: "Cambia el título de tu landing cada 2 semanas y compara cuántos leads captas. El mejor título puede triplicar resultados.",
      tip: "Pídele al GPT 3 variantes de título para probar →",
    },
    {
      title: "Analiza tus leads",
      body: "Ve a la sección 'Clientes' para ver quién ha rellenado el formulario. Identifica patrones: ¿qué sector? ¿qué hora del día?",
    },
    {
      title: "Optimiza cada sección",
      body: "Revisa el rendimiento de cada bloque de tu landing. Experimenta con diferentes textos en los botones y mide cuál convierte mejor.",
    },
  ],
};

const RESOURCE_STEPS: Record<Stage, Step[]> = {
  "contexto": [
    {
      title: "Antes de crear el recurso",
      body: "Completa tu perfil GPT para recibir sugerencias de contenido personalizadas a tu sector y cliente ideal.",
      tip: "Rellena tu perfil GPT y vuelve para obtener ideas específicas →",
    },
  ],
  "primeros-pasos": [
    {
      title: "¿Qué problema resuelve tu recurso?",
      body: "El mejor recurso resuelve UN problema concreto de tu cliente ideal.\n\n✓ Específico y accionable\n✓ Resultados claros en el título\n✗ Demasiado genérico ('Todo sobre el marketing')",
      tip: "Pídele al GPT el problema más urgente de tu cliente →",
    },
    {
      title: "Elige el formato adecuado",
      body: "• Checklist → Procesos paso a paso\n• Guía → Explicaciones con contexto\n• Recomendaciones → Listas de herramientas/consejos\n\nEl más descargado: checklist (rápido de leer).",
    },
    {
      title: "Crea un título con gancho",
      body: "Fórmula: [Número] + [Adjetivo] + [Resultado deseado] + [Plazo/Sector]\n\nEjemplo: '7 ejercicios rápidos para aliviar el dolor de espalda en casa'\n\nSe concreto con el resultado.",
      tip: "Pídele al GPT variantes de título para tu recurso →",
    },
    {
      title: "Estructura el contenido",
      body: "Cada sección del recurso debe:\n✓ Tener un título claro\n✓ Ser accionable (el lector puede aplicarlo hoy)\n✓ Ser breve (máx. 3-4 líneas por punto)\n\n5-7 puntos es el tamaño ideal.",
    },
    {
      title: "Configura los CTAs del recurso",
      body: "Al final del recurso añade 1-2 botones:\n\nCTA1 → Contactar por WhatsApp\nCTA2 → Ver más servicios / Agendar cita\n\nEl recurso es la puerta, el CTA es la venta.",
      tip: "Pídele al GPT el texto ideal para los CTAs de tu recurso →",
    },
    {
      title: "Aplica tu estilo de marca",
      body: "Usa los colores de tu negocio. La consistencia visual entre landing y recurso genera más confianza.\n\nSi no tienes colores definidos, usa verde oscuro + blanco (funciona en todos los sectores).",
    },
    {
      title: "Genera y descarga el PDF",
      body: "Pulsa 'Generar PDF' para obtener el archivo. Compártelo por WhatsApp, Instagram o vincúlalo en tu landing como CTA1.\n\nTu primer recurso de valor está listo.",
    },
  ],
  "optimizacion": [
    {
      title: "Crea un segundo recurso",
      body: "Negocios con 2+ recursos captan un 60% más de leads. Crea un recurso para cada servicio principal que ofreces.",
      tip: "Pídele al GPT ideas para tu próximo recurso de valor →",
    },
    {
      title: "Mejora el título del recurso existente",
      body: "Si tu recurso lleva activo más de 2 semanas, prueba un título más específico. La especificidad siempre gana.",
    },
  ],
  "maestria": [
    {
      title: "Recursos estacionales",
      body: "Crea recursos específicos para momentos del año: vuelta al cole, navidad, verano. La relevancia temporal multiplica las descargas.",
      tip: "Pídele al GPT un calendario de recursos para todo el año →",
    },
    {
      title: "Secuencia de recursos",
      body: "Diseña una secuencia: recurso gratuito → servicio de pago. Cada recurso lleva al siguiente nivel de compromiso.",
    },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STAGE_ORDER: Stage[] = ["contexto", "primeros-pasos", "optimizacion", "maestria"];

const STAGE_LABEL: Record<Stage, string> = {
  "contexto": "Antes de empezar",
  "primeros-pasos": "Primeros pasos",
  "optimizacion": "Optimización",
  "maestria": "Estrategia avanzada",
};

// La clave incluye el contexto para que landing y recursos sean independientes
const storageKey = (context: OnboardingContext) => `konecta-onboarding-drawer-${context}`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingDrawer({
  context,
  businessId: _businessId, // reservado para uso futuro (analytics, etc.)
  moduleGpt = false,
  gptUrl = "https://chatgpt.com/",
  open: openProp,
  onOpenChange,
}: OnboardingDrawerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  // Si viene controlado externamente, usar esa prop; si no, el estado interno
  const open = openProp !== undefined ? openProp : internalOpen;

  // Steps cargados desde la BD (null = aún cargando; [] o array = ya cargado)
  const [dbSteps, setDbSteps] = useState<DbStep[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("onboarding_steps")
      .select("*")
      .eq("active", true)
      .order("stage")
      .order("step_order")
      .then(({ data, error }) => {
        if (cancelled) return;
        console.log("[OnboardingDrawer] fetch result:", {
          total: data?.length ?? 0,
          forContext: data?.filter(s => s.context === context).length ?? 0,
          error: error?.message ?? null,
          sample: data?.slice(0, 3).map(s => `${s.context}/${s.stage}/${s.step_order}`),
        });
        if (data && data.length > 0) setDbSteps(data as DbStep[]);
        // Si data es null o vacío, dejamos dbSteps en null → fallback hardcoded
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  // Load persisted state (clave por contexto para que landing y recursos sean independientes)
  const STORAGE_KEY = storageKey(context);
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Limpiar clave antigua (sin contexto) para evitar estados obsoletos
    localStorage.removeItem("konecta-onboarding-drawer");
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.dismissed) { setDismissed(true); return; }
        if (parsed.open !== undefined && onOpenChange === undefined) setInternalOpen(parsed.open);
        if (parsed.stepIndex !== undefined) setStepIndex(parsed.stepIndex);
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si el usuario pulsa explícitamente el botón "Guía de Personalización" (openProp → true)
  // y la guía estaba descartada, la reactivamos para que pueda volver a usarla.
  useEffect(() => {
    if (openProp !== true || !dismissed) return;
    setDismissed(false);
    try {
      const key = storageKey(context);
      const current = JSON.parse(localStorage.getItem(key) || "{}");
      localStorage.setItem(key, JSON.stringify({ ...current, dismissed: false, stepIndex: 0 }));
      setStepIndex(0);
    } catch { /* ignore */ }
  }, [openProp, dismissed, context]);

  // Sincronizar el prop externo `open` con el modal móvil:
  // El drawer de escritorio usa `hidden lg:flex` (invisible en móvil),
  // así que cuando el padre abre la guía en móvil hay que abrir el modal.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMobile = window.innerWidth < 1024;
    if (openProp === true && isMobile) {
      setMobileOpen(true);
    }
    if (openProp === false && isMobile) {
      setMobileOpen(false);
    }
  }, [openProp]);

  const persist = useCallback((patch: { open?: boolean; stepIndex?: number; dismissed?: boolean }) => {
    if (typeof window === "undefined") return;
    try {
      const key = storageKey(context);
      const current = JSON.parse(localStorage.getItem(key) || "{}");
      localStorage.setItem(key, JSON.stringify({ ...current, ...patch }));
    } catch { /* ignore */ }
  }, [context]);

  const toggle = () => {
    const next = !open;
    if (onOpenChange) onOpenChange(next);
    else setInternalOpen(next);
    persist({ open: next });
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (onOpenChange) onOpenChange(false);
    else setInternalOpen(false);
    persist({ dismissed: true });
  };

  const handleRestart = () => {
    setStepIndex(0);
    persist({ stepIndex: 0 });
  };

  // Mostrar TODOS los pasos de todos los stages en orden (contexto → primeros-pasos → optimizacion → maestria)
  const steps: Step[] = dbSteps
    ? dbSteps
        .filter(s => s.context === context)
        .sort((a, b) => {
          const stageA = STAGE_ORDER.indexOf(a.stage);
          const stageB = STAGE_ORDER.indexOf(b.stage);
          return stageA !== stageB ? stageA - stageB : a.step_order - b.step_order;
        })
        .map(s => ({ title: s.title, body: s.body, tip: s.tip ?? undefined, stage: s.stage }))
    : STAGE_ORDER.flatMap(st =>
        ((context === "landing" ? LANDING_STEPS : RESOURCE_STEPS)[st] ?? []).map(
          s => ({ ...s, stage: st as Stage })
        )
      );

  const totalSteps = steps.length;
  // Si el stepIndex guardado en localStorage era de una sesión anterior con menos pasos,
  // lo resetemos silenciosamente para no quedarnos en "último paso" con la guía recién ampliada
  const safeIndex = totalSteps > 0 ? Math.min(stepIndex, totalSteps - 1) : 0;
  const currentStep = steps[safeIndex] ?? steps[0];
  const isLast = safeIndex >= totalSteps - 1;
  // Stage del paso actual (para el header)
  const currentStage: Stage = (currentStep as Step & { stage?: Stage }).stage ?? "primeros-pasos";

  const goNext = () => {
    const next = Math.min(safeIndex + 1, totalSteps - 1);
    setStepIndex(next);
    persist({ stepIndex: next });
  };

  const goSkip = () => goNext();

  if (dismissed) return null;

  return (
    <>
      {/* El botón de apertura lo gestiona el padre (header de la página) */}

      {/* ── Mobile banner — solo si NO está en el último paso completado ── */}
      {!mobileOpen && !isLast && (
        <div className="lg:hidden flex items-center justify-between gap-3 px-4 py-2 bg-[var(--brand-1)]/10 border-b border-[var(--brand-1)]/20 text-xs">
          <span className="font-medium text-[var(--brand-1)] truncate">
            {STAGE_LABEL[currentStage]} — Paso {safeIndex + 1} de {totalSteps}
          </span>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="shrink-0 px-2.5 py-1 rounded-lg bg-[var(--brand-1)] text-white font-semibold"
          >
            Ver guía
          </button>
        </div>
      )}

      {/* ── Mobile modal ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setMobileOpen(false);
              if (onOpenChange) onOpenChange(false);
            }}
          />
          <div className="relative w-full flex flex-col max-h-[80vh] min-h-0 overflow-hidden rounded-t-2xl bg-[var(--card)] border-t border-[var(--border)]">
            <DrawerContent
              stage={currentStage}
              step={currentStep}
              stepIndex={safeIndex}
              totalSteps={totalSteps}
              isLast={isLast}
              moduleGpt={moduleGpt}
              gptUrl={gptUrl}
              onNext={goNext}
              onSkip={goSkip}
              onDismiss={handleDismiss}
              onRestart={handleRestart}
              onClose={() => {
                setMobileOpen(false);
                // Notificar al padre para sincronizar el estado del botón
                if (onOpenChange) onOpenChange(false);
              }}
            />
          </div>
        </div>
      )}

      {/* ── Desktop drawer — panel fijo derecho, ocupa exactamente el alto del viewport ── */}
      {open && (
        <div className="hidden lg:flex fixed top-0 right-0 h-screen z-40 flex-col w-80 bg-[var(--card)] border-l border-[var(--border)] shadow-2xl">
          <DrawerContent
            stage={currentStage}
            step={currentStep}
            stepIndex={safeIndex}
            totalSteps={totalSteps}
            isLast={isLast}
            moduleGpt={moduleGpt}
            gptUrl={gptUrl}
            onNext={goNext}
            onSkip={goSkip}
            onDismiss={handleDismiss}
            onRestart={handleRestart}
            onClose={toggle}
          />
        </div>
      )}
    </>
  );
}

// ─── Inner content (shared between mobile modal + desktop drawer) ─────────────

interface DrawerContentProps {
  stage: Stage;
  step: Step;
  stepIndex: number;
  totalSteps: number;
  isLast: boolean;
  moduleGpt: boolean;
  gptUrl: string;
  onNext: () => void;
  onSkip: () => void;
  onDismiss: () => void;
  onRestart: () => void;
  onClose: () => void;
}

function DrawerContent({
  stage,
  step,
  stepIndex,
  totalSteps,
  isLast,
  moduleGpt,
  gptUrl,
  onNext,
  onSkip,
  onDismiss,
  onRestart,
  onClose,
}: DrawerContentProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-[var(--border)]">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-1)]">
            {STAGE_LABEL[stage]}
          </div>
          <div className="text-xs text-[var(--foreground)]/50 mt-0.5">
            Paso {stepIndex + 1} de {totalSteps}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[var(--border)] transition text-[var(--foreground)]/50 hover:text-[var(--foreground)]"
        >
          ✕
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-2">
        <div className="h-1 rounded-full bg-[var(--border)] overflow-hidden">
          <div
            className="h-full bg-[var(--brand-1)] rounded-full transition-all duration-500"
            style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content — min-h-0 es necesario en flexbox para que overflow-y-auto funcione */}
      <div className="flex-1 min-h-0 px-4 py-3 space-y-3 overflow-y-auto">
        <h3 className="font-bold text-sm leading-snug">{step.title}</h3>
        <p className="text-xs text-[var(--foreground)]/75 leading-relaxed whitespace-pre-line">
          {step.body}
        </p>

        {/* GPT prompt */}
        {moduleGpt && step.tip && (
          <a
            href={gptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition group"
          >
            <div>
              <div className="text-xs font-semibold text-amber-500 group-hover:underline">
                {step.tip}
              </div>
              <div className="text-[10px] text-amber-400/70 mt-0.5">
                GPT de Fidelización →
              </div>
            </div>
          </a>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-4 pb-5 pt-3 border-t border-[var(--border)] space-y-2">
        {!isLast ? (
          <>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onSkip}
                className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] text-xs text-[var(--foreground)]/50 hover:bg-[var(--border)]/50 transition"
              >
                Saltar paso
              </button>
              <button
                type="button"
                onClick={onNext}
                className="flex-1 px-3 py-2 rounded-lg bg-[var(--brand-1)] text-white text-xs font-semibold hover:opacity-90 transition"
              >
                Siguiente →
              </button>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="w-full text-[10px] text-[var(--foreground)]/30 hover:text-[var(--foreground)]/60 transition"
            >
              No volver a mostrar esta guía
            </button>
          </>
        ) : (
          <div className="space-y-2">
            <div className="text-xs text-emerald-500 font-semibold text-center py-1">
              Has completado todos los pasos de esta etapa
            </div>
            <button
              type="button"
              onClick={onRestart}
              className="w-full px-3 py-2 rounded-lg border border-[var(--brand-1)] text-[var(--brand-1)] text-xs font-semibold hover:bg-[var(--brand-1)]/10 transition"
            >
              Volver a ver la guía desde el inicio
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="w-full text-[10px] text-[var(--foreground)]/30 hover:text-[var(--foreground)]/60 transition"
            >
              No volver a mostrar esta guía
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
