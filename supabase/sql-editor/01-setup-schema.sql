-- ============================================================
-- 01-setup-schema.sql
-- Complete Altura schema creation — idempotent (DROP IF EXISTS)
-- Run this in the Supabase SQL Editor to create all tables.
-- ============================================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS compliance_checks CASCADE;
DROP TABLE IF EXISTS compliance_rules CASCADE;
DROP TABLE IF EXISTS model_portfolio_targets CASCADE;
DROP TABLE IF EXISTS model_portfolios CASCADE;
DROP TABLE IF EXISTS import_rows CASCADE;
DROP TABLE IF EXISTS import_batches CASCADE;
DROP TABLE IF EXISTS import_mappings CASCADE;
DROP TABLE IF EXISTS cash_movements CASCADE;
DROP TABLE IF EXISTS settlements CASCADE;
DROP TABLE IF EXISTS trades CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS holdings_history CASCADE;
DROP TABLE IF EXISTS holdings CASCADE;
DROP TABLE IF EXISTS securities CASCADE;
DROP TABLE IF EXISTS asset_types CASCADE;
DROP TABLE IF EXISTS funds CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- ============================================================
-- CORE TENANCY
-- ============================================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  is_system BOOLEAN DEFAULT false,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, slug)
);

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id),
  full_name TEXT,
  email TEXT NOT NULL,
  is_superadmin BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  persona_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- FUND MANAGEMENT
-- ============================================================

CREATE TABLE asset_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  display_order INT DEFAULT 0
);

INSERT INTO asset_types (name, slug, display_order) VALUES
  ('Stocks', 'stocks', 1),
  ('Fixed Income', 'fixed-income', 2),
  ('Hedges', 'hedges', 3),
  ('Cash', 'cash', 4)
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE funds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  currency TEXT DEFAULT 'NZD',
  inception_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'suspended')),
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, code)
);

CREATE TABLE securities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker TEXT NOT NULL,
  name TEXT NOT NULL,
  asset_type_id UUID REFERENCES asset_types(id),
  exchange TEXT,
  currency TEXT DEFAULT 'NZD',
  isin TEXT,
  sedol TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ticker, exchange)
);

CREATE TABLE holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id UUID REFERENCES funds(id) ON DELETE CASCADE,
  security_id UUID REFERENCES securities(id),
  quantity DECIMAL(20,6) NOT NULL DEFAULT 0,
  avg_cost_local DECIMAL(20,6) DEFAULT 0,
  avg_cost_nzd DECIMAL(20,6) DEFAULT 0,
  last_price DECIMAL(20,6) DEFAULT 0,
  market_value_local DECIMAL(20,2) DEFAULT 0,
  market_value_nzd DECIMAL(20,2) DEFAULT 0,
  weight_pct DECIMAL(8,4) DEFAULT 0,
  fx_rate DECIMAL(12,6) DEFAULT 1,
  as_of_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(fund_id, security_id, as_of_date)
);

CREATE TABLE holdings_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id UUID REFERENCES funds(id) ON DELETE CASCADE,
  security_id UUID REFERENCES securities(id),
  quantity DECIMAL(20,6),
  last_price DECIMAL(20,6),
  market_value_local DECIMAL(20,2),
  market_value_nzd DECIMAL(20,2),
  weight_pct DECIMAL(8,4),
  fx_rate DECIMAL(12,6),
  snapshot_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TRADING OPERATIONS
-- ============================================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id UUID REFERENCES funds(id) ON DELETE CASCADE,
  security_id UUID REFERENCES securities(id),
  order_type TEXT NOT NULL CHECK (order_type IN ('buy', 'sell')),
  quantity DECIMAL(20,6),
  limit_price DECIMAL(20,6),
  status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'sent', 'partial', 'filled', 'cancelled')),
  broker TEXT,
  notes TEXT,
  created_by UUID REFERENCES user_profiles(id),
  approved_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  fund_id UUID REFERENCES funds(id) ON DELETE CASCADE,
  security_id UUID REFERENCES securities(id),
  trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  quantity DECIMAL(20,6) NOT NULL,
  price DECIMAL(20,6) NOT NULL,
  currency TEXT DEFAULT 'NZD',
  fx_rate DECIMAL(12,6) DEFAULT 1,
  gross_amount DECIMAL(20,2),
  net_amount DECIMAL(20,2),
  commission DECIMAL(20,2) DEFAULT 0,
  trade_date DATE NOT NULL,
  settlement_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'settled', 'failed', 'cancelled')),
  broker TEXT,
  external_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
  fund_id UUID REFERENCES funds(id),
  expected_date DATE NOT NULL,
  actual_date DATE,
  amount DECIMAL(20,2) NOT NULL,
  currency TEXT DEFAULT 'NZD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'settled', 'failed', 'partial')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id UUID REFERENCES funds(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('investment', 'redemption', 'dividend', 'interest', 'fee', 'settlement', 'fx', 'other')),
  amount DECIMAL(20,2) NOT NULL,
  currency TEXT DEFAULT 'NZD',
  counterparty TEXT,
  effective_date DATE NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'settled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- DATA INGESTION
-- ============================================================

CREATE TABLE import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  file_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'partial')),
  total_rows INT DEFAULT 0,
  processed_rows INT DEFAULT 0,
  error_rows INT DEFAULT 0,
  errors JSONB DEFAULT '[]',
  imported_by UUID REFERENCES user_profiles(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE import_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES import_batches(id) ON DELETE CASCADE,
  row_number INT,
  raw_data JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'error', 'skipped')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE import_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  mapping JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- MODEL PORTFOLIOS & COMPLIANCE
-- ============================================================

CREATE TABLE model_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id UUID REFERENCES funds(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE model_portfolio_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES model_portfolios(id) ON DELETE CASCADE,
  security_id UUID REFERENCES securities(id),
  asset_type_id UUID REFERENCES asset_types(id),
  target_weight DECIMAL(8,4) NOT NULL,
  min_weight DECIMAL(8,4),
  max_weight DECIMAL(8,4),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE compliance_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  fund_id UUID REFERENCES funds(id),
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL,
  parameters JSONB NOT NULL,
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'breach')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE compliance_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES compliance_rules(id) ON DELETE CASCADE,
  fund_id UUID REFERENCES funds(id),
  status TEXT NOT NULL CHECK (status IN ('pass', 'warning', 'breach')),
  details JSONB,
  checked_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES user_profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
