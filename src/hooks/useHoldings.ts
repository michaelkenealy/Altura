import { useQuery } from "@tanstack/react-query";
import { getHoldingsByFund, USE_MOCK_DATA, type Holding } from "@/lib/mock-data";

async function fetchHoldings(fundId: string): Promise<Holding[]> {
  if (USE_MOCK_DATA) {
    await new Promise((r) => setTimeout(r, 100));
    return getHoldingsByFund(fundId);
  }
  throw new Error("Supabase not configured");
}

export function useHoldings(fundId: string | null) {
  return useQuery({
    queryKey: ["holdings", fundId],
    queryFn: () => fetchHoldings(fundId!),
    enabled: !!fundId,
  });
}
