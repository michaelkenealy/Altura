-- Migration 005: Model portfolios and compliance tables
-- Model portfolios, target weights, compliance rules, compliance checks, and audit logs

-- model_portfolios (benchmark/target allocation templates)
CREATE TABLE model_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  currency TEXT DEFAULT 'NZD',
  rebalance_frequency TEXT CHECK (
    rebalance_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual', 'manual')
  ) DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_by UUID REFERENCES user_profiles(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, name)
);

COMMENT ON TABLE model_portfolios IS 'Target allocation templates that can be assigned to one or more funds for drift/rebalance tracking.';

-- model_portfolio_targets (individual security weights within a model)
CREATE TABLE model_portfolio_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_portfolio_id UUID NOT NULL REFERENCES model_portfolios(id) ON DELETE CASCADE,
  security_id UUID REFERENCES securities(id),   -- NULL for cash or asset-class targets
  asset_type_id UUID REFERENCES asset_types(id), -- for asset-class-level targets
  target_weight_pct DECIMAL(8,4) NOT NULL CHECK (target_weight_pct >= 0 AND target_weight_pct <= 100),
  min_weight_pct DECIMAL(8,4) DEFAULT 0 CHECK (min_weight_pct >= 0),
  max_weight_pct DECIMAL(8,4) DEFAULT 100 CHECK (max_weight_pct <= 100),
  notes TEXT,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,             -- NULL = currently active
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT target_range_valid CHECK (min_weight_pct <= target_weight_pct AND target_weight_pct <= max_weight_pct),
  CONSTRAINT security_or_asset_type CHECK (
    (security_id IS NOT NULL AND asset_type_id IS NULL) OR
    (security_id IS NULL AND asset_type_id IS NOT NULL)
  )
);

COMMENT ON TABLE model_portfolio_targets IS 'Per-security or per-asset-class target weights within a model portfolio.';
COMMENT ON COLUMN model_portfolio_targets.security_id IS 'Mutually exclusive with asset_type_id. Set one or the other.';
COMMENT ON COLUMN model_portfolio_targets.effective_to IS 'NULL indicates the target is currently active.';

-- compliance_rules (configurable per org, optionally scoped to a fund or model)
CREATE TABLE compliance_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  fund_id UUID REFERENCES funds(id),              -- NULL = applies to all org funds
  model_portfolio_id UUID REFERENCES model_portfolios(id),
  rule_type TEXT NOT NULL CHECK (
    rule_type IN (
      'concentration_limit',  -- max % in a single security
      'asset_class_limit',    -- max/min % in an asset class
      'liquidity_limit',      -- min cash holding
      'sector_limit',         -- max % in a sector
      'currency_limit',       -- max % in a foreign currency
      'drift_limit',          -- max drift from model target
      'custom'
    )
  ),
  name TEXT NOT NULL,
  description TEXT,
  parameters JSONB NOT NULL DEFAULT '{}',
  -- parameters examples:
  --   concentration_limit: { "max_pct": 10 }
  --   asset_class_limit:   { "asset_type_slug": "stocks", "min_pct": 20, "max_pct": 60 }
  --   drift_limit:         { "max_drift_pct": 5 }
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'breach')),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE compliance_rules IS 'Configurable compliance constraints. Evaluated against current holdings periodically or on demand.';
COMMENT ON COLUMN compliance_rules.parameters IS 'Rule-type-specific thresholds and configuration stored as JSONB.';
COMMENT ON COLUMN compliance_rules.severity IS 'breach = hard violation; warning = soft alert; info = informational only.';

-- compliance_checks (results of evaluating rules against actual holdings)
CREATE TABLE compliance_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES compliance_rules(id) ON DELETE CASCADE,
  fund_id UUID REFERENCES funds(id),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('pass', 'warning', 'breach', 'error')),
  actual_value DECIMAL(20,6),    -- the measured value (e.g. 12.5 for 12.5%)
  threshold_value DECIMAL(20,6), -- the rule's limit that was compared
  deviation DECIMAL(20,6),       -- actual - threshold (positive = breach magnitude)
  detail JSONB DEFAULT '{}',     -- full breakdown (per-security, per-asset-class, etc.)
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES user_profiles(id),
  resolution_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE compliance_checks IS 'Point-in-time results of evaluating each compliance_rule. Append-only for audit purposes.';
COMMENT ON COLUMN compliance_checks.deviation IS 'Positive value means actual exceeded threshold by this amount.';
COMMENT ON COLUMN compliance_checks.detail IS 'Full breakdown: securities contributing to breach, drift deltas, etc.';

-- audit_logs (immutable record of all significant user actions)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id),
  action TEXT NOT NULL,          -- e.g. 'fund.create', 'trade.approve', 'import.upload'
  target_table TEXT,             -- e.g. 'funds', 'trades'
  target_id UUID,                -- PK of the affected record
  old_data JSONB,                -- previous state (for updates/deletes)
  new_data JSONB,                -- new state (for inserts/updates)
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
  -- NO updated_at — audit logs are immutable
);

COMMENT ON TABLE audit_logs IS 'Append-only audit trail. Never update or delete rows. RLS prevents non-superadmin modifications.';
COMMENT ON COLUMN audit_logs.old_data IS 'NULL for INSERT operations.';
COMMENT ON COLUMN audit_logs.new_data IS 'NULL for DELETE operations.';
COMMENT ON COLUMN audit_logs.action IS 'Dot-separated namespace.verb, e.g. fund.create, trade.settle, user.login.';
