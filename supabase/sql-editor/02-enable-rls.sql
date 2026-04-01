-- ============================================================
-- 02-enable-rls.sql
-- Enable Row-Level Security and create all policies.
-- Run AFTER 01-setup-schema.sql
-- ============================================================

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION auth_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM user_profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(is_superadmin, false) FROM user_profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_role_slug()
RETURNS TEXT AS $$
  SELECT r.slug
  FROM user_profiles up
  JOIN roles r ON up.role_id = r.id
  WHERE up.id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_has_role(role_slugs TEXT[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = auth.uid()
      AND r.slug = ANY(role_slugs)
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE organizations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE funds                ENABLE ROW LEVEL SECURITY;
ALTER TABLE securities           ENABLE ROW LEVEL SECURITY;
ALTER TABLE holdings             ENABLE ROW LEVEL SECURITY;
ALTER TABLE holdings_history     ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades               ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements          ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_batches       ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_rows          ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_mappings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_portfolios     ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_portfolio_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_rules     ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs           ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ORGANIZATIONS
-- ============================================================

DROP POLICY IF EXISTS "organizations: members can read own org" ON organizations;
CREATE POLICY "organizations: members can read own org"
  ON organizations FOR SELECT
  USING (auth_is_superadmin() OR id = auth_org_id());

DROP POLICY IF EXISTS "organizations: only superadmin can insert" ON organizations;
CREATE POLICY "organizations: only superadmin can insert"
  ON organizations FOR INSERT
  WITH CHECK (auth_is_superadmin());

DROP POLICY IF EXISTS "organizations: only superadmin can update" ON organizations;
CREATE POLICY "organizations: only superadmin can update"
  ON organizations FOR UPDATE
  USING (auth_is_superadmin());

-- ============================================================
-- ROLES
-- ============================================================

DROP POLICY IF EXISTS "roles: members can read their org roles" ON roles;
CREATE POLICY "roles: members can read their org roles"
  ON roles FOR SELECT
  USING (auth_is_superadmin() OR org_id = auth_org_id());

DROP POLICY IF EXISTS "roles: only master can manage roles" ON roles;
CREATE POLICY "roles: only master can manage roles"
  ON roles FOR INSERT
  WITH CHECK (auth_is_superadmin() OR auth_has_role(ARRAY['master']));

DROP POLICY IF EXISTS "roles: only master can update roles" ON roles;
CREATE POLICY "roles: only master can update roles"
  ON roles FOR UPDATE
  USING (auth_is_superadmin() OR auth_has_role(ARRAY['master']));

-- ============================================================
-- USER PROFILES
-- ============================================================

DROP POLICY IF EXISTS "user_profiles: users can read own org members" ON user_profiles;
CREATE POLICY "user_profiles: users can read own org members"
  ON user_profiles FOR SELECT
  USING (auth_is_superadmin() OR org_id = auth_org_id());

DROP POLICY IF EXISTS "user_profiles: only master can insert members" ON user_profiles;
CREATE POLICY "user_profiles: only master can insert members"
  ON user_profiles FOR INSERT
  WITH CHECK (auth_is_superadmin() OR auth_has_role(ARRAY['master']));

DROP POLICY IF EXISTS "user_profiles: master can update members, users can update self" ON user_profiles;
CREATE POLICY "user_profiles: master can update members, users can update self"
  ON user_profiles FOR UPDATE
  USING (
    auth_is_superadmin()
    OR auth_has_role(ARRAY['master'])
    OR id = auth.uid()
  );

-- ============================================================
-- FUNDS
-- ============================================================

DROP POLICY IF EXISTS "funds: org members can read" ON funds;
CREATE POLICY "funds: org members can read"
  ON funds FOR SELECT
  USING (auth_is_superadmin() OR org_id = auth_org_id());

DROP POLICY IF EXISTS "funds: only master can create" ON funds;
CREATE POLICY "funds: only master can create"
  ON funds FOR INSERT
  WITH CHECK (auth_is_superadmin() OR auth_has_role(ARRAY['master']));

DROP POLICY IF EXISTS "funds: master and portfolio manager can update" ON funds;
CREATE POLICY "funds: master and portfolio manager can update"
  ON funds FOR UPDATE
  USING (auth_is_superadmin() OR auth_has_role(ARRAY['master', 'portfolio-manager']));

-- ============================================================
-- SECURITIES (shared across all authenticated users)
-- ============================================================

DROP POLICY IF EXISTS "securities: all authenticated users can read" ON securities;
CREATE POLICY "securities: all authenticated users can read"
  ON securities FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "securities: only master and analyst can insert" ON securities;
CREATE POLICY "securities: only master and analyst can insert"
  ON securities FOR INSERT
  WITH CHECK (auth_is_superadmin() OR auth_has_role(ARRAY['master', 'analyst', 'portfolio-manager']));

DROP POLICY IF EXISTS "securities: master and analyst can update" ON securities;
CREATE POLICY "securities: master and analyst can update"
  ON securities FOR UPDATE
  USING (auth_is_superadmin() OR auth_has_role(ARRAY['master', 'analyst', 'portfolio-manager']));

-- ============================================================
-- HOLDINGS
-- ============================================================

DROP POLICY IF EXISTS "holdings: org members can read via fund" ON holdings;
CREATE POLICY "holdings: org members can read via fund"
  ON holdings FOR SELECT
  USING (
    auth_is_superadmin()
    OR fund_id IN (SELECT id FROM funds WHERE org_id = auth_org_id())
  );

DROP POLICY IF EXISTS "holdings: operations and above can insert" ON holdings;
CREATE POLICY "holdings: operations and above can insert"
  ON holdings FOR INSERT
  WITH CHECK (
    auth_is_superadmin()
    OR (
      fund_id IN (SELECT id FROM funds WHERE org_id = auth_org_id())
      AND auth_has_role(ARRAY['master', 'portfolio-manager', 'operations'])
    )
  );

DROP POLICY IF EXISTS "holdings: operations and above can update" ON holdings;
CREATE POLICY "holdings: operations and above can update"
  ON holdings FOR UPDATE
  USING (
    auth_is_superadmin()
    OR (
      fund_id IN (SELECT id FROM funds WHERE org_id = auth_org_id())
      AND auth_has_role(ARRAY['master', 'portfolio-manager', 'operations'])
    )
  );

-- ============================================================
-- HOLDINGS HISTORY
-- ============================================================

DROP POLICY IF EXISTS "holdings_history: org members can read" ON holdings_history;
CREATE POLICY "holdings_history: org members can read"
  ON holdings_history FOR SELECT
  USING (
    auth_is_superadmin()
    OR fund_id IN (SELECT id FROM funds WHERE org_id = auth_org_id())
  );

DROP POLICY IF EXISTS "holdings_history: operations and above can insert" ON holdings_history;
CREATE POLICY "holdings_history: operations and above can insert"
  ON holdings_history FOR INSERT
  WITH CHECK (
    auth_is_superadmin()
    OR (
      fund_id IN (SELECT id FROM funds WHERE org_id = auth_org_id())
      AND auth_has_role(ARRAY['master', 'portfolio-manager', 'operations'])
    )
  );

-- ============================================================
-- ORDERS
-- ============================================================

DROP POLICY IF EXISTS "orders: org members can read" ON orders;
CREATE POLICY "orders: org members can read"
  ON orders FOR SELECT
  USING (
    auth_is_superadmin()
    OR fund_id IN (SELECT id FROM funds WHERE org_id = auth_org_id())
  );

DROP POLICY IF EXISTS "orders: portfolio manager and above can create" ON orders;
CREATE POLICY "orders: portfolio manager and above can create"
  ON orders FOR INSERT
  WITH CHECK (
    auth_is_superadmin()
    OR (
      fund_id IN (SELECT id FROM funds WHERE org_id = auth_org_id())
      AND auth_has_role(ARRAY['master', 'portfolio-manager'])
    )
  );

DROP POLICY IF EXISTS "orders: portfolio manager and above can update" ON orders;
CREATE POLICY "orders: portfolio manager and above can update"
  ON orders FOR UPDATE
  USING (
    auth_is_superadmin()
    OR (
      fund_id IN (SELECT id FROM funds WHERE org_id = auth_org_id())
      AND auth_has_role(ARRAY['master', 'portfolio-manager'])
    )
  );

-- ============================================================
-- TRADES
-- ============================================================

DROP POLICY IF EXISTS "trades: org members can read" ON trades;
CREATE POLICY "trades: org members can read"
  ON trades FOR SELECT
  USING (
    auth_is_superadmin()
    OR fund_id IN (SELECT id FROM funds WHERE org_id = auth_org_id())
  );

DROP POLICY IF EXISTS "trades: operations and above can insert" ON trades;
CREATE POLICY "trades: operations and above can insert"
  ON trades FOR INSERT
  WITH CHECK (
    auth_is_superadmin()
    OR (
      fund_id IN (SELECT id FROM funds WHERE org_id = auth_org_id())
      AND auth_has_role(ARRAY['master', 'portfolio-manager', 'operations'])
    )
  );

DROP POLICY IF EXISTS "trades: operations and above can update" ON trades;
CREATE POLICY "trades: operations and above can update"
  ON trades FOR UPDATE
  USING (
    auth_is_superadmin()
    OR (
      fund_id IN (SELECT id FROM funds WHERE org_id = auth_org_id())
      AND auth_has_role(ARRAY['master', 'portfolio-manager', 'operations'])
    )
  );

-- ============================================================
-- SETTLEMENTS
-- ============================================================

DROP POLICY IF EXISTS "settlements: org members can read" ON settlements;
CREATE POLICY "settlements: org members can read"
  ON settlements FOR SELECT
  USING (
    auth_is_superadmin()
    OR fund_id IN (SELECT id FROM funds WHERE org_id = auth_org_id())
  );

DROP POLICY IF EXISTS "settlements: operations and above can insert/update" ON settlements;
CREATE POLICY "settlements: operations and above can insert/update"
  ON settlements FOR INSERT
  WITH CHECK (
    auth_is_superadmin()
    OR (
      fund_id IN (SELECT id FROM funds WHERE org_id = auth_org_id())
      AND auth_has_role(ARRAY['master', 'portfolio-manager', 'operations'])
    )
  );

DROP POLICY IF EXISTS "settlements: operations and above can update" ON settlements;
CREATE POLICY "settlements: operations and above can update"
  ON settlements FOR UPDATE
  USING (
    auth_is_superadmin()
    OR (
      fund_id IN (SELECT id FROM funds WHERE org_id = auth_org_id())
      AND auth_has_role(ARRAY['master', 'portfolio-manager', 'operations'])
    )
  );

-- ============================================================
-- CASH MOVEMENTS
-- ============================================================

DROP POLICY IF EXISTS "cash_movements: org members can read" ON cash_movements;
CREATE POLICY "cash_movements: org members can read"
  ON cash_movements FOR SELECT
  USING (
    auth_is_superadmin()
    OR fund_id IN (SELECT id FROM funds WHERE org_id = auth_org_id())
  );

DROP POLICY IF EXISTS "cash_movements: operations and above can insert" ON cash_movements;
CREATE POLICY "cash_movements: operations and above can insert"
  ON cash_movements FOR INSERT
  WITH CHECK (
    auth_is_superadmin()
    OR (
      fund_id IN (SELECT id FROM funds WHERE org_id = auth_org_id())
      AND auth_has_role(ARRAY['master', 'portfolio-manager', 'operations'])
    )
  );

-- ============================================================
-- IMPORT BATCHES
-- ============================================================

DROP POLICY IF EXISTS "import_batches: org members can read" ON import_batches;
CREATE POLICY "import_batches: org members can read"
  ON import_batches FOR SELECT
  USING (auth_is_superadmin() OR org_id = auth_org_id());

DROP POLICY IF EXISTS "import_batches: operations and above can insert" ON import_batches;
CREATE POLICY "import_batches: operations and above can insert"
  ON import_batches FOR INSERT
  WITH CHECK (
    auth_is_superadmin()
    OR (org_id = auth_org_id() AND auth_has_role(ARRAY['master', 'portfolio-manager', 'operations']))
  );

DROP POLICY IF EXISTS "import_batches: operations and above can update" ON import_batches;
CREATE POLICY "import_batches: operations and above can update"
  ON import_batches FOR UPDATE
  USING (
    auth_is_superadmin()
    OR (org_id = auth_org_id() AND auth_has_role(ARRAY['master', 'portfolio-manager', 'operations']))
  );

-- ============================================================
-- IMPORT ROWS
-- ============================================================

DROP POLICY IF EXISTS "import_rows: org members can read via batch" ON import_rows;
CREATE POLICY "import_rows: org members can read via batch"
  ON import_rows FOR SELECT
  USING (
    auth_is_superadmin()
    OR batch_id IN (SELECT id FROM import_batches WHERE org_id = auth_org_id())
  );

DROP POLICY IF EXISTS "import_rows: operations and above can insert" ON import_rows;
CREATE POLICY "import_rows: operations and above can insert"
  ON import_rows FOR INSERT
  WITH CHECK (
    auth_is_superadmin()
    OR (
      batch_id IN (SELECT id FROM import_batches WHERE org_id = auth_org_id())
      AND auth_has_role(ARRAY['master', 'portfolio-manager', 'operations'])
    )
  );

-- ============================================================
-- IMPORT MAPPINGS
-- ============================================================

DROP POLICY IF EXISTS "import_mappings: org members can read" ON import_mappings;
CREATE POLICY "import_mappings: org members can read"
  ON import_mappings FOR SELECT
  USING (auth_is_superadmin() OR org_id = auth_org_id());

DROP POLICY IF EXISTS "import_mappings: operations and above can manage" ON import_mappings;
CREATE POLICY "import_mappings: operations and above can manage"
  ON import_mappings FOR INSERT
  WITH CHECK (
    auth_is_superadmin()
    OR (org_id = auth_org_id() AND auth_has_role(ARRAY['master', 'portfolio-manager', 'operations']))
  );

DROP POLICY IF EXISTS "import_mappings: operations and above can update" ON import_mappings;
CREATE POLICY "import_mappings: operations and above can update"
  ON import_mappings FOR UPDATE
  USING (
    auth_is_superadmin()
    OR (org_id = auth_org_id() AND auth_has_role(ARRAY['master', 'portfolio-manager', 'operations']))
  );

-- ============================================================
-- MODEL PORTFOLIOS
-- ============================================================

DROP POLICY IF EXISTS "model_portfolios: org members can read" ON model_portfolios;
CREATE POLICY "model_portfolios: org members can read"
  ON model_portfolios FOR SELECT
  USING (
    auth_is_superadmin()
    OR fund_id IN (SELECT id FROM funds WHERE org_id = auth_org_id())
  );

DROP POLICY IF EXISTS "model_portfolios: portfolio manager and above can manage" ON model_portfolios;
CREATE POLICY "model_portfolios: portfolio manager and above can manage"
  ON model_portfolios FOR INSERT
  WITH CHECK (
    auth_is_superadmin()
    OR (
      fund_id IN (SELECT id FROM funds WHERE org_id = auth_org_id())
      AND auth_has_role(ARRAY['master', 'portfolio-manager'])
    )
  );

DROP POLICY IF EXISTS "model_portfolios: portfolio manager and above can update" ON model_portfolios;
CREATE POLICY "model_portfolios: portfolio manager and above can update"
  ON model_portfolios FOR UPDATE
  USING (
    auth_is_superadmin()
    OR (
      fund_id IN (SELECT id FROM funds WHERE org_id = auth_org_id())
      AND auth_has_role(ARRAY['master', 'portfolio-manager'])
    )
  );

-- ============================================================
-- MODEL PORTFOLIO TARGETS
-- ============================================================

DROP POLICY IF EXISTS "model_portfolio_targets: org members can read" ON model_portfolio_targets;
CREATE POLICY "model_portfolio_targets: org members can read"
  ON model_portfolio_targets FOR SELECT
  USING (
    auth_is_superadmin()
    OR model_id IN (
      SELECT mp.id FROM model_portfolios mp
      JOIN funds f ON mp.fund_id = f.id
      WHERE f.org_id = auth_org_id()
    )
  );

DROP POLICY IF EXISTS "model_portfolio_targets: portfolio manager and above can manage" ON model_portfolio_targets;
CREATE POLICY "model_portfolio_targets: portfolio manager and above can manage"
  ON model_portfolio_targets FOR INSERT
  WITH CHECK (
    auth_is_superadmin()
    OR (
      model_id IN (
        SELECT mp.id FROM model_portfolios mp
        JOIN funds f ON mp.fund_id = f.id
        WHERE f.org_id = auth_org_id()
      )
      AND auth_has_role(ARRAY['master', 'portfolio-manager'])
    )
  );

-- ============================================================
-- COMPLIANCE RULES
-- ============================================================

DROP POLICY IF EXISTS "compliance_rules: org members can read" ON compliance_rules;
CREATE POLICY "compliance_rules: org members can read"
  ON compliance_rules FOR SELECT
  USING (auth_is_superadmin() OR org_id = auth_org_id());

DROP POLICY IF EXISTS "compliance_rules: master and compliance can manage" ON compliance_rules;
CREATE POLICY "compliance_rules: master and compliance can manage"
  ON compliance_rules FOR INSERT
  WITH CHECK (
    auth_is_superadmin()
    OR (org_id = auth_org_id() AND auth_has_role(ARRAY['master', 'compliance']))
  );

DROP POLICY IF EXISTS "compliance_rules: master and compliance can update" ON compliance_rules;
CREATE POLICY "compliance_rules: master and compliance can update"
  ON compliance_rules FOR UPDATE
  USING (
    auth_is_superadmin()
    OR (org_id = auth_org_id() AND auth_has_role(ARRAY['master', 'compliance']))
  );

-- ============================================================
-- COMPLIANCE CHECKS
-- ============================================================

DROP POLICY IF EXISTS "compliance_checks: org members can read" ON compliance_checks;
CREATE POLICY "compliance_checks: org members can read"
  ON compliance_checks FOR SELECT
  USING (
    auth_is_superadmin()
    OR fund_id IN (SELECT id FROM funds WHERE org_id = auth_org_id())
    OR rule_id IN (SELECT id FROM compliance_rules WHERE org_id = auth_org_id())
  );

-- Compliance checks written by edge function using service role (bypasses RLS)
DROP POLICY IF EXISTS "compliance_checks: only superadmin/service can insert" ON compliance_checks;
CREATE POLICY "compliance_checks: only superadmin/service can insert"
  ON compliance_checks FOR INSERT
  WITH CHECK (auth_is_superadmin());

-- ============================================================
-- AUDIT LOGS (append-only)
-- ============================================================

DROP POLICY IF EXISTS "audit_logs: org members can read own org logs" ON audit_logs;
CREATE POLICY "audit_logs: org members can read own org logs"
  ON audit_logs FOR SELECT
  USING (auth_is_superadmin() OR org_id = auth_org_id());

DROP POLICY IF EXISTS "audit_logs: any authenticated org member can insert" ON audit_logs;
CREATE POLICY "audit_logs: any authenticated org member can insert"
  ON audit_logs FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND org_id = auth_org_id()
  );
-- No UPDATE or DELETE policies on audit_logs — it is append-only
