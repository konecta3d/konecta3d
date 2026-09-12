-- Interruptor de vídeo por paso: permite activar/desactivar el vídeo de un paso
-- sin borrar su enlace. Por defecto activado. La plataforma solo muestra el vídeo
-- de un paso si tiene video_url Y video_enabled = true.
ALTER TABLE onboarding_steps
  ADD COLUMN IF NOT EXISTS video_enabled boolean DEFAULT true;
