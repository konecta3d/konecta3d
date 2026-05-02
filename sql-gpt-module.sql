-- ============================================================
-- MIGRACIÓN: Módulo GPT de Fidelización
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Añadir columna module_gpt a businesses
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS module_gpt BOOLEAN DEFAULT false;

-- 2. Tabla de preguntas del perfil GPT
CREATE TABLE IF NOT EXISTS gpt_context_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  question_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabla de respuestas por negocio
CREATE TABLE IF NOT EXISTS gpt_context_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  question_id UUID REFERENCES gpt_context_questions(id) ON DELETE CASCADE,
  answer_text TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, question_id)
);

-- 4. Políticas RLS para gpt_context_questions (solo lectura para autenticados)
ALTER TABLE gpt_context_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos pueden leer preguntas GPT"
  ON gpt_context_questions FOR SELECT
  USING (true);

CREATE POLICY "Solo service role puede modificar preguntas"
  ON gpt_context_questions FOR ALL
  USING (auth.role() = 'service_role');

-- 5. Políticas RLS para gpt_context_answers (cada negocio solo ve las suyas)
ALTER TABLE gpt_context_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Negocio lee sus propias respuestas"
  ON gpt_context_answers FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses
      WHERE contact_email = auth.email()
    )
  );

CREATE POLICY "Negocio escribe sus propias respuestas"
  ON gpt_context_answers FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses
      WHERE contact_email = auth.email()
    )
  );

CREATE POLICY "Negocio actualiza sus propias respuestas"
  ON gpt_context_answers FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM businesses
      WHERE contact_email = auth.email()
    )
  );

CREATE POLICY "Service role acceso total a respuestas"
  ON gpt_context_answers FOR ALL
  USING (auth.role() = 'service_role');

-- 6. Insertar las 11 preguntas iniciales
INSERT INTO gpt_context_questions (question_text, question_order) VALUES
  ('¿A qué te dedicas y qué problema resuelves a tus clientes?', 1),
  ('¿Quién es tu cliente ideal? (describe en 2-3 frases)', 2),
  ('¿Cómo te diferencias de otros que hacen lo mismo?', 3),
  ('¿Qué vendes exactamente y a qué precio?', 4),
  ('¿Qué desea tu cliente cuando te contacta?', 5),
  ('¿Qué le impide actuar o comprar?', 6),
  ('¿Cómo te encuentran ahora mismo?', 7),
  ('¿Qué herramientas usas para contactar clientes?', 8),
  ('¿Tienes ya algo creado en la plataforma? (landing, recursos, otros)', 9),
  ('¿Qué quieres conseguir con esta plataforma a corto plazo?', 10),
  ('Notas finales (escribe aquí lo que quieras que sepa el GPT)', 11)
ON CONFLICT DO NOTHING;

-- 7. Guardar URL del GPT en settings global
-- (Cambia la URL por la real cuando la tengas)
INSERT INTO settings (key, value)
VALUES ('gpt_url', '"https://chatgpt.com/"')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- FIN DE MIGRACIÓN
-- ============================================================
