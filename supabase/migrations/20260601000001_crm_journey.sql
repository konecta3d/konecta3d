-- ============================================================
-- Tracker del embudo de lanzamiento (seguimiento por cliente)
-- Sigue a cada negocio a través de las 7 etapas del recorrido.
-- Guarda objetivos cumplidos, insights recogidos y siguiente paso.
-- Acceso exclusivo vía API con service role (admin).
-- ============================================================

-- Negocios en seguimiento
CREATE TABLE IF NOT EXISTS crm_journey (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre                TEXT        NOT NULL,                 -- nombre del negocio
  business_id           UUID        REFERENCES businesses(id) ON DELETE SET NULL,
  lead_id               UUID        REFERENCES crm_leads(id)  ON DELETE SET NULL,
  etapa_actual          INT         NOT NULL DEFAULT 1,
  objetivos_cumplidos   JSONB       NOT NULL DEFAULT '[]',   -- array de ids de objetivos marcados
  siguiente_accion      TEXT,
  fecha_proxima_accion  DATE,
  notas                 TEXT,
  etapa_entered_at      TIMESTAMPTZ NOT NULL DEFAULT now(),  -- para medir tiempo por etapa
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_journey_etapa ON crm_journey(etapa_actual);

ALTER TABLE crm_journey ENABLE ROW LEVEL SECURITY;

-- Insights recogidos de las conversaciones con cada negocio
CREATE TABLE IF NOT EXISTS crm_journey_insights (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id    UUID        NOT NULL REFERENCES crm_journey(id) ON DELETE CASCADE,
  etapa_id      INT,                                          -- en qué etapa se recogió
  tipo          TEXT        NOT NULL,                          -- categoría (objeción, deseo, etc.)
  contenido     TEXT,
  fecha         TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_journey_insights_journey ON crm_journey_insights(journey_id);
CREATE INDEX IF NOT EXISTS idx_crm_journey_insights_tipo    ON crm_journey_insights(tipo);

ALTER TABLE crm_journey_insights ENABLE ROW LEVEL SECURITY;
