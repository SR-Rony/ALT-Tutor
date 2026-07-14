"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ListTree, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
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
import { slugify } from "@/lib/slugify";
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

  const onSubmit = async () => {
    const title = form.title.trim();
    const slug = form.slug.trim();
    const description = form.description.trim();
    if (!title || !slug || !description || !form.categoryId) {
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
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="border-b border-border px-5 py-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <PageHeader
              title="My Courses"
              description="Full access to your courses — edit details and manage curriculum."
              className="mb-0"
            />
            <div className="flex items-center gap-2">
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
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your courses..."
            className="max-w-md"
          />
          {actionError || error ? (
            <p className="mt-3 text-sm text-accent">
              {actionError || (error as unknown as ApiError)?.message || "Something went wrong"}
            </p>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">Course</th>
                <th className="px-5 py-3 font-semibold">Price</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Access</th>
                <th className="px-5 py-3 font-semibold">Created</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!visible.length ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                    You have no courses yet. Create one to start adding chapters and lessons.
                  </td>
                </tr>
              ) : null}
              {visible.map((course) => {
                const isOwned = ownedIds.has(course.id);
                return (
                  <tr key={course.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-foreground">{course.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {course.category?.name ?? "—"} · {String(course.level).toLowerCase()}
                      </p>
                    </td>
                    <td className="px-5 py-4">{formatMoney(course.price)}</td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase",
                          String(course.status) === "PUBLISHED"
                            ? "bg-[#ecfdf3] text-accent-green"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {String(course.status).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-muted-foreground">
                      {isOwned ? "Owner" : "Instructor"}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{formatShortDate(course.createdAt)}</td>
                    <td className="px-5 py-4 text-right">
                      <AdminActionsBar>
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Curriculum">
                          <Link href={ROUTES.teacher.courseCurriculum(course.id)} aria-label="Manage curriculum">
                            <ListTree className="h-4 w-4 text-primary" />
                          </Link>
                        </Button>
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={4}
              className={cn(fieldClass(), "h-auto py-2.5")}
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
