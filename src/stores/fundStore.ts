import { create } from "zustand";
import type { Fund } from "@/types/fund";

interface FundState {
  funds: Fund[];
  selectedFundId: string | null;
  isLoading: boolean;
  setFunds: (funds: Fund[]) => void;
  setSelectedFundId: (id: string | null) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useFundStore = create<FundState>((set) => ({
  funds: [],
  selectedFundId: null,
  isLoading: false,
  setFunds: (funds) => set({ funds }),
  setSelectedFundId: (selectedFundId) => set({ selectedFundId }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));
