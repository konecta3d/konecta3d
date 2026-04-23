-- Módulo de Formularios — tablas para Konecta3D
-- Ejecutar en Supabase SQL Editor

-- Tabla: forms
CREATE TABLE IF NOT EXISTS forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- 'captacion' | 'fidelizacion'
  objective TEXT NOT NULL, -- 'contacto', 'reserva', 'datos', 'opinion', 'retorno', 'comunidad'
  basis TEXT NOT NULL, -- 'producto_servicio' | 'info_experiencia'
  questions JSONB DEFAULT '[]', -- [{ id, question_text, question_type, options? }]
  data_collection TEXT NOT NULL, -- 'name_phone_email' | 'anonymous' | 'thanks_page'
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: form_responses
CREATE TABLE IF NOT EXISTS form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id), -- NULL si es anónimo
  answers JSONB DEFAULT '[]', -- [{ question_id, answer }]
  contact_data JSONB, -- { name, phone, email } si aplica
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para forms (negocio solo ve sus propios formularios)
CREATE POLICY "Businesses can manage own forms" ON forms
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Businesses can view own form_responses" ON form_responses
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Acceso público a form_responses (para API route público que inserta sin auth)
-- No requiere POLICY adicional porque usaremos service role key en la API route

-- Añadir module_forms a businesses si no existe (Supabase no tiene ALTER TABLE ADD COLUMN IF NOT EXISTS para todas las versiones)
-- Ejecutar solo si la columna no existe:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'module_forms'
  ) THEN
    ALTER TABLE businesses ADD COLUMN module_forms BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Comments
COMMENT ON TABLE forms IS 'Formularios creados por negocios para captar leads o fidelizar clientes';
COMMENT ON TABLE form_responses IS 'Respuestas guardadas de formularios (tanto de captación como fidelización)';
