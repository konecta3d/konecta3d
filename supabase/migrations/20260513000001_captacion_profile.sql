-- ============================================================
-- MIGRACIÓN: Perfil de Captación — Konecta3D
-- ============================================================
-- Orden de creación (respeta dependencias):
--   1. captacion_forms          (sin deps externas salvo businesses)
--   2. captacion_lead_magnets   (sin deps externas salvo businesses)
--   3. captacion_campaigns      (depende de forms y lead_magnets)
--   4. captacion_leads          (depende de campaigns)
-- ============================================================


-- ============================================================
-- 1. CAPTACION_FORMS — constructores de formulario por bloques
-- ============================================================

CREATE TABLE IF NOT EXISTS captacion_forms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,

  -- Objetivo del formulario: quick | diagnostic | full
  objective   TEXT NOT NULL DEFAULT 'diagnostic'
              CHECK (objective IN ('quick', 'diagnostic', 'full')),

  -- Estado del formulario
  status      TEXT NOT NULL DEFAULT 'draft'
              CHECK (status IN ('draft', 'published')),

  -- Array ordenado de bloques con su configuración completa.
  -- Estructura de cada bloque:
  -- {
  --   "id": "uuid",
  --   "type": "welcome|segmentation|questions|capture|final_message|thank_you",
  --   "order": 1,
  --   "config": { ... depende del tipo ... }
  -- }
  --
  -- Ejemplos de config por tipo:
  -- welcome:      { logo_type, logo_url, title, subtitle, bg_type, bg_color, text_color }
  -- segmentation: { options: [{ id, title, description }] }
  -- questions:    { questions: [{ id, text, type, options, segment_ids }] }
  -- capture:      { fields: [{ name, label, required, enabled }] }
  -- final_message:{ title, text, cta_text, lead_magnet_by_segment: { default, [seg_id] } }
  -- thank_you:    { title, message, next_steps: ["paso1", "paso2"] }
  blocks      JSONB NOT NULL DEFAULT '[]'::jsonb,

  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE captacion_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "captacion_forms_owner" ON captacion_forms
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "captacion_forms_service_role" ON captacion_forms
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_captacion_forms_business_id
  ON captacion_forms(business_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_captacion_forms_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS captacion_forms_updated_at ON captacion_forms;
CREATE TRIGGER captacion_forms_updated_at
  BEFORE UPDATE ON captacion_forms
  FOR EACH ROW EXECUTE FUNCTION update_captacion_forms_updated_at();


-- ============================================================
-- 2. CAPTACION_LEAD_MAGNETS — recursos de captación
--    Separados de los lead_magnets de fidelización.
-- ============================================================

CREATE TABLE IF NOT EXISTS captacion_lead_magnets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Nombre interno (solo lo ve el negocio)
  name         TEXT NOT NULL,

  -- Tipo de recurso
  type         TEXT NOT NULL DEFAULT 'pdf'
               CHECK (type IN ('pdf', 'url', 'code')),

  -- Almacenamiento del recurso
  file_url     TEXT,         -- URL en Supabase Storage (para PDFs)
  external_url TEXT,         -- URL externa (para tipo 'url')
  code_value   TEXT,         -- Código de descuento (para tipo 'code')

  -- Presentación al cliente
  title        TEXT,         -- Título visible
  description  TEXT,         -- 1-2 líneas descriptivas
  cta_text     TEXT DEFAULT 'Descargar ahora',

  -- Estado
  status       TEXT NOT NULL DEFAULT 'draft'
               CHECK (status IN ('active', 'draft', 'archived')),

  -- Estadísticas (se actualizan al entregar)
  delivered_count INT NOT NULL DEFAULT 0,

  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE captacion_lead_magnets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "captacion_lead_magnets_owner" ON captacion_lead_magnets
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "captacion_lead_magnets_service_role" ON captacion_lead_magnets
  FOR ALL USING (auth.role() = 'service_role');

-- Lectura pública (necesaria para servir el recurso en /c/[slug])
CREATE POLICY "captacion_lead_magnets_public_read" ON captacion_lead_magnets
  FOR SELECT USING (status = 'active');

CREATE INDEX IF NOT EXISTS idx_captacion_lead_magnets_business_id
  ON captacion_lead_magnets(business_id);

DROP TRIGGER IF EXISTS captacion_lead_magnets_updated_at ON captacion_lead_magnets;
CREATE TRIGGER captacion_lead_magnets_updated_at
  BEFORE UPDATE ON captacion_lead_magnets
  FOR EACH ROW EXECUTE FUNCTION update_captacion_forms_updated_at();


-- ============================================================
-- 3. CAPTACION_CAMPAIGNS — campañas que agrupan form + recurso
-- ============================================================

CREATE TABLE IF NOT EXISTS captacion_campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Datos básicos
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'event'
                  CHECK (type IN ('event', 'permanent')),
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'active', 'finished')),

  -- Fechas (opcionales para campañas permanentes)
  starts_at       TIMESTAMPTZ,
  ends_at         TIMESTAMPTZ,

  -- Contexto de la campaña
  target_client   TEXT,         -- Descripción del cliente ideal
  objective       TEXT,         -- contact | qualify | deliver

  -- Recursos vinculados (pueden ser NULL mientras es borrador)
  form_id         UUID REFERENCES captacion_forms(id) ON DELETE SET NULL,
  lead_magnet_id  UUID REFERENCES captacion_lead_magnets(id) ON DELETE SET NULL,

  -- Métricas manuales
  keychains_distributed INT NOT NULL DEFAULT 0,

  -- URL pública del formulario: /c/[slug]
  -- Único en toda la plataforma
  slug            TEXT UNIQUE NOT NULL,

  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE captacion_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "captacion_campaigns_owner" ON captacion_campaigns
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "captacion_campaigns_service_role" ON captacion_campaigns
  FOR ALL USING (auth.role() = 'service_role');

-- Lectura pública necesaria para /c/[slug]
CREATE POLICY "captacion_campaigns_public_read" ON captacion_campaigns
  FOR SELECT USING (status = 'active');

CREATE INDEX IF NOT EXISTS idx_captacion_campaigns_business_id
  ON captacion_campaigns(business_id);

CREATE INDEX IF NOT EXISTS idx_captacion_campaigns_slug
  ON captacion_campaigns(slug);

CREATE INDEX IF NOT EXISTS idx_captacion_campaigns_status
  ON captacion_campaigns(status);

DROP TRIGGER IF EXISTS captacion_campaigns_updated_at ON captacion_campaigns;
CREATE TRIGGER captacion_campaigns_updated_at
  BEFORE UPDATE ON captacion_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_captacion_forms_updated_at();


-- ============================================================
-- 4. CAPTACION_LEADS — leads capturados en las campañas
-- ============================================================

CREATE TABLE IF NOT EXISTS captacion_leads (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id              UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  campaign_id              UUID NOT NULL REFERENCES captacion_campaigns(id) ON DELETE CASCADE,

  -- Datos del lead
  name                     TEXT,
  phone                    TEXT,
  email                    TEXT,
  company                  TEXT,
  position                 TEXT,

  -- Respuestas del formulario
  segment                  TEXT,     -- Segmento elegido en el bloque de segmentación
  quiz_answers             JSONB DEFAULT '{}'::jsonb,
  -- Estructura quiz_answers:
  -- { "q_uuid1": "SI", "q_uuid2": "NO", "q_uuid3": "A" }

  -- Entrega del lead magnet
  lead_magnet_id           UUID REFERENCES captacion_lead_magnets(id) ON DELETE SET NULL,
  lead_magnet_delivered    BOOLEAN NOT NULL DEFAULT false,
  lead_magnet_delivered_at TIMESTAMPTZ,

  -- Gestión del lead
  status                   TEXT NOT NULL DEFAULT 'new'
                           CHECK (status IN ('new', 'contacted', 'active', 'discarded')),
  notes                    TEXT,

  -- Migración al perfil de fidelización
  migrated_to_fidelizacion BOOLEAN NOT NULL DEFAULT false,
  migrated_at              TIMESTAMPTZ,

  created_at               TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE captacion_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "captacion_leads_owner" ON captacion_leads
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "captacion_leads_service_role" ON captacion_leads
  FOR ALL USING (auth.role() = 'service_role');

-- INSERT público: necesario para que el formulario pueda crear leads sin auth
CREATE POLICY "captacion_leads_public_insert" ON captacion_leads
  FOR INSERT WITH CHECK (
    campaign_id IN (
      SELECT id FROM captacion_campaigns WHERE status = 'active'
    )
  );

CREATE INDEX IF NOT EXISTS idx_captacion_leads_business_id
  ON captacion_leads(business_id);

CREATE INDEX IF NOT EXISTS idx_captacion_leads_campaign_id
  ON captacion_leads(campaign_id);

CREATE INDEX IF NOT EXISTS idx_captacion_leads_created_at
  ON captacion_leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_captacion_leads_status
  ON captacion_leads(status);


-- ============================================================
-- 5. AÑADIR COLUMNA module_captacion A businesses
--    Para activar/desactivar el perfil por negocio
-- ============================================================

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS module_captacion BOOLEAN DEFAULT false;


-- ============================================================
-- FIN DE MIGRACIÓN
-- ============================================================
SELECT 'Migración captacion_profile aplicada correctamente ✓' AS resultado;
