# Altura — Setup Guide

Complete guide to getting the Altura fund portfolio management platform running locally, in Supabase, and deployed on Vercel.

---

## 1. Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 18.18+ (LTS recommended: 20.x) | Check with `node -v` |
| npm | 9+ | Comes with Node.js |
| Git | Any recent version | — |
| Supabase account | — | [supabase.com](https://supabase.com) |
| Vercel account | — | [vercel.com](https://vercel.com) (for deployment) |

---

## 2. GitHub Repo — Branch Structure & Merge Order

The repo has several feature branches that need to be merged into `main` in a specific order to avoid conflicts. Each branch adds a distinct layer.

### Branches to merge (in order)

| # | Branch | What it adds |
|---|---|---|
| 1 | `feat/complete-schema` | Completes migrations 003–007 (trading, ingestion, compliance, RLS, views) |
| 2 | `feat/supabase-backend` | SQL Editor scripts, Edge Functions, `supabase/config.toml` |
| 3 | `feat/auth-system` | Real Supabase auth in `LoginForm`, `PermissionGuard`, `useAuth`, middleware |
| 4 | `feat/dashboard-ui` | Dashboard with metric cards and mock data layer |
| 5 | `feat/user-views` | Buyside, Compliance, and Operations primary views |
| 6 | `feat/dashboard-complete` | Complete data hooks (`useFunds`, `useHoldings`, etc.), fund detail pages, `DataTable` |

### Exact commands

```bash
git clone https://github.com/YOUR_ORG/altura.git
cd altura

# Make sure you're on main and it's up to date
git checkout main
git pull origin main

# Merge each branch in order
git merge --no-ff origin/feat/complete-schema
git merge --no-ff origin/feat/supabase-backend
git merge --no-ff origin/feat/auth-system
git merge --no-ff origin/feat/dashboard-ui
git merge --no-ff origin/feat/user-views
git merge --no-ff origin/feat/dashboard-complete

# Push the merged main
git push origin main
```

> **Conflict note:** Migrations 003–007 appear in multiple branches. When conflicts arise on `supabase/migrations/`, keep the version from `feat/complete-schema` — it is the most complete standalone version. The later branches add application code on top.

---

## 3. Supabase Setup

### 3a. Create a new project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Name it `altura` (or similar), pick a region close to you, set a strong DB password
3. Wait for provisioning (~2 minutes)

### 3b. Run SQL scripts in order

All scripts live in `supabase/sql-editor/` on the `feat/supabase-backend` branch (merge it first, or copy-paste from that branch). Run each one in **Supabase Dashboard → SQL Editor** in the order below.

**Important:** Run each script fully before starting the next one.

---

#### `01-setup-schema.sql` — Create all tables

Drops and recreates every table in the correct dependency order:
`organizations` → `roles` → `user_profiles` → `asset_types` → `funds` → `securities` → `holdings` → `holdings_history` → `orders` → `trades` → `settlements` → `cash_movements` → `import_batches` → `import_rows` → `import_mappings` → `model_portfolios` → `model_portfolio_targets` → `compliance_rules` → `compliance_checks` → `audit_logs`

This script is **idempotent** — safe to re-run.

---

#### `02-enable-rls.sql` — Row-Level Security policies

Enables RLS on all tables and creates all access policies. Defines helper functions used by policies:
- `auth_org_id()` — returns the current user's org
- `auth_is_superadmin()` — checks superadmin flag
- `auth_role_slug()` — returns the current user's role slug
- `auth_has_role(slug)` — role membership check

Run **after** `01`.

---

#### `03-create-views.sql` — Materialized views and summary views

Creates:
- `portfolio_view` (materialized) — fast org/fund lookups with pre-computed weights
- `fund_summary_view` (regular view) — real-time AUM calculations per fund
- `refresh_portfolio_view()` function for concurrent refresh

Run **after** `01` and `02`.

---

#### `04-create-indexes.sql` — Performance indexes

Adds 40+ indexes covering org isolation, fund lookups, security search (ticker, ISIN, SEDOL), holdings date range queries, order/trade status filters, settlement tracking, and audit log feeds.

Run **after** `01`.

---

#### `05-seed-data.sql` — Development seed data + superadmin setup

**Before running this script, you must first sign up via the Altura app** (or create the user manually in Supabase Auth) using `mkenealy@gmail.com`.

The script:
- Creates the default org: **Altura Capital** (NZD)
- Seeds 5 system roles: Master, Compliance, Portfolio Manager, Analyst, Operations
- Creates 3 sample funds: Altura Growth Fund, Altura Income Fund, Altura Balanced Fund
- Adds 11 sample securities (NZ/AU equities, fixed income, cash, hedges)
- Seeds sample holdings for the Growth Fund (as of 2026-03-31)
- Creates 4 default compliance rules
- **Looks up `mkenealy@gmail.com` in `auth.users` and grants superadmin** — you will see a NOTICE confirming it worked

If the NOTICE says the user was not found, sign up first and re-run just the superadmin section.

---

#### `06-helper-functions.sql` — Utility functions

Creates functions for use in queries and edge functions:
- `get_user_org()` — returns org_id for the current session user
- Additional utility functions for fund AUM calculations, holdings weight recalculation, and cash projection helpers

Run **after** `01`.

---

#### `07-triggers.sql` — Auto-update triggers

Creates:
- `set_updated_at()` trigger on all timestamped tables
- Audit log trigger (appends to `audit_logs` on inserts/updates to key tables)
- Holdings weight recalculation trigger (fires after holdings change)

Run **after** `01` and `06`.

---

#### `08-scheduled-jobs.sql` — pg_cron scheduled jobs

> **Prerequisite:** Enable `pg_cron` first: **Supabase Dashboard → Settings → Database → Extensions → pg_cron → Enable**

Creates scheduled jobs:
- Nightly holdings snapshot (`snapshot_holdings_to_history()`) at midnight
- Hourly portfolio view refresh (`refresh_portfolio_view()`)

This step is **optional for initial setup** — the app works without it, you just won't get automatic snapshots.

---

### 3c. Get your API credentials

Go to **Supabase Dashboard → Settings → API**:

| Variable | Where to find it |
|---|---|
| Project URL | "Project URL" (e.g. `https://abcdefgh.supabase.co`) |
| Anon key | "Project API keys → anon / public" |
| Service role key | "Project API keys → service_role" (keep secret) |

### 3d. Auth settings

Go to **Supabase Dashboard → Authentication → Settings**:
- Set **Site URL** to `http://localhost:3000` (dev) or your production URL
- Under **Redirect URLs**, add: `http://localhost:3000/**` and your Vercel URL
- Email confirmations: disable during initial setup if you want frictionless testing

---

## 4. Local Development

### 4a. Clone and install

```bash
git clone https://github.com/YOUR_ORG/altura.git
cd altura
npm install
```

### 4b. Create `.env.local`

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> The app only needs the two `NEXT_PUBLIC_*` vars to run. The service role key is only needed for Edge Functions.

### 4c. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**What to expect on first load:**
- You'll be redirected to `/login` (middleware enforces auth)
- The login page shows the Altura logo and an email/password form
- The app uses the dark navy design system — if it looks unstyled, check that Tailwind is building correctly

---

## 5. Vercel Deployment

### 5a. Connect the repo

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import the GitHub repo
3. Vercel will auto-detect Next.js

### 5b. Environment variables

In **Vercel → Project Settings → Environment Variables**, add:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `NEXT_PUBLIC_APP_URL` | Your Vercel deployment URL (e.g. `https://altura.vercel.app`) |

### 5c. Deploy settings

These should be auto-configured but verify:

| Setting | Value |
|---|---|
| Framework Preset | Next.js |
| Build Command | `npm run build` |
| Output Directory | `.next` (default) |
| Install Command | `npm install` |
| Node.js Version | 20.x |

### 5d. Deploy

Click **Deploy**. First deploy takes ~3 minutes.

After deployment, go back to **Supabase → Authentication → Settings** and add the Vercel URL to **Redirect URLs**.

### 5e. Custom domain (optional)

**Vercel → Project → Settings → Domains** → Add your domain → Update DNS at your registrar.

---

## 6. First Login / Initial Testing

### 6a. Create the first user

1. Go to [http://localhost:3000/login](http://localhost:3000/login)
2. Click through to register (or go to `/register` directly)
3. Sign up with `mkenealy@gmail.com`
4. Check your email and confirm (or disable email confirmation in Supabase Auth settings)

### 6b. Grant superadmin

Once `mkenealy@gmail.com` exists in Supabase Auth:

1. Go to **Supabase Dashboard → SQL Editor**
2. Re-run `05-seed-data.sql` (it's safe to re-run — uses `INSERT ... ON CONFLICT DO UPDATE`)
3. You should see: `NOTICE: Superadmin profile created/updated for mkenealy@gmail.com`

Alternatively, run just the superadmin block manually:

```sql
DO $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
  v_role_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'mkenealy@gmail.com' LIMIT 1;
  SELECT id INTO v_org_id FROM organizations WHERE slug = 'altura-capital' LIMIT 1;
  SELECT id INTO v_role_id FROM roles WHERE slug = 'master' LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User mkenealy@gmail.com not found — sign up first.';
    RETURN;
  END IF;

  INSERT INTO user_profiles (id, org_id, role_id, full_name, email, is_superadmin, is_active)
  VALUES (v_user_id, v_org_id, v_role_id, 'Mike Kenealy', 'mkenealy@gmail.com', true, true)
  ON CONFLICT (id) DO UPDATE SET is_superadmin = true, role_id = v_role_id, is_active = true;

  RAISE NOTICE 'Superadmin granted to mkenealy@gmail.com';
END $$;
```

### 6c. Pages to test

| URL | What to verify |
|---|---|
| `/login` | Form renders, can sign in |
| `/dashboard` | Metric cards show (Total AUM, Active Funds, MTD Return, Open Orders) |
| `/dashboard/funds` | Fund list renders |
| `/dashboard/portfolio` | Holdings table renders |
| `/dashboard/compliance` | Compliance rules/checks render |
| `/dashboard/operations` | Operations view renders |
| `/dashboard/settings/users` | Only visible to superadmin/master role |
| `/dashboard/settings/roles` | Only visible to superadmin/master role |

If any page shows a blank screen, open the browser console — most issues will be Supabase auth or missing env vars.

---

## 7. Known Issues / TODOs

### Mock data vs. real Supabase

| Area | Status |
|---|---|
| Dashboard metric cards (AUM, fund count, MTD return) | **Mock data** — hardcoded in `src/lib/mock-data.ts` |
| Orders badge ("38 pending") in sidebar | **Hardcoded** in `src/config/navigation.ts` |
| Fund list data | **Partially wired** — `useFunds` hook exists but may fall back to mock |
| Holdings table | **Partially wired** — `useHoldings` hook exists but needs testing |
| User name/email in sidebar | **Hardcoded** ("Portfolio Manager", "pm@altura.com") |
| Auth → real Supabase session | **Wired** via `feat/auth-system` branch |

### Needs wiring up

- **Sidebar user info** — should read from `useAuth()` / `authStore`, not hardcoded strings
- **Dashboard metrics** — need to query `fund_summary_view` and aggregate for the logged-in org
- **Orders page** — badge count should come from a live query on `orders` table
- **Permission guards** — `PermissionGuard` component exists (`feat/auth-system`) but not applied to all restricted routes
- **Edge Functions** — `calculate-cash-projection`, `create-fund`, `process-csv-import`, `refresh-portfolio`, `run-compliance-check` are scaffolded but need deployment via `supabase functions deploy`
- **`database.types.ts`** — currently a placeholder. Generate real types with: `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts`

### TypeScript / build issues to fix before prod

- Strict mode is on (`tsconfig.json`) — any `any` types in the data hooks will surface at build time
- Run `npm run build` locally before deploying to catch type errors early
- The `@radix-ui/react-badge` package in `package.json` may not exist (there is no official Radix badge primitive) — if `npm install` fails, remove it and use the shadcn `Badge` component directly

### Database notes

- `portfolio_view` is a **materialized view** — it won't update automatically until `08-scheduled-jobs.sql` is running or you call `SELECT refresh_portfolio_view()` manually
- `fund_summary_view` is a regular view and always reflects current data
- RLS is enabled on all tables — queries from the browser (anon key) will only return rows matching the user's `org_id`. If you see empty tables after seeding, check that the user has a `user_profiles` row with the correct `org_id`

---

## Quick Reference

```bash
# Local dev
npm run dev                          # http://localhost:3000

# Generate Supabase types
npx supabase gen types typescript \
  --project-id YOUR_PROJECT_REF \
  > src/types/database.types.ts

# Deploy edge functions (from supabase-backend branch)
npx supabase functions deploy calculate-cash-projection
npx supabase functions deploy create-fund
npx supabase functions deploy process-csv-import
npx supabase functions deploy refresh-portfolio
npx supabase functions deploy run-compliance-check

# Build check
npm run build
```
