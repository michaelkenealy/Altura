-- Migration 003: Trading and operations tables
-- Orders, trades, settlements, and cash movements

-- orders (buy/sell instructions)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
  security_id UUID NOT NULL REFERENCES securities(id),
  order_type TEXT NOT NULL CHECK (order_type IN ('buy', 'sell', 'short', 'cover')),
  quantity DECIMAL(20,6) NOT NULL CHECK (quantity > 0),
  limit_price DECIMAL(20,6), -- NULL = market order
  currency TEXT NOT NULL DEFAULT 'NZD',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'open', 'partial', 'filled', 'cancelled', 'rejected')),
  notes TEXT,
  placed_by UUID REFERENCES user_profiles(id),
  placed_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE orders IS 'Trade instructions before execution. Tracks intent and lifecycle of each order.';
COMMENT ON COLUMN orders.limit_price IS 'NULL indicates a market order with no price limit.';

-- trades (executed fills against orders)
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
  security_id UUID NOT NULL REFERENCES securities(id),
  trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell', 'short', 'cover')),
  quantity DECIMAL(20,6) NOT NULL CHECK (quantity > 0),
  price DECIMAL(20,6) NOT NULL CHECK (price >= 0),
  gross_amount_local DECIMAL(20,2) NOT NULL, -- quantity * price in local currency
  gross_amount_nzd DECIMAL(20,2) NOT NULL,
  commission DECIMAL(20,2) DEFAULT 0,
  taxes DECIMAL(20,2) DEFAULT 0,
  net_amount_nzd DECIMAL(20,2) NOT NULL, -- gross + fees, in NZD
  fx_rate DECIMAL(12,6) DEFAULT 1,
  currency TEXT NOT NULL DEFAULT 'NZD',
  trade_date DATE NOT NULL DEFAULT CURRENT_DATE,
  settlement_date DATE, -- T+2 or as agreed
  broker TEXT,
  external_ref TEXT, -- broker/custodian reference
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'settled', 'failed', 'cancelled')),
  recorded_by UUID REFERENCES user_profiles(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE trades IS 'Actual executed transactions. Each trade may partially or fully fill an order.';
COMMENT ON COLUMN trades.order_id IS 'NULL allowed for manual/legacy trade entry not linked to an order.';
COMMENT ON COLUMN trades.net_amount_nzd IS 'Gross NZD amount plus commission and taxes; the true cost/proceeds.';

-- settlements (confirmation that a trade has settled)
CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  fund_id UUID NOT NULL REFERENCES funds(id),
  settled_at TIMESTAMPTZ,
  settlement_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'settled', 'failed', 'disputed')),
  custodian TEXT,
  custodian_ref TEXT,
  notes TEXT,
  confirmed_by UUID REFERENCES user_profiles(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(trade_id) -- one settlement record per trade
);

COMMENT ON TABLE settlements IS 'Settlement confirmations linking trade execution to custodian confirmation.';

-- cash_movements (deposits, withdrawals, dividends, fees, FX, etc.)
CREATE TABLE cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (
    movement_type IN (
      'deposit', 'withdrawal', 'dividend', 'interest',
      'fee', 'tax', 'fx_gain_loss', 'transfer_in', 'transfer_out', 'other'
    )
  ),
  amount_local DECIMAL(20,2) NOT NULL,  -- positive = inflow, negative = outflow
  amount_nzd DECIMAL(20,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NZD',
  fx_rate DECIMAL(12,6) DEFAULT 1,
  value_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  related_trade_id UUID REFERENCES trades(id), -- optional link to triggering trade
  related_security_id UUID REFERENCES securities(id), -- e.g., dividend source
  external_ref TEXT,
  recorded_by UUID REFERENCES user_profiles(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE cash_movements IS 'All cash flows in/out of a fund: deposits, dividends, fees, FX P&L, etc.';
COMMENT ON COLUMN cash_movements.amount_local IS 'Positive = inflow to fund. Negative = outflow from fund.';
