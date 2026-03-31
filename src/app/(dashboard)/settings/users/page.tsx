"use client";

import { useEffect, useState, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  UserPlus,
  Search,
  MoreHorizontal,
  ChevronDown,
  Check,
  X,
  Loader2,
  Mail,
  Shield,
  Clock,
  AlertCircle,
  UserCheck,
  UserX,
  Pencil,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useRequirePermission } from "@/hooks/useRequireAuth";
import { ROLE_PERMISSIONS } from "@/config/permissions";
import type { Role } from "@/config/permissions";
import type { UserProfile } from "@/types/user";
import { formatDate } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrgUser extends UserProfile {
  org_id?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  portfolio_manager: "Portfolio Manager",
  analyst: "Analyst",
  trader: "Trader",
  compliance_officer: "Compliance Officer",
  operations: "Operations",
  viewer: "Viewer",
};

const ROLE_COLORS: Record<Role, { bg: string; text: string }> = {
  super_admin: { bg: "rgba(197,165,114,0.15)", text: "#C5A572" },
  admin: { bg: "rgba(197,165,114,0.1)", text: "#B08A52" },
  portfolio_manager: { bg: "rgba(59,130,246,0.15)", text: "#60A5FA" },
  analyst: { bg: "rgba(139,92,246,0.15)", text: "#A78BFA" },
  trader: { bg: "rgba(34,197,94,0.15)", text: "#4ADE80" },
  compliance_officer: { bg: "rgba(245,158,11,0.15)", text: "#FCD34D" },
  operations: { bg: "rgba(20,184,166,0.15)", text: "#2DD4BF" },
  viewer: { bg: "rgba(148,163,184,0.1)", text: "#94A3B8" },
};

// ─── Add User Schema ──────────────────────────────────────────────────────────

const addUserSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  role: z.enum([
    "super_admin",
    "admin",
    "portfolio_manager",
    "analyst",
    "trader",
    "compliance_officer",
    "operations",
    "viewer",
  ] as const),
});

type AddUserFormData = z.infer<typeof addUserSchema>;

// ─── Role Badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: Role }) {
  const colors = ROLE_COLORS[role];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      <Shield size={10} />
      {ROLE_LABELS[role]}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={
        isActive
          ? { backgroundColor: "rgba(34,197,94,0.12)", color: "#4ADE80" }
          : { backgroundColor: "rgba(148,163,184,0.1)", color: "#94A3B8" }
      }
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: isActive ? "#4ADE80" : "#64748B" }}
      />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

// ─── Role Select ──────────────────────────────────────────────────────────────

function RoleSelect({
  value,
  onChange,
  disabled,
}: {
  value: Role;
  onChange: (role: Role) => void;
  disabled?: boolean;
}) {
  return (
    <Select.Root value={value} onValueChange={(v) => onChange(v as Role)} disabled={disabled}>
      <Select.Trigger
        className="flex items-center gap-1.5 rounded px-2 py-1 text-sm outline-none transition-colors"
        style={{
          backgroundColor: "var(--altura-navy-elevated)",
          border: "1px solid var(--altura-border)",
          color: "var(--altura-text-primary)",
        }}
      >
        <Select.Value />
        <Select.Icon>
          <ChevronDown size={12} style={{ color: "var(--altura-text-muted)" }} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          className="z-50 min-w-[160px] overflow-hidden rounded-md shadow-lg"
          style={{
            backgroundColor: "var(--altura-navy-elevated)",
            border: "1px solid var(--altura-border)",
          }}
          position="popper"
          sideOffset={4}
        >
          <Select.Viewport className="p-1">
            {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
              <Select.Item
                key={role}
                value={role}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm outline-none data-[highlighted]:opacity-80"
                style={{ color: "var(--altura-text-primary)" }}
              >
                <Select.ItemIndicator>
                  <Check size={12} style={{ color: "var(--altura-gold)" }} />
                </Select.ItemIndicator>
                <Select.ItemText>{ROLE_LABELS[role]}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

// ─── Add User Modal ───────────────────────────────────────────────────────────

function AddUserModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AddUserFormData>({
    resolver: zodResolver(addUserSchema),
    defaultValues: { role: "viewer" },
  });

  const supabase = createClient();
  const { userProfile } = useAuthStore();
  const selectedRole = watch("role");

  async function onSubmit(data: AddUserFormData) {
    // Invite the user via Supabase Admin (requires service role in production).
    // In this implementation we call a hypothetical RPC or direct insert.
    // The actual invitation flow would use supabase.auth.admin.inviteUserByEmail()
    // which requires the service-role key on a secure server action.
    // Here we demonstrate the client-side call pattern.
    try {
      const { error } = await supabase.rpc("invite_org_user", {
        p_email: data.email,
        p_full_name: data.full_name,
        p_role: data.role,
        p_org_id: userProfile?.id ?? "",
      });

      if (error) {
        setError("root", { message: error.message });
        return;
      }

      reset();
      onSuccess();
      onClose();
    } catch {
      setError("root", { message: "Failed to invite user. Please try again." });
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-40 animate-fade-in"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl p-6 shadow-2xl animate-slide-in"
          style={{
            backgroundColor: "var(--altura-navy-surface)",
            border: "1px solid var(--altura-border)",
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <Dialog.Title
                className="text-base font-semibold"
                style={{ color: "var(--altura-text-primary)" }}
              >
                Invite User
              </Dialog.Title>
              <Dialog.Description
                className="text-xs mt-0.5"
                style={{ color: "var(--altura-text-muted)" }}
              >
                Send an invitation email to add a new team member.
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="rounded p-1 transition-opacity hover:opacity-70"
              style={{ color: "var(--altura-text-muted)" }}
            >
              <X size={16} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errors.root && (
              <div
                className="flex items-start gap-2 rounded-md p-3 text-xs"
                style={{
                  backgroundColor: "rgba(239,68,68,0.08)",
                  color: "#EF4444",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                {errors.root.message}
              </div>
            )}

            {/* Name */}
            <div className="space-y-1.5">
              <label
                className="text-xs font-medium"
                style={{ color: "var(--altura-text-secondary)" }}
              >
                Full name
              </label>
              <input
                {...register("full_name")}
                placeholder="Jane Smith"
                className="w-full rounded-md px-3 py-2 text-sm outline-none transition-all"
                style={{
                  backgroundColor: "var(--altura-navy-elevated)",
                  border: `1px solid ${errors.full_name ? "#EF4444" : "var(--altura-border)"}`,
                  color: "var(--altura-text-primary)",
                }}
              />
              {errors.full_name && (
                <p className="text-xs" style={{ color: "#EF4444" }}>
                  {errors.full_name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label
                className="text-xs font-medium"
                style={{ color: "var(--altura-text-secondary)" }}
              >
                Email address
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="jane@firm.com"
                className="w-full rounded-md px-3 py-2 text-sm outline-none transition-all"
                style={{
                  backgroundColor: "var(--altura-navy-elevated)",
                  border: `1px solid ${errors.email ? "#EF4444" : "var(--altura-border)"}`,
                  color: "var(--altura-text-primary)",
                }}
              />
              {errors.email && (
                <p className="text-xs" style={{ color: "#EF4444" }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <label
                className="text-xs font-medium"
                style={{ color: "var(--altura-text-secondary)" }}
              >
                Role
              </label>
              <Select.Root
                value={selectedRole}
                onValueChange={(v) => setValue("role", v as Role)}
              >
                <Select.Trigger
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm outline-none"
                  style={{
                    backgroundColor: "var(--altura-navy-elevated)",
                    border: "1px solid var(--altura-border)",
                    color: "var(--altura-text-primary)",
                  }}
                >
                  <Select.Value />
                  <Select.Icon>
                    <ChevronDown size={14} style={{ color: "var(--altura-text-muted)" }} />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content
                    className="z-50 w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md shadow-lg"
                    style={{
                      backgroundColor: "var(--altura-navy-elevated)",
                      border: "1px solid var(--altura-border)",
                    }}
                    position="popper"
                    sideOffset={4}
                  >
                    <Select.Viewport className="p-1">
                      {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
                        <Select.Item
                          key={role}
                          value={role}
                          className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm outline-none data-[highlighted]:opacity-80"
                          style={{ color: "var(--altura-text-primary)" }}
                        >
                          <Select.ItemIndicator>
                            <Check size={13} style={{ color: "var(--altura-gold)" }} />
                          </Select.ItemIndicator>
                          <Select.ItemText>{ROLE_LABELS[role]}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Dialog.Close
                type="button"
                className="flex-1 rounded-md py-2 text-sm transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: "var(--altura-navy-elevated)",
                  border: "1px solid var(--altura-border)",
                  color: "var(--altura-text-secondary)",
                }}
              >
                Cancel
              </Dialog.Close>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-semibold transition-opacity disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, #C5A572 0%, #B08A52 100%)",
                  color: "var(--altura-navy)",
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Mail size={14} />
                    Send Invite
                  </>
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  useRequirePermission("user:read");

  const [users, setUsers] = useState<OrgUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [savingRoleFor, setSavingRoleFor] = useState<string | null>(null);
  const [togglingFor, setTogglingFor] = useState<string | null>(null);

  const supabase = createClient();
  const { userProfile } = useAuthStore();

  const fetchUsers = useCallback(async () => {
    if (!userProfile) return;
    setIsLoading(true);

    try {
      const { data } = await supabase
        .from("user_profiles")
        .select(
          `
          *,
          roles (name)
        `
        )
        .eq("org_id", (userProfile as any).org_id ?? "")
        .order("created_at", { ascending: false });

      if (data) {
        const mapped: OrgUser[] = data.map((p: any) => ({
          id: p.id,
          email: p.email ?? "",
          full_name: p.full_name ?? "",
          role: (p.roles?.name ?? "viewer") as Role,
          fund_access: p.fund_access ?? [],
          is_active: p.is_active ?? true,
          last_login: p.last_login ?? null,
          created_at: p.created_at ?? "",
          updated_at: p.updated_at ?? "",
          org_id: p.org_id,
        }));
        setUsers(mapped);
      }
    } finally {
      setIsLoading(false);
    }
  }, [supabase, userProfile]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleRoleChange(userId: string, role: Role) {
    setSavingRoleFor(userId);
    // Optimistic update
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));

    try {
      await supabase
        .from("user_profiles")
        .update({ role_id: role })
        .eq("id", userId);
    } finally {
      setSavingRoleFor(null);
      setEditingUserId(null);
    }
  }

  async function handleToggleActive(userId: string, currentlyActive: boolean) {
    setTogglingFor(userId);
    const newState = !currentlyActive;
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_active: newState } : u))
    );

    try {
      await supabase
        .from("user_profiles")
        .update({ is_active: newState })
        .eq("id", userId);
    } finally {
      setTogglingFor(null);
    }
  }

  const filtered = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <PermissionGuard
      requiredPermission="user:read"
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <Shield size={32} className="mx-auto mb-3 opacity-30" style={{ color: "var(--altura-text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--altura-text-muted)" }}>
              You don&apos;t have permission to view this page.
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
              Users
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--altura-text-secondary)" }}>
              {users.length} member{users.length !== 1 ? "s" : ""} in your organisation
            </p>
          </div>

          <PermissionGuard requiredPermission="user:write">
            <button
              onClick={() => setAddModalOpen(true)}
              className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #C5A572 0%, #B08A52 100%)",
                color: "var(--altura-navy)",
              }}
            >
              <UserPlus size={15} />
              Invite User
            </button>
          </PermissionGuard>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--altura-text-muted)" }}
          />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md py-2.5 pl-9 pr-4 text-sm outline-none transition-all"
            style={{
              backgroundColor: "var(--altura-navy-surface)",
              border: "1px solid var(--altura-border)",
              color: "var(--altura-text-primary)",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--altura-gold)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--altura-border)")}
          />
        </div>

        {/* Table */}
        <div
          className="overflow-hidden rounded-xl"
          style={{ border: "1px solid var(--altura-border)" }}
        >
          {isLoading ? (
            <div
              className="flex h-48 items-center justify-center gap-3"
              style={{ backgroundColor: "var(--altura-navy-surface)" }}
            >
              <Loader2 size={18} className="animate-spin" style={{ color: "var(--altura-gold)" }} />
              <span className="text-sm" style={{ color: "var(--altura-text-muted)" }}>
                Loading users…
              </span>
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="flex h-48 flex-col items-center justify-center gap-3"
              style={{ backgroundColor: "var(--altura-navy-surface)" }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: "var(--altura-navy-elevated)" }}
              >
                <Search size={18} style={{ color: "var(--altura-text-muted)" }} />
              </div>
              <p className="text-sm" style={{ color: "var(--altura-text-muted)" }}>
                {search ? "No users match your search." : "No users found."}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    backgroundColor: "var(--altura-navy-elevated)",
                    borderBottom: "1px solid var(--altura-border)",
                  }}
                >
                  {["User", "Role", "Status", "Last Login", ""].map((col) => (
                    <th
                      key={col}
                      className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        col === "" ? "w-10" : ""
                      }`}
                      style={{ color: "var(--altura-text-muted)" }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ backgroundColor: "var(--altura-navy-surface)" }}>
                {filtered.map((user, idx) => (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom:
                        idx < filtered.length - 1
                          ? "1px solid var(--altura-border)"
                          : undefined,
                    }}
                  >
                    {/* User */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                          style={{
                            background: "linear-gradient(135deg, #C5A572 0%, #B08A52 100%)",
                            color: "var(--altura-navy)",
                          }}
                        >
                          {initials(user.full_name || user.email)}
                        </div>
                        <div>
                          <div
                            className="font-medium text-sm"
                            style={{ color: "var(--altura-text-primary)" }}
                          >
                            {user.full_name || "—"}
                          </div>
                          <div
                            className="text-xs flex items-center gap-1 mt-0.5"
                            style={{ color: "var(--altura-text-muted)" }}
                          >
                            <Mail size={10} />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3.5">
                      <PermissionGuard
                        requiredPermission="user:write"
                        fallback={<RoleBadge role={user.role} />}
                      >
                        {editingUserId === user.id ? (
                          <div className="flex items-center gap-2">
                            <RoleSelect
                              value={user.role}
                              onChange={(role) => handleRoleChange(user.id, role)}
                              disabled={savingRoleFor === user.id}
                            />
                            {savingRoleFor === user.id ? (
                              <Loader2 size={13} className="animate-spin" style={{ color: "var(--altura-gold)" }} />
                            ) : (
                              <button
                                onClick={() => setEditingUserId(null)}
                                className="rounded p-0.5 hover:opacity-70"
                                style={{ color: "var(--altura-text-muted)" }}
                              >
                                <X size={13} />
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingUserId(user.id)}
                            className="group flex items-center gap-1.5"
                          >
                            <RoleBadge role={user.role} />
                            <Pencil
                              size={11}
                              className="opacity-0 group-hover:opacity-60 transition-opacity"
                              style={{ color: "var(--altura-text-muted)" }}
                            />
                          </button>
                        )}
                      </PermissionGuard>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <StatusBadge isActive={user.is_active} />
                    </td>

                    {/* Last Login */}
                    <td className="px-4 py-3.5">
                      <div
                        className="flex items-center gap-1.5 text-xs"
                        style={{ color: "var(--altura-text-muted)" }}
                      >
                        <Clock size={12} />
                        {user.last_login
                          ? formatDate(user.last_login, "medium")
                          : "Never"}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <PermissionGuard requiredPermission="user:write">
                        <button
                          onClick={() => handleToggleActive(user.id, user.is_active)}
                          disabled={togglingFor === user.id}
                          title={user.is_active ? "Deactivate user" : "Activate user"}
                          className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                          style={
                            user.is_active
                              ? {
                                  backgroundColor: "rgba(239,68,68,0.1)",
                                  color: "#F87171",
                                  border: "1px solid rgba(239,68,68,0.2)",
                                }
                              : {
                                  backgroundColor: "rgba(34,197,94,0.1)",
                                  color: "#4ADE80",
                                  border: "1px solid rgba(34,197,94,0.2)",
                                }
                          }
                        >
                          {togglingFor === user.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : user.is_active ? (
                            <UserX size={12} />
                          ) : (
                            <UserCheck size={12} />
                          )}
                          {user.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </PermissionGuard>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary footer */}
        {!isLoading && users.length > 0 && (
          <div
            className="flex items-center justify-between rounded-lg px-4 py-3 text-xs"
            style={{
              backgroundColor: "var(--altura-navy-surface)",
              border: "1px solid var(--altura-border)",
              color: "var(--altura-text-muted)",
            }}
          >
            <span>
              Showing {filtered.length} of {users.length} users
            </span>
            <span>
              {users.filter((u) => u.is_active).length} active ·{" "}
              {users.filter((u) => !u.is_active).length} inactive
            </span>
          </div>
        )}
      </div>

      <AddUserModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={fetchUsers}
      />
    </PermissionGuard>
  );
}
