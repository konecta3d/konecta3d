-- Tabla de logs de actividad para el admin
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_activity_logs_business ON activity_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);

-- Habilitar RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Política de lectura para admin
CREATE POLICY "Admin can read activity_logs" ON activity_logs
  FOR SELECT USING (true);

-- Política de inserción
CREATE POLICY "System can insert activity_logs" ON activity_logs
  FOR INSERT WITH CHECK (true);
