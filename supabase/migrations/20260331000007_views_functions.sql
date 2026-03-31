-- Migration 007: Views and functions
-- Materialized portfolio view, fund summary view, and utility functions

-- Unique index required for REFRESH MATERIALIZED VIEW CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS portfolio_view_unique_idx
  ON holdings (fund_id, security_id, as_of_date);

-- Portfolio view (materialized for performance)
CREATE MATERIALIZED VIEW portfolio_view AS
SELECT
  h.fund_id,
  f.name        AS fund_name,
  f.code        AS fund_code,
  f.org_id,
  s.ticker,
  s.name        AS security_name,
  at.name       AS asset_type,
  at.slug       AS asset_type_slug,
  h.quantity,
  h.last_price,
  h.weight_pct,
  h.market_value_local,
  h.market_value_nzd,
  h.fx_rate,
  s.currency,
  h.as_of_date
FROM holdings h
JOIN funds f       ON h.fund_id       = f.id
JOIN securities s  ON h.security_id   = s.id
JOIN asset_types at ON s.asset_type_id = at.id
WHERE f.status = 'active';

-- Index the materialized view for fast org/fund lookups
CREATE INDEX portfolio_view_org_idx  ON portfolio_view (org_id);
CREATE INDEX portfolio_view_fund_idx ON portfolio_view (fund_id);
CREATE INDEX portfolio_view_date_idx ON portfolio_view (as_of_date);

-- Fund summary view (real-time, not materialized — lightweight enough)
CREATE VIEW fund_summary_view AS
SELECT
  f.id          AS fund_id,
  f.name,
  f.code,
  f.currency,
  f.org_id,
  f.status,
  f.inception_date,
  COUNT(DISTINCT h.security_id)           AS num_holdings,
  COALESCE(SUM(h.market_value_nzd), 0)   AS total_aum_nzd,
  MAX(h.as_of_date)                        AS last_updated
FROM funds f
LEFT JOIN holdings h ON f.id = h.fund_id
GROUP BY f.id, f.name, f.code, f.currency, f.org_id, f.status, f.inception_date;

-- Function: refresh portfolio materialized view (call via pg_cron or after import)
CREATE OR REPLACE FUNCTION refresh_portfolio_view()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY portfolio_view;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: updated_at trigger helper
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables that have the column
CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_funds_updated_at
  BEFORE UPDATE ON funds
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_holdings_updated_at
  BEFORE UPDATE ON holdings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_trades_updated_at
  BEFORE UPDATE ON trades
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_settlements_updated_at
  BEFORE UPDATE ON settlements
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_import_mappings_updated_at
  BEFORE UPDATE ON import_mappings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_model_portfolios_updated_at
  BEFORE UPDATE ON model_portfolios
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Function: snapshot current holdings to history (call nightly)
CREATE OR REPLACE FUNCTION snapshot_holdings_to_history()
RETURNS void AS $$
BEGIN
  INSERT INTO holdings_history (
    fund_id, security_id, quantity, last_price,
    market_value_local, market_value_nzd, weight_pct, fx_rate, snapshot_date
  )
  SELECT
    fund_id, security_id, quantity, last_price,
    market_value_local, market_value_nzd, weight_pct, fx_rate, CURRENT_DATE
  FROM holdings
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: get fund AUM breakdown by asset type
CREATE OR REPLACE FUNCTION fund_aum_by_asset_type(p_fund_id UUID)
RETURNS TABLE (
  asset_type TEXT,
  asset_type_slug TEXT,
  total_market_value_nzd DECIMAL,
  weight_pct DECIMAL,
  num_holdings BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    at.name,
    at.slug,
    COALESCE(SUM(h.market_value_nzd), 0),
    COALESCE(SUM(h.weight_pct), 0),
    COUNT(h.id)
  FROM asset_types at
  LEFT JOIN securities s  ON s.asset_type_id = at.id
  LEFT JOIN holdings h    ON h.security_id = s.id AND h.fund_id = p_fund_id
  GROUP BY at.name, at.slug
  ORDER BY at.display_order;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
