"use client";

import { useFundStore } from "@/stores/fundStore";

export function useFund() {
  const { selectedFundId, setSelectedFundId, funds } = useFundStore();
  const selectedFund = funds.find((f) => f.id === selectedFundId) ?? null;

  return {
    selectedFund,
    selectedFundId,
    setSelectedFundId,
    funds,
  };
}
