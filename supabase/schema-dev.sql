-- ============================================================
-- KONECTA3D — SCHEMA COMPLETO PARA PROYECTO DEV
-- ============================================================
-- Ejecuta este archivo completo en el SQL Editor de Supabase
-- del proyecto konecta3d-dev (NO en producción).
--
-- Orden de ejecución:
--   1. Tabla businesses (base, todo depende de ella)
--   2. Tabla landing_configs
--   3. Tablas de módulos (lead_magnets, vip_benefits, etc.)
--   4. Tablas de soporte (settings, activity_logs, etc.)
--   5. Índices y RLS
--   6. Datos de ejemplo para desarrollo
-- ============================================================


-- ============================================================
-- 1. BUSINESSES — tabla principal
-- ============================================================

CREATE TABLE IF NOT EXISTS businesses (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               TEXT,                        -- Supabase Auth UID
  public_id             TEXT,                        -- slug público (K3D-XXXX)
  slug                  TEXT,                        -- slug para URLs
  name                  TEXT NOT NULL,
  sector                TEXT DEFAULT '',
  contact_email         TEXT,
  phone                 TEXT DEFAULT '',
  logo_url              TEXT,                        -- URL en Supabase Storage (nunca base64)

  -- Módulos activados
  module_lead_magnet    BOOLEAN DEFAULT true,
  module_vip_benefits   BOOLEAN DEFAULT false,
  module_whatsapp       BOOLEAN DEFAULT true,
  module_tools          BOOLEAN DEFAULT true,
  module_forms          BOOLEAN DEFAULT false,
  module_gpt            BOOLEAN DEFAULT false,
  module_ai_landing     BOOLEAN DEFAULT false,
  module_ai_recursos    BOOLEAN DEFAULT false,

  -- Configuración extra
  profile_active        BOOLEAN DEFAULT true,
  landing_active        BOOLEAN DEFAULT true,
  multi_landing_enabled BOOLEAN DEFAULT false,
  font_family           TEXT,
  last_login            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "businesses_service_role" ON businesses
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "businesses_owner_read" ON businesses
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "businesses_owner_update" ON businesses
  FOR UPDATE USING (user_id = auth.uid()::text);

CREATE INDEX IF NOT EXISTS idx_businesses_user_id   ON businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_public_id ON businesses(public_id);
CREATE INDEX IF NOT EXISTS idx_businesses_slug      ON businesses(slug);


-- ============================================================
-- 2. LANDING_CONFIGS — configuración del editor de landing
-- ============================================================

CREATE TABLE IF NOT EXISTS landing_configs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  config      JSONB NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id)
);

ALTER TABLE landing_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "landing_configs_owner" ON landing_configs
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "landing_configs_service_role" ON landing_configs
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_landing_configs_business_id ON landing_configs(business_id);


-- ============================================================
-- 3. LEAD_MAGNETS — recursos descargables para captar leads
-- ============================================================

CREATE TABLE IF NOT EXISTS lead_magnets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID REFERENCES businesses(id) ON DELETE CASCADE,
  title         TEXT,
  subtitle      TEXT,
  type          TEXT,
  objective     TEXT,
  business_type TEXT,
  intro         TEXT,
  content       TEXT,
  content2      TEXT,
  content3      TEXT,
  sn1           TEXT,
  sn2           TEXT,
  sn3           TEXT,
  sn4           TEXT,
  sn1_en        BOOLEAN DEFAULT true,
  sn2_en        BOOLEAN DEFAULT true,
  sn3_en        BOOLEAN DEFAULT true,
  sn4_en        BOOLEAN DEFAULT true,
  cta1_text     TEXT,
  cta1_link     TEXT,
  cta1_action   TEXT,
  cta2_enabled  BOOLEAN DEFAULT false,
  cta2_text     TEXT,
  cta2_link     TEXT,
  color_brand   TEXT DEFAULT '#C5A059',
  color_tag     TEXT DEFAULT '#C5A059',
  color_title   TEXT DEFAULT '#0A0A0B',
  color_button  TEXT DEFAULT '#C5A059',
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE lead_magnets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_magnets_owner" ON lead_magnets
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "lead_magnets_service_role" ON lead_magnets
  FOR ALL USING (auth.role() = 'service_role');


-- ============================================================
-- 4. CLIENTS — gestión de clientes del negocio
-- ============================================================

CREATE TABLE IF NOT EXISTS clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  company     TEXT,
  notes       TEXT,
  status      TEXT DEFAULT 'nuevo',
  source      TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_owner" ON clients
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "clients_service_role" ON clients
  FOR ALL USING (auth.role() = 'service_role');


-- ============================================================
-- 5. LEADS — seguimiento de leads capturados
-- ============================================================

CREATE TABLE IF NOT EXISTS leads (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID REFERENCES businesses(id) ON DELETE CASCADE,
  client_id    UUID REFERENCES clients(id),
  source       TEXT,
  status       TEXT DEFAULT 'nuevo',
  notes        TEXT,
  converted_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_owner" ON leads
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "leads_service_role" ON leads
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_leads_business_id ON leads(business_id);


-- ============================================================
-- 6. ACTION_LINKS — botones de acción de la landing
-- ============================================================

CREATE TABLE IF NOT EXISTS action_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  type        TEXT NOT NULL, -- whatsapp, calendar, location, reviews, payment, video, form, catalog, social
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  config      JSONB DEFAULT '{}',
  is_default  BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE action_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "action_links_owner" ON action_links
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "action_links_service_role" ON action_links
  FOR ALL USING (auth.role() = 'service_role');


-- ============================================================
-- 7. CAMPAIGNS — campañas de marketing
-- ============================================================

CREATE TABLE IF NOT EXISTS campaigns (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT,
  objective   TEXT,
  status      TEXT DEFAULT 'borrador',
  start_date  DATE,
  end_date    DATE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_owner" ON campaigns
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "campaigns_service_role" ON campaigns
  FOR ALL USING (auth.role() = 'service_role');


-- ============================================================
-- 8. PRODUCTS_SERVICES — catálogo de productos y servicios
-- ============================================================

CREATE TABLE IF NOT EXISTS products_services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  price       DECIMAL(10,2),
  type        TEXT DEFAULT 'servicio',
  category    TEXT,
  image_url   TEXT,
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE products_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_services_owner" ON products_services
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()::text
    )
  );


-- ============================================================
-- 9. ACTIVITY_LOGS — historial de acciones (admin)
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  action      VARCHAR(100) NOT NULL,
  details     TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_logs_read_all" ON activity_logs
  FOR SELECT USING (true);

CREATE POLICY "activity_logs_insert" ON activity_logs
  FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_activity_logs_business_id ON activity_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at  ON activity_logs(created_at DESC);


-- ============================================================
-- 10. SETTINGS — configuración global de la plataforma
-- ============================================================

CREATE TABLE IF NOT EXISTS settings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key        TEXT UNIQUE NOT NULL,
  value      JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ⚠ En DEV acceso abierto. En PROD restringir a service_role.
CREATE POLICY "settings_read"  ON settings FOR SELECT USING (true);
CREATE POLICY "settings_write" ON settings FOR ALL   USING (true);

CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Función y trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS settings_updated_at ON settings;
CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Valores por defecto
INSERT INTO settings (key, value) VALUES
  ('global', '{"email_from":"noreply@konecta3d.com","email_name":"Konecta3D","notify_new_business":true,"notify_new_leads":true,"min_password_length":6,"require_special_chars":false,"force_password_change":false}'),
  ('names',  '{"dashboard":"Panel de Control","landing":"Landing","leadMagnet":"Lead Magnet","vipBenefits":"Beneficios VIP","actions":"Acciones"}')
ON CONFLICT (key) DO NOTHING;


-- ============================================================
-- 11. ONBOARDING_STEPS — guía de personalización
-- ============================================================

CREATE TABLE IF NOT EXISTS onboarding_steps (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context    TEXT NOT NULL CHECK (context IN ('landing', 'resources')),
  stage      TEXT NOT NULL CHECK (stage IN ('contexto', 'primeros-pasos', 'optimizacion', 'maestria')),
  step_order INTEGER NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  tip        TEXT,
  active     BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "onboarding_read"         ON onboarding_steps FOR SELECT USING (true);
CREATE POLICY "onboarding_service_role" ON onboarding_steps FOR ALL    USING (auth.role() = 'service_role');


-- ============================================================
-- 12. LANDING_AI_CONVERSATIONS — conversaciones del asistente
-- ============================================================

CREATE TABLE IF NOT EXISTS landing_ai_conversations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  messages     JSONB NOT NULL DEFAULT '[]'::jsonb,
  final_config JSONB,
  created_at   TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE landing_ai_conversations ENABLE ROW LEVEL SECURITY;
-- Sin políticas → solo service_role puede escribir (bypasea RLS).

CREATE INDEX IF NOT EXISTS idx_landing_ai_business_id  ON landing_ai_conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_landing_ai_created_at   ON landing_ai_conversations(created_at DESC);


-- ============================================================
-- 13. DATOS DE EJEMPLO PARA DESARROLLO
-- ============================================================
-- Un negocio de prueba para no tener que crear uno cada vez.
-- Credenciales: dev-negocio@konecta3d.com / dev1234
-- (Créalo primero en Supabase Auth y pon aquí su UID)

-- INSERT INTO businesses (user_id, public_id, slug, name, sector, contact_email, phone,
--   module_lead_magnet, module_vip_benefits, module_whatsapp)
-- VALUES (
--   'PEGA-AQUI-EL-UID-DEL-USUARIO-DE-PRUEBA',
--   'K3D-DEV001',
--   'negocio-de-prueba',
--   'Negocio de Prueba DEV',
--   'dental',
--   'dev-negocio@konecta3d.com',
--   '600000000',
--   true, true, true
-- );

-- ============================================================
-- FIN DEL SCHEMA
-- ============================================================
SELECT 'Schema DEV creado correctamente ✓' AS resultado;
