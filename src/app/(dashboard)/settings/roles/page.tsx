"use client";

import { useState } from "react";
import { Check, X, Shield, Lock, ChevronDown, ChevronUp, Info } from "lucide-react";
import { ROLE_PERMISSIONS } from "@/config/permissions";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useRequirePermission } from "@/hooks/useRequireAuth";
import type { Permission, Role } from "@/config/permissions";

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  portfolio_manager: "Portfolio Mgr",
  analyst: "Analyst",
  trader: "Trader",
  compliance_officer: "Compliance",
  operations: "Operations",
  viewer: "Viewer",
};

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  super_admin: "Full platform access including user management and billing.",
  admin: "Manage users, roles, and all fund data. Cannot delete users.",
  portfolio_manager: "Manage portfolios, funds, and create orders.",
  analyst: "Read-only access to all investment data and reports.",
  trader: "Create and manage orders. No compliance or admin access.",
  compliance_officer: "Monitor compliance rules and approve orders.",
  operations: "Manage operational tasks, cash movements, and settlements.",
  viewer: "Read-only access to funds, portfolios, and orders.",
};

const PERMISSION_GROUPS: { label: string; permissions: Permission[] }[] = [
  {
    label: "Funds",
    permissions: ["fund:read", "fund:write", "fund:delete"],
  },
  {
    label: "Portfolio",
    permissions: ["portfolio:read", "portfolio:write"],
  },
  {
    label: "Orders",
    permissions: ["order:read", "order:write", "order:approve"],
  },
  {
    label: "Compliance",
    permissions: ["compliance:read", "compliance:write"],
  },
  {
    label: "Operations",
    permissions: ["operations:read", "operations:write"],
  },
  {
    label: "Users",
    permissions: ["user:read", "user:write", "user:delete"],
  },
  {
    label: "Roles",
    permissions: ["role:read", "role:write"],
  },
  {
    label: "Settings",
    permissions: ["settings:read", "settings:write"],
  },
];

const PERMISSION_LABELS: Record<Permission, string> = {
  "fund:read": "View funds",
  "fund:write": "Edit funds",
  "fund:delete": "Delete funds",
  "portfolio:read": "View portfolios",
  "portfolio:write": "Edit portfolios",
  "order:read": "View orders",
  "order:write": "Create/edit orders",
  "order:approve": "Approve orders",
  "compliance:read": "View compliance",
  "compliance:write": "Edit compliance rules",
  "operations:read": "View operations",
  "operations:write": "Edit operations",
  "user:read": "View users",
  "user:write": "Invite/edit users",
  "user:delete": "Delete users",
  "role:read": "View roles",
  "role:write": "Edit roles",
  "settings:read": "View settings",
  "settings:write": "Edit settings",
};

const ROLES = Object.keys(ROLE_LABELS) as Role[];

const ROLE_COLORS: Record<Role, string> = {
  super_admin: "#C5A572",
  admin: "#B08A52",
  portfolio_manager: "#60A5FA",
  analyst: "#A78BFA",
  trader: "#4ADE80",
  compliance_officer: "#FCD34D",
  operations: "#2DD4BF",
  viewer: "#94A3B8",
};

// ─── Permission Cell ──────────────────────────────────────────────────────────

function PermCell({
  hasIt,
  canEdit,
  onToggle,
}: {
  hasIt: boolean;
  canEdit: boolean;
  onToggle?: () => void;
}) {
  if (!canEdit) {
    return (
      <td className="px-3 py-2.5 text-center">
        {hasIt ? (
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full mx-auto"
            style={{ backgroundColor: "rgba(34,197,94,0.15)" }}
          >
            <Check size={11} style={{ color: "#4ADE80" }} />
          </span>
        ) : (
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full mx-auto opacity-30"
            style={{ backgroundColor: "rgba(148,163,184,0.1)" }}
          >
            <X size={10} style={{ color: "#64748B" }} />
          </span>
        )}
      </td>
    );
  }

  return (
    <td className="px-3 py-2.5 text-center">
      <button
        onClick={onToggle}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full mx-auto transition-all hover:scale-110"
        style={
          hasIt
            ? { backgroundColor: "rgba(34,197,94,0.15)" }
            : { backgroundColor: "rgba(148,163,184,0.08)", border: "1px dashed #334155" }
        }
      >
        {hasIt ? (
          <Check size={11} style={{ color: "#4ADE80" }} />
        ) : (
          <X size={10} style={{ color: "#475569" }} />
        )}
      </button>
    </td>
  );
}

// ─── Role Card (Summary) ──────────────────────────────────────────────────────

function RoleCard({ role, isSelected, onClick }: { role: Role; isSelected: boolean; onClick: () => void }) {
  const permCount = ROLE_PERMISSIONS[role].length;
  const totalPerms = Object.keys(PERMISSION_LABELS).length;

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl p-4 transition-all"
      style={{
        backgroundColor: isSelected
          ? "var(--altura-navy-elevated)"
          : "var(--altura-navy-surface)",
        border: `1px solid ${isSelected ? ROLE_COLORS[role] + "60" : "var(--altura-border)"}`,
        boxShadow: isSelected ? `0 0 0 1px ${ROLE_COLORS[role]}30` : undefined,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ backgroundColor: ROLE_COLORS[role] + "20" }}
          >
            <Shield size={13} style={{ color: ROLE_COLORS[role] }} />
          </div>
          <span
            className="text-sm font-semibold"
            style={{ color: isSelected ? ROLE_COLORS[role] : "var(--altura-text-primary)" }}
          >
            {ROLE_LABELS[role]}
          </span>
        </div>
        <span className="text-xs" style={{ color: "var(--altura-text-muted)" }}>
          {permCount}/{totalPerms}
        </span>
      </div>

      {/* Permission bar */}
      <div
        className="mb-2.5 h-1.5 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: "var(--altura-border)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${(permCount / totalPerms) * 100}%`,
            backgroundColor: ROLE_COLORS[role],
          }}
        />
      </div>

      <p className="text-xs leading-relaxed" style={{ color: "var(--altura-text-muted)" }}>
        {ROLE_DESCRIPTIONS[role]}
      </p>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RolesPage() {
  useRequirePermission("role:read");

  const { can } = usePermissions();
  const canEditRoles = can("role:write");

  const [selectedRole, setSelectedRole] = useState<Role>("admin");
  const [permissions, setPermissions] = useState<Record<Role, Permission[]>>({
    ...ROLE_PERMISSIONS,
  });
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(PERMISSION_GROUPS.map((g) => g.label))
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  function togglePermission(role: Role, permission: Permission) {
    if (!canEditRoles) return;
    setPermissions((prev) => {
      const current = prev[role];
      const updated = current.includes(permission)
        ? current.filter((p) => p !== permission)
        : [...current, permission];
      return { ...prev, [role]: updated };
    });
    setHasUnsavedChanges(true);
  }

  function toggleGroup(label: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  async function handleSave() {
    setIsSaving(true);
    // In production: call supabase to update role permissions
    await new Promise((r) => setTimeout(r, 800));
    setHasUnsavedChanges(false);
    setIsSaving(false);
  }

  function handleDiscard() {
    setPermissions({ ...ROLE_PERMISSIONS });
    setHasUnsavedChanges(false);
  }

  return (
    <PermissionGuard
      requiredPermission="role:read"
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <Lock size={32} className="mx-auto mb-3 opacity-30" style={{ color: "var(--altura-text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--altura-text-muted)" }}>
              You don&apos;t have permission to view roles.
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-semibold tracking-tight"
              style={{ color: "var(--altura-text-primary)" }}
            >
              Roles & Permissions
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--altura-text-secondary)" }}>
              Configure role-based access control for your organisation.
            </p>
          </div>

          {canEditRoles && hasUnsavedChanges && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleDiscard}
                className="rounded-md px-3 py-2 text-sm transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: "var(--altura-navy-elevated)",
                  border: "1px solid var(--altura-border)",
                  color: "var(--altura-text-secondary)",
                }}
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-opacity disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, #C5A572 0%, #B08A52 100%)",
                  color: "var(--altura-navy)",
                }}
              >
                {isSaving ? (
                  <span className="animate-pulse">Saving…</span>
                ) : (
                  "Save changes"
                )}
              </button>
            </div>
          )}
        </div>

        {/* Read-only notice */}
        {!canEditRoles && (
          <div
            className="flex items-center gap-2.5 rounded-lg px-4 py-3 text-sm"
            style={{
              backgroundColor: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.2)",
              color: "#93C5FD",
            }}
          >
            <Info size={15} className="shrink-0" />
            You have read-only access. Contact an admin to modify role permissions.
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          {/* Role list */}
          <div className="col-span-4 space-y-2">
            <p
              className="text-xs font-medium uppercase tracking-wider mb-3"
              style={{ color: "var(--altura-text-muted)" }}
            >
              Roles ({ROLES.length})
            </p>
            {ROLES.map((role) => (
              <RoleCard
                key={role}
                role={role}
                isSelected={selectedRole === role}
                onClick={() => setSelectedRole(role)}
              />
            ))}
          </div>

          {/* Permission matrix */}
          <div className="col-span-8">
            <div
              className="overflow-hidden rounded-xl"
              style={{ border: "1px solid var(--altura-border)" }}
            >
              {/* Matrix header */}
              <div
                className="flex items-center justify-between px-5 py-3.5"
                style={{
                  backgroundColor: "var(--altura-navy-elevated)",
                  borderBottom: "1px solid var(--altura-border)",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{ backgroundColor: ROLE_COLORS[selectedRole] + "20" }}
                  >
                    <Shield size={14} style={{ color: ROLE_COLORS[selectedRole] }} />
                  </div>
                  <div>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "var(--altura-text-primary)" }}
                    >
                      {ROLE_LABELS[selectedRole]}
                    </span>
                    <span className="ml-2 text-xs" style={{ color: "var(--altura-text-muted)" }}>
                      {permissions[selectedRole].length} permissions
                    </span>
                  </div>
                </div>
                {canEditRoles ? (
                  <span
                    className="text-xs rounded-full px-2.5 py-1"
                    style={{
                      backgroundColor: "rgba(197,165,114,0.1)",
                      color: "var(--altura-gold)",
                    }}
                  >
                    Editable
                  </span>
                ) : (
                  <span
                    className="flex items-center gap-1 text-xs"
                    style={{ color: "var(--altura-text-muted)" }}
                  >
                    <Lock size={11} />
                    Read-only
                  </span>
                )}
              </div>

              {/* Permission groups */}
              <div style={{ backgroundColor: "var(--altura-navy-surface)" }}>
                {PERMISSION_GROUPS.map((group, gIdx) => {
                  const isExpanded = expandedGroups.has(group.label);
                  const groupPerms = permissions[selectedRole].filter((p) =>
                    group.permissions.includes(p)
                  );

                  return (
                    <div
                      key={group.label}
                      style={
                        gIdx < PERMISSION_GROUPS.length - 1
                          ? { borderBottom: "1px solid var(--altura-border)" }
                          : undefined
                      }
                    >
                      {/* Group header */}
                      <button
                        onClick={() => toggleGroup(group.label)}
                        className="flex w-full items-center justify-between px-5 py-3 transition-opacity hover:opacity-80"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs font-semibold uppercase tracking-wider"
                            style={{ color: "var(--altura-text-secondary)" }}
                          >
                            {group.label}
                          </span>
                          <span
                            className="text-xs rounded-full px-1.5 py-0.5"
                            style={{
                              backgroundColor: "var(--altura-navy-elevated)",
                              color: "var(--altura-text-muted)",
                            }}
                          >
                            {groupPerms.length}/{group.permissions.length}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp size={14} style={{ color: "var(--altura-text-muted)" }} />
                        ) : (
                          <ChevronDown size={14} style={{ color: "var(--altura-text-muted)" }} />
                        )}
                      </button>

                      {/* Permission rows */}
                      {isExpanded && (
                        <table className="w-full text-sm">
                          <tbody>
                            {group.permissions.map((perm, pIdx) => {
                              const hasIt = permissions[selectedRole].includes(perm);
                              return (
                                <tr
                                  key={perm}
                                  style={
                                    pIdx < group.permissions.length - 1
                                      ? { borderTop: "1px solid var(--altura-border)" }
                                      : { borderTop: "1px solid var(--altura-border)" }
                                  }
                                >
                                  <td className="px-5 py-2.5 pl-8">
                                    <span
                                      className="text-xs"
                                      style={{ color: "var(--altura-text-secondary)" }}
                                    >
                                      {PERMISSION_LABELS[perm]}
                                    </span>
                                    <span
                                      className="ml-2 text-xs font-mono opacity-50"
                                      style={{ color: "var(--altura-text-muted)" }}
                                    >
                                      {perm}
                                    </span>
                                  </td>
                                  <PermCell
                                    hasIt={hasIt}
                                    canEdit={canEditRoles}
                                    onToggle={() =>
                                      togglePermission(selectedRole, perm)
                                    }
                                  />
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* All-roles quick overview */}
            <div
              className="mt-4 overflow-hidden rounded-xl"
              style={{ border: "1px solid var(--altura-border)" }}
            >
              <div
                className="px-5 py-3"
                style={{
                  backgroundColor: "var(--altura-navy-elevated)",
                  borderBottom: "1px solid var(--altura-border)",
                }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--altura-text-muted)" }}
                >
                  All Roles — Quick Overview
                </p>
              </div>
              <div style={{ backgroundColor: "var(--altura-navy-surface)" }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--altura-border)" }}>
                      <th
                        className="px-5 py-2.5 text-left font-medium"
                        style={{ color: "var(--altura-text-muted)" }}
                      >
                        Permission
                      </th>
                      {ROLES.map((role) => (
                        <th
                          key={role}
                          className="px-3 py-2.5 text-center font-medium"
                          style={{
                            color:
                              role === selectedRole
                                ? ROLE_COLORS[role]
                                : "var(--altura-text-muted)",
                            minWidth: "72px",
                          }}
                        >
                          {ROLE_LABELS[role].split(" ")[0]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERMISSION_GROUPS.map((group) =>
                      group.permissions.map((perm, pIdx) => (
                        <tr
                          key={perm}
                          style={{
                            borderTop: "1px solid var(--altura-border)",
                            backgroundColor:
                              pIdx % 2 === 0
                                ? "transparent"
                                : "rgba(255,255,255,0.01)",
                          }}
                        >
                          <td
                            className="px-5 py-2"
                            style={{ color: "var(--altura-text-secondary)" }}
                          >
                            {PERMISSION_LABELS[perm]}
                          </td>
                          {ROLES.map((role) => {
                            const hasIt = ROLE_PERMISSIONS[role].includes(perm);
                            return (
                              <td
                                key={role}
                                className="px-3 py-2 text-center"
                                style={
                                  role === selectedRole
                                    ? { backgroundColor: ROLE_COLORS[role] + "08" }
                                    : undefined
                                }
                              >
                                {hasIt ? (
                                  <Check
                                    size={11}
                                    className="mx-auto"
                                    style={{ color: "#4ADE80" }}
                                  />
                                ) : (
                                  <span
                                    className="block h-0.5 w-3 rounded-full mx-auto opacity-20"
                                    style={{ backgroundColor: "#64748B" }}
                                  />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
