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
    <div className="relative overflow-x-clip bg-[#F8FAFC]">
      <section className="relative mx-auto max-w-7xl px-4 pb-6 pt-10 sm:px-6 sm:pt-14 lg:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full bg-blue-100 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#1D4ED8]">
            Course Catalog
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Learn from Expert Mentors
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Browse published courses by curriculum and level. Enroll in free or paid programs and start
            learning today.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-2xl sm:mt-10">
          <label className="relative block">
            <span className="sr-only">Search courses</span>
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by course title..."
              className="h-12 w-full rounded-full border border-slate-200 bg-white pl-11 pr-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#1D4ED8] focus:ring-4 focus:ring-blue-100 sm:h-14 sm:text-base"
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
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </label>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:pb-20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <aside className="w-full shrink-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24 lg:w-64">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900">Filters</h2>
              {hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold text-[#1D4ED8] hover:underline"
                >
                  Reset
                </button>
              ) : null}
            </div>

            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Curriculum</p>
              <div className="mt-3 flex flex-wrap gap-2 lg:flex-col">
                <FilterChip
                  active={!categoryId}
                  label="All curricula"
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
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Level</p>
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
              <p className="text-sm font-medium text-slate-600">
                {isLoading ? "Loading courses…" : `${total} course${total === 1 ? "" : "s"} found`}
                {isFetching && !isLoading ? (
                  <span className="ml-2 text-slate-400">Updating…</span>
                ) : null}
              </p>
              {level ? (
                <p className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1D4ED8]">
                  {formatCourseLevel(level)}
                </p>
              ) : null}
            </div>

            {isError ? (
              <div className="rounded-2xl border border-dashed border-red-200 bg-red-50 px-6 py-14 text-center">
                <p className="text-base font-semibold text-red-600">Could not load courses</p>
                <p className="mt-2 text-sm text-slate-600">
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
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
                <p className="text-lg font-bold text-slate-900">No courses match your filters</p>
                <p className="mt-2 text-sm text-slate-500">
                  Try a different search term or clear the filters.
                </p>
                {hasFilters ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-5 text-sm font-semibold text-[#1D4ED8] hover:underline"
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
                <span className="px-3 text-sm font-semibold text-slate-600">
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
        "rounded-xl px-3.5 py-2 text-left text-sm font-semibold transition-colors duration-200 lg:w-full",
        active
          ? "bg-[#1D4ED8] text-white shadow-sm hover:bg-[#1E40AF]"
          : "bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-[#1D4ED8]"
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
        "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#1D4ED8] hover:text-[#1D4ED8]",
        disabled && "pointer-events-none opacity-40"
      )}
    >
      {children}
    </button>
  );
}
