import { useQuery } from "@tanstack/react-query";
import { getHoldingsByFund, USE_MOCK_DATA, type Holding, type AssetType } from "@/lib/mock-data";

export interface AssetTypeGroup {
  asset_type: AssetType;
  holdings: Holding[];
  total_value_nzd: number;
  weight_pct: number;
  count: number;
}

async function fetchPortfolio(fundId: string): Promise<AssetTypeGroup[]> {
  if (USE_MOCK_DATA) {
    await new Promise((r) => setTimeout(r, 110));
    const holdings = getHoldingsByFund(fundId);
    const totalValue = holdings.reduce((sum, h) => sum + h.market_value_nzd, 0);

    const groupMap = new Map<string, AssetTypeGroup>();
    for (const h of holdings) {
      const key = h.security.asset_type.id;
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          asset_type: h.security.asset_type,
          holdings: [],
          total_value_nzd: 0,
          weight_pct: 0,
          count: 0,
        });
      }
      const group = groupMap.get(key)!;
      group.holdings.push(h);
      group.total_value_nzd += h.market_value_nzd;
      group.count += 1;
    }

    for (const group of groupMap.values()) {
      group.weight_pct = (group.total_value_nzd / totalValue) * 100;
    }

    return [...groupMap.values()].sort(
      (a, b) => a.asset_type.sort_order - b.asset_type.sort_order
    );
  }
  throw new Error("Supabase not configured");
}

export function usePortfolio(fundId: string | null) {
  return useQuery({
    queryKey: ["portfolio", fundId],
    queryFn: () => fetchPortfolio(fundId!),
    enabled: !!fundId,
  });
}
