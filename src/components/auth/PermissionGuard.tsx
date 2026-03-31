"use client";

import type { ReactNode } from "react";
import type { Permission, Role } from "@/config/permissions";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthStore } from "@/stores/authStore";

interface PermissionGuardProps {
  children: ReactNode;
  /** Require a specific permission (checked against the user's role). */
  requiredPermission?: Permission;
  /** Require one of the listed roles. */
  requiredRole?: Role | Role[];
  /** Rendered when the check fails. Defaults to null (renders nothing). */
  fallback?: ReactNode;
}

/**
 * Renders `children` only when the authenticated user satisfies the
 * required permission and/or role conditions.
 *
 * Usage:
 * ```tsx
 * <PermissionGuard requiredPermission="user:write">
 *   <AddUserButton />
 * </PermissionGuard>
 *
 * <PermissionGuard requiredRole={["super_admin", "admin"]} fallback={<AccessDenied />}>
 *   <AdminPanel />
 * </PermissionGuard>
 * ```
 */
export function PermissionGuard({
  children,
  requiredPermission,
  requiredRole,
  fallback = null,
}: PermissionGuardProps) {
  const { can, role } = usePermissions();
  const { isLoading } = useAuthStore();

  // Don't render anything while auth state is resolving
  if (isLoading) return null;

  // Permission check
  if (requiredPermission && !can(requiredPermission)) {
    return <>{fallback}</>;
  }

  // Role check
  if (requiredRole !== undefined) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!role || !allowedRoles.includes(role)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}
