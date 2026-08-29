"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils";

type ListPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  from: number;
  to: number;
  onPageChange: (page: number) => void;
  className?: string;
  label?: string;
};

export function ListPagination({
  page,
  totalPages,
  total,
  from,
  to,
  onPageChange,
  className,
  label = "items",
}: ListPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5",
        className
      )}
    >
      <p className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-semibold text-foreground">
          {from}–{to}
        </span>{" "}
        of <span className="font-semibold text-foreground">{total}</span> {label}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={cn(
            "inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted",
            "disabled:pointer-events-none disabled:opacity-40"
          )}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Previous
        </button>
        <span className="min-w-[5.5rem] text-center text-sm font-semibold tabular-nums text-foreground">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className={cn(
            "inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted",
            "disabled:pointer-events-none disabled:opacity-40"
          )}
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
