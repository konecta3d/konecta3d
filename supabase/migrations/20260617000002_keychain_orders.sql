-- ============================================================
-- Pedidos de llaveros por negocio
-- Dos ejes independientes: estado del pedido (logística) y estado del pago.
-- Gestionado por el admin; el negocio podrá solicitar (auto-servicio) más adelante.
-- ============================================================

CREATE TABLE IF NOT EXISTS keychain_orders (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id            UUID        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  cantidad               INT         NOT NULL,
  precio_unit            NUMERIC(10,2) NOT NULL DEFAULT 3,   -- 3 € por unidad (regla fija)

  -- Eje logística
  estado                 TEXT        NOT NULL DEFAULT 'solicitado',
                         -- solicitado / confirmado / en_produccion / enviado / entregado / cancelado

  -- Eje pago (independiente del estado logístico)
  estado_pago            TEXT        NOT NULL DEFAULT 'pendiente',  -- pendiente / pagado
  metodo_pago            TEXT,                                       -- transferencia / bizum / tarjeta / otro
  fecha_pago             DATE,

  -- Fechas y envío
  fecha_pedido           DATE        NOT NULL DEFAULT CURRENT_DATE,
  fecha_evento           DATE,                                       -- feria/evento donde se usarán
  fecha_entrega_estimada DATE,
  direccion_envio        TEXT,
  tracking               TEXT,

  origen                 TEXT        NOT NULL DEFAULT 'admin',        -- admin / autoservicio
  notas                  TEXT,

  created_at             TIMESTAMPTZ DEFAULT now(),
  updated_at             TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_keychain_orders_business ON keychain_orders(business_id);
CREATE INDEX IF NOT EXISTS idx_keychain_orders_estado   ON keychain_orders(estado);
CREATE INDEX IF NOT EXISTS idx_keychain_orders_evento   ON keychain_orders(fecha_evento);

ALTER TABLE keychain_orders ENABLE ROW LEVEL SECURITY;

-- El service role (APIs admin) tiene acceso completo.
CREATE POLICY keychain_orders_service ON keychain_orders
  FOR ALL USING (auth.role() = 'service_role');

-- El negocio dueño puede ver/crear los suyos (para el auto-servicio futuro).
CREATE POLICY keychain_orders_owner ON keychain_orders
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()::text)
  );
