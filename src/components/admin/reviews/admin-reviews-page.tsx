"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  MessageSquare,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { AdminActionsBar, AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";
import {
  useAdminDeleteReview,
  useAdminReviews,
  useAdminUpdateReview,
} from "@/hooks";
import { formatShortDate } from "@/lib/format";
import type { AdminReview, ApiError, ReviewStatus } from "@/types";
import { cn } from "@/utils";

type StatusTab = "ALL" | ReviewStatus;

const STATUS_TABS: { id: StatusTab; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "PENDING", label: "Pending" },
  { id: "APPROVED", label: "Approved" },
  { id: "HIDDEN", label: "Hidden" },
];

const PAGE_SIZE = 20;

function statusBadgeClass(status: string) {
  const s = status.toUpperCase();
  if (s === "APPROVED") return "bg-[#ecfdf3] text-[#067647] ring-[#abefc6]";
  if (s === "PENDING") return "bg-[#fff7ed] text-[#c2410c] ring-[#fdba74]";
  if (s === "HIDDEN") return "bg-muted text-muted-foreground ring-border";
  return "bg-muted text-muted-foreground ring-border";
}

function stars(rating: number) {
  return "★".repeat(Math.max(0, Math.min(5, rating))) + "☆".repeat(Math.max(0, 5 - rating));
}

export function AdminReviewsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<StatusTab>("ALL");
  const [ratingFilter, setRatingFilter] = useState<number | "">("");
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<AdminReview | null>(null);
  const [reply, setReply] = useState("");
  const [editRating, setEditRating] = useState("5");
  const [editComment, setEditComment] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const filters = useMemo(
    () => ({
      status: statusTab === "ALL" ? undefined : statusTab,
      rating: ratingFilter === "" ? undefined : ratingFilter,
      search: search || undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [statusTab, ratingFilter, search, page]
  );

  const { data, isLoading, error, refetch, isFetching } = useAdminReviews(filters);
  const updateReview = useAdminUpdateReview();
  const deleteReview = useAdminDeleteReview();

  const items = data?.items ?? [];
  const counts = data?.counts ?? { all: 0, pending: 0, approved: 0, hidden: 0 };
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;
  const busy = updateReview.isPending || deleteReview.isPending;

  const tabCount = (tab: StatusTab) => {
    if (tab === "ALL") return counts.all;
    if (tab === "PENDING") return counts.pending;
    if (tab === "APPROVED") return counts.approved;
    return counts.hidden;
  };

  const openEdit = (item: AdminReview) => {
    setEditItem(item);
    setReply(item.adminReply ?? "");
    setEditRating(String(item.rating));
    setEditComment(item.comment ?? "");
    setActionError(null);
  };

  const onSetStatus = async (id: string, status: ReviewStatus, label: string) => {
    setActionError(null);
    setPendingId(id);
    try {
      await updateReview.mutateAsync({ id, payload: { status } });
    } catch (err) {
      setActionError((err as ApiError)?.message || `Failed to ${label}`);
    } finally {
      setPendingId(null);
    }
  };

  const onDelete = async (item: AdminReview) => {
    const confirmed = window.confirm(
      `Delete review by "${item.student.name}" on "${item.course.title}"?`
    );
    if (!confirmed) return;
    setActionError(null);
    setPendingId(item.id);
    try {
      await deleteReview.mutateAsync(item.id);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to delete review");
    } finally {
      setPendingId(null);
    }
  };

  const onSaveEdit = async () => {
    if (!editItem) return;
    const rating = Number.parseInt(editRating, 10);
    if (!rating || rating < 1 || rating > 5) {
      setActionError("Rating must be between 1 and 5");
      return;
    }
    setActionError(null);
    try {
      await updateReview.mutateAsync({
        id: editItem.id,
        payload: {
          rating,
          comment: editComment.trim() || null,
          adminReply: reply.trim() || null,
        },
      });
      setEditItem(null);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to save review");
    }
  };

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Reviews"
          description="Moderate student course reviews — approve, hide, reply, or delete."
          className="mb-0"
        />
        <PageLoader label="Loading reviews..." />
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="border-b border-border px-5 py-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <PageHeader
              title="Reviews"
              description="Full control over student course reviews. Pending reviews stay hidden until approved."
              className="mb-0"
            />
            <AdminActionsBar>
              <AdminIconAction
                label="Refresh"
                icon={RefreshCw}
                tone="primary"
                disabled={isFetching}
                onClick={() => void refetch()}
                className={isFetching ? "animate-spin" : undefined}
              />
            </AdminActionsBar>
          </div>

          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusTab(tab.id);
                  setPage(1);
                }}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-semibold transition",
                  statusTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                <span className="ml-1.5 opacity-80">{tabCount(tab.id)}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search student, course, or comment…"
              className="max-w-md"
            />
            <select
              value={ratingFilter === "" ? "" : String(ratingFilter)}
              onChange={(e) => {
                setRatingFilter(e.target.value ? Number(e.target.value) : "");
                setPage(1);
              }}
              className="flex h-10 rounded-xl border border-border bg-card px-3 text-sm"
            >
              <option value="">All ratings</option>
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} stars
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <p className="mt-2 text-sm text-accent">{(error as unknown as ApiError)?.message}</p>
          ) : null}
          {actionError ? <p className="mt-2 text-sm text-accent">{actionError}</p> : null}
        </div>

        <div className={cn("overflow-x-auto", isFetching && !isLoading ? "opacity-70" : "")}>
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Course</th>
                <th className="px-5 py-3">Rating</th>
                <th className="px-5 py-3">Review</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                    No reviews found.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const status = String(item.status).toUpperCase() as ReviewStatus;
                  const rowBusy = busy && pendingId === item.id;
                  return (
                    <tr key={item.id} className="border-b border-border/60 align-top">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-foreground">{item.student.name}</p>
                        <p className="text-xs text-muted-foreground">{item.student.phone}</p>
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={ROUTES.admin.courseCurriculum(item.course.id)}
                          className="font-medium text-primary hover:underline"
                        >
                          {item.course.title}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-amber-500" title={`${item.rating}/5`}>
                          {stars(item.rating)}
                        </span>
                      </td>
                      <td className="px-5 py-4 max-w-xs">
                        <p className="line-clamp-3 text-muted-foreground">
                          {item.comment?.trim() || "—"}
                        </p>
                        {item.adminReply ? (
                          <p className="mt-1 line-clamp-2 text-xs text-primary">
                            Reply: {item.adminReply}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ring-1 ring-inset",
                            statusBadgeClass(status)
                          )}
                        >
                          {status.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {formatShortDate(item.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {status !== "APPROVED" ? (
                            <AdminIconAction
                              label="Approve"
                              icon={Check}
                              tone="success"
                              disabled={rowBusy}
                              onClick={() => void onSetStatus(item.id, "APPROVED", "approve")}
                            />
                          ) : null}
                          {status !== "HIDDEN" ? (
                            <AdminIconAction
                              label="Hide"
                              icon={EyeOff}
                              tone="default"
                              disabled={rowBusy}
                              onClick={() => void onSetStatus(item.id, "HIDDEN", "hide")}
                            />
                          ) : null}
                          {status === "HIDDEN" ? (
                            <AdminIconAction
                              label="Mark pending"
                              icon={MessageSquare}
                              tone="primary"
                              disabled={rowBusy}
                              onClick={() => void onSetStatus(item.id, "PENDING", "update")}
                            />
                          ) : null}
                          <AdminIconAction
                            label="Edit / reply"
                            icon={MessageSquare}
                            tone="primary"
                            disabled={rowBusy}
                            onClick={() => openEdit(item)}
                          />
                          <AdminIconAction
                            label="Delete"
                            icon={Trash2}
                            tone="danger"
                            disabled={rowBusy}
                            onClick={() => void onDelete(item)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 text-sm">
          <p className="text-muted-foreground">
            {total} review{total === 1 ? "" : "s"} · page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page >= totalPages || isFetching}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <AdminModal
        open={Boolean(editItem)}
        title="Edit review"
        description={
          editItem ? `${editItem.student.name} · ${editItem.course.title}` : undefined
        }
        onClose={() => !busy && setEditItem(null)}
        className="sm:max-w-lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={() => setEditItem(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={busy} onClick={() => void onSaveEdit()}>
              {busy ? "Saving…" : "Save"}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <label className="block space-y-1 text-sm">
            <span className="font-semibold">Rating (1–5)</span>
            <select
              value={editRating}
              onChange={(e) => setEditRating(e.target.value)}
              disabled={busy}
              className="flex h-10 w-full rounded-xl border border-border px-3 text-sm"
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} stars
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-semibold">Student comment</span>
            <textarea
              value={editComment}
              onChange={(e) => setEditComment(e.target.value)}
              disabled={busy}
              rows={3}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-semibold">Admin reply (optional)</span>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              disabled={busy}
              rows={3}
              placeholder="Public reply shown with the review"
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
            />
          </label>
          {actionError ? <p className="text-sm text-accent">{actionError}</p> : null}
        </div>
      </AdminModal>
    </>
  );
}
