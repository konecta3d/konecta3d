-- ============================================================
-- Agenda de citas del CRM comercial (Miguel/Miriam)
-- Herramienta de ASIGNACIÓN de huecos para llamadas cortas tras la feria.
-- Cada cita queda ligada a un lead del pipeline (crm_leads).
-- Acceso exclusivo vía API admin (service role).
-- ============================================================

CREATE TABLE IF NOT EXISTS crm_citas (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       UUID        NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  agente        TEXT        NOT NULL,                       -- Miguel / Miriam
  inicio        TIMESTAMPTZ NOT NULL,                       -- comienzo del hueco
  duracion_min  INT         NOT NULL DEFAULT 10,
  canal         TEXT        NOT NULL DEFAULT 'llamada',     -- llamada/whatsapp/videollamada
  estado        TEXT        NOT NULL DEFAULT 'agendada',    -- agendada/hecha/no_asistio/cancelada
  notas         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Un agente no puede tener dos citas ACTIVAS en el mismo hueco (no se pisan).
-- Las canceladas no cuentan, así un hueco liberado se puede reasignar.
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_citas_slot
  ON crm_citas(agente, inicio)
  WHERE estado <> 'cancelada';

CREATE INDEX IF NOT EXISTS idx_crm_citas_inicio ON crm_citas(inicio);
CREATE INDEX IF NOT EXISTS idx_crm_citas_lead   ON crm_citas(lead_id);

ALTER TABLE crm_citas ENABLE ROW LEVEL SECURITY;
-- Sin políticas públicas: solo el service role (APIs admin) accede.
