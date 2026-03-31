export interface Fund {
  id: string;
  name: string;
  ticker: string;
  strategy: string;
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

export interface FundPerformance {
  fund_id: string;
  date: string;
  nav: number;
  return_mtd: number;
  return_qtd: number;
  return_ytd: number;
  return_inception: number;
  volatility: number;
  sharpe_ratio: number;
  max_drawdown: number;
}

export interface FundAllocation {
  fund_id: string;
  asset_class: string;
  weight: number;
  market_value: number;
}
