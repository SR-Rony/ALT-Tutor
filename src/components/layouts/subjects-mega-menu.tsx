"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Atom,
  BookOpen,
  Calculator,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  FlaskConical,
  GraduationCap,
  Languages,
  Layers,
  Leaf,
  Lightbulb,
  Loader2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/constants";
import { useSubjectsMenu } from "@/hooks";
import type {
  SubjectMenuCategory,
  SubjectMenuProgram,
  SubjectMenuResource,
} from "@/types/subjects.types";
import { cn } from "@/utils";

const TONE_CLASSES = [
  "bg-primary text-primary-foreground",
  "bg-accent text-white",
  "bg-accent-purple text-white",
  "bg-accent-green text-white",
  "bg-[#ff6b35] text-white",
  "bg-primary-hover text-primary-foreground",
];

function categoryIcon(category: SubjectMenuCategory, index: number): LucideIcon {
  const slug = `${category.slug} ${category.iconName ?? ""}`.toLowerCase();
  if (slug.includes("math") || slug.includes("calculator")) return Calculator;
  if (slug.includes("science") || slug.includes("flask")) return FlaskConical;
  if (slug.includes("individual") || slug.includes("users")) return Users;
  if (slug.includes("english") || slug.includes("book")) return BookOpen;
  if (slug.includes("language") || slug.includes("spanish") || slug.includes("french")) {
    return Languages;
  }
  if (slug.includes("physics") || slug.includes("atom")) return Atom;
  if (slug.includes("bio") || slug.includes("leaf")) return Leaf;
  return [GraduationCap, BookOpen, Layers, Lightbulb][index % 4];
}

function resourceIcon(resource: SubjectMenuResource): LucideIcon {
  const t = String(resource.resourceType).toUpperCase();
  if (t === "QUESTIONBANK") return ClipboardList;
  if (t === "KEY_CONCEPTS") return Lightbulb;
  if (t === "PAST_PAPERS" || t === "PRACTICE_EXAMS" || t === "PAPER_3") return FileText;
  return BookOpen;
}

function categoryTone(index: number) {
  return TONE_CLASSES[index % TONE_CLASSES.length];
}

function resourceHref(program: SubjectMenuProgram, resource: SubjectMenuResource) {
  if (resource.href) return resource.href;
  return ROUTES.subjectResource(program.slug, resource.slug);
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
  menu,
  isLoading,
  onNavigate,
}: {
  menu: SubjectMenuCategory[];
  isLoading: boolean;
  onNavigate: () => void;
}) {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [programId, setProgramId] = useState<string | null>(null);

  const selectedCategory = useMemo(
    () => menu.find((c) => c.id === categoryId) ?? menu[0] ?? null,
    [menu, categoryId]
  );

  const subjects = selectedCategory?.subjects ?? [];

  const selectedSubject = useMemo(
    () => subjects.find((s) => s.id === subjectId) ?? subjects[0] ?? null,
    [subjects, subjectId]
  );

  const programs = selectedSubject?.programs ?? [];

  const selectedProgram = useMemo(
    () => programs.find((p) => p.id === programId) ?? programs[0] ?? null,
    [programs, programId]
  );

  const resources = useMemo(() => {
    const list = (selectedProgram?.resources ?? []).filter((r) => r.isActive !== false);
    return [...list].sort((a, b) => {
      const aQb = String(a.resourceType).toUpperCase() === "QUESTIONBANK" ? 0 : 1;
      const bQb = String(b.resourceType).toUpperCase() === "QUESTIONBANK" ? 0 : 1;
      if (aQb !== bQb) return aQb - bQb;
      return (a.order ?? 0) - (b.order ?? 0);
    });
  }, [selectedProgram]);

  useEffect(() => {
    if (!menu.length) {
      setCategoryId(null);
      return;
    }
    if (!categoryId || !menu.some((c) => c.id === categoryId)) {
      setCategoryId(menu[0].id);
    }
  }, [menu, categoryId]);

  useEffect(() => {
    if (!subjects.length) {
      setSubjectId(null);
      return;
    }
    if (!subjectId || !subjects.some((s) => s.id === subjectId)) {
      setSubjectId(subjects[0].id);
    }
  }, [subjects, subjectId]);

  useEffect(() => {
    if (!programs.length) {
      setProgramId(null);
      return;
    }
    if (!programId || !programs.some((p) => p.id === programId)) {
      setProgramId(programs[0].id);
    }
  }, [programs, programId]);

  if (isLoading) {
    return (
      <div className="flex min-h-[16rem] items-center justify-center rounded-2xl border border-border bg-card shadow-[0_20px_50px_-12px_rgba(24,119,242,0.2)]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!menu.length) {
    return (
      <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center shadow-[0_20px_50px_-12px_rgba(24,119,242,0.2)]">
        <p className="text-sm text-muted-foreground">No subjects available yet.</p>
        <Link
          href={ROUTES.courses}
          onClick={onNavigate}
          className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
        >
          Browse courses
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_20px_50px_-12px_rgba(24,119,242,0.2)]">
      <div className="grid min-h-[22rem] grid-cols-1 md:grid-cols-[minmax(12rem,0.9fr)_minmax(12rem,0.9fr)_minmax(11rem,0.85fr)_minmax(16rem,1.2fr)]">
        {/* Categories */}
        <div className="border-b border-border p-3 md:border-b-0 md:border-r">
          <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Category
          </p>
          <div className="space-y-0.5">
            {menu.map((category, index) => {
              const Icon = categoryIcon(category, index);
              return (
                <MegaRow
                  key={category.id}
                  active={category.id === selectedCategory?.id}
                  onSelect={() => {
                    setCategoryId(category.id);
                    setSubjectId(null);
                    setProgramId(null);
                  }}
                  icon={<Icon className="h-4 w-4" aria-hidden />}
                  iconClassName={categoryTone(index)}
                  label={category.name}
                />
              );
            })}
          </div>
        </div>

        {/* Subjects */}
        <div className="border-b border-border p-3 md:border-b-0 md:border-r">
          <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Subject
          </p>
          <div className="space-y-0.5">
            {subjects.length === 0 ? (
              <p className="px-3 py-6 text-sm text-muted-foreground">No subjects.</p>
            ) : (
              subjects.map((subject) => (
                <MegaRow
                  key={subject.id}
                  active={subject.id === selectedSubject?.id}
                  onSelect={() => {
                    setSubjectId(subject.id);
                    setProgramId(null);
                  }}
                  icon={<BookOpen className="h-4 w-4" aria-hidden />}
                  iconClassName={
                    subject.id === selectedSubject?.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary-muted text-primary"
                  }
                  label={subject.name}
                />
              ))
            )}
          </div>
        </div>

        {/* Programs */}
        <div className="border-b border-border p-3 md:border-b-0 md:border-r">
          <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Program
          </p>
          <div className="space-y-0.5">
            {programs.length === 0 ? (
              <p className="px-3 py-6 text-sm text-muted-foreground">No programs.</p>
            ) : (
              programs.map((program) => (
                <MegaRow
                  key={program.id}
                  active={program.id === selectedProgram?.id}
                  onSelect={() => setProgramId(program.id)}
                  icon={<GraduationCap className="h-4 w-4" aria-hidden />}
                  iconClassName={
                    program.id === selectedProgram?.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary-muted text-primary"
                  }
                  label={program.name}
                />
              ))
            )}
          </div>
        </div>

        {/* Resources */}
        <div className="p-4 sm:p-5">
          <p className="mb-3 text-sm font-bold text-foreground">
            {selectedProgram?.name ?? "Resources"}
          </p>
          {resources.length === 0 ? (
            <p className="text-sm text-muted-foreground">No resources for this program yet.</p>
          ) : (
            <ul className="space-y-1">
              {resources.map((resource) => {
                const Icon = resourceIcon(resource);
                const href = selectedProgram
                  ? resourceHref(selectedProgram, resource)
                  : "#";
                const isQb = String(resource.resourceType).toUpperCase() === "QUESTIONBANK";
                return (
                  <li key={resource.id}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition",
                        isQb
                          ? "bg-primary-muted font-semibold text-primary hover:bg-primary/15"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex h-8 w-8 items-center justify-center rounded-lg",
                          isQb ? "bg-primary text-primary-foreground" : "bg-muted text-primary"
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1 truncate">{resource.title}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {selectedProgram ? (
            <Link
              href={ROUTES.subjectQuestionbank(selectedProgram.slug)}
              onClick={onNavigate}
              className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline"
            >
              Open Questionbank →
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function SubjectsMegaMenu({ pathname }: { pathname: string; search?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data: menu = [], isLoading } = useSubjectsMenu();
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
        className="group inline-flex cursor-pointer items-center gap-1 px-3 py-2"
        aria-expanded={open}
        aria-haspopup="true"
        onMouseEnter={openMenu}
        onMouseLeave={scheduleClose}
        onClick={() => setOpen((value) => !value)}
      >
        <span
          className={cn(
            "relative inline-flex items-center gap-1 text-sm font-medium transition-colors duration-300",
            open || active ? "text-[#ef3239]" : "text-[#1a2b5e]/75 group-hover:text-[#ef3239]"
          )}
        >
          Subjects
          <ChevronDown
            className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")}
            aria-hidden
          />
          <span
            aria-hidden
            className={cn(
              "absolute inset-x-0 -bottom-1 h-0.5 origin-left rounded-full bg-gradient-to-r from-[#3b8dee] via-[#ff6b35] to-[#ef3239] transition-transform duration-300 ease-out",
              open || active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
            )}
          />
        </span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.16 }}
            className="fixed left-1/2 top-16 z-50 w-[min(64rem,calc(100vw-2rem))] -translate-x-1/2 pt-2 lg:top-[4.5rem] xl:w-[68rem]"
            onMouseEnter={openMenu}
            onMouseLeave={scheduleClose}
          >
            <MegaPanel menu={menu} isLoading={isLoading} onNavigate={() => setOpen(false)} />
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
  const { data: menu = [], isLoading } = useSubjectsMenu();
  const active = isSubjectsPathActive(pathname);

  const selectedCategory = menu.find((c) => c.id === categoryId) ?? menu[0] ?? null;
  const subjects = selectedCategory?.subjects ?? [];
  const selectedSubject = subjects.find((s) => s.id === subjectId) ?? subjects[0] ?? null;

  useEffect(() => {
    if (menu.length && !categoryId) setCategoryId(menu[0].id);
  }, [menu, categoryId]);

  useEffect(() => {
    if (subjects.length && (!subjectId || !subjects.some((s) => s.id === subjectId))) {
      setSubjectId(subjects[0].id);
    }
  }, [subjects, subjectId]);

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
      <button
        type="button"
        className={cn(
          "flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-left text-base font-medium transition-colors duration-300",
          active ? "text-[#ef3239]" : "text-foreground hover:text-[#ef3239]"
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
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : menu.length === 0 ? (
            <p className="px-2 py-4 text-sm text-muted-foreground">No subjects yet.</p>
          ) : (
            <>
              <div className="space-y-1">
                <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Category
                </p>
                {menu.map((category, index) => {
                  const Icon = categoryIcon(category, index);
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setCategoryId(category.id);
                        setSubjectId(null);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm",
                        category.id === selectedCategory?.id
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
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      {category.name}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1">
                <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Subject
                </p>
                {subjects.map((subject) => (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => setSubjectId(subject.id)}
                    className={cn(
                      "w-full rounded-lg px-3 py-2 text-left text-sm",
                      subject.id === selectedSubject?.id
                        ? "bg-card font-semibold text-foreground shadow-sm"
                        : "text-muted-foreground"
                    )}
                  >
                    {subject.name}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Programs & resources
                </p>
                {(selectedSubject?.programs ?? []).map((program) => (
                  <div key={program.id} className="rounded-xl border border-border bg-card p-3">
                    <p className="mb-2 text-sm font-bold text-foreground">{program.name}</p>
                    <div className="space-y-1">
                      {program.resources
                        .filter((r) => r.isActive !== false)
                        .map((resource) => (
                          <Link
                            key={resource.id}
                            href={resourceHref(program, resource)}
                            onClick={onNavigate}
                            className="block rounded-lg px-2 py-1.5 text-sm text-primary hover:bg-primary-muted"
                          >
                            {resource.title}
                          </Link>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
