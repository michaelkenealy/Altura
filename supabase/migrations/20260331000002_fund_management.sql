-- Migration 002: Fund management tables
-- Asset types, funds, securities, holdings, and holdings history

-- asset_types
CREATE TABLE asset_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- Stocks, Fixed Income, Hedges, Cash
  slug TEXT UNIQUE NOT NULL,
  display_order INT DEFAULT 0
);

-- Insert default asset types
INSERT INTO asset_types (name, slug, display_order) VALUES
  ('Stocks', 'stocks', 1),
  ('Fixed Income', 'fixed-income', 2),
  ('Hedges', 'hedges', 3),
  ('Cash', 'cash', 4);

-- funds
CREATE TABLE funds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL, -- unique fund code
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

-- securities (master security list)
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

-- holdings (current positions)
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
  weight_pct DECIMAL(8,4) DEFAULT 0, -- % of fund
  fx_rate DECIMAL(12,6) DEFAULT 1,
  as_of_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(fund_id, security_id, as_of_date)
);

-- holdings_history (for historical tracking)
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
