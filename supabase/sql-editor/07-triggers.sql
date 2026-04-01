-- ============================================================
-- 07-triggers.sql
-- Auto-update triggers for updated_at, audit logging, and
-- holdings weight recalculation.
-- Run AFTER 01-setup-schema.sql and 06-helper-functions.sql
-- ============================================================

-- ============================================================
-- FUNCTION: set_updated_at()
-- Generic trigger function to update the updated_at column.
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- APPLY updated_at TRIGGERS TO ALL RELEVANT TABLES
-- ============================================================

-- organizations
DROP TRIGGER IF EXISTS trg_organizations_updated_at ON organizations;
CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- user_profiles
DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- funds
DROP TRIGGER IF EXISTS trg_funds_updated_at ON funds;
CREATE TRIGGER trg_funds_updated_at
  BEFORE UPDATE ON funds
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- holdings
DROP TRIGGER IF EXISTS trg_holdings_updated_at ON holdings;
CREATE TRIGGER trg_holdings_updated_at
  BEFORE UPDATE ON holdings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- orders
DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- trades
DROP TRIGGER IF EXISTS trg_trades_updated_at ON trades;
CREATE TRIGGER trg_trades_updated_at
  BEFORE UPDATE ON trades
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- settlements
DROP TRIGGER IF EXISTS trg_settlements_updated_at ON settlements;
CREATE TRIGGER trg_settlements_updated_at
  BEFORE UPDATE ON settlements
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- import_mappings
DROP TRIGGER IF EXISTS trg_import_mappings_updated_at ON import_mappings;
CREATE TRIGGER trg_import_mappings_updated_at
  BEFORE UPDATE ON import_mappings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- model_portfolios
DROP TRIGGER IF EXISTS trg_model_portfolios_updated_at ON model_portfolios;
CREATE TRIGGER trg_model_portfolios_updated_at
  BEFORE UPDATE ON model_portfolios
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- FUNCTION: trg_audit_funds()
-- Automatically logs changes to the funds table.
-- ============================================================

CREATE OR REPLACE FUNCTION trg_audit_funds()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (org_id, action, entity_type, entity_id, new_data)
    VALUES (NEW.org_id, 'CREATE', 'fund', NEW.id, row_to_json(NEW)::JSONB);
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (org_id, action, entity_type, entity_id, old_data, new_data)
    VALUES (NEW.org_id, 'UPDATE', 'fund', NEW.id,
            row_to_json(OLD)::JSONB, row_to_json(NEW)::JSONB);
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (org_id, action, entity_type, entity_id, old_data)
    VALUES (OLD.org_id, 'DELETE', 'fund', OLD.id, row_to_json(OLD)::JSONB);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_funds ON funds;
CREATE TRIGGER trg_audit_funds
  AFTER INSERT OR UPDATE OR DELETE ON funds
  FOR EACH ROW EXECUTE FUNCTION trg_audit_funds();

-- ============================================================
-- FUNCTION: trg_audit_orders()
-- Automatically logs changes to orders.
-- ============================================================

CREATE OR REPLACE FUNCTION trg_audit_orders()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
BEGIN
  SELECT org_id INTO v_org_id FROM funds WHERE id = COALESCE(NEW.fund_id, OLD.fund_id);

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (org_id, action, entity_type, entity_id, new_data)
    VALUES (v_org_id, 'CREATE', 'order', NEW.id, row_to_json(NEW)::JSONB);
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only log status changes to reduce noise
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO audit_logs (org_id, action, entity_type, entity_id, old_data, new_data)
      VALUES (v_org_id,
              'STATUS_CHANGE',
              'order',
              NEW.id,
              jsonb_build_object('status', OLD.status),
              jsonb_build_object('status', NEW.status));
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (org_id, action, entity_type, entity_id, old_data)
    VALUES (v_org_id, 'DELETE', 'order', OLD.id, row_to_json(OLD)::JSONB);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_orders ON orders;
CREATE TRIGGER trg_audit_orders
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION trg_audit_orders();

-- ============================================================
-- FUNCTION: trg_audit_trades()
-- Automatically logs all trade inserts and status changes.
-- ============================================================

CREATE OR REPLACE FUNCTION trg_audit_trades()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
BEGIN
  SELECT org_id INTO v_org_id FROM funds WHERE id = COALESCE(NEW.fund_id, OLD.fund_id);

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (org_id, action, entity_type, entity_id, new_data)
    VALUES (v_org_id, 'CREATE', 'trade', NEW.id, row_to_json(NEW)::JSONB);
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO audit_logs (org_id, action, entity_type, entity_id, old_data, new_data)
      VALUES (v_org_id,
              'STATUS_CHANGE',
              'trade',
              NEW.id,
              jsonb_build_object('status', OLD.status),
              jsonb_build_object('status', NEW.status));
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_trades ON trades;
CREATE TRIGGER trg_audit_trades
  AFTER INSERT OR UPDATE ON trades
  FOR EACH ROW EXECUTE FUNCTION trg_audit_trades();

-- ============================================================
-- FUNCTION: trg_recalculate_weights()
-- After any holding INSERT or UPDATE, recalculate weights
-- for the entire fund.
-- ============================================================

CREATE OR REPLACE FUNCTION trg_recalculate_weights()
RETURNS TRIGGER AS $$
DECLARE
  v_fund_id UUID;
  v_total_aum DECIMAL;
BEGIN
  v_fund_id := COALESCE(NEW.fund_id, OLD.fund_id);

  SELECT COALESCE(SUM(market_value_nzd), 0)
  INTO v_total_aum
  FROM holdings
  WHERE fund_id = v_fund_id;

  IF v_total_aum > 0 THEN
    UPDATE holdings
    SET weight_pct = ROUND((market_value_nzd / v_total_aum) * 100, 4)
    WHERE fund_id = v_fund_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: This trigger fires AFTER each row — for bulk imports,
-- call calculate_holding_weights() directly instead to avoid
-- per-row recalculation overhead.
DROP TRIGGER IF EXISTS trg_holdings_recalculate_weights ON holdings;
CREATE TRIGGER trg_holdings_recalculate_weights
  AFTER INSERT OR UPDATE OF market_value_nzd ON holdings
  FOR EACH ROW
  WHEN (pg_trigger_depth() = 0)  -- prevent recursive trigger calls
  EXECUTE FUNCTION trg_recalculate_weights();
