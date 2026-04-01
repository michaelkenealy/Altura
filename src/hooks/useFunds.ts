import { useQuery } from "@tanstack/react-query";
import { FUNDS, USE_MOCK_DATA, type MockFund } from "@/lib/mock-data";

async function fetchFunds(): Promise<MockFund[]> {
  if (USE_MOCK_DATA) {
    await new Promise((r) => setTimeout(r, 120));
    return FUNDS;
  }
  // TODO: replace with Supabase call
  throw new Error("Supabase not configured");
}

export function useFunds() {
  return useQuery({
    queryKey: ["funds"],
    queryFn: fetchFunds,
  });
}
