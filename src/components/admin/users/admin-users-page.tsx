"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Ban, CheckCircle2, RefreshCw, Trash2, UserCog } from "lucide-react";
import { AdminActionsBar, AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import { PageHeader, PageLoader } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";
import {
  useAdminUsers,
  useDeleteUser,
  useUpdateUserRole,
  useUpdateUserStatus,
} from "@/hooks";
import { formatRoleLabel, formatShortDate } from "@/lib/format";
import { useAppSelector } from "@/store";
import type { ApiError, BackendRole } from "@/types";
import { cn } from "@/utils";

const ASSIGNABLE_ROLES: BackendRole[] = ["STUDENT", "TEACHER", "ADMIN"];

function roleSelectClass(role: string) {
  const r = role.toUpperCase();
  if (r === "ADMIN") return "border-accent/30 bg-accent/10 text-accent";
  if (r === "TEACHER") return "border-primary/30 bg-primary/10 text-primary";
  return "border-accent-green/30 bg-[#ecfdf3] text-accent-green";
}

export function AdminUsersPage() {
  const router = useRouter();
  const currentUser = useAppSelector((s) => s.auth.user);
  const { data = [], isLoading, error, refetch, isFetching } = useAdminUsers();
  const updateStatus = useUpdateUserStatus();
  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [roleSelectNonce, setRoleSelectNonce] = useState(0);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((user) => {
      const matchesRole = roleFilter === "ALL" || user.role.toUpperCase() === roleFilter;
      if (!matchesRole) return false;
      if (!q) return true;
      return (
        user.name.toLowerCase().includes(q) ||
        user.phone.toLowerCase().includes(q) ||
        (user.email ?? "").toLowerCase().includes(q)
      );
    });
  }, [data, search, roleFilter]);

  const busy = updateStatus.isPending || updateRole.isPending || deleteUser.isPending;

  const onToggleActive = async (id: string, isActive: boolean) => {
    setActionError(null);
    setPendingId(id);
    try {
      await updateStatus.mutateAsync({ id, isActive: !isActive });
    } catch (err) {
      const apiError = err as ApiError;
      setActionError(apiError?.message || "Failed to update user status");
    } finally {
      setPendingId(null);
    }
  };

  const onRoleChange = async (id: string, name: string, currentRole: string, nextRole: BackendRole) => {
    if (currentRole.toUpperCase() === nextRole) return;

    const confirmed = window.confirm(
      `Change "${name}" role from ${formatRoleLabel(currentRole)} to ${formatRoleLabel(nextRole)}?`
    );
    if (!confirmed) {
      setRoleSelectNonce((n) => n + 1);
      return;
    }

    setActionError(null);
    setPendingId(id);
    try {
      await updateRole.mutateAsync({ id, role: nextRole });
    } catch (err) {
      const apiError = err as ApiError;
      setActionError(apiError?.message || "Failed to update user role");
    } finally {
      setPendingId(null);
    }
  };

  const onDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(`Delete user "${name}"? This cannot be undone.`);
    if (!confirmed) return;

    setActionError(null);
    setPendingId(id);
    try {
      await deleteUser.mutateAsync(id);
    } catch (err) {
      const apiError = err as ApiError;
      setActionError(apiError?.message || "Failed to delete user");
    } finally {
      setPendingId(null);
    }
  };

  if (isLoading && data.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Users"
          description="Manage accounts — update roles, activate, deactivate, or delete."
          className="mb-0"
        />
        <PageLoader label="Loading users..." />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="border-b border-border px-5 py-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <PageHeader
            title="Users"
            description="Manage accounts — update roles, activate, deactivate, or delete."
            className="mb-0"
          />
          <AdminIconAction
            label="Refresh"
            icon={RefreshCw}
            tone="primary"
            disabled={isFetching}
            onClick={() => void refetch()}
            className={isFetching ? "animate-spin" : undefined}
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or email..."
            className="max-w-md"
          />
          <div className="flex flex-wrap gap-2">
            {["ALL", "STUDENT", "TEACHER", "ADMIN"].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setRoleFilter(role)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  roleFilter === role
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {role === "ALL" ? "All" : formatRoleLabel(role)}
              </button>
            ))}
          </div>
        </div>
        {actionError || error ? (
          <p className="mt-3 text-sm text-accent">
            {actionError || (error as unknown as ApiError)?.message || "Something went wrong"}
            {!actionError && error ? (
              <button type="button" className="ml-2 underline" onClick={() => void refetch()}>
                Retry
              </button>
            ) : null}
          </p>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-semibold">User</th>
              <th className="px-5 py-3 font-semibold">Role</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Joined</th>
              <th className="px-5 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                  No users match your filters.
                </td>
              </tr>
            ) : null}

            {visible.map((user) => {
              const isSelf = currentUser?.id === user.id;
              const isAdmin = user.role.toUpperCase() === "ADMIN";
              const rowBusy = busy && pendingId === user.id;
              const currentRole = user.role.toUpperCase() as BackendRole;
              const detailsHref = ROUTES.admin.userDetail(user.id);

              return (
                <tr
                  key={user.id}
                  role="link"
                  tabIndex={0}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/30"
                  onClick={() => router.push(detailsHref)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(detailsHref);
                    }
                  }}
                >
                  <td className="px-5 py-4">
                    <p className="font-semibold text-foreground">
                      {user.name}
                      {isSelf ? (
                        <span className="ml-2 text-[11px] font-medium text-muted-foreground">(you)</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.phone}
                      {user.email ? ` · ${user.email}` : ""}
                    </p>
                  </td>
                  <td
                    className="px-5 py-4"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <div className="relative inline-flex items-center gap-2">
                      <UserCog className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-current opacity-70" aria-hidden />
                      <select
                        key={`${user.id}-${currentRole}-${roleSelectNonce}`}
                        aria-label={`Update role for ${user.name}`}
                        defaultValue={currentRole}
                        disabled={rowBusy || isSelf}
                        onChange={(e) =>
                          void onRoleChange(user.id, user.name, user.role, e.target.value as BackendRole)
                        }
                        className={cn(
                          "h-9 appearance-none rounded-full border py-1 pl-8 pr-8 text-[11px] font-semibold uppercase tracking-wide outline-none transition focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60",
                          roleSelectClass(user.role)
                        )}
                      >
                        {ASSIGNABLE_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {formatRoleLabel(role)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                        user.isActive ? "bg-[#ecfdf3] text-accent-green" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{formatShortDate(user.createdAt)}</td>
                  <td
                    className="px-5 py-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <AdminActionsBar>
                      <AdminIconAction
                        label={user.isActive ? "Deactivate user" : "Activate user"}
                        icon={user.isActive ? Ban : CheckCircle2}
                        tone={user.isActive ? "warning" : "success"}
                        disabled={rowBusy || isSelf || isAdmin}
                        onClick={() => void onToggleActive(user.id, user.isActive)}
                      />
                      <AdminIconAction
                        label="Delete user"
                        icon={Trash2}
                        tone="danger"
                        disabled={rowBusy || isSelf || isAdmin}
                        onClick={() => void onDelete(user.id, user.name)}
                      />
                    </AdminActionsBar>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
