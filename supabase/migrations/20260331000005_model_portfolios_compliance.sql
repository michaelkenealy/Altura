-- Migration 005: Model portfolios and compliance
-- Model portfolios, targets, compliance rules, checks, and audit logs

-- model_portfolios
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

-- model_portfolio_targets
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

-- compliance_rules
CREATE TABLE compliance_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  fund_id UUID REFERENCES funds(id), -- NULL = applies to all funds in org
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL, -- 'concentration', 'asset_class', 'liquidity', 'custom'
  parameters JSONB NOT NULL, -- rule-specific config
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'breach')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- compliance_checks
CREATE TABLE compliance_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES compliance_rules(id) ON DELETE CASCADE,
  fund_id UUID REFERENCES funds(id),
  status TEXT NOT NULL CHECK (status IN ('pass', 'warning', 'breach')),
  details JSONB,
  checked_at TIMESTAMPTZ DEFAULT now()
);

-- audit_logs (append-only activity trail)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES user_profiles(id),
  action TEXT NOT NULL,       -- e.g. 'CREATE', 'UPDATE', 'DELETE', 'APPROVE'
  entity_type TEXT NOT NULL,  -- e.g. 'fund', 'order', 'trade'
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
