-- Tabla: lead_magnets (recursos descargables para captar leads)
CREATE TABLE IF NOT EXISTS lead_magnets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  title TEXT,
  subtitle TEXT,
  type TEXT,
  objective TEXT,
  business_type TEXT,
  intro TEXT,
  content TEXT,
  content2 TEXT,
  content3 TEXT,
  sn1 TEXT,
  sn2 TEXT,
  sn3 TEXT,
  sn4 TEXT,
  sn1_en BOOLEAN DEFAULT true,
  sn2_en BOOLEAN DEFAULT true,
  sn3_en BOOLEAN DEFAULT true,
  sn4_en BOOLEAN DEFAULT true,
  cta1_text TEXT,
  cta1_link TEXT,
  cta1_action TEXT,
  cta2_enabled BOOLEAN DEFAULT false,
  cta2_text TEXT,
  cta2_link TEXT,
  color_brand TEXT DEFAULT '#C5A059',
  color_tag TEXT DEFAULT '#C5A059',
  color_title TEXT DEFAULT '#0A0A0B',
  color_button TEXT DEFAULT '#C5A059',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: clients (gestión de clientes)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  notes TEXT,
  status TEXT DEFAULT 'nuevo',
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: products_services (catálogo de productos y servicios)
CREATE TABLE IF NOT EXISTS products_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  type TEXT DEFAULT 'servicio',
  category TEXT,
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: leads (seguimiento de leads)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  source TEXT,
  status TEXT DEFAULT 'nuevo',
  notes TEXT,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: campaigns (campañas de marketing)
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  objective TEXT,
  status TEXT DEFAULT 'borrador',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE lead_magnets ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para businesses (solo su propio negocio)
CREATE POLICY "Users can manage own lead_magnets" ON lead_magnets
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Users can manage own clients" ON clients
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Users can manage own products_services" ON products_services
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Users can manage own leads" ON leads
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Users can manage own campaigns" ON campaigns
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Tabla: whatsapp_links (links de WhatsApp guardados)
CREATE TABLE IF NOT EXISTS whatsapp_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT,
  url TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE whatsapp_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own whatsapp_links" ON whatsapp_links
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Tabla unificada: action_links (todos los tipos de acciones)
CREATE TABLE IF NOT EXISTS action_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- whatsapp, calendar, location, reviews, payment, video, form, catalog, social
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE action_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own action_links" ON action_links
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Insertar datos de ejemplo
INSERT INTO lead_magnets (business_id, title, type, objective, business_type, intro, content, color_brand, color_tag, color_title, color_button)
SELECT 
  b.id,
  'Guía: Cómo elegir el mejor servicio',
  'guia',
  'captar',
  'servicio',
  'Descarga esta guía gratuita y aprende los secretos que los expertos usan para...',
  '1. Define tus objetivos claramente
2. Investiga las opciones del mercado
3. Compara características y precios
4. Lee opiniones de otros clientes
5. Toma una decisión informada',
  '#C5A059', '#C5A059', '#0A0A0B', '#C5A059'
FROM businesses b LIMIT 1;
