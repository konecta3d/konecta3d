-- =====================================================
-- KONECTA3D - TABLAS PARA PRODUCCIÓN
-- Ejecutar este SQL en el SQL Editor de Supabase
-- =====================================================

-- 1. TABLA DE CONFIGURACIÓN GLOBAL
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuración global por defecto
INSERT INTO settings (key, value) VALUES 
    ('global', '{"email_from":"noreply@konecta3d.com","email_name":"Konecta3D","notify_new_business":true,"notify_new_leads":true,"min_password_length":6,"require_special_chars":false,"force_password_change":false}'),
    ('names', '{"dashboard":"Panel de Control","landing":"Landing","leadMagnet":"Lead Magnet","vipBenefits":"Beneficios VIP","actions":"Acciones"}')
ON CONFLICT (key) DO NOTHING;

-- Habilitar RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "settings_read" ON settings;
DROP POLICY IF EXISTS "settings_write" ON settings;

CREATE POLICY "settings_read" ON settings FOR SELECT USING (true);
CREATE POLICY "settings_write" ON settings FOR ALL USING (true);

-- 2. CREAR ÍNDICES PARA MEJORAR RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_public_id ON businesses(public_id);
CREATE INDEX IF NOT EXISTS idx_leads_business_id ON leads(business_id);
CREATE INDEX IF NOT EXISTS idx_landings_business_id ON landings(business_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_business_id ON activity_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- 3. ACTUALIZAR TABLA BUSINESSES SI FALTA ALGUNA COLUMNA
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'public_id') THEN
        ALTER TABLE businesses ADD COLUMN public_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'user_id') THEN
        ALTER TABLE businesses ADD COLUMN user_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'logo_url') THEN
        ALTER TABLE businesses ADD COLUMN logo_url TEXT;
    END IF;
END $$;

-- 4. VERIFICAR TABLAS EXISTENTES
SELECT 'Tablas creadas correctamente' as resultado;
