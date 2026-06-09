-- ============================================================
-- Añadir URL de política de privacidad por campaña
-- Permite que cada negocio enlace su propia política en el
-- checkbox de consentimiento del formulario de captación.
-- ============================================================

ALTER TABLE captacion_campaigns
  ADD COLUMN IF NOT EXISTS privacy_url  TEXT,
  ADD COLUMN IF NOT EXISTS privacy_text TEXT;
