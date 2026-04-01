import { useQuery } from "@tanstack/react-query";
import { getTradesByFund, TRADES, USE_MOCK_DATA, type Trade } from "@/lib/mock-data";

async function fetchTrades(fundId?: string): Promise<Trade[]> {
  if (USE_MOCK_DATA) {
    await new Promise((r) => setTimeout(r, 90));
    return fundId ? getTradesByFund(fundId) : TRADES;
  }
  throw new Error("Supabase not configured");
}

export function useTrades(fundId?: string | null) {
  return useQuery({
    queryKey: ["trades", fundId ?? "all"],
    queryFn: () => fetchTrades(fundId ?? undefined),
  });
}
