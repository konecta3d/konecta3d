-- Tabla de configuración global para Konecta3D
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuración global por defecto
INSERT INTO settings (key, value) VALUES 
    ('global', '{"email_from":"noreply@konecta3d.com","email_name":"Konecta3D","notify_new_business":true,"notify_new_leads":true,"min_password_length":6,"require_special_chars":false,"force_password_change":false}')
ON CONFLICT (key) DO NOTHING;

-- Habilitar RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Política de lectura (todos pueden leer)
CREATE POLICY "settings_read" ON settings FOR SELECT USING (true);

-- Política de escritura (solo admin - por ahora público para desarrollo)
CREATE POLICY "settings_write" ON settings FOR ALL USING (true);

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS settings_updated_at ON settings;
CREATE TRIGGER settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
