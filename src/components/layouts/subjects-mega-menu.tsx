"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Code2,
  GraduationCap,
  Layers,
  Palette,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/constants";
import { useCategories, useCourses } from "@/hooks";
import { formatCourseLevel } from "@/lib/course-format";
import type { CatalogCourse } from "@/types/course.types";
import type { HomeCategory } from "@/types/home.types";
import { cn } from "@/utils";

const LEVELS = [
  { id: "", label: "All" },
  { id: "BEGINNER", label: "Beginner" },
  { id: "INTERMEDIATE", label: "Intermediate" },
  { id: "ADVANCED", label: "Advanced" },
] as const;

const CATEGORY_ICONS: LucideIcon[] = [Code2, Palette, Briefcase, GraduationCap, BookOpen, Sparkles];

const TONE_CLASSES = [
  "bg-primary text-primary-foreground",
  "bg-accent text-white",
  "bg-accent-purple text-white",
  "bg-accent-green text-white",
  "bg-[#ff6b35] text-white",
  "bg-primary-hover text-primary-foreground",
];

function categoryIcon(category: HomeCategory, index: number): LucideIcon {
  const slug = category.slug.toLowerCase();
  if (slug.includes("web") || slug.includes("dev")) return Code2;
  if (slug.includes("design") || slug.includes("ui")) return Palette;
  if (slug.includes("business")) return Briefcase;
  return CATEGORY_ICONS[index % CATEGORY_ICONS.length];
}

function categoryTone(index: number) {
  return TONE_CLASSES[index % TONE_CLASSES.length];
}

function catalogHref(categoryId: string | null, level: string) {
  const params = new URLSearchParams();
  if (categoryId) params.set("categoryId", categoryId);
  if (level) params.set("level", level);
  const qs = params.toString();
  return qs ? `${ROUTES.courses}?${qs}` : ROUTES.courses;
}

function filterCourses(
  courses: CatalogCourse[],
  categoryId: string | null,
  level: string
): CatalogCourse[] {
  return courses.filter((course) => {
    if (categoryId && course.category?.id !== categoryId) return false;
    if (level && String(course.level).toUpperCase() !== level) return false;
    return true;
  });
}

function isSubjectsPathActive(pathname: string) {
  return pathname === ROUTES.courses || pathname.startsWith(`${ROUTES.courses}/`);
}

function MegaRow({
  active,
  onSelect,
  icon,
  iconClassName,
  label,
}: {
  active: boolean;
  onSelect: () => void;
  icon: ReactNode;
  iconClassName?: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onMouseEnter={onSelect}
      onFocus={onSelect}
      onClick={onSelect}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
        active
          ? "bg-primary-muted font-semibold text-foreground"
          : "font-medium text-foreground/90 hover:bg-muted"
      )}
    >
      <span
        className={cn(
          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          iconClassName
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <ChevronRight
        className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")}
        aria-hidden
      />
    </button>
  );
}

function MegaPanel({
  categories,
  courses,
  onNavigate,
}: {
  categories: HomeCategory[];
  courses: CatalogCourse[];
  onNavigate: () => void;
}) {
  const [categoryId, setCategoryId] = useState<string | null>(categories[0]?.id ?? null);
  const [level, setLevel] = useState("");

  useEffect(() => {
    if (!categories.length) {
      setCategoryId(null);
      return;
    }
    if (!categoryId || !categories.some((c) => c.id === categoryId)) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId) ?? null,
    [categories, categoryId]
  );

  const filtered = useMemo(
    () => filterCourses(courses, categoryId, level),
    [courses, categoryId, level]
  );

  const splitIndex = Math.ceil(filtered.length / 2);
  const leftCourses = filtered.slice(0, splitIndex);
  const rightCourses = filtered.slice(splitIndex);

  const browseLabel = selectedCategory
    ? level
      ? `All ${formatCourseLevel(level)} in ${selectedCategory.name}`
      : `All ${selectedCategory.name} courses`
    : "Browse all courses";

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_20px_50px_-12px_rgba(24,119,242,0.2)]">
      <div className="grid min-h-[22rem] grid-cols-[minmax(14rem,0.95fr)_minmax(12rem,0.85fr)_minmax(22rem,1.6fr)]">
        <div className="border-r border-border p-3">
          <div className="space-y-0.5">
            {categories.length === 0 ? (
              <p className="px-3 py-6 text-sm text-muted-foreground">No categories yet.</p>
            ) : (
              categories.map((category, index) => {
                const Icon = categoryIcon(category, index);
                return (
                  <MegaRow
                    key={category.id}
                    active={category.id === categoryId}
                    onSelect={() => setCategoryId(category.id)}
                    icon={<Icon className="h-4 w-4" aria-hidden />}
                    iconClassName={categoryTone(index)}
                    label={category.name}
                  />
                );
              })
            )}
          </div>
        </div>

        <div className="border-r border-border p-3">
          <div className="space-y-0.5">
            {LEVELS.map((item) => (
              <MegaRow
                key={item.id || "all"}
                active={level === item.id}
                onSelect={() => setLevel(item.id)}
                icon={<Layers className="h-4 w-4" aria-hidden />}
                iconClassName={
                  level === item.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary-muted text-primary"
                }
                label={item.label}
              />
            ))}
          </div>
        </div>

        <div className="p-5">
          {filtered.length === 0 ? (
            <div className="px-2 py-6">
              <p className="text-sm text-muted-foreground">No courses match this selection.</p>
              {categoryId ? (
                <Link
                  href={catalogHref(categoryId, level)}
                  onClick={onNavigate}
                  className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
                >
                  Browse catalog
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <p className="mb-3 text-sm font-bold text-foreground">Browse</p>
                <ul className="space-y-0.5">
                  <li>
                    <Link
                      href={catalogHref(categoryId, level)}
                      onClick={onNavigate}
                      className="block rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {browseLabel}
                    </Link>
                  </li>
                  {selectedCategory && level ? (
                    <li>
                      <Link
                        href={catalogHref(categoryId, "")}
                        onClick={onNavigate}
                        className="block rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        All levels in {selectedCategory.name}
                      </Link>
                    </li>
                  ) : null}
                  {selectedCategory && !level ? (
                    <>
                      {LEVELS.filter((l) => l.id).map((item) => (
                        <li key={item.id}>
                          <Link
                            href={catalogHref(categoryId, item.id)}
                            onClick={onNavigate}
                            className="block rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            {item.label} in {selectedCategory.name}
                          </Link>
                        </li>
                      ))}
                    </>
                  ) : null}
                </ul>
              </div>

              <div>
                <p className="mb-3 text-sm font-bold text-foreground">Courses</p>
                <div
                  className={cn(
                    "grid gap-x-6",
                    rightCourses.length > 0 ? "grid-cols-2" : "grid-cols-1"
                  )}
                >
                  <ul className="space-y-0.5">
                    {leftCourses.map((course) => (
                      <li key={course.id}>
                        <Link
                          href={ROUTES.courseDetail(course.slug)}
                          onClick={onNavigate}
                          className="block rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          {course.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {rightCourses.length ? (
                    <ul className="space-y-0.5">
                      {rightCourses.map((course) => (
                        <li key={course.id}>
                          <Link
                            href={ROUTES.courseDetail(course.slug)}
                            onClick={onNavigate}
                            className="block rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            {course.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SubjectsMegaMenu({ pathname }: { pathname: string; search?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data: categories = [] } = useCategories();
  const { data: courses = [] } = useCourses();
  const active = isSubjectsPathActive(pathname);

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const openMenu = () => {
    clearCloseTimer();
    setOpen(true);
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  };

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (ref.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className={cn(
          "group inline-flex cursor-pointer items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition-colors",
          open || active
            ? "bg-primary-muted text-primary"
            : "text-foreground/80 hover:bg-muted hover:text-accent"
        )}
        aria-expanded={open}
        aria-haspopup="true"
        onMouseEnter={openMenu}
        onMouseLeave={scheduleClose}
        onClick={() => setOpen((value) => !value)}
      >
        Subjects
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")}
          aria-hidden
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.16 }}
            className="fixed left-1/2 top-16 z-50 w-[min(58rem,calc(100vw-2rem))] -translate-x-1/2 pt-2 lg:top-[4.5rem] xl:w-[62rem]"
            onMouseEnter={openMenu}
            onMouseLeave={scheduleClose}
          >
            <MegaPanel
              categories={categories}
              courses={courses}
              onNavigate={() => setOpen(false)}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function SubjectsMobileMenu({
  pathname,
  onNavigate,
}: {
  pathname: string;
  search?: string;
  onNavigate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [level, setLevel] = useState("");
  const { data: categories = [] } = useCategories();
  const { data: courses = [] } = useCourses();
  const active = isSubjectsPathActive(pathname);

  useEffect(() => {
    if (categories.length && !categoryId) setCategoryId(categories[0].id);
  }, [categories, categoryId]);

  const selectedCategory = categories.find((c) => c.id === categoryId) ?? null;
  const filtered = filterCourses(courses, categoryId, level);

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
      <button
        type="button"
        className={cn(
          "flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-left text-base font-medium transition-colors",
          active ? "text-accent" : "text-foreground hover:text-accent"
        )}
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
      >
        <span className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 shrink-0" aria-hidden />
          Subjects
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition-transform duration-200", expanded && "rotate-180")}
          aria-hidden
        />
      </button>

      {expanded ? (
        <div className="space-y-3 border-t border-border/70 bg-muted/30 px-3 py-3">
          <div className="space-y-1">
            <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Category
            </p>
            {categories.map((category, index) => {
              const Icon = categoryIcon(category, index);
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setCategoryId(category.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm",
                    category.id === categoryId
                      ? "bg-card font-semibold text-foreground shadow-sm"
                      : "text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded-md",
                      categoryTone(index)
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  {category.name}
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5">
            <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Level
            </p>
            <div className="flex flex-wrap gap-1.5">
              {LEVELS.map((item) => (
                <button
                  key={item.id || "all"}
                  type="button"
                  onClick={() => setLevel(item.id)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold",
                    level === item.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Links
            </p>
            <Link
              href={catalogHref(categoryId, level)}
              onClick={onNavigate}
              className="block rounded-lg bg-card px-3 py-2 text-sm font-medium text-primary"
            >
              {selectedCategory
                ? level
                  ? `Browse ${formatCourseLevel(level)} — ${selectedCategory.name}`
                  : `Browse ${selectedCategory.name}`
                : "Browse all courses"}
            </Link>
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">No courses in this selection.</p>
            ) : (
              filtered.map((course) => (
                <Link
                  key={course.id}
                  href={ROUTES.courseDetail(course.slug)}
                  onClick={onNavigate}
                  className="block rounded-lg px-3 py-2 text-sm text-foreground hover:bg-card"
                >
                  {course.title}
                </Link>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
