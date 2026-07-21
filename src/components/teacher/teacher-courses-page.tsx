"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  ListTree,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { AdminActionsBar, AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";
import {
  useCategories,
  useTeacherCourses,
  useTeacherCreateCourse,
  useTeacherDeleteCourse,
  useTeacherUpdateCourse,
} from "@/hooks";
import { formatMoney, formatShortDate } from "@/lib/format";
import { isRichTextEmpty, serializeRichText } from "@/lib/rich-text";
import { slugify } from "@/lib/slugify";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import type { AdminCourse, ApiError, CourseLevel } from "@/types";
import { cn } from "@/utils";

const levels: CourseLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

type FormState = {
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  price: string;
  level: CourseLevel;
  categoryId: string;
};

const emptyForm: FormState = {
  title: "",
  slug: "",
  description: "",
  thumbnail: "",
  price: "0",
  level: "BEGINNER",
  categoryId: "",
};

function fieldClass() {
  return "flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15";
}

export function TeacherCoursesPage() {
  const router = useRouter();
  const { data, isLoading, error, refetch, isFetching } = useTeacherCourses();
  const { data: categories = [] } = useCategories();
  const createCourse = useTeacherCreateCourse();
  const updateCourse = useTeacherUpdateCourse();
  const deleteCourse = useTeacherDeleteCourse();

  const courses = data?.all ?? [];
  const ownedIds = useMemo(() => new Set((data?.owned ?? []).map((c) => c.id)), [data?.owned]);

  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCourse | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [autoSlug, setAutoSlug] = useState(true);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.category?.name ?? "").toLowerCase().includes(q)
    );
  }, [courses, search]);

  const busy = createCourse.isPending || updateCourse.isPending || deleteCourse.isPending;
  const publishedCount = courses.filter((c) => String(c.status) === "PUBLISHED").length;

  useEffect(() => {
    if (!modalOpen) return;
    if (editing) {
      setForm({
        title: editing.title,
        slug: editing.slug,
        description: editing.description,
        thumbnail: editing.thumbnail ?? "",
        price: String(Number(editing.price) || 0),
        level: (String(editing.level).toUpperCase() as CourseLevel) || "BEGINNER",
        categoryId: editing.categoryId || editing.category?.id || "",
      });
      setAutoSlug(false);
    } else {
      setForm({ ...emptyForm, categoryId: categories[0]?.id ?? "" });
      setAutoSlug(true);
    }
  }, [modalOpen, editing, categories]);

  const openCurriculum = (courseId: string) => {
    router.push(ROUTES.teacher.courseCurriculum(courseId));
  };

  const onSubmit = async () => {
    const title = form.title.trim();
    const slug = form.slug.trim();
    const description = serializeRichText(form.description);
    if (!title || !slug || isRichTextEmpty(description) || !form.categoryId) {
      setActionError("Title, slug, description, and category are required");
      return;
    }
    const payload = {
      title,
      slug,
      description,
      thumbnail: form.thumbnail.trim() || undefined,
      price: Number(form.price) || 0,
      level: form.level,
      categoryId: form.categoryId,
    };
    setActionError(null);
    try {
      if (editing) {
        await updateCourse.mutateAsync({ id: editing.id, payload });
      } else {
        await createCourse.mutateAsync(payload);
      }
      setModalOpen(false);
      setEditing(null);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to save course");
    }
  };

  const onDelete = async (course: AdminCourse) => {
    if (!ownedIds.has(course.id)) {
      setActionError("You can only delete courses you own");
      return;
    }
    const confirmed = window.confirm(`Delete course "${course.title}"?`);
    if (!confirmed) return;
    setActionError(null);
    try {
      await deleteCourse.mutateAsync(course.id);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to delete course");
    }
  };

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Courses" description="Manage your courses, chapters, and lessons." className="mb-0" />
        <PageLoader label="Loading your courses..." />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <PageHeader
              title="My Courses"
              description="Click a course to open its curriculum. Edit details anytime from the actions."
              className="mb-0"
            />
            <p className="mt-2 text-xs font-medium text-muted-foreground">
              {courses.length} course{courses.length === 1 ? "" : "s"}
              {" · "}
              {publishedCount} published
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <AdminIconAction
              label="Refresh"
              icon={RefreshCw}
              tone="primary"
              disabled={isFetching}
              onClick={() => void refetch()}
              className={isFetching ? "animate-spin" : undefined}
            />
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditing(null);
                setActionError(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden />
              New course
            </Button>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your courses..."
            className="pl-9"
          />
        </div>

        {actionError || error ? (
          <p className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-accent">
            {actionError || (error as unknown as ApiError)?.message || "Something went wrong"}
          </p>
        ) : null}

        {!visible.length ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <ListTree className="mx-auto h-10 w-10 text-muted-foreground/60" aria-hidden />
            <p className="mt-4 font-semibold text-foreground">
              {search.trim() ? "No courses match your search" : "No courses yet"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search.trim()
                ? "Try a different title, slug, or category."
                : "Create a course, then add chapters and lessons."}
            </p>
            {!search.trim() ? (
              <Button
                type="button"
                className="mt-5"
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setActionError(null);
                  setModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4" aria-hidden />
                Create first course
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((course) => {
              const isOwned = ownedIds.has(course.id);
              const isPublished = String(course.status) === "PUBLISHED";
              const enrollments = course._count?.enrollments ?? 0;

              return (
                <div
                  key={course.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openCurriculum(course.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openCurriculum(course.id);
                    }
                  }}
                  className={cn(
                    "group cursor-pointer rounded-2xl border border-border bg-card p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-5",
                    "transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_14px_32px_rgba(24,119,242,0.12)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
                  )}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-bold text-foreground group-hover:text-primary sm:text-lg">
                          {course.title}
                        </h3>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase",
                            isPublished ? "bg-[#ecfdf3] text-accent-green" : "bg-muted text-muted-foreground"
                          )}
                        >
                          {String(course.status).toLowerCase()}
                        </span>
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                          {isOwned ? "Owner" : "Co-teacher"}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        {course.category?.name ?? "Uncategorized"}
                        {" · "}
                        {String(course.level).toLowerCase()}
                        {" · "}
                        {formatMoney(course.price)}
                        {" · "}
                        Created {formatShortDate(course.createdAt)}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-medium text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" aria-hidden />
                          {enrollments} enrolled
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-primary">
                          <ListTree className="h-3.5 w-3.5" aria-hidden />
                          Open curriculum
                          <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden />
                        </span>
                      </div>
                    </div>

                    <div
                      className="flex shrink-0 items-center gap-1 self-end lg:self-center"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <AdminActionsBar>
                        <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                          <Link href={ROUTES.teacher.courseCurriculum(course.id)}>
                            <ListTree className="h-3.5 w-3.5" aria-hidden />
                            Curriculum
                          </Link>
                        </Button>
                        <AdminIconAction
                          label="Open curriculum"
                          icon={ListTree}
                          tone="primary"
                          className="sm:hidden"
                          onClick={() => openCurriculum(course.id)}
                        />
                        {isOwned ? (
                          <>
                            <AdminIconAction
                              label="Edit course"
                              icon={Pencil}
                              tone="primary"
                              disabled={busy}
                              onClick={() => {
                                setEditing(course);
                                setActionError(null);
                                setModalOpen(true);
                              }}
                            />
                            <AdminIconAction
                              label="Delete course"
                              icon={Trash2}
                              tone="danger"
                              disabled={busy}
                              onClick={() => void onDelete(course)}
                            />
                          </>
                        ) : null}
                      </AdminActionsBar>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AdminModal
        open={modalOpen}
        title={editing ? "Update course" : "Create course"}
        description="Courses start as Draft. An admin can publish them."
        onClose={() => !busy && setModalOpen(false)}
        className="sm:max-w-2xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={busy || !categories.length} onClick={() => void onSubmit()}>
              {busy ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-sm font-semibold">Title</span>
            <Input
              value={form.title}
              onChange={(e) => {
                const title = e.target.value;
                setForm((p) => ({ ...p, title, slug: autoSlug ? slugify(title) : p.slug }));
              }}
            />
          </label>
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-sm font-semibold">Slug</span>
            <Input
              value={form.slug}
              onChange={(e) => {
                setAutoSlug(false);
                setForm((p) => ({ ...p, slug: slugify(e.target.value) }));
              }}
            />
          </label>
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-sm font-semibold">Description</span>
            <RichTextEditor
              value={form.description}
              onChange={(description) => setForm((p) => ({ ...p, description }))}
              placeholder="What students will learn..."
              minHeight="140px"
            />
          </label>
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-sm font-semibold">Thumbnail URL</span>
            <Input
              value={form.thumbnail}
              onChange={(e) => setForm((p) => ({ ...p, thumbnail: e.target.value }))}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Price</span>
            <Input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Level</span>
            <select
              value={form.level}
              onChange={(e) => setForm((p) => ({ ...p, level: e.target.value as CourseLevel }))}
              className={fieldClass()}
            >
              {levels.map((level) => (
                <option key={level} value={level}>
                  {level.charAt(0) + level.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-sm font-semibold">Category</span>
            <select
              value={form.categoryId}
              onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
              className={fieldClass()}
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </label>
          {actionError ? <p className="sm:col-span-2 text-sm text-accent">{actionError}</p> : null}
        </div>
      </AdminModal>
    </>
  );
}
