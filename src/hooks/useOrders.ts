import { useQuery } from "@tanstack/react-query";
import { getOrdersByFund, ORDERS, USE_MOCK_DATA, type Order } from "@/lib/mock-data";

async function fetchOrders(fundId?: string): Promise<Order[]> {
  if (USE_MOCK_DATA) {
    await new Promise((r) => setTimeout(r, 90));
    return fundId ? getOrdersByFund(fundId) : ORDERS;
  }
  throw new Error("Supabase not configured");
}

export function useOrders(fundId?: string | null) {
  return useQuery({
    queryKey: ["orders", fundId ?? "all"],
    queryFn: () => fetchOrders(fundId ?? undefined),
  });
}
