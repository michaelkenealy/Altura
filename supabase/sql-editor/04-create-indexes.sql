-- ============================================================
-- 04-create-indexes.sql
-- All performance indexes.
-- Run AFTER 01-setup-schema.sql
-- ============================================================

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations (slug);

-- ============================================================
-- ROLES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_roles_org_id ON roles (org_id);
CREATE INDEX IF NOT EXISTS idx_roles_slug   ON roles (slug);

-- ============================================================
-- USER PROFILES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_org_id  ON user_profiles (org_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_id ON user_profiles (role_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email   ON user_profiles (email);

-- ============================================================
-- FUNDS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_funds_org_id     ON funds (org_id);
CREATE INDEX IF NOT EXISTS idx_funds_status     ON funds (status);
CREATE INDEX IF NOT EXISTS idx_funds_org_status ON funds (org_id, status);

-- ============================================================
-- SECURITIES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_securities_ticker        ON securities (ticker);
CREATE INDEX IF NOT EXISTS idx_securities_asset_type_id ON securities (asset_type_id);
CREATE INDEX IF NOT EXISTS idx_securities_isin          ON securities (isin) WHERE isin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_securities_sedol         ON securities (sedol) WHERE sedol IS NOT NULL;

-- ============================================================
-- HOLDINGS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_holdings_fund_id       ON holdings (fund_id);
CREATE INDEX IF NOT EXISTS idx_holdings_security_id   ON holdings (security_id);
CREATE INDEX IF NOT EXISTS idx_holdings_as_of_date    ON holdings (as_of_date);
CREATE INDEX IF NOT EXISTS idx_holdings_fund_date     ON holdings (fund_id, as_of_date DESC);
CREATE INDEX IF NOT EXISTS idx_holdings_fund_security ON holdings (fund_id, security_id);

-- ============================================================
-- HOLDINGS HISTORY
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_holdings_history_fund_id       ON holdings_history (fund_id);
CREATE INDEX IF NOT EXISTS idx_holdings_history_security_id   ON holdings_history (security_id);
CREATE INDEX IF NOT EXISTS idx_holdings_history_snapshot_date ON holdings_history (snapshot_date);
CREATE INDEX IF NOT EXISTS idx_holdings_history_fund_date     ON holdings_history (fund_id, snapshot_date DESC);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_orders_fund_id     ON orders (fund_id);
CREATE INDEX IF NOT EXISTS idx_orders_security_id ON orders (security_id);
CREATE INDEX IF NOT EXISTS idx_orders_status      ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_by  ON orders (created_by);
CREATE INDEX IF NOT EXISTS idx_orders_fund_status ON orders (fund_id, status);

-- ============================================================
-- TRADES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_trades_fund_id         ON trades (fund_id);
CREATE INDEX IF NOT EXISTS idx_trades_security_id     ON trades (security_id);
CREATE INDEX IF NOT EXISTS idx_trades_order_id        ON trades (order_id);
CREATE INDEX IF NOT EXISTS idx_trades_trade_date      ON trades (trade_date);
CREATE INDEX IF NOT EXISTS idx_trades_settlement_date ON trades (settlement_date);
CREATE INDEX IF NOT EXISTS idx_trades_status          ON trades (status);
CREATE INDEX IF NOT EXISTS idx_trades_fund_date       ON trades (fund_id, trade_date DESC);
CREATE INDEX IF NOT EXISTS idx_trades_fund_status     ON trades (fund_id, status);
CREATE INDEX IF NOT EXISTS idx_trades_external_ref    ON trades (external_ref) WHERE external_ref IS NOT NULL;

-- ============================================================
-- SETTLEMENTS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_settlements_trade_id      ON settlements (trade_id);
CREATE INDEX IF NOT EXISTS idx_settlements_fund_id       ON settlements (fund_id);
CREATE INDEX IF NOT EXISTS idx_settlements_expected_date ON settlements (expected_date);
CREATE INDEX IF NOT EXISTS idx_settlements_status        ON settlements (status);
CREATE INDEX IF NOT EXISTS idx_settlements_fund_status   ON settlements (fund_id, status);

-- ============================================================
-- CASH MOVEMENTS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_cash_movements_fund_id        ON cash_movements (fund_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_effective_date ON cash_movements (effective_date);
CREATE INDEX IF NOT EXISTS idx_cash_movements_movement_type  ON cash_movements (movement_type);
CREATE INDEX IF NOT EXISTS idx_cash_movements_status         ON cash_movements (status);
CREATE INDEX IF NOT EXISTS idx_cash_movements_fund_date      ON cash_movements (fund_id, effective_date DESC);

-- ============================================================
-- IMPORT BATCHES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_import_batches_org_id  ON import_batches (org_id);
CREATE INDEX IF NOT EXISTS idx_import_batches_status  ON import_batches (status);
CREATE INDEX IF NOT EXISTS idx_import_batches_created ON import_batches (created_at DESC);

-- ============================================================
-- IMPORT ROWS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_import_rows_batch_id ON import_rows (batch_id);
CREATE INDEX IF NOT EXISTS idx_import_rows_status   ON import_rows (batch_id, status);

-- ============================================================
-- IMPORT MAPPINGS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_import_mappings_org_id ON import_mappings (org_id);

-- ============================================================
-- MODEL PORTFOLIOS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_model_portfolios_fund_id ON model_portfolios (fund_id);

-- ============================================================
-- MODEL PORTFOLIO TARGETS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_model_portfolio_targets_model_id    ON model_portfolio_targets (model_id);
CREATE INDEX IF NOT EXISTS idx_model_portfolio_targets_security_id ON model_portfolio_targets (security_id);
CREATE INDEX IF NOT EXISTS idx_model_portfolio_targets_asset_type  ON model_portfolio_targets (asset_type_id);

-- ============================================================
-- COMPLIANCE RULES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_compliance_rules_org_id  ON compliance_rules (org_id);
CREATE INDEX IF NOT EXISTS idx_compliance_rules_fund_id ON compliance_rules (fund_id) WHERE fund_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_compliance_rules_active  ON compliance_rules (org_id, is_active);

-- ============================================================
-- COMPLIANCE CHECKS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_compliance_checks_rule_id    ON compliance_checks (rule_id);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_fund_id    ON compliance_checks (fund_id);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_status     ON compliance_checks (status);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_checked_at ON compliance_checks (checked_at DESC);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id      ON audit_logs (org_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id     ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity      ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at  ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created ON audit_logs (org_id, created_at DESC);
