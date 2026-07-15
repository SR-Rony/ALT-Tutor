"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Ban, CheckCircle2, Mail, Phone, Trash2, UserCog } from "lucide-react";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import {
  useAdminUser,
  useDeleteUser,
  useUpdateUserRole,
  useUpdateUserStatus,
} from "@/hooks";
import { formatRoleLabel, formatShortDate } from "@/lib/format";
import { useAppSelector } from "@/store";
import type { ApiError, BackendRole } from "@/types";
import { cn } from "@/utils";

const ASSIGNABLE_ROLES: BackendRole[] = ["STUDENT", "TEACHER", "ADMIN"];

type Props = { userId: string };

function roleBadgeClass(role: string) {
  const r = role.toUpperCase();
  if (r === "ADMIN") return "bg-accent/10 text-accent";
  if (r === "TEACHER") return "bg-primary/10 text-primary";
  return "bg-[#ecfdf3] text-accent-green";
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AdminUserDetailPage({ userId }: Props) {
  const router = useRouter();
  const currentUser = useAppSelector((s) => s.auth.user);
  const { data: user, isLoading, error, refetch } = useAdminUser(userId);
  const updateStatus = useUpdateUserStatus();
  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();

  const [actionError, setActionError] = useState<string | null>(null);
  const [roleSelectNonce, setRoleSelectNonce] = useState(0);

  const busy = updateStatus.isPending || updateRole.isPending || deleteUser.isPending;
  const isSelf = Boolean(user && currentUser?.id === user.id);
  const isAdmin = Boolean(user && user.role.toUpperCase() === "ADMIN");
  const currentRole = (user?.role.toUpperCase() ?? "STUDENT") as BackendRole;

  const onToggleActive = async () => {
    if (!user) return;
    setActionError(null);
    try {
      await updateStatus.mutateAsync({ id: user.id, isActive: !user.isActive });
    } catch (err) {
      const apiError = err as ApiError;
      setActionError(apiError?.message || "Failed to update user status");
    }
  };

  const onRoleChange = async (nextRole: BackendRole) => {
    if (!user || user.role.toUpperCase() === nextRole) return;

    const confirmed = window.confirm(
      `Change "${user.name}" role from ${formatRoleLabel(user.role)} to ${formatRoleLabel(nextRole)}?`
    );
    if (!confirmed) {
      setRoleSelectNonce((n) => n + 1);
      return;
    }

    setActionError(null);
    try {
      await updateRole.mutateAsync({ id: user.id, role: nextRole });
    } catch (err) {
      const apiError = err as ApiError;
      setActionError(apiError?.message || "Failed to update user role");
      setRoleSelectNonce((n) => n + 1);
    }
  };

  const onDelete = async () => {
    if (!user) return;
    const confirmed = window.confirm(`Delete user "${user.name}"? This cannot be undone.`);
    if (!confirmed) return;

    setActionError(null);
    try {
      await deleteUser.mutateAsync(user.id);
      router.push(ROUTES.admin.users);
    } catch (err) {
      const apiError = err as ApiError;
      setActionError(apiError?.message || "Failed to delete user");
    }
  };

  if (isLoading && !user) {
    return <PageLoader label="Loading user profile..." />;
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-accent">
          {(error as unknown as ApiError)?.message || "User not found."}
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href={ROUTES.admin.users}>Back to users</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href={ROUTES.admin.users}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Users
          </Link>
        </Button>
        <PageHeader
          title="User profile"
          description="Admin access — view account details and manage role or status."
          className="mb-0"
        />
      </div>

      {actionError || error ? (
        <p className="text-sm text-accent">
          {actionError || (error as unknown as ApiError)?.message || "Something went wrong"}
          {!actionError && error ? (
            <button type="button" className="ml-2 underline" onClick={() => void refetch()}>
              Retry
            </button>
          ) : null}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="border-b border-border px-5 py-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-lg font-bold text-primary">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                initials(user.name) || "?"
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold text-foreground">
                  {user.name}
                  {isSelf ? (
                    <span className="ml-2 text-sm font-medium text-muted-foreground">(you)</span>
                  ) : null}
                </h2>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                    roleBadgeClass(user.role)
                  )}
                >
                  {formatRoleLabel(user.role)}
                </span>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                    user.isActive ? "bg-[#ecfdf3] text-accent-green" : "bg-muted text-muted-foreground"
                  )}
                >
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-4">
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" aria-hidden />
                  {user.phone}
                </span>
                {user.email ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" aria-hidden />
                    {user.email}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-0 sm:grid-cols-2">
          <DetailRow label="User ID" value={user.id} />
          <DetailRow label="Role" value={formatRoleLabel(user.role)} />
          <DetailRow label="Status" value={user.isActive ? "Active" : "Inactive"} />
          <DetailRow label="Verified" value={user.isVerified ? "Yes" : "No"} />
          <DetailRow label="Phone" value={user.phone} />
          <DetailRow label="Email" value={user.email || "—"} />
          <DetailRow label="Joined" value={formatShortDate(user.createdAt)} />
          <DetailRow label="Avatar" value={user.avatar ? "Set" : "Not set"} />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-foreground">Admin actions</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Change role, activate/deactivate, or delete this account.
          </p>
        </div>

        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Role
            </span>
            <div className="relative inline-flex items-center">
              <UserCog
                className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted-foreground"
                aria-hidden
              />
              <select
                key={`${user.id}-${currentRole}-${roleSelectNonce}`}
                aria-label={`Update role for ${user.name}`}
                defaultValue={currentRole}
                disabled={busy || isSelf}
                onChange={(e) => void onRoleChange(e.target.value as BackendRole)}
                className="h-10 appearance-none rounded-xl border border-border bg-card py-1 pl-8 pr-8 text-sm font-medium outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {ASSIGNABLE_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {formatRoleLabel(role)}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy || isSelf || isAdmin}
              onClick={() => void onToggleActive()}
            >
              {user.isActive ? (
                <>
                  <Ban className="h-4 w-4" aria-hidden />
                  Deactivate
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  Activate
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-accent/30 text-accent hover:bg-accent/10"
              disabled={busy || isSelf || isAdmin}
              onClick={() => void onDelete()}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Delete
            </Button>
          </div>
        </div>

        {isSelf ? (
          <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
            You cannot change your own role, status, or delete your account from here.
          </p>
        ) : isAdmin ? (
          <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
            Admin accounts cannot be deactivated or deleted from this screen.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-border px-5 py-4 sm:odd:border-r">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 break-all text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
