"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Atom,
  BookOpen,
  Briefcase,
  Calculator,
  ChevronDown,
  ChevronRight,
  FlaskConical,
  Languages,
  Leaf,
  Sigma,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/constants";
import { useSubjectsMenu } from "@/hooks/use-subjects";
import type {
  SubjectMenuCategory,
  SubjectMenuProgram,
  SubjectMenuSubject,
} from "@/types/subjects.types";
import { cn } from "@/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  calculator: Calculator,
  flask: FlaskConical,
  users: Users,
  book: BookOpen,
  languages: Languages,
  function: Calculator,
  sigma: Sigma,
  leaf: Leaf,
  atom: Atom,
  briefcase: Briefcase,
};

const TONE_CLASS: Record<string, string> = {
  primary: "bg-primary text-primary-foreground",
  "primary-hover": "bg-primary-hover text-primary-foreground",
  accent: "bg-accent text-white",
  "accent-purple": "bg-accent-purple text-white",
  "accent-green": "bg-accent-green text-white",
  orange: "bg-[#ff6b35] text-white",
};

function resolveIcon(name?: string | null): LucideIcon {
  if (!name) return BookOpen;
  return ICON_MAP[name] ?? BookOpen;
}

function resolveTone(tone?: string | null, index = 0) {
  if (tone && TONE_CLASS[tone]) return TONE_CLASS[tone];
  const fallback = ["primary", "primary-hover", "accent", "accent-purple", "orange"];
  return TONE_CLASS[fallback[index % fallback.length]];
}

function resourceHref(program: SubjectMenuProgram, resourceSlug: string, href?: string | null) {
  if (href) return href;
  return ROUTES.subjectResource(program.slug, resourceSlug);
}

function isSubjectsPathActive(pathname: string) {
  return (
    pathname === ROUTES.courses ||
    pathname.startsWith(`${ROUTES.courses}/`) ||
    pathname.startsWith("/subjects/")
  );
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
  onNavigate,
}: {
  categories: SubjectMenuCategory[];
  onNavigate: () => void;
}) {
  const [categoryId, setCategoryId] = useState<string | null>(categories[0]?.id ?? null);
  const [subjectId, setSubjectId] = useState<string | null>(null);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId) ?? null,
    [categories, categoryId]
  );

  const subjects = selectedCategory?.subjects ?? [];

  useEffect(() => {
    if (!categories.length) {
      setCategoryId(null);
      return;
    }
    if (!categoryId || !categories.some((c) => c.id === categoryId)) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  useEffect(() => {
    if (!subjects.length) {
      setSubjectId(null);
      return;
    }
    if (!subjectId || !subjects.some((s) => s.id === subjectId)) {
      setSubjectId(subjects[0].id);
    }
  }, [subjects, subjectId]);

  const selectedSubject: SubjectMenuSubject | null =
    subjects.find((s) => s.id === subjectId) ?? null;
  const programs = selectedSubject?.programs ?? [];

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_20px_50px_-12px_rgba(24,119,242,0.2)]">
      <div className="grid min-h-[22rem] grid-cols-[minmax(14rem,0.95fr)_minmax(12rem,0.85fr)_minmax(22rem,1.6fr)]">
        <div className="border-r border-border p-3">
          <div className="space-y-0.5">
            {categories.length === 0 ? (
              <p className="px-3 py-6 text-sm text-muted-foreground">No subjects yet.</p>
            ) : (
              categories.map((category, index) => {
                const Icon = resolveIcon(category.iconName);
                return (
                  <MegaRow
                    key={category.id}
                    active={category.id === categoryId}
                    onSelect={() => setCategoryId(category.id)}
                    icon={<Icon className="h-4 w-4" aria-hidden />}
                    iconClassName={resolveTone(category.iconTone, index)}
                    label={category.name}
                  />
                );
              })
            )}
          </div>
        </div>

        <div className="border-r border-border p-3">
          <div className="space-y-0.5">
            {subjects.length === 0 ? (
              <p className="px-3 py-6 text-sm text-muted-foreground">No subjects in this category.</p>
            ) : (
              subjects.map((subject) => {
                const Icon = resolveIcon(subject.iconName);
                return (
                  <MegaRow
                    key={subject.id}
                    active={subject.id === subjectId}
                    onSelect={() => setSubjectId(subject.id)}
                    icon={<Icon className="h-4 w-4" aria-hidden />}
                    iconClassName={
                      subject.id === subjectId
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary-muted text-primary"
                    }
                    label={subject.name}
                  />
                );
              })
            )}
          </div>
        </div>

        <div className="p-5">
          {programs.length === 0 ? (
            <p className="px-2 py-6 text-sm text-muted-foreground">
              Select a subject to see SL/HL resources.
            </p>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2">
              {programs.map((program) => (
                <div key={program.id}>
                  <p className="mb-3 text-sm font-bold text-foreground">{program.name}</p>
                  <ul className="space-y-0.5">
                    {program.resources.map((resource) => (
                      <li key={resource.id}>
                        <Link
                          href={resourceHref(program, resource.slug, resource.href)}
                          onClick={onNavigate}
                          className="block rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          {resource.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
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
  const { data: categories = [] } = useSubjectsMenu();
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
            : "text-[#1a2b5e] hover:bg-muted hover:text-accent"
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
            <MegaPanel categories={categories} onNavigate={() => setOpen(false)} />
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
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const { data: categories = [] } = useSubjectsMenu();
  const active = isSubjectsPathActive(pathname);

  useEffect(() => {
    if (categories.length && !categoryId) setCategoryId(categories[0].id);
  }, [categories, categoryId]);

  const subjects = categories.find((c) => c.id === categoryId)?.subjects ?? [];

  useEffect(() => {
    if (!subjects.length) {
      setSubjectId(null);
      return;
    }
    if (!subjectId || !subjects.some((s) => s.id === subjectId)) {
      setSubjectId(subjects[0].id);
    }
  }, [subjects, subjectId]);

  const programs = subjects.find((s) => s.id === subjectId)?.programs ?? [];

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
            {categories.map((category, index) => {
              const Icon = resolveIcon(category.iconName);
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
                      resolveTone(category.iconTone, index)
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  {category.name}
                </button>
              );
            })}
          </div>

          {subjects.length ? (
            <div className="flex flex-wrap gap-1.5">
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => setSubjectId(subject.id)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold",
                    subject.id === subjectId
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground"
                  )}
                >
                  {subject.name}
                </button>
              ))}
            </div>
          ) : null}

          {programs.map((program) => (
            <div key={program.id} className="rounded-lg bg-card px-3 py-2">
              <p className="text-sm font-semibold text-foreground">{program.name}</p>
              <div className="mt-1 space-y-1">
                {program.resources.map((resource) => (
                  <Link
                    key={resource.id}
                    href={resourceHref(program, resource.slug, resource.href)}
                    onClick={onNavigate}
                    className="block text-sm text-primary"
                  >
                    {resource.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
