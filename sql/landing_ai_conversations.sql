-- ============================================================================
-- Tabla: landing_ai_conversations
-- Almacena las conversaciones del chat asistente del editor de landing.
-- No es accesible por el negocio una vez completada — solo el admin las revisa.
-- ============================================================================

CREATE TABLE IF NOT EXISTS landing_ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  final_config JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS landing_ai_conversations_business_id_idx
  ON landing_ai_conversations(business_id);

CREATE INDEX IF NOT EXISTS landing_ai_conversations_created_at_idx
  ON landing_ai_conversations(created_at DESC);

-- ============================================================================
-- RLS: la tabla es de uso interno (admin) — escribe el service role.
-- Bloqueamos el acceso anon/authenticated; la API route usa service role.
-- ============================================================================

ALTER TABLE landing_ai_conversations ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated → access denegado por defecto.
-- El service role en las API routes bypasea RLS automáticamente.
