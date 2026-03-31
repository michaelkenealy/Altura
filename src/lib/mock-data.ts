import type { Fund } from "@/types/fund";

export type AssetType = "Stocks" | "Fixed Income" | "Hedges" | "Cash";

export interface Holding {
  id: string;
  fund_id: string;
  name: string;
  ticker: string;
  asset_type: AssetType;
  last_price: number;
  local_currency: string;
  quantity: number;
  local_value: number;
  nzd_value: number;
  fx_rate: number;
  weight: number;
  cost_basis: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
}

export interface ActivityItem {
  id: string;
  type: "trade" | "subscription" | "redemption" | "corporate_action" | "compliance";
  description: string;
  fund_name: string;
  amount?: number;
  timestamp: string;
  status: "completed" | "pending" | "failed";
}

export const MOCK_FUNDS: Fund[] = [
  {
    id: "fund-001",
    name: "Altura NZ Equity Fund",
    ticker: "ANZEF",
    strategy: "Long/Short Equity",
    inception_date: "2018-03-15",
    currency: "NZD",
    aum: 485_000_000,
    nav: 1.8542,
    nav_date: "2026-03-31",
    status: "active",
    manager_id: "mgr-001",
    created_at: "2018-03-15T00:00:00Z",
    updated_at: "2026-03-31T16:00:00Z",
  },
  {
    id: "fund-002",
    name: "Altura Trans-Tasman Growth",
    ticker: "ATTG",
    strategy: "Long/Short Equity",
    inception_date: "2020-07-01",
    currency: "NZD",
    aum: 312_000_000,
    nav: 1.4231,
    nav_date: "2026-03-31",
    status: "active",
    manager_id: "mgr-001",
    created_at: "2020-07-01T00:00:00Z",
    updated_at: "2026-03-31T16:00:00Z",
  },
  {
    id: "fund-003",
    name: "Altura Fixed Income Fund",
    ticker: "AFIF",
    strategy: "Credit",
    inception_date: "2019-11-01",
    currency: "NZD",
    aum: 198_000_000,
    nav: 1.1876,
    nav_date: "2026-03-31",
    status: "active",
    manager_id: "mgr-002",
    created_at: "2019-11-01T00:00:00Z",
    updated_at: "2026-03-31T16:00:00Z",
  },
  {
    id: "fund-004",
    name: "Altura Global Macro",
    ticker: "AGM",
    strategy: "Global Macro",
    inception_date: "2021-01-15",
    currency: "NZD",
    aum: 156_000_000,
    nav: 1.2954,
    nav_date: "2026-03-31",
    status: "soft_closed",
    manager_id: "mgr-002",
    created_at: "2021-01-15T00:00:00Z",
    updated_at: "2026-03-31T16:00:00Z",
  },
];

export const MOCK_HOLDINGS: Record<string, Holding[]> = {
  "fund-001": [
    // Stocks
    {
      id: "h-001", fund_id: "fund-001", name: "Fisher & Paykel Healthcare", ticker: "FPH.NZ",
      asset_type: "Stocks", last_price: 28.54, local_currency: "NZD", quantity: 1_200_000,
      local_value: 34_248_000, nzd_value: 34_248_000, fx_rate: 1, weight: 7.06,
      cost_basis: 24.20, unrealized_pnl: 5_208_000, unrealized_pnl_pct: 17.93,
    },
    {
      id: "h-002", fund_id: "fund-001", name: "Meridian Energy", ticker: "MEL.NZ",
      asset_type: "Stocks", last_price: 6.82, local_currency: "NZD", quantity: 4_500_000,
      local_value: 30_690_000, nzd_value: 30_690_000, fx_rate: 1, weight: 6.33,
      cost_basis: 5.91, unrealized_pnl: 4_095_000, unrealized_pnl_pct: 15.40,
    },
    {
      id: "h-003", fund_id: "fund-001", name: "Commonwealth Bank", ticker: "CBA.AX",
      asset_type: "Stocks", last_price: 138.45, local_currency: "AUD", quantity: 180_000,
      local_value: 24_921_000, nzd_value: 27_141_090, fx_rate: 1.089, weight: 5.60,
      cost_basis: 118.20, unrealized_pnl: 3_645_000, unrealized_pnl_pct: 17.13,
    },
    {
      id: "h-004", fund_id: "fund-001", name: "Xero Limited", ticker: "XRO.NZ",
      asset_type: "Stocks", last_price: 142.30, local_currency: "NZD", quantity: 155_000,
      local_value: 22_056_500, nzd_value: 22_056_500, fx_rate: 1, weight: 4.55,
      cost_basis: 125.80, unrealized_pnl: 2_557_500, unrealized_pnl_pct: 13.11,
    },
    {
      id: "h-005", fund_id: "fund-001", name: "Spark New Zealand", ticker: "SPK.NZ",
      asset_type: "Stocks", last_price: 3.24, local_currency: "NZD", quantity: 6_200_000,
      local_value: 20_088_000, nzd_value: 20_088_000, fx_rate: 1, weight: 4.14,
      cost_basis: 3.56, unrealized_pnl: -1_984_000, unrealized_pnl_pct: -8.99,
    },
    // Fixed Income
    {
      id: "h-006", fund_id: "fund-001", name: "NZ Govt Bond 4.5% 2028", ticker: "NZGB28",
      asset_type: "Fixed Income", last_price: 99.84, local_currency: "NZD", quantity: 80_000,
      local_value: 79_872_000, nzd_value: 79_872_000, fx_rate: 1, weight: 16.47,
      cost_basis: 98.50, unrealized_pnl: 1_072_000, unrealized_pnl_pct: 1.36,
    },
    {
      id: "h-007", fund_id: "fund-001", name: "NZ Govt Bond 3.0% 2030", ticker: "NZGB30",
      asset_type: "Fixed Income", last_price: 96.12, local_currency: "NZD", quantity: 50_000,
      local_value: 48_060_000, nzd_value: 48_060_000, fx_rate: 1, weight: 9.91,
      cost_basis: 97.80, unrealized_pnl: -840_000, unrealized_pnl_pct: -1.72,
    },
    // Hedges
    {
      id: "h-008", fund_id: "fund-001", name: "NZD/USD Put Options", ticker: "NZDUSD-P",
      asset_type: "Hedges", last_price: 2.45, local_currency: "USD", quantity: 500_000,
      local_value: 1_225_000, nzd_value: 2_083_333, fx_rate: 0.588, weight: 0.43,
      cost_basis: 1.80, unrealized_pnl: 325_000, unrealized_pnl_pct: 36.11,
    },
    {
      id: "h-009", fund_id: "fund-001", name: "AUD/NZD Forward", ticker: "AUDNZD-FWD",
      asset_type: "Hedges", last_price: 1.0892, local_currency: "AUD", quantity: 15_000_000,
      local_value: 16_338_000, nzd_value: 16_338_000, fx_rate: 1, weight: 3.37,
      cost_basis: 1.0850, unrealized_pnl: 63_000, unrealized_pnl_pct: 0.39,
    },
    // Cash
    {
      id: "h-010", fund_id: "fund-001", name: "NZD Cash & Equivalents", ticker: "CASH-NZD",
      asset_type: "Cash", last_price: 1.00, local_currency: "NZD", quantity: 150_000_000,
      local_value: 150_000_000, nzd_value: 150_000_000, fx_rate: 1, weight: 30.93,
      cost_basis: 1.00, unrealized_pnl: 0, unrealized_pnl_pct: 0,
    },
  ],
  "fund-002": [
    {
      id: "h-101", fund_id: "fund-002", name: "A2 Milk Company", ticker: "ATM.NZ",
      asset_type: "Stocks", last_price: 7.82, local_currency: "NZD", quantity: 2_800_000,
      local_value: 21_896_000, nzd_value: 21_896_000, fx_rate: 1, weight: 7.02,
      cost_basis: 6.50, unrealized_pnl: 3_696_000, unrealized_pnl_pct: 20.31,
    },
    {
      id: "h-102", fund_id: "fund-002", name: "BHP Group", ticker: "BHP.AX",
      asset_type: "Stocks", last_price: 45.82, local_currency: "AUD", quantity: 380_000,
      local_value: 17_411_600, nzd_value: 18_961_032, fx_rate: 1.089, weight: 6.08,
      cost_basis: 42.15, unrealized_pnl: 1_394_600, unrealized_pnl_pct: 8.71,
    },
    {
      id: "h-103", fund_id: "fund-002", name: "Mainfreight", ticker: "MFT.NZ",
      asset_type: "Stocks", last_price: 68.50, local_currency: "NZD", quantity: 210_000,
      local_value: 14_385_000, nzd_value: 14_385_000, fx_rate: 1, weight: 4.61,
      cost_basis: 72.40, unrealized_pnl: -819_000, unrealized_pnl_pct: -5.39,
    },
    {
      id: "h-104", fund_id: "fund-002", name: "ANZ Covered Bond 2027", ticker: "ANZCB27",
      asset_type: "Fixed Income", last_price: 101.25, local_currency: "NZD", quantity: 40_000,
      local_value: 40_500_000, nzd_value: 40_500_000, fx_rate: 1, weight: 12.98,
      cost_basis: 100.00, unrealized_pnl: 500_000, unrealized_pnl_pct: 1.25,
    },
    {
      id: "h-105", fund_id: "fund-002", name: "NZD Cash & Equivalents", ticker: "CASH-NZD",
      asset_type: "Cash", last_price: 1.00, local_currency: "NZD", quantity: 120_000_000,
      local_value: 120_000_000, nzd_value: 120_000_000, fx_rate: 1, weight: 38.46,
      cost_basis: 1.00, unrealized_pnl: 0, unrealized_pnl_pct: 0,
    },
  ],
  "fund-003": [
    {
      id: "h-201", fund_id: "fund-003", name: "NZ Govt Bond 5.0% 2031", ticker: "NZGB31",
      asset_type: "Fixed Income", last_price: 102.15, local_currency: "NZD", quantity: 60_000,
      local_value: 61_290_000, nzd_value: 61_290_000, fx_rate: 1, weight: 30.95,
      cost_basis: 100.00, unrealized_pnl: 1_290_000, unrealized_pnl_pct: 2.15,
    },
    {
      id: "h-202", fund_id: "fund-003", name: "Westpac Subordinated Notes", ticker: "WBCNZ",
      asset_type: "Fixed Income", last_price: 99.45, local_currency: "NZD", quantity: 45_000,
      local_value: 44_752_500, nzd_value: 44_752_500, fx_rate: 1, weight: 22.60,
      cost_basis: 100.00, unrealized_pnl: -247_500, unrealized_pnl_pct: -0.55,
    },
    {
      id: "h-203", fund_id: "fund-003", name: "NZD Cash & Equivalents", ticker: "CASH-NZD",
      asset_type: "Cash", last_price: 1.00, local_currency: "NZD", quantity: 91_957_500,
      local_value: 91_957_500, nzd_value: 91_957_500, fx_rate: 1, weight: 46.44,
      cost_basis: 1.00, unrealized_pnl: 0, unrealized_pnl_pct: 0,
    },
  ],
  "fund-004": [
    {
      id: "h-301", fund_id: "fund-004", name: "S&P 500 E-mini Futures", ticker: "ES1!",
      asset_type: "Hedges", last_price: 5280.50, local_currency: "USD", quantity: 10,
      local_value: 52_805_000, nzd_value: 89_800_000, fx_rate: 0.588, weight: 57.57,
      cost_basis: 5100.00, unrealized_pnl: 1_805_000, unrealized_pnl_pct: 3.54,
    },
    {
      id: "h-302", fund_id: "fund-004", name: "USD/NZD Forward", ticker: "USDNZD-FWD",
      asset_type: "Hedges", last_price: 0.588, local_currency: "USD", quantity: 30_000_000,
      local_value: 17_640_000, nzd_value: 30_000_000, fx_rate: 0.588, weight: 19.23,
      cost_basis: 0.595, unrealized_pnl: -210_000, unrealized_pnl_pct: -1.18,
    },
    {
      id: "h-303", fund_id: "fund-004", name: "USD Cash & Equivalents", ticker: "CASH-USD",
      asset_type: "Cash", last_price: 1.00, local_currency: "USD", quantity: 21_200_000,
      local_value: 21_200_000, nzd_value: 36_054_421, fx_rate: 0.588, weight: 23.11,
      cost_basis: 1.00, unrealized_pnl: 0, unrealized_pnl_pct: 0,
    },
  ],
};

export const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: "act-001", type: "trade",
    description: "Bought 200,000 FPH.NZ @ $28.20", fund_name: "ANZEF",
    amount: 5_640_000, timestamp: "2026-04-01T14:32:00Z", status: "completed",
  },
  {
    id: "act-002", type: "subscription",
    description: "Investor subscription received", fund_name: "ATTG",
    amount: 5_000_000, timestamp: "2026-04-01T12:15:00Z", status: "pending",
  },
  {
    id: "act-003", type: "trade",
    description: "Sold 100,000 SPK.NZ @ $3.24", fund_name: "ANZEF",
    amount: 324_000, timestamp: "2026-04-01T11:48:00Z", status: "completed",
  },
  {
    id: "act-004", type: "compliance",
    description: "Concentration limit review — ANZEF", fund_name: "ANZEF",
    timestamp: "2026-04-01T09:30:00Z", status: "completed",
  },
  {
    id: "act-005", type: "corporate_action",
    description: "FPH.NZ dividend: $0.18/share", fund_name: "ANZEF",
    amount: 216_000, timestamp: "2026-03-31T16:00:00Z", status: "completed",
  },
  {
    id: "act-006", type: "trade",
    description: "Bought 5 ES1! contracts @ 5,265.00", fund_name: "AGM",
    amount: 2_632_500, timestamp: "2026-03-31T14:20:00Z", status: "completed",
  },
  {
    id: "act-007", type: "redemption",
    description: "Investor redemption processed", fund_name: "AFIF",
    amount: 2_500_000, timestamp: "2026-03-31T10:00:00Z", status: "completed",
  },
];

export const MOCK_FUND_SUMMARY = {
  total_aum: MOCK_FUNDS.reduce((sum, f) => sum + f.aum, 0),
  total_funds: MOCK_FUNDS.length,
  active_funds: MOCK_FUNDS.filter((f) => f.status === "active").length,
  total_holdings: Object.values(MOCK_HOLDINGS).reduce((sum, h) => sum + h.length, 0),
  daily_pnl: 1_847_230,
  daily_pnl_pct: 0.157,
  mtd_return: 2.34,
  ytd_return: 4.71,
};
