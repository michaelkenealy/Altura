-- Migration 003: Trading and operations tables
-- Orders, trades, settlements, and cash movements

-- orders
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

-- trades
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

-- settlements
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

-- cash_movements
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
