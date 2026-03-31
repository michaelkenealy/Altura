"use client";

import { useQuery } from "@tanstack/react-query";
import { MOCK_HOLDINGS } from "@/lib/mock-data";
import type { Holding } from "@/lib/mock-data";

const USE_MOCK = true;

export function useHoldings(fundId: string | null) {
  return useQuery<Holding[]>({
    queryKey: ["holdings", fundId],
    enabled: !!fundId,
    queryFn: async () => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 250));
        return MOCK_HOLDINGS[fundId!] ?? [];
      }
      // TODO: real Supabase query
      // const supabase = createClient();
      // const { data, error } = await supabase
      //   .from("holdings")
      //   .select("*")
      //   .eq("fund_id", fundId)
      //   .order("nzd_value", { ascending: false });
      // if (error) throw error;
      // return data;
      return [];
    },
  });
}

export function usePortfolio(fundId: string | null) {
  return useQuery({
    queryKey: ["portfolio", fundId],
    enabled: !!fundId,
    queryFn: async () => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 300));
        const holdings = MOCK_HOLDINGS[fundId!] ?? [];

        const grouped: Record<string, Holding[]> = {};
        for (const h of holdings) {
          if (!grouped[h.asset_type]) grouped[h.asset_type] = [];
          grouped[h.asset_type].push(h);
        }

        const totalNzdValue = holdings.reduce((s, h) => s + h.nzd_value, 0);

        return {
          holdings,
          grouped,
          totalNzdValue,
          summary: Object.entries(grouped).map(([type, items]) => ({
            asset_type: type,
            count: items.length,
            nzd_value: items.reduce((s, h) => s + h.nzd_value, 0),
            weight: items.reduce((s, h) => s + h.weight, 0),
            unrealized_pnl: items.reduce((s, h) => s + h.unrealized_pnl, 0),
          })),
        };
      }
      return null;
    },
  });
}
