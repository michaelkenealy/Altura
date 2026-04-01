-- ============================================================
-- 08-scheduled-jobs.sql
-- Scheduled job setup using pg_cron (if enabled) or Supabase cron.
--
-- PREREQUISITE: pg_cron must be enabled.
-- Enable it in the Supabase Dashboard:
--   Settings → Database → Extensions → pg_cron → Enable
--
-- Alternatively, use the Supabase Edge Function cron triggers via
-- the Dashboard: Edge Functions → Schedule (or via CLI).
-- ============================================================

-- ============================================================
-- CHECK: Confirm pg_cron is available
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    RAISE NOTICE 'pg_cron is NOT enabled. Enable it via Dashboard > Database > Extensions, then re-run this script.';
    RAISE NOTICE 'Alternatively, use Supabase Edge Function cron schedules for the jobs below.';
  ELSE
    RAISE NOTICE 'pg_cron is available. Scheduling jobs...';
  END IF;
END $$;

-- ============================================================
-- JOB 1: Daily portfolio snapshot (runs at 11:59 PM NZST = 10:59 UTC)
-- Snapshots current holdings into holdings_history for historical tracking.
-- ============================================================

SELECT cron.schedule(
  'daily-portfolio-snapshot',          -- job name (unique)
  '59 10 * * *',                       -- cron expression: 10:59 UTC daily
  $$SELECT snapshot_holdings_to_history();$$
)
WHERE EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron');

-- ============================================================
-- JOB 2: Daily compliance check (runs at 11:00 PM NZST = 10:00 UTC)
-- Calls the Edge Function via http extension (requires pg_net).
-- ============================================================

-- Option A: pg_net (HTTP call to edge function)
-- Requires pg_net extension to be enabled.

/*
SELECT cron.schedule(
  'daily-compliance-check',
  '0 10 * * *',   -- 10:00 UTC = 11:00 PM NZST
  $$
    SELECT net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/run-compliance-check',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := '{}'::JSONB
    );
  $$
)
WHERE EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron');
*/

-- Option B: Direct SQL compliance check (no pg_net needed)
-- Creates a simplified in-database compliance snapshot.

SELECT cron.schedule(
  'daily-compliance-snapshot',
  '0 10 * * *',
  $$
    -- Insert pass/warning/breach records for concentration rule
    INSERT INTO compliance_checks (rule_id, fund_id, status, details, checked_at)
    SELECT
      cr.id AS rule_id,
      h_agg.fund_id,
      CASE
        WHEN h_agg.max_weight > (cr.parameters->>'max_weight_pct')::DECIMAL THEN 'breach'
        WHEN h_agg.max_weight > (cr.parameters->>'max_weight_pct')::DECIMAL * 0.9 THEN 'warning'
        ELSE 'pass'
      END AS status,
      jsonb_build_object(
        'max_weight_pct', h_agg.max_weight,
        'threshold_pct', (cr.parameters->>'max_weight_pct')::DECIMAL,
        'worst_ticker', h_agg.worst_ticker
      ) AS details,
      now() AS checked_at
    FROM compliance_rules cr
    CROSS JOIN LATERAL (
      SELECT
        h.fund_id,
        MAX(h.weight_pct) AS max_weight,
        (ARRAY_AGG(s.ticker ORDER BY h.weight_pct DESC))[1] AS worst_ticker
      FROM holdings h
      JOIN securities s ON h.security_id = s.id
      JOIN funds f ON h.fund_id = f.id
      WHERE f.org_id = cr.org_id
        AND (cr.fund_id IS NULL OR h.fund_id = cr.fund_id)
        AND f.status = 'active'
      GROUP BY h.fund_id
    ) h_agg
    WHERE cr.rule_type = 'concentration'
      AND cr.is_active = true
      AND (cr.parameters->>'scope') = 'security';
  $$
)
WHERE EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron');

-- ============================================================
-- JOB 3: Materialized view refresh (every 4 hours)
-- Keeps portfolio_view up-to-date without manual refresh calls.
-- ============================================================

SELECT cron.schedule(
  'refresh-portfolio-view',
  '0 */4 * * *',    -- every 4 hours
  $$SELECT refresh_portfolio_view();$$
)
WHERE EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron');

-- ============================================================
-- VERIFY SCHEDULED JOBS
-- ============================================================

-- Run this to see all scheduled jobs:
-- SELECT jobid, jobname, schedule, command, active FROM cron.job;

-- ============================================================
-- UNSCHEDULE JOBS (if needed)
-- ============================================================

-- SELECT cron.unschedule('daily-portfolio-snapshot');
-- SELECT cron.unschedule('daily-compliance-snapshot');
-- SELECT cron.unschedule('refresh-portfolio-view');

-- ============================================================
-- ALTERNATIVE: Supabase Edge Function Schedules
-- If pg_cron is not available, use Supabase Dashboard or CLI:
--
-- 1. Dashboard: Edge Functions → [function-name] → Schedule
--    - daily-portfolio-snapshot: cron "59 10 * * *"
--    - daily-compliance-check:   cron "0 10 * * *"
--    - refresh-portfolio-view:   cron "0 */4 * * *"
--
-- 2. CLI (supabase.toml):
--    Add under [functions.<name>]:
--      schedule = "59 10 * * *"
--
-- 3. Supabase pg_cron docs:
--    https://supabase.com/docs/guides/database/extensions/pg_cron
-- ============================================================
