"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { hasPermission } from "@/config/permissions";
import type { Permission, Role } from "@/config/permissions";

/**
 * Redirect unauthenticated users to `redirectTo` (default: /login).
 * Returns auth state for convenience.
 */
export function useRequireAuth(redirectTo = "/login") {
  const { user, userRole, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(redirectTo);
    }
  }, [user, isLoading, router, redirectTo]);

  return { user, userRole, isLoading };
}

/**
 * Redirect users that don't have the required role(s).
 * Unauthenticated users are redirected to /login first.
 */
export function useRequireRole(
  requiredRole: Role | Role[],
  redirectTo = "/dashboard"
) {
  const { user, userRole, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!userRole || !roles.includes(userRole)) {
      router.replace(redirectTo);
    }
  }, [user, userRole, isLoading, router, redirectTo, requiredRole]);

  return { user, userRole, isLoading };
}

/**
 * Redirect users that don't have the required permission.
 * Unauthenticated users are redirected to /login first.
 */
export function useRequirePermission(
  permission: Permission,
  redirectTo = "/dashboard"
) {
  const { user, userRole, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!userRole || !hasPermission(userRole, permission)) {
      router.replace(redirectTo);
    }
  }, [user, userRole, isLoading, router, redirectTo, permission]);

  const authorized = !!userRole && hasPermission(userRole, permission);
  return { user, userRole, isLoading, authorized };
}
