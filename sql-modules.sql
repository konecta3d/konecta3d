-- Añadir campos de módulos a la tabla businesses
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS module_vip_benefits BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS module_lead_magnet BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS module_whatsapp BOOLEAN DEFAULT true;

-- Actualizar valores por defecto para negocios existentes
UPDATE businesses SET 
  module_vip_benefits = COALESCE(module_vip_benefits, true),
  module_lead_magnet = COALESCE(module_lead_magnet, true),
  module_whatsapp = COALESCE(module_whatsapp, true)
WHERE module_vip_benefits IS NULL;
