-- ============================================================
-- Formularios de Fidelización
-- ============================================================

-- Tabla principal de formularios de feedback
CREATE TABLE IF NOT EXISTS fidelizacion_forms (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  slug          TEXT        UNIQUE NOT NULL,
  objective     TEXT        NOT NULL DEFAULT 'general',
  status        TEXT        NOT NULL DEFAULT 'draft',
  blocks        JSONB       DEFAULT '[]',
  response_count INT        NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE fidelizacion_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_fid_forms" ON fidelizacion_forms FOR ALL
  USING (business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  ));

-- Tabla de respuestas / feedback
CREATE TABLE IF NOT EXISTS fidelizacion_feedback (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id          UUID        NOT NULL REFERENCES fidelizacion_forms(id) ON DELETE CASCADE,
  business_id      UUID        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  respondent_name  TEXT,
  respondent_email TEXT,
  answers          JSONB       NOT NULL DEFAULT '{}',
  nps_score        INT,
  avg_rating       NUMERIC(3,2),
  submitted_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE fidelizacion_feedback ENABLE ROW LEVEL SECURITY;

-- Solo el dueño del negocio puede leer las respuestas
CREATE POLICY "owner_reads_feedback" ON fidelizacion_feedback FOR SELECT
  USING (business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  ));

-- Cualquiera puede insertar una respuesta (formulario público)
CREATE POLICY "anyone_submits_feedback" ON fidelizacion_feedback FOR INSERT
  WITH CHECK (true);
