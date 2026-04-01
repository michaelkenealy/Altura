import { useQuery } from "@tanstack/react-query";
import { getFundSummary, FUND_SUMMARIES, USE_MOCK_DATA, type FundSummary } from "@/lib/mock-data";

async function fetchFundSummary(fundId: string): Promise<FundSummary | null> {
  if (USE_MOCK_DATA) {
    await new Promise((r) => setTimeout(r, 80));
    return getFundSummary(fundId) ?? null;
  }
  throw new Error("Supabase not configured");
}

async function fetchAllSummaries(): Promise<FundSummary[]> {
  if (USE_MOCK_DATA) {
    await new Promise((r) => setTimeout(r, 80));
    return FUND_SUMMARIES;
  }
  throw new Error("Supabase not configured");
}

export function useFundSummary(fundId: string | null) {
  return useQuery({
    queryKey: ["fund-summary", fundId],
    queryFn: () => fetchFundSummary(fundId!),
    enabled: !!fundId,
  });
}

export function useAllFundSummaries() {
  return useQuery({
    queryKey: ["fund-summaries"],
    queryFn: fetchAllSummaries,
  });
}
