/**
 * POST /api/admin/run-migration
 * Crea las tablas que puedan faltar: clients, client_benefits, products_services.
 * Solo accesible por admins.
 */
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";

export async function POST(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const results: Record<string, string> = {};

  // ── clients ──────────────────────────────────────────────────────────────
  try {
    const { error } = await supabaseAdmin.from("clients").select("id").limit(1);
    if (error?.message?.includes("does not exist")) {
      results.clients = "MISSING – ejecuta el SQL de abajo en Supabase";
    } else if (error) {
      results.clients = "ERROR: " + error.message;
    } else {
      results.clients = "OK";
    }
  } catch (e) {
    results.clients = "EXCEPTION: " + String(e);
  }

  // ── client_benefits ───────────────────────────────────────────────────────
  try {
    const { error } = await supabaseAdmin.from("client_benefits").select("id").limit(1);
    if (error?.message?.includes("does not exist")) {
      results.client_benefits = "MISSING";
    } else if (error) {
      results.client_benefits = "ERROR: " + error.message;
    } else {
      results.client_benefits = "OK";
    }
  } catch (e) {
    results.client_benefits = "EXCEPTION: " + String(e);
  }

  // ── products_services ─────────────────────────────────────────────────────
  try {
    const { error } = await supabaseAdmin.from("products_services").select("id").limit(1);
    if (error?.message?.includes("does not exist")) {
      results.products_services = "MISSING";
    } else if (error) {
      results.products_services = "ERROR: " + error.message;
    } else {
      results.products_services = "OK";
    }
  } catch (e) {
    results.products_services = "EXCEPTION: " + String(e);
  }

  const hasMissing = Object.values(results).some((v) => v.startsWith("MISSING"));

  return NextResponse.json({
    results,
    hasMissing,
    sql: hasMissing
      ? `-- Ejecuta este SQL en Supabase Dashboard → SQL Editor

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT DEFAULT '',
  email       TEXT DEFAULT '',
  notes       TEXT DEFAULT '',
  tags        TEXT[] DEFAULT '{}',
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business_owner_clients" ON clients
  USING (business_id IN (SELECT id FROM businesses WHERE contact_email = auth.email()));

-- Tabla de asignación beneficio-cliente
CREATE TABLE IF NOT EXISTS client_benefits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  benefit_id  UUID NOT NULL REFERENCES benefits(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, benefit_id)
);
ALTER TABLE client_benefits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business_owner_client_benefits" ON client_benefits
  USING (client_id IN (
    SELECT c.id FROM clients c
    JOIN businesses b ON b.id = c.business_id
    WHERE b.contact_email = auth.email()
  ));

-- Tabla de productos y servicios
CREATE TABLE IF NOT EXISTS products_services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  price       TEXT DEFAULT '',
  price_offer TEXT,
  valid_from  DATE,
  valid_until DATE,
  category    TEXT DEFAULT 'Producto',
  images      TEXT[] DEFAULT '{}',
  features    JSONB DEFAULT '[]',
  stock       TEXT,
  featured    BOOLEAN DEFAULT false,
  sort_order  INTEGER DEFAULT 0,
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE products_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business_owner_products" ON products_services
  USING (business_id IN (SELECT id FROM businesses WHERE contact_email = auth.email()));
`
      : null,
  });
}
