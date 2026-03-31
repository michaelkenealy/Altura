-- Migration 007: Indexes, materialized views, functions, and seed data

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1: INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

-- organizations
CREATE INDEX idx_organizations_slug ON organizations(slug);

-- roles
CREATE INDEX idx_roles_org_id ON roles(org_id);

-- user_profiles
CREATE INDEX idx_user_profiles_org_id ON user_profiles(org_id);
CREATE INDEX idx_user_profiles_role_id ON user_profiles(role_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

-- funds
CREATE INDEX idx_funds_org_id ON funds(org_id);
CREATE INDEX idx_funds_status ON funds(status);
CREATE INDEX idx_funds_org_status ON funds(org_id, status);

-- securities
CREATE INDEX idx_securities_ticker ON securities(ticker);
CREATE INDEX idx_securities_asset_type_id ON securities(asset_type_id);
CREATE INDEX idx_securities_isin ON securities(isin) WHERE isin IS NOT NULL;

-- holdings
CREATE INDEX idx_holdings_fund_id ON holdings(fund_id);
CREATE INDEX idx_holdings_security_id ON holdings(security_id);
CREATE INDEX idx_holdings_as_of_date ON holdings(as_of_date);
CREATE INDEX idx_holdings_fund_date ON holdings(fund_id, as_of_date DESC);

-- holdings_history
CREATE INDEX idx_holdings_history_fund_id ON holdings_history(fund_id);
CREATE INDEX idx_holdings_history_security_id ON holdings_history(security_id);
CREATE INDEX idx_holdings_history_snapshot_date ON holdings_history(snapshot_date DESC);
CREATE INDEX idx_holdings_history_fund_date ON holdings_history(fund_id, snapshot_date DESC);

-- orders
CREATE INDEX idx_orders_org_id ON orders(org_id);
CREATE INDEX idx_orders_fund_id ON orders(fund_id);
CREATE INDEX idx_orders_security_id ON orders(security_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_placed_at ON orders(placed_at DESC);
CREATE INDEX idx_orders_org_status ON orders(org_id, status);

-- trades
CREATE INDEX idx_trades_org_id ON trades(org_id);
CREATE INDEX idx_trades_fund_id ON trades(fund_id);
CREATE INDEX idx_trades_security_id ON trades(security_id);
CREATE INDEX idx_trades_order_id ON trades(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX idx_trades_trade_date ON trades(trade_date DESC);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_fund_date ON trades(fund_id, trade_date DESC);
CREATE INDEX idx_trades_settlement_date ON trades(settlement_date) WHERE settlement_date IS NOT NULL;

-- settlements
CREATE INDEX idx_settlements_org_id ON settlements(org_id);
CREATE INDEX idx_settlements_fund_id ON settlements(fund_id);
CREATE INDEX idx_settlements_trade_id ON settlements(trade_id);
CREATE INDEX idx_settlements_status ON settlements(status);
CREATE INDEX idx_settlements_settlement_date ON settlements(settlement_date DESC);

-- cash_movements
CREATE INDEX idx_cash_movements_org_id ON cash_movements(org_id);
CREATE INDEX idx_cash_movements_fund_id ON cash_movements(fund_id);
CREATE INDEX idx_cash_movements_value_date ON cash_movements(value_date DESC);
CREATE INDEX idx_cash_movements_movement_type ON cash_movements(movement_type);
CREATE INDEX idx_cash_movements_fund_date ON cash_movements(fund_id, value_date DESC);

-- import_batches
CREATE INDEX idx_import_batches_org_id ON import_batches(org_id);
CREATE INDEX idx_import_batches_fund_id ON import_batches(fund_id) WHERE fund_id IS NOT NULL;
CREATE INDEX idx_import_batches_status ON import_batches(status);
CREATE INDEX idx_import_batches_import_type ON import_batches(import_type);
CREATE INDEX idx_import_batches_created_at ON import_batches(created_at DESC);

-- import_rows
CREATE INDEX idx_import_rows_batch_id ON import_rows(batch_id);
CREATE INDEX idx_import_rows_org_id ON import_rows(org_id);
CREATE INDEX idx_import_rows_status ON import_rows(status);

-- import_mappings
CREATE INDEX idx_import_mappings_org_id ON import_mappings(org_id);
CREATE INDEX idx_import_mappings_org_type ON import_mappings(org_id, import_type);

-- model_portfolios
CREATE INDEX idx_model_portfolios_org_id ON model_portfolios(org_id);
CREATE INDEX idx_model_portfolios_status ON model_portfolios(status);

-- model_portfolio_targets
CREATE INDEX idx_model_portfolio_targets_model_id ON model_portfolio_targets(model_portfolio_id);
CREATE INDEX idx_model_portfolio_targets_security_id ON model_portfolio_targets(security_id) WHERE security_id IS NOT NULL;
CREATE INDEX idx_model_portfolio_targets_asset_type_id ON model_portfolio_targets(asset_type_id) WHERE asset_type_id IS NOT NULL;
CREATE INDEX idx_model_portfolio_targets_effective ON model_portfolio_targets(effective_from, effective_to);

-- compliance_rules
CREATE INDEX idx_compliance_rules_org_id ON compliance_rules(org_id);
CREATE INDEX idx_compliance_rules_fund_id ON compliance_rules(fund_id) WHERE fund_id IS NOT NULL;
CREATE INDEX idx_compliance_rules_active ON compliance_rules(org_id, is_active);

-- compliance_checks
CREATE INDEX idx_compliance_checks_org_id ON compliance_checks(org_id);
CREATE INDEX idx_compliance_checks_rule_id ON compliance_checks(rule_id);
CREATE INDEX idx_compliance_checks_fund_id ON compliance_checks(fund_id) WHERE fund_id IS NOT NULL;
CREATE INDEX idx_compliance_checks_status ON compliance_checks(status);
CREATE INDEX idx_compliance_checks_check_date ON compliance_checks(check_date DESC);

-- audit_logs
CREATE INDEX idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_table, target_id) WHERE target_table IS NOT NULL;
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2: MATERIALIZED VIEWS
-- ─────────────────────────────────────────────────────────────────────────────

-- portfolio_view: latest holdings per fund with security and asset-type details
-- Refreshed on demand via refresh_portfolio_view().
CREATE MATERIALIZED VIEW portfolio_view AS
SELECT
  h.id              AS holding_id,
  h.fund_id,
  f.org_id,
  f.name            AS fund_name,
  f.code            AS fund_code,
  f.currency        AS fund_currency,
  h.security_id,
  s.ticker,
  s.name            AS security_name,
  s.exchange,
  s.currency        AS security_currency,
  s.isin,
  at.id             AS asset_type_id,
  at.name           AS asset_type_name,
  at.slug           AS asset_type_slug,
  h.quantity,
  h.avg_cost_local,
  h.avg_cost_nzd,
  h.last_price,
  h.market_value_local,
  h.market_value_nzd,
  h.weight_pct,
  h.fx_rate,
  h.as_of_date
FROM holdings h
JOIN funds     f  ON f.id = h.fund_id
JOIN securities s ON s.id = h.security_id
JOIN asset_types at ON at.id = s.asset_type_id
WHERE f.status = 'active';

COMMENT ON MATERIALIZED VIEW portfolio_view IS
  'Denormalized current holdings snapshot. Refresh with SELECT refresh_portfolio_view().';

-- Index on materialized view for fast org/fund lookups
CREATE INDEX idx_portfolio_view_org_id   ON portfolio_view(org_id);
CREATE INDEX idx_portfolio_view_fund_id  ON portfolio_view(fund_id);
CREATE INDEX idx_portfolio_view_as_of    ON portfolio_view(as_of_date DESC);
CREATE INDEX idx_portfolio_view_asset_type ON portfolio_view(asset_type_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- fund_summary_view: per-fund aggregate totals (regular view, always current)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE VIEW fund_summary_view AS
SELECT
  f.id                                              AS fund_id,
  f.org_id,
  f.name                                            AS fund_name,
  f.code                                            AS fund_code,
  f.currency,
  f.status,
  COUNT(DISTINCT h.security_id)                     AS security_count,
  SUM(h.market_value_nzd)                           AS total_market_value_nzd,
  SUM(h.market_value_local)                         AS total_market_value_local,
  MAX(h.as_of_date)                                 AS latest_as_of_date,
  -- Asset-class breakdown (NZD)
  SUM(h.market_value_nzd) FILTER (
    WHERE at.slug = 'stocks')                        AS stocks_value_nzd,
  SUM(h.market_value_nzd) FILTER (
    WHERE at.slug = 'fixed-income')                  AS fixed_income_value_nzd,
  SUM(h.market_value_nzd) FILTER (
    WHERE at.slug = 'hedges')                        AS hedges_value_nzd,
  SUM(h.market_value_nzd) FILTER (
    WHERE at.slug = 'cash')                          AS cash_value_nzd
FROM funds f
LEFT JOIN holdings  h  ON h.fund_id = f.id
LEFT JOIN securities s ON s.id = h.security_id
LEFT JOIN asset_types at ON at.id = s.asset_type_id
GROUP BY f.id, f.org_id, f.name, f.code, f.currency, f.status;

COMMENT ON VIEW fund_summary_view IS
  'Live per-fund aggregate totals. No refresh required; always reflects current holdings rows.';

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3: FUNCTIONS
-- ─────────────────────────────────────────────────────────────────────────────

-- refresh_portfolio_view(): concurrently refreshes the materialized view.
-- Call after any holdings import or end-of-day pricing run.
CREATE OR REPLACE FUNCTION refresh_portfolio_view()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER  -- runs as the defining role so it bypasses RLS on the mat. view
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY portfolio_view;
END;
$$;

COMMENT ON FUNCTION refresh_portfolio_view() IS
  'Concurrently refreshes portfolio_view. Safe to call while the view is being read.';

-- snapshot_holdings_history(): copies current holdings into holdings_history for a given date.
-- Intended to be called nightly by a cron job or after end-of-day price loading.
CREATE OR REPLACE FUNCTION snapshot_holdings_history(p_snapshot_date DATE DEFAULT CURRENT_DATE)
RETURNS INT  -- returns number of rows inserted
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inserted INT;
BEGIN
  INSERT INTO holdings_history (
    fund_id, security_id, quantity, last_price,
    market_value_local, market_value_nzd, weight_pct, fx_rate, snapshot_date
  )
  SELECT
    fund_id, security_id, quantity, last_price,
    market_value_local, market_value_nzd, weight_pct, fx_rate, p_snapshot_date
  FROM holdings
  WHERE as_of_date = p_snapshot_date
  ON CONFLICT DO NOTHING;  -- idempotent: safe to call twice for the same date

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted;
END;
$$;

COMMENT ON FUNCTION snapshot_holdings_history(DATE) IS
  'Copies holdings rows for p_snapshot_date into holdings_history. Idempotent.';

-- log_audit_event(): convenience wrapper for writing to audit_logs.
-- Call from application code or database triggers.
CREATE OR REPLACE FUNCTION log_audit_event(
  p_org_id      UUID,
  p_action      TEXT,
  p_target_table TEXT DEFAULT NULL,
  p_target_id   UUID DEFAULT NULL,
  p_old_data    JSONB DEFAULT NULL,
  p_new_data    JSONB DEFAULT NULL
)
RETURNS UUID  -- returns new audit_logs.id
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO audit_logs (org_id, user_id, action, target_table, target_id, old_data, new_data)
  VALUES (p_org_id, auth.uid(), p_action, p_target_table, p_target_id, p_old_data, p_new_data)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION log_audit_event(UUID, TEXT, TEXT, UUID, JSONB, JSONB) IS
  'Inserts a row into audit_logs. Uses auth.uid() for the acting user. Safe to call from triggers.';

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 4: SEED DATA
-- ─────────────────────────────────────────────────────────────────────────────

-- Default organization
INSERT INTO organizations (id, name, slug, settings)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Altura Capital',
  'altura-capital',
  '{"timezone": "Pacific/Auckland", "default_currency": "NZD"}'
)
ON CONFLICT (slug) DO NOTHING;

-- Default system roles for the default org
INSERT INTO roles (org_id, name, slug, is_system, permissions)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Master',
    'master',
    true,
    '{"funds": ["create","read","update","delete"], "trades": ["create","read","update","delete"], "compliance": ["manage"], "users": ["manage"]}'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Compliance',
    'compliance',
    true,
    '{"funds": ["read"], "trades": ["read"], "compliance": ["create","read","update"], "reports": ["read"]}'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Portfolio Manager',
    'portfolio_manager',
    true,
    '{"funds": ["read","update"], "trades": ["create","read","update"], "holdings": ["create","read","update"]}'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Analyst',
    'analyst',
    true,
    '{"funds": ["read"], "trades": ["read"], "holdings": ["read"], "reports": ["read"]}'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Operations',
    'operations',
    true,
    '{"trades": ["create","read","update"], "settlements": ["create","read","update"], "cash_movements": ["create","read","update"], "imports": ["create","read","update"]}'
  )
ON CONFLICT (org_id, slug) DO NOTHING;

-- Sample funds for Altura Capital
INSERT INTO funds (id, org_id, name, code, description, currency, inception_date, status)
VALUES
  (
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Altura Growth Fund',
    'AGF',
    'Long-only equities and fixed income, targeting NZ and global growth assets.',
    'NZD',
    '2020-01-01',
    'active'
  ),
  (
    '00000000-0000-0000-0001-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Altura Balanced Fund',
    'ABF',
    'Diversified multi-asset fund with defensive allocation.',
    'NZD',
    '2021-06-01',
    'active'
  ),
  (
    '00000000-0000-0000-0001-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Altura Income Fund',
    'AIF',
    'Fixed income and cash-equivalent securities targeting steady yield.',
    'NZD',
    '2022-03-01',
    'active'
  )
ON CONFLICT (org_id, code) DO NOTHING;

-- Sample securities
INSERT INTO securities (id, ticker, name, asset_type_id, exchange, currency, isin)
VALUES
  -- NZX stocks
  (
    '00000000-0000-0000-0002-000000000001',
    'AIR',
    'Air New Zealand Ltd',
    (SELECT id FROM asset_types WHERE slug = 'stocks'),
    'NZX',
    'NZD',
    'NZAIRE0001S2'
  ),
  (
    '00000000-0000-0000-0002-000000000002',
    'ATM',
    'A2 Milk Company Ltd',
    (SELECT id FROM asset_types WHERE slug = 'stocks'),
    'NZX',
    'NZD',
    'NZATME0002S4'
  ),
  (
    '00000000-0000-0000-0002-000000000003',
    'FPH',
    'Fisher & Paykel Healthcare Ltd',
    (SELECT id FROM asset_types WHERE slug = 'stocks'),
    'NZX',
    'NZD',
    'NZFPHE0001S2'
  ),
  (
    '00000000-0000-0000-0002-000000000004',
    'SPK',
    'Spark New Zealand Ltd',
    (SELECT id FROM asset_types WHERE slug = 'stocks'),
    'NZX',
    'NZD',
    'NZSPKE0001S6'
  ),
  -- ASX stocks
  (
    '00000000-0000-0000-0002-000000000005',
    'CBA',
    'Commonwealth Bank of Australia',
    (SELECT id FROM asset_types WHERE slug = 'stocks'),
    'ASX',
    'AUD',
    'AU000000CBA7'
  ),
  (
    '00000000-0000-0000-0002-000000000006',
    'BHP',
    'BHP Group Ltd',
    (SELECT id FROM asset_types WHERE slug = 'stocks'),
    'ASX',
    'AUD',
    'AU000000BHP4'
  ),
  -- Fixed income
  (
    '00000000-0000-0000-0002-000000000007',
    'NZGB2030',
    'NZ Government Bond 2030',
    (SELECT id FROM asset_types WHERE slug = 'fixed-income'),
    'NZX',
    'NZD',
    'NZGOVT0030B1'
  ),
  (
    '00000000-0000-0000-0002-000000000008',
    'NZGB2035',
    'NZ Government Bond 2035',
    (SELECT id FROM asset_types WHERE slug = 'fixed-income'),
    'NZX',
    'NZD',
    'NZGOVT0035B2'
  ),
  -- Cash / money market
  (
    '00000000-0000-0000-0002-000000000009',
    'CASH_NZD',
    'NZD Cash',
    (SELECT id FROM asset_types WHERE slug = 'cash'),
    NULL,
    'NZD',
    NULL
  ),
  (
    '00000000-0000-0000-0002-000000000010',
    'CASH_AUD',
    'AUD Cash',
    (SELECT id FROM asset_types WHERE slug = 'cash'),
    NULL,
    'AUD',
    NULL
  )
ON CONFLICT (ticker, exchange) DO NOTHING;

-- Sample holdings for Altura Growth Fund (as at today)
INSERT INTO holdings (fund_id, security_id, quantity, avg_cost_local, avg_cost_nzd, last_price, market_value_local, market_value_nzd, weight_pct, fx_rate, as_of_date)
VALUES
  -- AIR
  (
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0002-000000000001',
    500000, 0.68, 0.68, 0.72, 360000.00, 360000.00, 9.50, 1.0,
    CURRENT_DATE
  ),
  -- ATM
  (
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0002-000000000002',
    200000, 5.20, 5.20, 5.45, 1090000.00, 1090000.00, 28.75, 1.0,
    CURRENT_DATE
  ),
  -- FPH
  (
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0002-000000000003',
    150000, 22.00, 22.00, 23.10, 3465000.00, 3465000.00, 91.35, 1.0,
    CURRENT_DATE
  ),
  -- NZGB2030
  (
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0002-000000000007',
    1000000, 0.985, 0.985, 0.992, 992000.00, 992000.00, 26.17, 1.0,
    CURRENT_DATE
  ),
  -- CASH_NZD
  (
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0002-000000000009',
    885000, 1.0, 1.0, 1.0, 885000.00, 885000.00, 23.34, 1.0,
    CURRENT_DATE
  )
ON CONFLICT (fund_id, security_id, as_of_date) DO NOTHING;

-- Sample compliance rule for the default org
INSERT INTO compliance_rules (
  org_id, fund_id, rule_type, name, description, parameters, severity, is_active
)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000001',
    'concentration_limit',
    'Single Security Cap — Growth Fund',
    'No single security may exceed 30% of the Growth Fund NAV.',
    '{"max_pct": 30}',
    'breach',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    NULL,
    'liquidity_limit',
    'Minimum Cash — All Funds',
    'All funds must hold at least 5% in cash or cash equivalents.',
    '{"min_pct": 5}',
    'warning',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    NULL,
    'asset_class_limit',
    'Equities Cap — All Funds',
    'Equity exposure must not exceed 70% of NAV.',
    '{"asset_type_slug": "stocks", "max_pct": 70}',
    'breach',
    true
  )
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Initial portfolio_view refresh (non-concurrent on first run — no unique index yet)
-- ─────────────────────────────────────────────────────────────────────────────
REFRESH MATERIALIZED VIEW portfolio_view;

-- Add unique index after initial population so CONCURRENTLY works in future refreshes
CREATE UNIQUE INDEX idx_portfolio_view_unique ON portfolio_view(holding_id);
