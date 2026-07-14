"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminUsers, useUpdateUserStatus } from "@/hooks";
import { formatRoleLabel, formatShortDate } from "@/lib/format";
import type { ApiError } from "@/types";
import { cn } from "@/utils";

function roleBadgeClass(role: string) {
  const r = role.toUpperCase();
  if (r === "ADMIN") return "bg-accent/10 text-accent";
  if (r === "TEACHER") return "bg-primary/10 text-primary";
  return "bg-[#ecfdf3] text-accent-green";
}

export function AdminUsersPage() {
  const { data = [], isLoading, error, refetch } = useAdminUsers();
  const updateStatus = useUpdateUserStatus();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [actionError, setActionError] = useState<string | null>(null);

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

  const onToggleActive = async (id: string, isActive: boolean) => {
    setActionError(null);
    try {
      await updateStatus.mutateAsync({ id, isActive: !isActive });
    } catch (err) {
      const apiError = err as ApiError;
      setActionError(apiError?.message || "Failed to update user status");
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="border-b border-border px-5 py-6">
        <PageHeader
          title="Users"
          description="Manage platform accounts — activate, deactivate, and filter by role."
          className="mb-4"
        />
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
        <table className="w-full min-w-[720px] text-left text-sm">
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
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td colSpan={5} className="px-5 py-4">
                      <div className="h-10 animate-pulse rounded-lg bg-muted" />
                    </td>
                  </tr>
                ))
              : null}

            {!isLoading && visible.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                  No users match your filters.
                </td>
              </tr>
            ) : null}

            {visible.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-5 py-4">
                  <p className="font-semibold text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.phone}
                    {user.email ? ` · ${user.email}` : ""}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                      roleBadgeClass(user.role)
                    )}
                  >
                    {formatRoleLabel(user.role)}
                  </span>
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
                <td className="px-5 py-4 text-right">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={updateStatus.isPending || user.role.toUpperCase() === "ADMIN"}
                    onClick={() => void onToggleActive(user.id, user.isActive)}
                  >
                    {user.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
