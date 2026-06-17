-- ============================================================
-- Campos de gestión del negocio desde admin
-- Clasificación (perfil de cliente + notas internas) y finanzas (suscripción).
-- ============================================================

ALTER TABLE businesses
  -- Clasificación
  ADD COLUMN IF NOT EXISTS perfil                 TEXT,                         -- A / B / C / D (asignación manual del admin)
  ADD COLUMN IF NOT EXISTS notas_admin            TEXT,
  -- Finanzas (cuota mensual de la plataforma)
  ADD COLUMN IF NOT EXISTS cuota_mensual          NUMERIC(10,2) DEFAULT 149,
  ADD COLUMN IF NOT EXISTS estado_suscripcion     TEXT DEFAULT 'prueba',        -- prueba / activa / impagada / pausada / baja
  ADD COLUMN IF NOT EXISTS metodo_cobro           TEXT,                         -- transferencia / domiciliacion / tarjeta / bizum / otro
  ADD COLUMN IF NOT EXISTS proximo_cobro          DATE,
  ADD COLUMN IF NOT EXISTS fecha_alta_suscripcion DATE;
