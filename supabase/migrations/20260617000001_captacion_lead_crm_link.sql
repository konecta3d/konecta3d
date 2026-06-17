-- ============================================================
-- Enlace lead de captación → ficha del pipeline (crm_leads)
-- Para el botón "Enviar al pipeline" y para no duplicar al reenviar.
-- ============================================================

ALTER TABLE captacion_leads
  ADD COLUMN IF NOT EXISTS crm_lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_captacion_leads_crm_lead
  ON captacion_leads(crm_lead_id);
