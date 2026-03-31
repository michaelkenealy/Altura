"use client";

import { useAuthStore } from "@/stores/authStore";
import { hasPermission } from "@/config/permissions";
import type { Permission } from "@/config/permissions";

export function usePermissions() {
  const { userRole } = useAuthStore();

  function can(permission: Permission): boolean {
    if (!userRole) return false;
    return hasPermission(userRole, permission);
  }

  function canAny(...permissions: Permission[]): boolean {
    return permissions.some((p) => can(p));
  }

  function canAll(...permissions: Permission[]): boolean {
    return permissions.every((p) => can(p));
  }

  return { can, canAny, canAll, role: userRole };
}
