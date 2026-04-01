-- ============================================================
-- 03-create-views.sql
-- Materialized portfolio view, fund summary view, and refresh function.
-- Run AFTER 01-setup-schema.sql and 02-enable-rls.sql
-- ============================================================

-- Drop existing views
DROP MATERIALIZED VIEW IF EXISTS portfolio_view CASCADE;
DROP VIEW IF EXISTS fund_summary_view CASCADE;

-- Unique index required for REFRESH MATERIALIZED VIEW CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS portfolio_view_unique_idx
  ON holdings (fund_id, security_id, as_of_date);

-- ============================================================
-- MATERIALIZED VIEW: portfolio_view
-- Snapshot of all holdings with fund, security, and asset type context.
-- Refresh via: SELECT refresh_portfolio_view();
-- ============================================================

CREATE MATERIALIZED VIEW portfolio_view AS
SELECT
  h.id              AS holding_id,
  h.fund_id,
  f.name            AS fund_name,
  f.code            AS fund_code,
  f.org_id,
  f.currency        AS fund_currency,
  h.security_id,
  s.ticker,
  s.name            AS security_name,
  s.exchange,
  s.currency        AS security_currency,
  s.isin,
  at.id             AS asset_type_id,
  at.name           AS asset_type,
  at.slug           AS asset_type_slug,
  h.quantity,
  h.avg_cost_local,
  h.avg_cost_nzd,
  h.last_price,
  h.weight_pct,
  h.market_value_local,
  h.market_value_nzd,
  h.fx_rate,
  h.as_of_date
FROM holdings h
JOIN funds f        ON h.fund_id       = f.id
JOIN securities s   ON h.security_id   = s.id
JOIN asset_types at ON s.asset_type_id = at.id
WHERE f.status = 'active';

-- Indexes on the materialized view for fast lookups
CREATE INDEX portfolio_view_org_idx          ON portfolio_view (org_id);
CREATE INDEX portfolio_view_fund_idx         ON portfolio_view (fund_id);
CREATE INDEX portfolio_view_date_idx         ON portfolio_view (as_of_date);
CREATE INDEX portfolio_view_asset_type_idx   ON portfolio_view (asset_type_slug);
CREATE INDEX portfolio_view_ticker_idx       ON portfolio_view (ticker);

-- ============================================================
-- VIEW: fund_summary_view
-- Real-time fund summary (not materialized — lightweight enough).
-- ============================================================

CREATE VIEW fund_summary_view AS
SELECT
  f.id              AS fund_id,
  f.name,
  f.code,
  f.currency,
  f.org_id,
  f.status,
  f.inception_date,
  f.description,
  f.metadata,
  f.created_at,
  f.updated_at,
  COUNT(DISTINCT h.security_id)           AS num_holdings,
  COALESCE(SUM(h.market_value_nzd), 0)   AS total_aum_nzd,
  MAX(h.as_of_date)                       AS last_updated
FROM funds f
LEFT JOIN holdings h ON f.id = h.fund_id
GROUP BY f.id, f.name, f.code, f.currency, f.org_id, f.status,
         f.inception_date, f.description, f.metadata, f.created_at, f.updated_at;

-- ============================================================
-- FUNCTION: refresh_portfolio_view
-- Call after data imports or holdings changes.
-- ============================================================

CREATE OR REPLACE FUNCTION refresh_portfolio_view()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY portfolio_view;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: snapshot_holdings_to_history
-- Call nightly to archive holdings snapshots.
-- ============================================================

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

-- ============================================================
-- FUNCTION: fund_aum_by_asset_type(p_fund_id UUID)
-- Returns AUM breakdown by asset class for a given fund.
-- ============================================================

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
  GROUP BY at.name, at.slug, at.display_order
  ORDER BY at.display_order;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
