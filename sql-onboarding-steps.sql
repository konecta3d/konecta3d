-- ============================================================
-- MIGRACIÓN: Pasos de la Guía de Personalización
-- Ejecutar en Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS onboarding_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context TEXT NOT NULL CHECK (context IN ('landing', 'resources')),
  stage TEXT NOT NULL CHECK (stage IN ('contexto', 'primeros-pasos', 'optimizacion', 'maestria')),
  step_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tip TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leer_pasos_onboarding" ON onboarding_steps FOR SELECT USING (true);
CREATE POLICY "service_role_pasos_onboarding" ON onboarding_steps FOR ALL USING (auth.role() = 'service_role');

-- ── LANDING — Contexto ──────────────────────────────────────
INSERT INTO onboarding_steps (context, stage, step_order, title, body, tip) VALUES
('landing', 'contexto', 1,
 'Completa tu perfil GPT',
 'Antes de configurar tu landing, rellena tu perfil GPT. Así el asistente podrá darte consejos personalizados en cada paso.',
 'Tu GPT ya tiene contexto sobre tu negocio si rellenaste el perfil →');

-- ── LANDING — Primeros pasos ────────────────────────────────
INSERT INTO onboarding_steps (context, stage, step_order, title, body, tip) VALUES
('landing', 'primeros-pasos', 1,
 '¿Cuál es el objetivo de tu landing?',
 'Una landing enfocada convierte mejor. Elige UN objetivo principal:

• Que descarguen un recurso de valor
• Que te contacten por WhatsApp
• Que agenden una cita',
 'Pídele al GPT que te ayude a elegir el objetivo según tu sector →'),

('landing', 'primeros-pasos', 2,
 'Configura el título y la descripción',
 'El título debe responder a: ¿qué gana el visitante? Usa la sección Encabezado del panel izquierdo.

Claves para un buen título:
- Claro y directo
- Habla de beneficio, no de función
- Evita usar el nombre de tu negocio como título',
 'Pídele al GPT un título para tu landing basado en tu perfil →'),

('landing', 'primeros-pasos', 3,
 'Añade tus botones de acción (CTAs)',
 'Los CTAs son los botones que llevan al visitante a hacer algo. Configura al menos uno en la sección Botones de acción.

CTA1 → Acción principal
CTA2 → Alternativa
CTA3 → Última oportunidad',
 'Pídele al GPT el texto ideal para tus botones →'),

('landing', 'primeros-pasos', 4,
 'Personaliza el diseño',
 'Ajusta colores, fuentes y logo para que la landing refleje tu marca. Usa las secciones Colores y Logo del panel.

La consistencia visual genera más confianza.',
 NULL),

('landing', 'primeros-pasos', 5,
 'Publica tu landing',
 'Cuando estés satisfecho, pulsa Guardar cambios y luego Previsualizar Landing para ver el resultado en móvil.

Tu landing ya está activa. Compártela o activa el NFC de tu llavero.',
 NULL);

-- ── LANDING — Optimización ──────────────────────────────────
INSERT INTO onboarding_steps (context, stage, step_order, title, body, tip) VALUES
('landing', 'optimizacion', 1,
 'Añade un recurso de valor',
 'Las landings con recurso gratuito convierten un 40% mejor. Ve a Recurso de Valor y crea uno.

Ideas según tu sector:
• Fisio → Guía de ejercicios
• Dental → Checklist higiene dental
• Inmobiliaria → Guía compra primera vivienda',
 'Pídele al GPT ideas de recursos para tu sector →'),

('landing', 'optimizacion', 2,
 'Optimiza el CTA principal',
 'Revisa el texto de tu botón principal. Los mejores CTAs son:

- Verbos de acción (Descarga, Reserva, Obtén)
- Mencionan el beneficio (tu guía gratis)
- Crean urgencia suave (ahora, hoy)',
 'Pídele al GPT alternativas para tu CTA actual →'),

('landing', 'optimizacion', 3,
 'Añade una reseña o prueba social',
 'Activa el bloque de reseñas en el panel. Una frase real de un cliente satisfecho puede doblar tu tasa de conversión.',
 NULL);

-- ── LANDING — Maestría ──────────────────────────────────────
INSERT INTO onboarding_steps (context, stage, step_order, title, body, tip) VALUES
('landing', 'maestria', 1,
 'Prueba A/B de títulos',
 'Cambia el título de tu landing cada 2 semanas y compara cuántos leads captas. El mejor título puede triplicar resultados.',
 'Pídele al GPT 3 variantes de título para probar →'),

('landing', 'maestria', 2,
 'Analiza tus leads',
 'Ve a la sección Clientes para ver quién ha rellenado el formulario. Identifica patrones: ¿qué sector? ¿qué hora del día?',
 NULL),

('landing', 'maestria', 3,
 'Optimiza cada sección',
 'Revisa el rendimiento de cada bloque de tu landing. Experimenta con diferentes textos en los botones y mide cuál convierte mejor.',
 NULL);

-- ── RECURSOS — Contexto ─────────────────────────────────────
INSERT INTO onboarding_steps (context, stage, step_order, title, body, tip) VALUES
('resources', 'contexto', 1,
 'Antes de crear el recurso',
 'Completa tu perfil GPT para recibir sugerencias de contenido personalizadas a tu sector y cliente ideal.',
 'Rellena tu perfil GPT y vuelve para obtener ideas específicas →');

-- ── RECURSOS — Primeros pasos ───────────────────────────────
INSERT INTO onboarding_steps (context, stage, step_order, title, body, tip) VALUES
('resources', 'primeros-pasos', 1,
 '¿Qué problema resuelve tu recurso?',
 'El mejor recurso resuelve UN problema concreto de tu cliente ideal.

- Específico y accionable
- Resultados claros en el título
- Evita ser demasiado genérico',
 'Pídele al GPT el problema más urgente de tu cliente →'),

('resources', 'primeros-pasos', 2,
 'Elige el formato adecuado',
 'Checklist → Procesos paso a paso
Guía → Explicaciones con contexto
Recomendaciones → Listas de herramientas o consejos

El más descargado: checklist (rápido de leer).',
 NULL),

('resources', 'primeros-pasos', 3,
 'Crea un título con gancho',
 'Fórmula: [Número] + [Adjetivo] + [Resultado deseado] + [Plazo/Sector]

Ejemplo: 7 ejercicios rápidos para aliviar el dolor de espalda en casa

Sé concreto con el resultado.',
 'Pídele al GPT variantes de título para tu recurso →'),

('resources', 'primeros-pasos', 4,
 'Estructura el contenido',
 'Cada sección del recurso debe:
- Tener un título claro
- Ser accionable (el lector puede aplicarlo hoy)
- Ser breve (máx. 3-4 líneas por punto)

5-7 puntos es el tamaño ideal.',
 NULL),

('resources', 'primeros-pasos', 5,
 'Configura los CTAs del recurso',
 'Al final del recurso añade 1-2 botones:

CTA1 → Contactar por WhatsApp
CTA2 → Ver más servicios o agendar cita

El recurso es la puerta, el CTA es la venta.',
 'Pídele al GPT el texto ideal para los CTAs de tu recurso →'),

('resources', 'primeros-pasos', 6,
 'Aplica tu estilo de marca',
 'Usa los colores de tu negocio. La consistencia visual entre landing y recurso genera más confianza.',
 NULL),

('resources', 'primeros-pasos', 7,
 'Genera y descarga el PDF',
 'Pulsa Generar PDF para obtener el archivo. Compártelo por WhatsApp, Instagram o vincúlalo en tu landing como CTA1.

Tu primer recurso de valor está listo.',
 NULL);

-- ── RECURSOS — Optimización ─────────────────────────────────
INSERT INTO onboarding_steps (context, stage, step_order, title, body, tip) VALUES
('resources', 'optimizacion', 1,
 'Crea un segundo recurso',
 'Negocios con 2 o más recursos captan un 60% más de leads. Crea un recurso para cada servicio principal que ofreces.',
 'Pídele al GPT ideas para tu próximo recurso de valor →'),

('resources', 'optimizacion', 2,
 'Mejora el título del recurso existente',
 'Si tu recurso lleva activo más de 2 semanas, prueba un título más específico. La especificidad siempre gana.',
 NULL);

-- ── RECURSOS — Maestría ─────────────────────────────────────
INSERT INTO onboarding_steps (context, stage, step_order, title, body, tip) VALUES
('resources', 'maestria', 1,
 'Recursos estacionales',
 'Crea recursos específicos para momentos del año: vuelta al cole, navidad, verano. La relevancia temporal multiplica las descargas.',
 'Pídele al GPT un calendario de recursos para todo el año →'),

('resources', 'maestria', 2,
 'Secuencia de recursos',
 'Diseña una secuencia: recurso gratuito → servicio de pago. Cada recurso lleva al siguiente nivel de compromiso.',
 NULL);

-- ============================================================
-- FIN DE MIGRACIÓN
-- ============================================================
