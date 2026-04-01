-- ============================================================
-- 06-helper-functions.sql
-- Utility functions for use in queries, triggers, and edge functions.
-- Run AFTER 01-setup-schema.sql
-- ============================================================

-- ============================================================
-- get_user_org() — returns current user's org_id
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_org()
RETURNS UUID AS $$
  SELECT org_id FROM user_profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- get_user_role() — returns current user's role slug
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT r.slug
  FROM user_profiles up
  JOIN roles r ON up.role_id = r.id
  WHERE up.id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- is_superadmin() — true if current user is superadmin
-- ============================================================

CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(is_superadmin, false)
  FROM user_profiles
  WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- calculate_fund_nav(fund_id UUID)
-- Returns the current NAV (total AUM in NZD) for a fund.
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_fund_nav(p_fund_id UUID)
RETURNS DECIMAL AS $$
  SELECT COALESCE(SUM(market_value_nzd), 0)
  FROM holdings
  WHERE fund_id = p_fund_id
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- calculate_holding_weights(fund_id UUID)
-- Recalculates weight_pct for all holdings in a fund
-- based on current market_value_nzd.
-- Returns number of holdings updated.
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_holding_weights(p_fund_id UUID)
RETURNS INT AS $$
DECLARE
  v_total_aum DECIMAL;
  v_count INT := 0;
BEGIN
  -- Get total AUM
  SELECT COALESCE(SUM(market_value_nzd), 0)
  INTO v_total_aum
  FROM holdings
  WHERE fund_id = p_fund_id;

  IF v_total_aum = 0 THEN
    RETURN 0;
  END IF;

  -- Update weights
  UPDATE holdings
  SET weight_pct = ROUND((market_value_nzd / v_total_aum) * 100, 4)
  WHERE fund_id = p_fund_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- process_trade(trade_data JSONB)
-- Processes a trade record:
--   1. Inserts into trades table
--   2. Updates (or inserts) the corresponding holding
--   3. Creates a settlement record
--   4. Returns the trade id
-- Expected trade_data keys:
--   fund_id, security_id, trade_type ('buy'|'sell'), quantity,
--   price, currency, fx_rate, commission, trade_date, settlement_date,
--   broker, external_ref, order_id (optional)
-- ============================================================

CREATE OR REPLACE FUNCTION process_trade(trade_data JSONB)
RETURNS UUID AS $$
DECLARE
  v_trade_id UUID;
  v_fund_id UUID;
  v_security_id UUID;
  v_trade_type TEXT;
  v_quantity DECIMAL;
  v_price DECIMAL;
  v_currency TEXT;
  v_fx_rate DECIMAL;
  v_commission DECIMAL;
  v_gross_amount DECIMAL;
  v_net_amount DECIMAL;
  v_settlement_date DATE;
  v_existing_holding holdings%ROWTYPE;
  v_new_quantity DECIMAL;
  v_new_avg_cost DECIMAL;
BEGIN
  -- Extract values
  v_fund_id       := (trade_data->>'fund_id')::UUID;
  v_security_id   := (trade_data->>'security_id')::UUID;
  v_trade_type    := trade_data->>'trade_type';
  v_quantity      := (trade_data->>'quantity')::DECIMAL;
  v_price         := (trade_data->>'price')::DECIMAL;
  v_currency      := COALESCE(trade_data->>'currency', 'NZD');
  v_fx_rate       := COALESCE((trade_data->>'fx_rate')::DECIMAL, 1);
  v_commission    := COALESCE((trade_data->>'commission')::DECIMAL, 0);
  v_gross_amount  := v_quantity * v_price;
  v_net_amount    := v_gross_amount + v_commission;
  v_settlement_date := COALESCE((trade_data->>'settlement_date')::DATE, CURRENT_DATE + 2);

  -- Insert trade
  INSERT INTO trades (
    order_id, fund_id, security_id, trade_type,
    quantity, price, currency, fx_rate,
    gross_amount, net_amount, commission,
    trade_date, settlement_date, status,
    broker, external_ref
  ) VALUES (
    (trade_data->>'order_id')::UUID,
    v_fund_id, v_security_id, v_trade_type,
    v_quantity, v_price, v_currency, v_fx_rate,
    v_gross_amount, v_net_amount, v_commission,
    COALESCE((trade_data->>'trade_date')::DATE, CURRENT_DATE),
    v_settlement_date,
    'pending',
    trade_data->>'broker',
    trade_data->>'external_ref'
  )
  RETURNING id INTO v_trade_id;

  -- Update or insert holding
  SELECT * INTO v_existing_holding
  FROM holdings
  WHERE fund_id = v_fund_id
    AND security_id = v_security_id
    AND as_of_date = CURRENT_DATE;

  IF v_trade_type = 'buy' THEN
    IF v_existing_holding.id IS NOT NULL THEN
      -- Weighted average cost calculation
      v_new_quantity := v_existing_holding.quantity + v_quantity;
      v_new_avg_cost := (
        (v_existing_holding.avg_cost_local * v_existing_holding.quantity) +
        (v_price * v_quantity)
      ) / v_new_quantity;

      UPDATE holdings SET
        quantity = v_new_quantity,
        avg_cost_local = ROUND(v_new_avg_cost, 6),
        avg_cost_nzd = ROUND(v_new_avg_cost / v_fx_rate, 6),
        market_value_local = ROUND(v_new_quantity * v_existing_holding.last_price, 2),
        market_value_nzd = ROUND((v_new_quantity * v_existing_holding.last_price) / v_fx_rate, 2)
      WHERE id = v_existing_holding.id;
    ELSE
      INSERT INTO holdings (
        fund_id, security_id, quantity,
        avg_cost_local, avg_cost_nzd,
        last_price,
        market_value_local, market_value_nzd,
        fx_rate, as_of_date
      ) VALUES (
        v_fund_id, v_security_id, v_quantity,
        v_price, ROUND(v_price / v_fx_rate, 6),
        v_price,
        ROUND(v_quantity * v_price, 2),
        ROUND((v_quantity * v_price) / v_fx_rate, 2),
        v_fx_rate, CURRENT_DATE
      );
    END IF;
  ELSIF v_trade_type = 'sell' THEN
    IF v_existing_holding.id IS NOT NULL THEN
      v_new_quantity := GREATEST(0, v_existing_holding.quantity - v_quantity);

      UPDATE holdings SET
        quantity = v_new_quantity,
        market_value_local = ROUND(v_new_quantity * v_existing_holding.last_price, 2),
        market_value_nzd = ROUND((v_new_quantity * v_existing_holding.last_price) / v_fx_rate, 2)
      WHERE id = v_existing_holding.id;
    END IF;
  END IF;

  -- Create settlement record
  INSERT INTO settlements (trade_id, fund_id, expected_date, amount, currency, status)
  VALUES (
    v_trade_id,
    v_fund_id,
    v_settlement_date,
    CASE WHEN v_trade_type = 'sell' THEN v_net_amount ELSE -v_net_amount END,
    v_currency,
    'pending'
  );

  -- Recalculate fund weights
  PERFORM calculate_holding_weights(v_fund_id);

  RETURN v_trade_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- log_audit(action, entity_type, entity_id, old_data, new_data)
-- Convenience function for inserting audit log entries.
-- Uses current auth.uid() for user_id and get_user_org() for org_id.
-- ============================================================

CREATE OR REPLACE FUNCTION log_audit(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (org_id, user_id, action, entity_type, entity_id, old_data, new_data)
  VALUES (
    get_user_org(),
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_data,
    p_new_data
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Usage examples:
-- SELECT calculate_fund_nav('00000000-0000-0000-0002-000000000001');
-- SELECT calculate_holding_weights('00000000-0000-0000-0002-000000000001');
-- SELECT get_user_role();
-- SELECT is_superadmin();
-- SELECT log_audit('VIEW', 'fund', '00000000-0000-0000-0002-000000000001');
-- ============================================================
