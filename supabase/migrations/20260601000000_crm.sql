-- ============================================================
-- CRM Comercial Interno de Konecta3D
-- Herramienta interna de Miguel/Miriam para gestionar el pipeline
-- de ventas. NO está relacionado con los negocios clientes.
-- Todas las tablas usan prefijo crm_ para aislamiento total.
-- Acceso exclusivo vía API con service role (admin autenticado).
-- ============================================================

-- ─── Tabla principal: leads del pipeline ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_leads (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Datos de contacto
  nombre                TEXT        NOT NULL,
  empresa               TEXT,
  sector                TEXT,
  email                 TEXT,
  telefono              TEXT,
  whatsapp              TEXT,
  linkedin_url          TEXT,
  instagram_url         TEXT,

  -- Estado en el pipeline
  etapa                 TEXT        NOT NULL DEFAULT 'prospecto',
  etapa_index           INT         NOT NULL DEFAULT 1,
  etapa_entered_at      TIMESTAMPTZ NOT NULL DEFAULT now(), -- entrada en etapa actual

  -- Cualificación
  score                 INT         DEFAULT 0,
  perfil                TEXT,                              -- A / B / C / D
  fuente                TEXT,

  -- Datos comerciales del Expositor
  proxima_feria         DATE,
  ferias_al_anio        INT,
  unidades_estimadas    INT,
  revenue_estimado      NUMERIC(10,2) DEFAULT 0,

  -- Gestión
  asignado_a            TEXT,                              -- Miguel / Miriam
  ultimo_contacto       TIMESTAMPTZ,
  proxima_accion        TEXT,
  fecha_proxima_accion  DATE,
  notas                 TEXT,

  -- Ciclo de vida
  fecha_entrada         TIMESTAMPTZ NOT NULL DEFAULT now(), -- entrada al pipeline
  fecha_cierre          TIMESTAMPTZ,                        -- llegada a ganado/perdido
  motivo_perdida        TEXT,

  -- Vínculo con la plataforma (cuando se convierte en negocio)
  business_id           UUID        REFERENCES businesses(id) ON DELETE SET NULL,

  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_leads_etapa     ON crm_leads(etapa);
CREATE INDEX IF NOT EXISTS idx_crm_leads_asignado  ON crm_leads(asignado_a);
CREATE INDEX IF NOT EXISTS idx_crm_leads_perfil    ON crm_leads(perfil);
CREATE INDEX IF NOT EXISTS idx_crm_leads_feria     ON crm_leads(proxima_feria);

ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
-- Sin políticas públicas: solo el service role (APIs admin) accede.

-- ─── Historial de etapas (medición de tiempo entre etapas) ───────────────────
CREATE TABLE IF NOT EXISTS crm_stage_history (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         UUID        NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  stage           TEXT        NOT NULL,
  stage_index     INT         NOT NULL,
  entered_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  exited_at       TIMESTAMPTZ,                       -- null = etapa actual
  duration_hours  NUMERIC(10,2),                     -- calculado al salir
  changed_by      TEXT,                              -- Miguel / Miriam
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_history_lead ON crm_stage_history(lead_id);

ALTER TABLE crm_stage_history ENABLE ROW LEVEL SECURITY;

-- ─── Log de actividad (interacciones con cada lead) ──────────────────────────
CREATE TABLE IF NOT EXISTS crm_activities (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id               UUID        NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  tipo                  TEXT        NOT NULL,        -- llamada/whatsapp/email/dm/demo/propuesta/feria
  realizado_por         TEXT,                        -- Miguel / Miriam
  resultado             TEXT,                        -- muy_positivo/positivo/neutral/negativo/sin_respuesta
  resumen               TEXT,
  siguiente_accion      TEXT,
  fecha_siguiente_accion DATE,
  duracion_min          INT,
  fecha                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_activities_lead ON crm_activities(lead_id);

ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;

-- ─── Tareas del equipo ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_tasks (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         UUID        REFERENCES crm_leads(id) ON DELETE CASCADE,
  titulo          TEXT        NOT NULL,
  tipo            TEXT,                              -- llamada/whatsapp/email/dm/propuesta/config/contenido
  asignado_a      TEXT,                              -- Miguel / Miriam
  fecha           DATE,
  completada      BOOLEAN     NOT NULL DEFAULT false,
  completada_at   TIMESTAMPTZ,
  notas           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_tasks_asignado ON crm_tasks(asignado_a);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_fecha    ON crm_tasks(fecha);

ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;

-- ─── Recursos y guiones ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_resources (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          TEXT        NOT NULL,
  categoria       TEXT,                              -- guion/copy/email/propuesta/onboarding/lead_magnet
  para_perfil     TEXT,                              -- A/B/C/D/todos
  etapa_proceso   TEXT,                              -- P1-P6
  usado_por       TEXT,                              -- Miguel/Miriam/ambos
  contenido       TEXT,
  version         TEXT        DEFAULT '1.0',
  updated_at      TIMESTAMPTZ DEFAULT now(),
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE crm_resources ENABLE ROW LEVEL SECURITY;

-- ─── Métricas semanales ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_metrics_weekly (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  semana              DATE        NOT NULL,          -- lunes de la semana
  prospectos          INT         DEFAULT 0,
  leads_capturados    INT         DEFAULT 0,
  leads_cualificados  INT         DEFAULT 0,
  perfil_a            INT         DEFAULT 0,
  llamadas            INT         DEFAULT 0,
  demos               INT         DEFAULT 0,
  propuestas          INT         DEFAULT 0,
  ventas              INT         DEFAULT 0,
  revenue             NUMERIC(10,2) DEFAULT 0,
  referidos           INT         DEFAULT 0,
  notas               TEXT,
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_metrics_semana ON crm_metrics_weekly(semana);

ALTER TABLE crm_metrics_weekly ENABLE ROW LEVEL SECURITY;
