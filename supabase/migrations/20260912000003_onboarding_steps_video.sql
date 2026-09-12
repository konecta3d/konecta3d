-- Vídeo tutorial (~1 min) por paso de la Guía de Personalización.
-- Cada paso (Logo, Nombre, Subtítulo…) de onboarding_steps puede llevar un vídeo
-- que muestra ese paso en uso dentro de la plataforma. Se edita desde
-- /admin/guia-personalizacion y se ve en el editor de landing / wizard de recurso:
-- dentro de cada paso del panel guía y desde un botón de vídeo en la cabecera.
ALTER TABLE onboarding_steps
  ADD COLUMN IF NOT EXISTS video_url text;
