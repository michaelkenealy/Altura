import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import type { Role } from "@/config/permissions";

interface AuthState {
  user: User | null;
  userRole: Role | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setUserRole: (role: Role | null) => void;
  setIsLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  userRole: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setUserRole: (userRole) => set({ userRole }),
  setIsLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ user: null, userRole: null, isLoading: false }),
}));
