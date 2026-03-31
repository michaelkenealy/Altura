"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import type { Role } from "@/config/permissions";
import type { UserProfile } from "@/types/user";

export function useAuth() {
  const {
    user,
    userProfile,
    userRole,
    isLoading,
    setUser,
    setUserProfile,
    setUserRole,
    setIsLoading,
    reset,
  } = useAuthStore();
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUser(user);
        await fetchUserProfile(user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user.id);
      } else {
        reset();
      }

      if (event === "SIGNED_OUT") {
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select(
          `
          *,
          roles (
            name,
            permissions
          )
        `
        )
        .eq("id", userId)
        .single();

      if (profile) {
        const roleName = (profile as any).roles?.name as Role | undefined;
        const userProfile: UserProfile = {
          id: profile.id,
          email: profile.email ?? "",
          full_name: profile.full_name ?? "",
          role: roleName ?? "viewer",
          fund_access: (profile as any).fund_access ?? [],
          is_active: (profile as any).is_active ?? true,
          last_login: (profile as any).last_login ?? null,
          created_at: profile.created_at ?? "",
          updated_at: profile.updated_at ?? "",
          avatar_url: (profile as any).avatar_url ?? undefined,
          phone: (profile as any).phone ?? undefined,
          department: (profile as any).department ?? undefined,
          title: (profile as any).title ?? undefined,
        };

        setUserProfile(userProfile);
        if (roleName) setUserRole(roleName);
      }

      setIsLoading(false);
      return profile as unknown as UserProfile;
    } catch {
      setIsLoading(false);
      return null;
    }
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }

  async function signOut() {
    await supabase.auth.signOut();
    reset();
    router.push("/login");
  }

  return {
    user,
    userProfile,
    userRole,
    isLoading,
    signIn,
    signOut,
  };
}
