export type Permission =
  | "fund:read"
  | "fund:write"
  | "fund:delete"
  | "portfolio:read"
  | "portfolio:write"
  | "order:read"
  | "order:write"
  | "order:approve"
  | "compliance:read"
  | "compliance:write"
  | "operations:read"
  | "operations:write"
  | "user:read"
  | "user:write"
  | "user:delete"
  | "role:read"
  | "role:write"
  | "settings:read"
  | "settings:write";

export type Role =
  | "super_admin"
  | "admin"
  | "portfolio_manager"
  | "analyst"
  | "trader"
  | "compliance_officer"
  | "operations"
  | "viewer";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    "fund:read", "fund:write", "fund:delete",
    "portfolio:read", "portfolio:write",
    "order:read", "order:write", "order:approve",
    "compliance:read", "compliance:write",
    "operations:read", "operations:write",
    "user:read", "user:write", "user:delete",
    "role:read", "role:write",
    "settings:read", "settings:write",
  ],
  admin: [
    "fund:read", "fund:write",
    "portfolio:read", "portfolio:write",
    "order:read", "order:write", "order:approve",
    "compliance:read", "compliance:write",
    "operations:read", "operations:write",
    "user:read", "user:write",
    "role:read",
    "settings:read", "settings:write",
  ],
  portfolio_manager: [
    "fund:read", "fund:write",
    "portfolio:read", "portfolio:write",
    "order:read", "order:write",
    "compliance:read",
    "operations:read",
    "settings:read",
  ],
  analyst: [
    "fund:read",
    "portfolio:read",
    "order:read",
    "compliance:read",
    "settings:read",
  ],
  trader: [
    "fund:read",
    "portfolio:read",
    "order:read", "order:write",
    "settings:read",
  ],
  compliance_officer: [
    "fund:read",
    "portfolio:read",
    "order:read", "order:approve",
    "compliance:read", "compliance:write",
    "settings:read",
  ],
  operations: [
    "fund:read",
    "portfolio:read",
    "order:read",
    "operations:read", "operations:write",
    "settings:read",
  ],
  viewer: [
    "fund:read",
    "portfolio:read",
    "order:read",
    "settings:read",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
