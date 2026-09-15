-- ============================================================
-- Alinear la tabla businesses con el esquema del código.
--
-- La tabla businesses de producción se creó antes de estas migraciones, y
-- `CREATE TABLE IF NOT EXISTS` NO añade columnas nuevas a una tabla ya existente.
-- Resultado: algunas columnas de "config extra"/módulos definidas en el esquema
-- inicial nunca llegaron a producción. Eso hace que un `select("*")` funcione
-- pero un `select` con esa columna concreta falle (columna inexistente), lo que
-- rompía /api/admin/business-stats (devolvía 404 y dejaba "Cargando progreso...").
--
-- Idempotente: `ADD COLUMN IF NOT EXISTS` no toca las columnas que ya existan.
-- ============================================================

ALTER TABLE businesses
  -- Módulos
  ADD COLUMN IF NOT EXISTS module_lead_magnet    BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS module_vip_benefits   BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS module_whatsapp       BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS module_tools          BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS module_forms          BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS module_gpt            BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS module_ai_landing     BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS module_ai_recursos    BOOLEAN DEFAULT false,
  -- Configuración extra / control de acceso
  ADD COLUMN IF NOT EXISTS profile_active        BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS landing_active        BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS multi_landing_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS font_family           TEXT,
  ADD COLUMN IF NOT EXISTS last_login            TIMESTAMPTZ,
  -- Identidad / contacto (por si faltara alguna en tablas muy antiguas)
  ADD COLUMN IF NOT EXISTS slug                  TEXT,
  ADD COLUMN IF NOT EXISTS public_id             TEXT,
  ADD COLUMN IF NOT EXISTS contact_email         TEXT,
  ADD COLUMN IF NOT EXISTS logo_url              TEXT;
