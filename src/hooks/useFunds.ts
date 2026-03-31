"use client";

import { useQuery } from "@tanstack/react-query";
import { MOCK_FUNDS, MOCK_FUND_SUMMARY } from "@/lib/mock-data";
import type { Fund } from "@/types/fund";

const USE_MOCK = true;

export function useFunds() {
  return useQuery<Fund[]>({
    queryKey: ["funds"],
    queryFn: async () => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 200));
        return MOCK_FUNDS;
      }
      // TODO: replace with real Supabase query
      // const supabase = createClient();
      // const { data, error } = await supabase.from("funds").select("*").order("name");
      // if (error) throw error;
      // return data;
      return [];
    },
  });
}

export function useFundSummary() {
  return useQuery({
    queryKey: ["fund-summary"],
    queryFn: async () => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 150));
        return MOCK_FUND_SUMMARY;
      }
      return null;
    },
  });
}

export function useFund(fundId: string | null) {
  return useQuery<Fund | null>({
    queryKey: ["fund", fundId],
    enabled: !!fundId,
    queryFn: async () => {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 100));
        return MOCK_FUNDS.find((f) => f.id === fundId) ?? null;
      }
      return null;
    },
  });
}
