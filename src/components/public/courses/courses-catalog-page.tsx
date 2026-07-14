"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useCategories, useCoursesCatalog } from "@/hooks";
import { formatCourseLevel } from "@/lib/course-format";
import { cn } from "@/utils";
import { CourseCard, CourseCardSkeleton } from "./course-card";

const LEVELS = [
  { id: "", label: "All levels" },
  { id: "BEGINNER", label: "Beginner" },
  { id: "INTERMEDIATE", label: "Intermediate" },
  { id: "ADVANCED", label: "Advanced" },
] as const;

export function CoursesCatalogPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const categoryId = searchParams.get("categoryId") ?? "";
  const level = searchParams.get("level") ?? "";
  const urlSearch = searchParams.get("search") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);

  const [searchInput, setSearchInput] = useState(urlSearch);
  const [search, setSearch] = useState(urlSearch);

  const { data: categories = [] } = useCategories();

  const syncUrl = useCallback(
    (next: {
      categoryId?: string;
      level?: string;
      search?: string;
      page?: number;
      clear?: boolean;
    }) => {
      if (next.clear) {
        router.replace(pathname, { scroll: false });
        return;
      }

      const params = new URLSearchParams();
      const nextCategory = next.categoryId !== undefined ? next.categoryId : categoryId;
      const nextLevel = next.level !== undefined ? next.level : level;
      const nextSearch = next.search !== undefined ? next.search : search;
      const nextPage = next.page !== undefined ? next.page : page;

      if (nextCategory) params.set("categoryId", nextCategory);
      if (nextLevel) params.set("level", nextLevel);
      if (nextSearch.trim()) params.set("search", nextSearch.trim());
      if (nextPage > 1) params.set("page", String(nextPage));

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [categoryId, level, search, page, pathname, router]
  );

  useEffect(() => {
    setSearchInput(urlSearch);
    setSearch(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = searchInput.trim();
      if (next === search) return;
      setSearch(next);
      syncUrl({ search: next, page: 1 });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput, search, syncUrl]);

  const query = useMemo(
    () => ({
      search: search || undefined,
      categoryId: categoryId || undefined,
      level: level || undefined,
      page,
      limit: 9,
    }),
    [search, categoryId, level, page]
  );

  const { data, isLoading, isError, isFetching } = useCoursesCatalog(query);
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    syncUrl({ clear: true });
  }

  const hasFilters = Boolean(search || categoryId || level);

  return (
    <div className="relative overflow-x-clip bg-[#f7f9fc]">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[28rem]">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#eef4fb_0%,#f7f9fc_70%,transparent_100%)]" />
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-[#fef3c7]/50 blur-3xl" />
        <div className="absolute right-0 top-0 h-80 w-[40%] bg-[linear-gradient(135deg,rgba(24,119,242,0.08)_0%,transparent_60%)]" />
      </div>

      <section className="relative mx-auto max-w-7xl px-4 pb-6 pt-10 sm:px-6 sm:pt-14 lg:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#1877f2]">
            Course catalog
          </p>
          <h1 className="mt-3 bg-gradient-to-r from-[#1a2b5e] via-[#ff6b35] to-[#ef3239] bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl lg:text-5xl">
            Learn from expert mentors
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#64748b] sm:text-base lg:text-lg">
            Browse published courses by category and level. Enroll free or paid programs and start
            learning today.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-2xl sm:mt-10">
          <label className="relative block">
            <span className="sr-only">Search courses</span>
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]"
              aria-hidden
            />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by course title..."
              className="h-12 w-full rounded-full border border-[#e8edf5] bg-white pl-11 pr-11 text-sm text-[#1a2b5e] shadow-[0_10px_30px_-16px_rgba(26,43,94,0.18)] outline-none transition focus:border-[#1877f2]/40 focus:ring-4 focus:ring-[#1877f2]/10 sm:h-14 sm:text-base"
            />
            {searchInput ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  syncUrl({ search: "", page: 1 });
                }}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#1a2b5e]"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </label>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:pb-20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <aside className="w-full shrink-0 rounded-2xl border border-[#e8edf5]/80 bg-white p-5 shadow-[0_12px_36px_-18px_rgba(26,43,94,0.14)] lg:sticky lg:top-24 lg:w-64">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-[#1a2b5e]">Filters</h2>
              {hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold text-[#ef3239] hover:underline"
                >
                  Reset
                </button>
              ) : null}
            </div>

            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wide text-[#94a3b8]">Category</p>
              <div className="mt-3 flex flex-wrap gap-2 lg:flex-col">
                <FilterChip
                  active={!categoryId}
                  label="All categories"
                  onClick={() => syncUrl({ categoryId: "", page: 1 })}
                />
                {categories.map((cat) => (
                  <FilterChip
                    key={cat.id}
                    active={categoryId === cat.id}
                    label={cat.name}
                    onClick={() => syncUrl({ categoryId: cat.id, page: 1 })}
                  />
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-wide text-[#94a3b8]">Level</p>
              <div className="mt-3 flex flex-wrap gap-2 lg:flex-col">
                {LEVELS.map((item) => (
                  <FilterChip
                    key={item.id || "all"}
                    active={level === item.id}
                    label={item.label}
                    onClick={() => syncUrl({ level: item.id, page: 1 })}
                  />
                ))}
              </div>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-[#64748b]">
                {isLoading ? "Loading courses…" : `${total} course${total === 1 ? "" : "s"} found`}
                {isFetching && !isLoading ? (
                  <span className="ml-2 text-[#94a3b8]">Updating…</span>
                ) : null}
              </p>
              {level ? (
                <p className="rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-semibold text-[#1877f2]">
                  {formatCourseLevel(level)}
                </p>
              ) : null}
            </div>

            {isError ? (
              <div className="rounded-2xl border border-dashed border-[#fecaca] bg-[#fff1f2] px-6 py-14 text-center">
                <p className="text-base font-semibold text-[#ef3239]">Could not load courses</p>
                <p className="mt-2 text-sm text-[#64748b]">
                  Check that the backend API is running and try again.
                </p>
              </div>
            ) : null}

            {isLoading ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CourseCardSkeleton key={i} />
                ))}
              </div>
            ) : null}

            {!isLoading && !isError && items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#e8edf5] bg-white px-6 py-16 text-center">
                <p className="text-lg font-bold text-[#1a2b5e]">No courses match your filters</p>
                <p className="mt-2 text-sm text-[#64748b]">
                  Try a different search term or clear the filters.
                </p>
                {hasFilters ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-5 text-sm font-semibold text-[#ef3239] hover:underline"
                  >
                    Clear all filters
                  </button>
                ) : null}
              </div>
            ) : null}

            {!isLoading && !isError && items.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : null}

            {totalPages > 1 ? (
              <div className="mt-10 flex items-center justify-center gap-2">
                <PaginationButton
                  disabled={page <= 1}
                  onClick={() => syncUrl({ page: Math.max(1, page - 1) })}
                >
                  Previous
                </PaginationButton>
                <span className="px-3 text-sm font-semibold text-[#475569]">
                  Page {page} of {totalPages}
                </span>
                <PaginationButton
                  disabled={page >= totalPages}
                  onClick={() => syncUrl({ page: Math.min(totalPages, page + 1) })}
                >
                  Next
                </PaginationButton>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3.5 py-2 text-left text-sm font-semibold transition-colors duration-200 lg:w-full",
        active
          ? "bg-gradient-to-r from-[#3b8dee] via-[#ff6b35] to-[#ef3239] text-white shadow-sm"
          : "bg-[#f8fafc] text-[#475569] hover:bg-[#eff6ff] hover:text-[#1877f2]"
      )}
    >
      {label}
    </button>
  );
}

function PaginationButton({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-full border border-[#e8edf5] bg-white px-4 py-2 text-sm font-semibold text-[#1a2b5e] transition hover:border-[#1877f2]/30 hover:text-[#1877f2]",
        disabled && "pointer-events-none opacity-40"
      )}
    >
      {children}
    </button>
  );
}
