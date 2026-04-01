// =============================================================================
// Altura Mock Data Layer
// Comprehensive mock data matching the Supabase database schema.
// Set USE_MOCK_DATA = false when Supabase is connected.
// =============================================================================

export const USE_MOCK_DATA = true;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MockFund {
  id: string;
  name: string;
  code: string;
  strategy: string;
  description: string;
  inception_date: string;
  currency: string;
  aum: number;
  nav: number;
  nav_date: string;
  status: "active" | "inactive" | "closed" | "soft_closed";
  manager_id: string;
  created_at: string;
  updated_at: string;
}

export interface AssetType {
  id: string;
  name: "Stocks" | "Fixed Income" | "Hedges" | "Cash";
  sort_order: number;
}

export interface Security {
  id: string;
  ticker: string;
  name: string;
  asset_type_id: string;
  asset_type: AssetType;
  exchange: string;
  currency: string;
  isin?: string;
}

export interface Holding {
  id: string;
  fund_id: string;
  security_id: string;
  security: Security;
  quantity: number;
  avg_cost_local: number;
  avg_cost_nzd: number;
  last_price: number;
  market_value_local: number;
  market_value_nzd: number;
  weight_pct: number;
  fx_rate: number;
  pnl_local: number;
  pnl_pct: number;
  as_of_date: string;
}

export interface Trade {
  id: string;
  fund_id: string;
  security_id: string;
  security: Security;
  trade_type: "buy" | "sell";
  quantity: number;
  price: number;
  fx_rate: number;
  commission: number;
  trade_value_nzd: number;
  trade_date: string;
  settlement_date: string;
  status: "settled" | "pending" | "failed";
  broker: string;
}

export interface Order {
  id: string;
  fund_id: string;
  security_id: string;
  security: Security;
  order_type: "buy" | "sell";
  quantity: number;
  limit_price?: number;
  status: "pending" | "submitted" | "partial" | "filled" | "cancelled" | "rejected";
  broker: string;
  created_at: string;
}

export interface FundSummary {
  fund_id: string;
  fund_name: string;
  fund_code: string;
  num_holdings: number;
  total_aum_nzd: number;
  daily_pnl: number;
  daily_pnl_pct: number;
  cash_balance: number;
  mtd_return: number;
  ytd_return: number;
  last_updated: string;
}

export interface AumDataPoint {
  date: string;
  aum: number;
  label: string;
}

// ---------------------------------------------------------------------------
// Asset Types
// ---------------------------------------------------------------------------

export const ASSET_TYPES: AssetType[] = [
  { id: "at-1", name: "Stocks", sort_order: 1 },
  { id: "at-2", name: "Fixed Income", sort_order: 2 },
  { id: "at-3", name: "Hedges", sort_order: 3 },
  { id: "at-4", name: "Cash", sort_order: 4 },
];

const AT = {
  stocks: ASSET_TYPES[0],
  fi: ASSET_TYPES[1],
  hedges: ASSET_TYPES[2],
  cash: ASSET_TYPES[3],
};

// ---------------------------------------------------------------------------
// Securities
// ---------------------------------------------------------------------------

export const SECURITIES: Security[] = [
  // NZX Equities
  { id: "s-fph", ticker: "FPH", name: "Fisher & Paykel Healthcare", asset_type_id: "at-1", asset_type: AT.stocks, exchange: "NZX", currency: "NZD", isin: "NZFPHE0001S2" },
  { id: "s-spk", ticker: "SPK", name: "Spark New Zealand", asset_type_id: "at-1", asset_type: AT.stocks, exchange: "NZX", currency: "NZD", isin: "NZSPKE0001S4" },
  { id: "s-mft", ticker: "MFT", name: "Mainfreight", asset_type_id: "at-1", asset_type: AT.stocks, exchange: "NZX", currency: "NZD", isin: "NZMFTE0001S9" },
  { id: "s-atm", ticker: "ATM", name: "The a2 Milk Company", asset_type_id: "at-1", asset_type: AT.stocks, exchange: "NZX", currency: "NZD", isin: "NZATME0002S5" },
  { id: "s-mel", ticker: "MEL", name: "Meridian Energy", asset_type_id: "at-1", asset_type: AT.stocks, exchange: "NZX", currency: "NZD", isin: "NZMELE0002S4" },
  { id: "s-aia", ticker: "AIA", name: "Auckland International Airport", asset_type_id: "at-1", asset_type: AT.stocks, exchange: "NZX", currency: "NZD", isin: "NZAIAE0002S6" },
  { id: "s-fbu", ticker: "FBU", name: "Fletcher Building", asset_type_id: "at-1", asset_type: AT.stocks, exchange: "NZX", currency: "NZD", isin: "NZFBUE0001S4" },
  { id: "s-pct", ticker: "PCT", name: "Precinct Properties NZ", asset_type_id: "at-1", asset_type: AT.stocks, exchange: "NZX", currency: "NZD", isin: "NZPCTE0001S0" },
  // ASX Equities
  { id: "s-csl", ticker: "CSL", name: "CSL Limited", asset_type_id: "at-1", asset_type: AT.stocks, exchange: "ASX", currency: "AUD", isin: "AU000000CSL8" },
  { id: "s-bhp", ticker: "BHP", name: "BHP Group", asset_type_id: "at-1", asset_type: AT.stocks, exchange: "ASX", currency: "AUD", isin: "AU000000BHP4" },
  // US Equities
  { id: "s-aapl", ticker: "AAPL", name: "Apple Inc.", asset_type_id: "at-1", asset_type: AT.stocks, exchange: "NASDAQ", currency: "USD", isin: "US0378331005" },
  { id: "s-msft", ticker: "MSFT", name: "Microsoft Corporation", asset_type_id: "at-1", asset_type: AT.stocks, exchange: "NASDAQ", currency: "USD", isin: "US5949181045" },
  // Fixed Income
  { id: "s-nzgb28", ticker: "NZGB28", name: "NZ Govt Bond 4.50% 2028", asset_type_id: "at-2", asset_type: AT.fi, exchange: "NZDX", currency: "NZD" },
  { id: "s-nzgb31", ticker: "NZGB31", name: "NZ Govt Bond 5.00% 2031", asset_type_id: "at-2", asset_type: AT.fi, exchange: "NZDX", currency: "NZD" },
  { id: "s-anzb", ticker: "ANZB", name: "ANZ NZ Fixed Rate Bond", asset_type_id: "at-2", asset_type: AT.fi, exchange: "NZDX", currency: "NZD" },
  { id: "s-wcdb", ticker: "WCDB", name: "Westpac NZ Senior Bond", asset_type_id: "at-2", asset_type: AT.fi, exchange: "NZDX", currency: "NZD" },
  // Hedges
  { id: "s-nzdfwd", ticker: "NZD/USD FWD", name: "NZD/USD 3M Forward Hedge", asset_type_id: "at-3", asset_type: AT.hedges, exchange: "OTC", currency: "NZD" },
  { id: "s-sp500p", ticker: "SPX PUT", name: "S&P 500 Dec 2025 Put 4800", asset_type_id: "at-3", asset_type: AT.hedges, exchange: "OTC", currency: "USD" },
  { id: "s-vixc", ticker: "VIX CALL", name: "VIX Jun 2025 Call 20", asset_type_id: "at-3", asset_type: AT.hedges, exchange: "CBOE", currency: "USD" },
  // Cash
  { id: "s-nzdcash", ticker: "NZD CASH", name: "NZD Cash & Equivalents", asset_type_id: "at-4", asset_type: AT.cash, exchange: "CASH", currency: "NZD" },
  { id: "s-audcash", ticker: "AUD CASH", name: "AUD Cash & Equivalents", asset_type_id: "at-4", asset_type: AT.cash, exchange: "CASH", currency: "AUD" },
  { id: "s-usdcash", ticker: "USD CASH", name: "USD Cash & Equivalents", asset_type_id: "at-4", asset_type: AT.cash, exchange: "CASH", currency: "USD" },
];

const SEC = Object.fromEntries(SECURITIES.map((s) => [s.id, s])) as Record<string, Security>;

// ---------------------------------------------------------------------------
// Funds
// ---------------------------------------------------------------------------

export const FUNDS: MockFund[] = [
  {
    id: "f-nzg",
    name: "NZ Growth Fund",
    code: "NZG",
    strategy: "Long/Short Equity",
    description: "High-conviction portfolio of NZ and AU growth equities with selective global exposure.",
    inception_date: "2018-07-01",
    currency: "NZD",
    aum: 145_280_000,
    nav: 1.4812,
    nav_date: "2026-03-31",
    status: "active",
    manager_id: "mgr-1",
    created_at: "2018-07-01T00:00:00Z",
    updated_at: "2026-03-31T16:00:00Z",
  },
  {
    id: "f-pif",
    name: "Pacific Income Fund",
    code: "PIF",
    strategy: "Fixed Income",
    description: "Conservative fixed income strategy targeting NZ and Pacific region bonds with minimal equity.",
    inception_date: "2019-03-15",
    currency: "NZD",
    aum: 87_450_000,
    nav: 1.1923,
    nav_date: "2026-03-31",
    status: "active",
    manager_id: "mgr-2",
    created_at: "2019-03-15T00:00:00Z",
    updated_at: "2026-03-31T16:00:00Z",
  },
  {
    id: "f-ghf",
    name: "Global Hedge Fund",
    code: "GHF",
    strategy: "Global Macro",
    description: "Absolute return strategy using global macro and derivatives to generate uncorrelated returns.",
    inception_date: "2021-01-10",
    currency: "NZD",
    aum: 62_100_000,
    nav: 1.0841,
    nav_date: "2026-03-31",
    status: "active",
    manager_id: "mgr-1",
    created_at: "2021-01-10T00:00:00Z",
    updated_at: "2026-03-31T16:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Holdings
// FX Rates: NZD/AUD = 0.9140 (1 AUD = 1.0941 NZD), NZD/USD = 0.6150 (1 USD = 1.6260 NZD)
// ---------------------------------------------------------------------------

function mkHolding(
  id: string,
  fund_id: string,
  security_id: string,
  quantity: number,
  avg_cost_local: number,
  last_price: number,
  fx_rate: number, // local to NZD (how many NZD per 1 local unit)
  total_aum_nzd: number,
): Holding {
  const market_value_local = quantity * last_price;
  const market_value_nzd = market_value_local * fx_rate;
  const avg_cost_nzd = avg_cost_local * fx_rate;
  const pnl_local = (last_price - avg_cost_local) * quantity;
  const pnl_pct = ((last_price - avg_cost_local) / avg_cost_local) * 100;
  const weight_pct = (market_value_nzd / total_aum_nzd) * 100;

  return {
    id,
    fund_id,
    security_id,
    security: SEC[security_id],
    quantity,
    avg_cost_local,
    avg_cost_nzd,
    last_price,
    market_value_local,
    market_value_nzd,
    weight_pct,
    fx_rate,
    pnl_local,
    pnl_pct,
    as_of_date: "2026-03-31",
  };
}

const NZG_AUM = 145_280_000;
const PIF_AUM = 87_450_000;
const GHF_AUM = 62_100_000;
const NZD = 1.0;
const AUD_NZD = 1.0941; // 1 AUD = 1.0941 NZD
const USD_NZD = 1.6260; // 1 USD = 1.6260 NZD

// --- NZ Growth Fund Holdings ---
export const NZG_HOLDINGS: Holding[] = [
  mkHolding("h-nzg-fph", "f-nzg", "s-fph", 1_200_000, 18.50, 22.45, NZD, NZG_AUM),
  mkHolding("h-nzg-spk", "f-nzg", "s-spk", 3_000_000, 3.45, 3.28, NZD, NZG_AUM),
  mkHolding("h-nzg-mft", "f-nzg", "s-mft", 200_000, 60.00, 65.20, NZD, NZG_AUM),
  mkHolding("h-nzg-atm", "f-nzg", "s-atm", 1_500_000, 9.20, 8.75, NZD, NZG_AUM),
  mkHolding("h-nzg-mel", "f-nzg", "s-mel", 1_000_000, 5.80, 6.15, NZD, NZG_AUM),
  mkHolding("h-nzg-aia", "f-nzg", "s-aia", 800_000, 7.20, 7.90, NZD, NZG_AUM),
  mkHolding("h-nzg-csl", "f-nzg", "s-csl", 50_000, 255.00, 291.40, AUD_NZD, NZG_AUM),
  mkHolding("h-nzg-aapl", "f-nzg", "s-aapl", 32_000, 185.00, 229.50, USD_NZD, NZG_AUM),
  mkHolding("h-nzg-nzgb28", "f-nzg", "s-nzgb28", 200_000, 100.00, 102.50, NZD, NZG_AUM),
  mkHolding("h-nzg-nzgb31", "f-nzg", "s-nzgb31", 100_000, 99.50, 101.20, NZD, NZG_AUM),
  mkHolding("h-nzg-sp500p", "f-nzg", "s-sp500p", 500, 18.00, 24.60, USD_NZD, NZG_AUM),
  mkHolding("h-nzg-cash", "f-nzg", "s-nzdcash", 7_250_000, 1.0, 1.0, NZD, NZG_AUM),
];

// --- Pacific Income Fund Holdings ---
export const PIF_HOLDINGS: Holding[] = [
  mkHolding("h-pif-nzgb28", "f-pif", "s-nzgb28", 300_000, 99.80, 102.50, NZD, PIF_AUM),
  mkHolding("h-pif-nzgb31", "f-pif", "s-nzgb31", 200_000, 98.50, 101.20, NZD, PIF_AUM),
  mkHolding("h-pif-anzb", "f-pif", "s-anzb", 150_000, 100.20, 100.50, NZD, PIF_AUM),
  mkHolding("h-pif-wcdb", "f-pif", "s-wcdb", 200_000, 100.10, 99.80, NZD, PIF_AUM),
  mkHolding("h-pif-fbu", "f-pif", "s-fbu", 2_000_000, 3.55, 3.20, NZD, PIF_AUM),
  mkHolding("h-pif-pct", "f-pif", "s-pct", 5_000_000, 1.20, 1.18, NZD, PIF_AUM),
  mkHolding("h-pif-nzdfwd", "f-pif", "s-nzdfwd", 10_000_000, 0.05, 0.048, NZD, PIF_AUM),
  mkHolding("h-pif-cash", "f-pif", "s-nzdcash", 8_700_000, 1.0, 1.0, NZD, PIF_AUM),
  mkHolding("h-pif-audcash", "f-pif", "s-audcash", 2_000_000, 1.0, 1.0, AUD_NZD, PIF_AUM),
];

// --- Global Hedge Fund Holdings ---
export const GHF_HOLDINGS: Holding[] = [
  mkHolding("h-ghf-fph", "f-ghf", "s-fph", 400_000, 20.10, 22.45, NZD, GHF_AUM),
  mkHolding("h-ghf-msft", "f-ghf", "s-msft", 12_000, 385.00, 421.50, USD_NZD, GHF_AUM),
  mkHolding("h-ghf-bhp", "f-ghf", "s-bhp", 200_000, 40.50, 44.20, AUD_NZD, GHF_AUM),
  mkHolding("h-ghf-aapl", "f-ghf", "s-aapl", 8_000, 195.00, 229.50, USD_NZD, GHF_AUM),
  mkHolding("h-ghf-nzgb31", "f-ghf", "s-nzgb31", 50_000, 100.00, 101.20, NZD, GHF_AUM),
  mkHolding("h-ghf-nzdfwd", "f-ghf", "s-nzdfwd", 20_000_000, 0.04, 0.048, NZD, GHF_AUM),
  mkHolding("h-ghf-sp500p", "f-ghf", "s-sp500p", 1_000, 14.00, 24.60, USD_NZD, GHF_AUM),
  mkHolding("h-ghf-vixc", "f-ghf", "s-vixc", 500, 3.50, 4.80, USD_NZD, GHF_AUM),
  mkHolding("h-ghf-cash", "f-ghf", "s-nzdcash", 6_200_000, 1.0, 1.0, NZD, GHF_AUM),
  mkHolding("h-ghf-usdcash", "f-ghf", "s-usdcash", 1_500_000, 1.0, 1.0, USD_NZD, GHF_AUM),
];

export const ALL_HOLDINGS: Holding[] = [...NZG_HOLDINGS, ...PIF_HOLDINGS, ...GHF_HOLDINGS];

export function getHoldingsByFund(fundId: string): Holding[] {
  return ALL_HOLDINGS.filter((h) => h.fund_id === fundId);
}

// ---------------------------------------------------------------------------
// Trades
// ---------------------------------------------------------------------------

export const TRADES: Trade[] = [
  {
    id: "t-001", fund_id: "f-nzg", security_id: "s-fph", security: SEC["s-fph"],
    trade_type: "buy", quantity: 200_000, price: 22.10, fx_rate: 1.0, commission: 1_650,
    trade_value_nzd: 200_000 * 22.10, trade_date: "2026-03-28", settlement_date: "2026-04-01",
    status: "pending", broker: "Forsyth Barr",
  },
  {
    id: "t-002", fund_id: "f-nzg", security_id: "s-atm", security: SEC["s-atm"],
    trade_type: "sell", quantity: 300_000, price: 8.82, fx_rate: 1.0, commission: 1_323,
    trade_value_nzd: 300_000 * 8.82, trade_date: "2026-03-27", settlement_date: "2026-03-31",
    status: "settled", broker: "Craigs Investment Partners",
  },
  {
    id: "t-003", fund_id: "f-nzg", security_id: "s-csl", security: SEC["s-csl"],
    trade_type: "buy", quantity: 5_000, price: 288.50, fx_rate: AUD_NZD, commission: 2_500,
    trade_value_nzd: 5_000 * 288.50 * AUD_NZD, trade_date: "2026-03-26", settlement_date: "2026-03-28",
    status: "settled", broker: "Macquarie Securities",
  },
  {
    id: "t-004", fund_id: "f-pif", security_id: "s-nzgb28", security: SEC["s-nzgb28"],
    trade_type: "buy", quantity: 50_000, price: 102.20, fx_rate: 1.0, commission: 750,
    trade_value_nzd: 50_000 * 102.20, trade_date: "2026-03-28", settlement_date: "2026-04-01",
    status: "pending", broker: "ANZ Markets",
  },
  {
    id: "t-005", fund_id: "f-pif", security_id: "s-fbu", security: SEC["s-fbu"],
    trade_type: "sell", quantity: 500_000, price: 3.22, fx_rate: 1.0, commission: 805,
    trade_value_nzd: 500_000 * 3.22, trade_date: "2026-03-25", settlement_date: "2026-03-27",
    status: "settled", broker: "Forsyth Barr",
  },
  {
    id: "t-006", fund_id: "f-ghf", security_id: "s-msft", security: SEC["s-msft"],
    trade_type: "buy", quantity: 2_000, price: 418.20, fx_rate: USD_NZD, commission: 1_200,
    trade_value_nzd: 2_000 * 418.20 * USD_NZD, trade_date: "2026-03-27", settlement_date: "2026-04-01",
    status: "pending", broker: "Interactive Brokers",
  },
  {
    id: "t-007", fund_id: "f-ghf", security_id: "s-sp500p", security: SEC["s-sp500p"],
    trade_type: "buy", quantity: 200, price: 22.50, fx_rate: USD_NZD, commission: 600,
    trade_value_nzd: 200 * 22.50 * USD_NZD, trade_date: "2026-03-24", settlement_date: "2026-03-26",
    status: "settled", broker: "Goldman Sachs",
  },
  {
    id: "t-008", fund_id: "f-nzg", security_id: "s-mel", security: SEC["s-mel"],
    trade_type: "buy", quantity: 250_000, price: 6.05, fx_rate: 1.0, commission: 756,
    trade_value_nzd: 250_000 * 6.05, trade_date: "2026-03-21", settlement_date: "2026-03-25",
    status: "settled", broker: "Jarden",
  },
  {
    id: "t-009", fund_id: "f-pif", security_id: "s-wcdb", security: SEC["s-wcdb"],
    trade_type: "buy", quantity: 100_000, price: 99.75, fx_rate: 1.0, commission: 500,
    trade_value_nzd: 100_000 * 99.75, trade_date: "2026-03-20", settlement_date: "2026-03-24",
    status: "settled", broker: "Westpac Institutional",
  },
  {
    id: "t-010", fund_id: "f-nzg", security_id: "s-aapl", security: SEC["s-aapl"],
    trade_type: "buy", quantity: 5_000, price: 224.00, fx_rate: USD_NZD, commission: 2_000,
    trade_value_nzd: 5_000 * 224.00 * USD_NZD, trade_date: "2026-03-18", settlement_date: "2026-03-20",
    status: "settled", broker: "Interactive Brokers",
  },
];

export function getTradesByFund(fundId: string): Trade[] {
  return TRADES.filter((t) => t.fund_id === fundId);
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export const ORDERS: Order[] = [
  {
    id: "o-001", fund_id: "f-nzg", security_id: "s-fph", security: SEC["s-fph"],
    order_type: "buy", quantity: 100_000, limit_price: 22.60,
    status: "pending", broker: "Forsyth Barr", created_at: "2026-03-31T09:15:00Z",
  },
  {
    id: "o-002", fund_id: "f-nzg", security_id: "s-spk", security: SEC["s-spk"],
    order_type: "sell", quantity: 500_000, limit_price: 3.35,
    status: "submitted", broker: "Craigs Investment Partners", created_at: "2026-03-31T10:30:00Z",
  },
  {
    id: "o-003", fund_id: "f-pif", security_id: "s-nzgb31", security: SEC["s-nzgb31"],
    order_type: "buy", quantity: 75_000,
    status: "pending", broker: "ANZ Markets", created_at: "2026-03-31T08:45:00Z",
  },
  {
    id: "o-004", fund_id: "f-ghf", security_id: "s-msft", security: SEC["s-msft"],
    order_type: "buy", quantity: 1_500, limit_price: 415.00,
    status: "partial", broker: "Interactive Brokers", created_at: "2026-03-31T11:00:00Z",
  },
  {
    id: "o-005", fund_id: "f-nzg", security_id: "s-aia", security: SEC["s-aia"],
    order_type: "buy", quantity: 200_000, limit_price: 7.85,
    status: "pending", broker: "Jarden", created_at: "2026-03-31T11:20:00Z",
  },
  {
    id: "o-006", fund_id: "f-ghf", security_id: "s-bhp", security: SEC["s-bhp"],
    order_type: "sell", quantity: 50_000, limit_price: 44.50,
    status: "submitted", broker: "Macquarie Securities", created_at: "2026-03-31T09:50:00Z",
  },
  {
    id: "o-007", fund_id: "f-pif", security_id: "s-anzb", security: SEC["s-anzb"],
    order_type: "buy", quantity: 50_000,
    status: "pending", broker: "ANZ Markets", created_at: "2026-03-31T12:10:00Z",
  },
];

export function getOrdersByFund(fundId: string): Order[] {
  return ORDERS.filter((o) => o.fund_id === fundId);
}

// ---------------------------------------------------------------------------
// Fund Summaries (aggregated metrics)
// ---------------------------------------------------------------------------

export const FUND_SUMMARIES: FundSummary[] = [
  {
    fund_id: "f-nzg",
    fund_name: "NZ Growth Fund",
    fund_code: "NZG",
    num_holdings: NZG_HOLDINGS.length,
    total_aum_nzd: NZG_AUM,
    daily_pnl: 824_500,
    daily_pnl_pct: 0.57,
    cash_balance: 7_250_000,
    mtd_return: 2.84,
    ytd_return: 6.12,
    last_updated: "2026-03-31T16:00:00Z",
  },
  {
    fund_id: "f-pif",
    fund_name: "Pacific Income Fund",
    fund_code: "PIF",
    num_holdings: PIF_HOLDINGS.length,
    total_aum_nzd: PIF_AUM,
    daily_pnl: -124_300,
    daily_pnl_pct: -0.14,
    cash_balance: 8_700_000 + 2_000_000 * AUD_NZD,
    mtd_return: 0.42,
    ytd_return: 1.98,
    last_updated: "2026-03-31T16:00:00Z",
  },
  {
    fund_id: "f-ghf",
    fund_name: "Global Hedge Fund",
    fund_code: "GHF",
    num_holdings: GHF_HOLDINGS.length,
    total_aum_nzd: GHF_AUM,
    daily_pnl: 392_100,
    daily_pnl_pct: 0.63,
    cash_balance: 6_200_000 + 1_500_000 * USD_NZD,
    mtd_return: 1.71,
    ytd_return: 3.45,
    last_updated: "2026-03-31T16:00:00Z",
  },
];

export function getFundSummary(fundId: string): FundSummary | undefined {
  return FUND_SUMMARIES.find((s) => s.fund_id === fundId);
}

// ---------------------------------------------------------------------------
// AUM History (30 days, for dashboard area chart)
// ---------------------------------------------------------------------------

function generateAumHistory(): AumDataPoint[] {
  const data: AumDataPoint[] = [];
  const startDate = new Date("2026-03-01");
  let totalAum = 285_000_000;

  for (let i = 0; i < 31; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends

    // Simulate daily fluctuation with slight upward drift
    const change = (Math.random() - 0.42) * 0.012 * totalAum;
    totalAum = Math.max(totalAum + change, 270_000_000);

    data.push({
      date: date.toISOString().split("T")[0],
      aum: Math.round(totalAum),
      label: date.toLocaleDateString("en-NZ", { month: "short", day: "numeric" }),
    });
  }

  // Ensure last point matches current total
  if (data.length > 0) {
    data[data.length - 1].aum = NZG_AUM + PIF_AUM + GHF_AUM;
  }

  return data;
}

export const AUM_HISTORY: AumDataPoint[] = generateAumHistory();

// ---------------------------------------------------------------------------
// Aggregate Dashboard Metrics
// ---------------------------------------------------------------------------

export const DASHBOARD_METRICS = {
  total_aum_nzd: NZG_AUM + PIF_AUM + GHF_AUM,
  num_funds: FUNDS.length,
  total_holdings: ALL_HOLDINGS.length,
  daily_pnl: FUND_SUMMARIES.reduce((sum, f) => sum + f.daily_pnl, 0),
  daily_pnl_pct:
    FUND_SUMMARIES.reduce((sum, f) => sum + f.daily_pnl, 0) /
    (NZG_AUM + PIF_AUM + GHF_AUM) * 100,
  open_orders: ORDERS.filter((o) => ["pending", "submitted", "partial"].includes(o.status)).length,
};
