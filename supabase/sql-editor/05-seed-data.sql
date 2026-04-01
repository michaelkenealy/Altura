-- ============================================================
-- 05-seed-data.sql
-- Default org, roles, sample funds, securities, and superadmin user.
-- Safe to run on a fresh database after 01-setup-schema.sql.
-- NOTE: Development/demo seed only. Do not run in production.
-- ============================================================

-- ============================================================
-- DEFAULT ORGANIZATION: Altura Capital
-- ============================================================

INSERT INTO organizations (id, name, slug, settings) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Altura Capital',
    'altura-capital',
    '{"timezone": "Pacific/Auckland", "currency": "NZD", "fiscal_year_start": "04-01"}'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SYSTEM ROLES
-- ============================================================

INSERT INTO roles (id, org_id, name, slug, is_system, permissions) VALUES
  (
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Master',
    'master',
    true,
    '{"all": true}'
  ),
  (
    '00000000-0000-0000-0001-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Compliance',
    'compliance',
    true,
    '{"funds": {"read": true}, "compliance": {"read": true, "write": true}, "audit_logs": {"read": true}}'
  ),
  (
    '00000000-0000-0000-0001-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Portfolio Manager',
    'portfolio-manager',
    true,
    '{"funds": {"read": true, "write": true}, "holdings": {"read": true, "write": true}, "orders": {"read": true, "write": true}, "trades": {"read": true}}'
  ),
  (
    '00000000-0000-0000-0001-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'Analyst',
    'analyst',
    true,
    '{"funds": {"read": true}, "holdings": {"read": true}, "trades": {"read": true}}'
  ),
  (
    '00000000-0000-0000-0001-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'Operations',
    'operations',
    true,
    '{"funds": {"read": true}, "holdings": {"read": true, "write": true}, "trades": {"read": true, "write": true}, "settlements": {"read": true, "write": true}, "cash_movements": {"read": true, "write": true}}'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SUPERADMIN USER PROFILE
-- NOTE: The auth.users record must exist first (sign up via Supabase Auth).
-- After mkenealy@gmail.com signs up, run this to grant superadmin.
-- ============================================================

-- Step 1: Find the auth user ID for mkenealy@gmail.com
-- SELECT id FROM auth.users WHERE email = 'mkenealy@gmail.com';

-- Step 2: Replace <AUTH_USER_ID> with the UUID from step 1 and run:
-- INSERT INTO user_profiles (id, org_id, role_id, full_name, email, is_superadmin, is_active)
-- VALUES (
--   '<AUTH_USER_ID>',
--   '00000000-0000-0000-0000-000000000001',
--   '00000000-0000-0000-0001-000000000001',  -- Master role
--   'Michael Kenealy',
--   'mkenealy@gmail.com',
--   true,   -- superadmin
--   true
-- )
-- ON CONFLICT (id) DO UPDATE SET
--   is_superadmin = true,
--   role_id = '00000000-0000-0000-0001-000000000001',
--   org_id = '00000000-0000-0000-0000-000000000001';

-- Shorthand: once you know the auth user ID, just run this:
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'mkenealy@gmail.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO user_profiles (id, org_id, role_id, full_name, email, is_superadmin, is_active)
    VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0001-000000000001',
      'Michael Kenealy',
      'mkenealy@gmail.com',
      true,
      true
    )
    ON CONFLICT (id) DO UPDATE SET
      is_superadmin = true,
      role_id = '00000000-0000-0000-0001-000000000001',
      org_id = '00000000-0000-0000-0000-000000000001',
      is_active = true;
    RAISE NOTICE 'Superadmin profile created/updated for mkenealy@gmail.com (id: %)', v_user_id;
  ELSE
    RAISE NOTICE 'User mkenealy@gmail.com not found in auth.users — sign up first, then re-run this script.';
  END IF;
END $$;

-- ============================================================
-- SAMPLE FUNDS
-- ============================================================

INSERT INTO funds (id, org_id, name, code, description, currency, inception_date, status) VALUES
  (
    '00000000-0000-0000-0002-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Altura Growth Fund',
    'AGF',
    'High-growth equity fund focused on NZ and Australian listed equities',
    'NZD',
    '2020-01-15',
    'active'
  ),
  (
    '00000000-0000-0000-0002-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Altura Income Fund',
    'AIF',
    'Conservative fixed income fund targeting steady yield',
    'NZD',
    '2019-07-01',
    'active'
  ),
  (
    '00000000-0000-0000-0002-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Altura Balanced Fund',
    'ABF',
    'Balanced fund with diversified exposure across asset classes',
    'NZD',
    '2021-03-01',
    'active'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SAMPLE SECURITIES
-- ============================================================

-- NZ Equities
INSERT INTO securities (id, ticker, name, asset_type_id, exchange, currency, isin) VALUES
  ('00000000-0000-0000-0003-000000000001', 'FPH',  'Fisher & Paykel Healthcare Corporation Limited', (SELECT id FROM asset_types WHERE slug = 'stocks'), 'NZX', 'NZD', 'NZFPHE0001S2'),
  ('00000000-0000-0000-0003-000000000002', 'ATM',  'The a2 Milk Company Limited',                   (SELECT id FROM asset_types WHERE slug = 'stocks'), 'NZX', 'NZD', 'NZATME0002S6'),
  ('00000000-0000-0000-0003-000000000003', 'MEL',  'Meridian Energy Limited',                       (SELECT id FROM asset_types WHERE slug = 'stocks'), 'NZX', 'NZD', 'NZMELE0002S7'),
  ('00000000-0000-0000-0003-000000000004', 'SPK',  'Spark New Zealand Limited',                     (SELECT id FROM asset_types WHERE slug = 'stocks'), 'NZX', 'NZD', 'NZSPKE0001S6')
ON CONFLICT (id) DO NOTHING;

-- Australian Equities
INSERT INTO securities (id, ticker, name, asset_type_id, exchange, currency, isin) VALUES
  ('00000000-0000-0000-0003-000000000005', 'CSL', 'CSL Limited',                        (SELECT id FROM asset_types WHERE slug = 'stocks'), 'ASX', 'AUD', 'AU000000CSL8'),
  ('00000000-0000-0000-0003-000000000006', 'CBA', 'Commonwealth Bank of Australia',     (SELECT id FROM asset_types WHERE slug = 'stocks'), 'ASX', 'AUD', 'AU000000CBA7')
ON CONFLICT (id) DO NOTHING;

-- Fixed Income
INSERT INTO securities (id, ticker, name, asset_type_id, exchange, currency) VALUES
  ('00000000-0000-0000-0003-000000000007', 'NZGB2028', 'NZ Government Bond 2028', (SELECT id FROM asset_types WHERE slug = 'fixed-income'), 'NZDM', 'NZD'),
  ('00000000-0000-0000-0003-000000000008', 'NZGB2033', 'NZ Government Bond 2033', (SELECT id FROM asset_types WHERE slug = 'fixed-income'), 'NZDM', 'NZD')
ON CONFLICT (id) DO NOTHING;

-- Cash / Money Market
INSERT INTO securities (id, ticker, name, asset_type_id, exchange, currency) VALUES
  ('00000000-0000-0000-0003-000000000009', 'NZD-CASH', 'NZD Cash', (SELECT id FROM asset_types WHERE slug = 'cash'), NULL, 'NZD'),
  ('00000000-0000-0000-0003-000000000010', 'AUD-CASH', 'AUD Cash', (SELECT id FROM asset_types WHERE slug = 'cash'), NULL, 'AUD')
ON CONFLICT (id) DO NOTHING;

-- Hedges / Derivatives
INSERT INTO securities (id, ticker, name, asset_type_id, exchange, currency) VALUES
  ('00000000-0000-0000-0003-000000000011', 'AUDFX-FWD', 'AUD/NZD FX Forward', (SELECT id FROM asset_types WHERE slug = 'hedges'), 'OTC', 'NZD')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SAMPLE HOLDINGS (Altura Growth Fund, as of 2026-03-31)
-- Total AUM ≈ NZD 7,585,000
-- ============================================================

INSERT INTO holdings (
  fund_id, security_id, quantity, avg_cost_local, avg_cost_nzd,
  last_price, market_value_local, market_value_nzd, weight_pct, fx_rate, as_of_date
) VALUES
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0003-000000000001',
    50000, 26.50, 26.50, 28.10, 1405000.00, 1405000.00, 18.50, 1.0, '2026-03-31'),
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0003-000000000002',
    120000, 5.80, 5.80, 6.20, 744000.00, 744000.00, 9.80, 1.0, '2026-03-31'),
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0003-000000000003',
    200000, 5.10, 5.10, 5.45, 1090000.00, 1090000.00, 14.35, 1.0, '2026-03-31'),
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0003-000000000005',
    8000, 285.00, 313.19, 295.50, 2364000.00, 2597802.20, 34.22, 0.91, '2026-03-31'),
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0003-000000000009',
    1748197.80, 1.0, 1.0, 1.0, 1748197.80, 1748197.80, 23.03, 1.0, '2026-03-31')
ON CONFLICT (fund_id, security_id, as_of_date) DO NOTHING;

-- ============================================================
-- SAMPLE COMPLIANCE RULES
-- ============================================================

INSERT INTO compliance_rules (org_id, fund_id, name, rule_type, parameters, severity) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    NULL,
    'Single Security Concentration Limit',
    'concentration',
    '{"max_weight_pct": 35, "scope": "security"}',
    'breach'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    NULL,
    'Asset Class Equity Limit',
    'asset_class',
    '{"asset_type_slug": "stocks", "max_weight_pct": 75}',
    'warning'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    NULL,
    'Minimum Cash Holding',
    'asset_class',
    '{"asset_type_slug": "cash", "min_weight_pct": 5}',
    'warning'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0002-000000000001',
    'AGF: Foreign Equity Limit',
    'concentration',
    '{"max_weight_pct": 40, "scope": "foreign_equity"}',
    'breach'
  );
