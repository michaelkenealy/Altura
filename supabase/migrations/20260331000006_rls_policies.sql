-- Migration 006: Row-Level Security (RLS) policies
-- Enforces org isolation, superadmin bypass, and role-based write restrictions.
--
-- Design principles:
--   1. Every tenant-scoped table filters by org_id matched via user_profiles.
--   2. Superadmins (is_superadmin = true) bypass all restrictions.
--   3. Role-based write restrictions (e.g. only Master role can INSERT funds).
--   4. audit_logs are insert-only for non-superadmins (no UPDATE/DELETE).

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: current user's profile row
-- ─────────────────────────────────────────────────────────────────────────────

-- Used inline in policies. Accessing user_profiles via auth.uid() is the
-- canonical pattern; we do NOT use a security-definer function here to keep
-- the dependency surface small and the policies readable.

-- ─────────────────────────────────────────────────────────────────────────────
-- Enable RLS on all tenant-scoped tables
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE organizations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE funds                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE securities            ENABLE ROW LEVEL SECURITY;
ALTER TABLE holdings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE holdings_history      ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders                ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades                ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements           ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_batches        ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_rows           ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_mappings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_portfolios      ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_portfolio_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_rules      ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs            ENABLE ROW LEVEL SECURITY;

-- asset_types is a global reference table — no RLS needed (public read-only).

-- ─────────────────────────────────────────────────────────────────────────────
-- Reusable sub-expressions (as inline subqueries in each policy)
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Superadmin check:
--   EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
--
-- Org match:
--   <table>.org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
--
-- Role slug check (for write restrictions):
--   EXISTS (
--     SELECT 1 FROM user_profiles up
--     JOIN roles r ON r.id = up.role_id
--     WHERE up.id = auth.uid() AND r.slug = 'master'
--   )
-- ─────────────────────────────────────────────────────────────────────────────

-- ═══════════════════════════════════════════════════════════════════════════
-- organizations
-- ═══════════════════════════════════════════════════════════════════════════

-- Users can see their own org; superadmins see all.
CREATE POLICY "org_select" ON organizations FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
);

-- Only superadmins can create/modify/delete orgs.
CREATE POLICY "org_insert" ON organizations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
);
CREATE POLICY "org_update" ON organizations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
);
CREATE POLICY "org_delete" ON organizations FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- roles
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "roles_select" ON roles FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
);
CREATE POLICY "roles_insert" ON roles FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
);
CREATE POLICY "roles_update" ON roles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
);
CREATE POLICY "roles_delete" ON roles FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- user_profiles
-- ═══════════════════════════════════════════════════════════════════════════

-- Users see their own profile and all profiles in their org.
CREATE POLICY "profiles_select" ON user_profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR id = auth.uid()
  OR org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
);
-- Users can update only their own profile; superadmins can update any.
CREATE POLICY "profiles_insert" ON user_profiles FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
);
CREATE POLICY "profiles_update" ON user_profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR id = auth.uid()
);
CREATE POLICY "profiles_delete" ON user_profiles FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- funds
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "funds_select" ON funds FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
);
-- Only Master role (or superadmin) can create funds.
CREATE POLICY "funds_insert" ON funds FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR (
    org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid() AND r.slug = 'master'
    )
  )
);
CREATE POLICY "funds_update" ON funds FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR (
    org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid() AND r.slug IN ('master', 'portfolio_manager')
    )
  )
);
CREATE POLICY "funds_delete" ON funds FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR (
    org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid() AND r.slug = 'master'
    )
  )
);

-- ═══════════════════════════════════════════════════════════════════════════
-- securities (global reference but org-scoped visibility not required;
--             allow any authenticated user to read; writes restricted)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "securities_select" ON securities FOR SELECT USING (
  auth.uid() IS NOT NULL
);
CREATE POLICY "securities_insert" ON securities FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON r.id = up.role_id
    WHERE up.id = auth.uid() AND r.slug IN ('master', 'portfolio_manager', 'operations')
  )
);
CREATE POLICY "securities_update" ON securities FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON r.id = up.role_id
    WHERE up.id = auth.uid() AND r.slug IN ('master', 'portfolio_manager', 'operations')
  )
);
CREATE POLICY "securities_delete" ON securities FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- holdings
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "holdings_select" ON holdings FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR fund_id IN (
    SELECT id FROM funds WHERE org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
  )
);
CREATE POLICY "holdings_insert" ON holdings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR fund_id IN (
    SELECT id FROM funds WHERE org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
  )
);
CREATE POLICY "holdings_update" ON holdings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR fund_id IN (
    SELECT id FROM funds WHERE org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
  )
);
CREATE POLICY "holdings_delete" ON holdings FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR fund_id IN (
    SELECT id FROM funds WHERE org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
  )
);

-- ═══════════════════════════════════════════════════════════════════════════
-- holdings_history
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "holdings_history_select" ON holdings_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR fund_id IN (
    SELECT id FROM funds WHERE org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
  )
);
CREATE POLICY "holdings_history_insert" ON holdings_history FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR fund_id IN (
    SELECT id FROM funds WHERE org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
  )
);
-- History rows are not updated or deleted (append-only pattern).

-- ═══════════════════════════════════════════════════════════════════════════
-- orders
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "orders_select" ON orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
);
CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR (
    org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid() AND r.slug IN ('master', 'portfolio_manager')
    )
  )
);
CREATE POLICY "orders_update" ON orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR (
    org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid() AND r.slug IN ('master', 'portfolio_manager', 'operations')
    )
  )
);
CREATE POLICY "orders_delete" ON orders FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR (
    org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid() AND r.slug = 'master'
    )
  )
);

-- ═══════════════════════════════════════════════════════════════════════════
-- trades
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "trades_select" ON trades FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
);
CREATE POLICY "trades_insert" ON trades FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR (
    org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid() AND r.slug IN ('master', 'portfolio_manager', 'operations')
    )
  )
);
CREATE POLICY "trades_update" ON trades FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR (
    org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid() AND r.slug IN ('master', 'portfolio_manager', 'operations')
    )
  )
);
CREATE POLICY "trades_delete" ON trades FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- settlements
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "settlements_select" ON settlements FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
);
CREATE POLICY "settlements_insert" ON settlements FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR (
    org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid() AND r.slug IN ('master', 'operations')
    )
  )
);
CREATE POLICY "settlements_update" ON settlements FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR (
    org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid() AND r.slug IN ('master', 'operations')
    )
  )
);
CREATE POLICY "settlements_delete" ON settlements FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- cash_movements
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "cash_movements_select" ON cash_movements FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
);
CREATE POLICY "cash_movements_insert" ON cash_movements FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR (
    org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid() AND r.slug IN ('master', 'portfolio_manager', 'operations')
    )
  )
);
CREATE POLICY "cash_movements_update" ON cash_movements FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR (
    org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid() AND r.slug IN ('master', 'operations')
    )
  )
);
CREATE POLICY "cash_movements_delete" ON cash_movements FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- import_batches
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "import_batches_select" ON import_batches FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
);
CREATE POLICY "import_batches_insert" ON import_batches FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
);
CREATE POLICY "import_batches_update" ON import_batches FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
);
CREATE POLICY "import_batches_delete" ON import_batches FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
);

-- ═══════════════════════════════════════════════════════════════════════════
-- import_rows
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "import_rows_select" ON import_rows FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
);
CREATE POLICY "import_rows_insert" ON import_rows FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
);
CREATE POLICY "import_rows_update" ON import_rows FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
);
CREATE POLICY "import_rows_delete" ON import_rows FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
);

-- ═══════════════════════════════════════════════════════════════════════════
-- import_mappings
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "import_mappings_select" ON import_mappings FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
);
CREATE POLICY "import_mappings_insert" ON import_mappings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
);
CREATE POLICY "import_mappings_update" ON import_mappings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
);
CREATE POLICY "import_mappings_delete" ON import_mappings FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
);

-- ═══════════════════════════════════════════════════════════════════════════
-- model_portfolios
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "model_portfolios_select" ON model_portfolios FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
);
CREATE POLICY "model_portfolios_insert" ON model_portfolios FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR (
    org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid() AND r.slug IN ('master', 'portfolio_manager')
    )
  )
);
CREATE POLICY "model_portfolios_update" ON model_portfolios FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR (
    org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid() AND r.slug IN ('master', 'portfolio_manager')
    )
  )
);
CREATE POLICY "model_portfolios_delete" ON model_portfolios FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR (
    org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid() AND r.slug = 'master'
    )
  )
);

-- ═══════════════════════════════════════════════════════════════════════════
-- model_portfolio_targets
-- ═══════════════════════════════════════════════════════════════════════════

-- Access is inherited through model_portfolio_id → model_portfolios.org_id
CREATE POLICY "model_portfolio_targets_select" ON model_portfolio_targets FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR model_portfolio_id IN (
    SELECT id FROM model_portfolios
    WHERE org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
  )
);
CREATE POLICY "model_portfolio_targets_insert" ON model_portfolio_targets FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR (
    model_portfolio_id IN (
      SELECT id FROM model_portfolios
      WHERE org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid() AND r.slug IN ('master', 'portfolio_manager')
    )
  )
);
CREATE POLICY "model_portfolio_targets_update" ON model_portfolio_targets FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR (
    model_portfolio_id IN (
      SELECT id FROM model_portfolios
      WHERE org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid() AND r.slug IN ('master', 'portfolio_manager')
    )
  )
);
CREATE POLICY "model_portfolio_targets_delete" ON model_portfolio_targets FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR (
    model_portfolio_id IN (
      SELECT id FROM model_portfolios
      WHERE org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid() AND r.slug = 'master'
    )
  )
);

-- ═══════════════════════════════════════════════════════════════════════════
-- compliance_rules
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "compliance_rules_select" ON compliance_rules FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
);
CREATE POLICY "compliance_rules_insert" ON compliance_rules FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR (
    org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid() AND r.slug IN ('master', 'compliance')
    )
  )
);
CREATE POLICY "compliance_rules_update" ON compliance_rules FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR (
    org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid() AND r.slug IN ('master', 'compliance')
    )
  )
);
CREATE POLICY "compliance_rules_delete" ON compliance_rules FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR (
    org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid() AND r.slug = 'master'
    )
  )
);

-- ═══════════════════════════════════════════════════════════════════════════
-- compliance_checks
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "compliance_checks_select" ON compliance_checks FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
);
-- Checks are inserted by the system/service role during evaluation runs.
-- All authenticated org members can read; only compliance/master/superadmin can resolve.
CREATE POLICY "compliance_checks_insert" ON compliance_checks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
);
CREATE POLICY "compliance_checks_update" ON compliance_checks FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR (
    org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid() AND r.slug IN ('master', 'compliance')
    )
  )
);
-- No DELETE for compliance_checks — append-only for audit purposes.

-- ═══════════════════════════════════════════════════════════════════════════
-- audit_logs — INSERT only for non-superadmins; no UPDATE or DELETE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
);
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT WITH CHECK (
  -- Any authenticated user in the org can write audit events (typically via trigger/service)
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_superadmin)
  OR org_id = (SELECT org_id FROM user_profiles WHERE id = auth.uid())
);
-- UPDATE and DELETE on audit_logs are intentionally omitted — no policy = deny for all non-superadmins.
-- Superadmins bypass RLS entirely so they can perform emergency corrections if needed.
