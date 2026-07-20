"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  Eye,
  FilePenLine,
  ImageIcon,
  Link2,
  ListTree,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { AdminActionsBar, AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";
import {
  useAdminCategories,
  useAdminCourses,
  useAdminUsers,
  useCreateCourse,
  useDeleteCourse,
  useUpdateCourse,
  useUpdateCourseStatus,
} from "@/hooks";
import { formatMoney, formatShortDate } from "@/lib/format";
import { isRichTextEmpty, serializeRichText } from "@/lib/rich-text";
import { slugify } from "@/lib/slugify";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { uploadService } from "@/services/upload.service";
import type { ApiError, AdminCourse, CourseLevel, CourseStatus } from "@/types";
import { cn } from "@/utils";

const statuses: CourseStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const levels: CourseLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

type ThumbnailMode = "upload" | "url";
type PricingMode = "free" | "paid";

type CourseFormState = {
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  thumbnailPublicId: string;
  pricing: PricingMode;
  salePrice: string;
  regularPrice: string;
  level: CourseLevel;
  categoryId: string;
  teacherId: string;
};

const emptyForm: CourseFormState = {
  title: "",
  slug: "",
  description: "",
  thumbnail: "",
  thumbnailPublicId: "",
  pricing: "free",
  salePrice: "",
  regularPrice: "",
  level: "BEGINNER",
  categoryId: "",
  teacherId: "",
};

function statusBadgeClass(status: string) {
  const s = status.toUpperCase();
  if (s === "PUBLISHED") return "bg-[#ecfdf3] text-accent-green";
  if (s === "DRAFT") return "bg-muted text-muted-foreground";
  return "bg-accent/10 text-accent";
}

function fieldClassName() {
  return "flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15";
}

export function AdminCoursesPage() {
  const router = useRouter();
  const { data = [], isLoading, error, refetch, isFetching } = useAdminCourses();
  const { data: categories = [] } = useAdminCategories();
  const { data: teachers = [] } = useAdminUsers("TEACHER");

  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const updateStatus = useUpdateCourseStatus();
  const deleteCourse = useDeleteCourse();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCourse | null>(null);
  const [form, setForm] = useState<CourseFormState>(emptyForm);
  const [autoSlug, setAutoSlug] = useState(true);
  const [thumbnailMode, setThumbnailMode] = useState<ThumbnailMode>("upload");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((course) => {
      const matchesStatus =
        statusFilter === "ALL" || String(course.status).toUpperCase() === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      return (
        course.title.toLowerCase().includes(q) ||
        course.slug.toLowerCase().includes(q) ||
        course.teacher.name.toLowerCase().includes(q) ||
        course.category.name.toLowerCase().includes(q)
      );
    });
  }, [data, search, statusFilter]);

  const busy =
    createCourse.isPending ||
    updateCourse.isPending ||
    updateStatus.isPending ||
    deleteCourse.isPending;

  useEffect(() => {
    if (!modalOpen) return;
    if (editing) {
      const publicId = editing.thumbnailPublicId ?? "";
      const price = Number(editing.price) || 0;
      const regularPrice = Number(editing.regularPrice) || 0;
      setForm({
        title: editing.title,
        slug: editing.slug,
        description: editing.description,
        thumbnail: editing.thumbnail ?? "",
        thumbnailPublicId: publicId,
        pricing: price > 0 ? "paid" : "free",
        salePrice: price > 0 ? String(price) : "",
        regularPrice: regularPrice > 0 ? String(regularPrice) : "",
        level: (String(editing.level).toUpperCase() as CourseLevel) || "BEGINNER",
        categoryId: editing.categoryId || editing.category?.id || "",
        teacherId: editing.teacherId || editing.teacher?.id || "",
      });
      setThumbnailMode(publicId ? "upload" : "url");
      setAutoSlug(false);
    } else {
      setForm({
        ...emptyForm,
        categoryId: categories[0]?.id ?? "",
        teacherId: teachers[0]?.id ?? "",
      });
      setThumbnailMode("upload");
      setAutoSlug(true);
    }
    setUploadProgress(null);
  }, [modalOpen, editing, categories, teachers]);

  const openCreate = () => {
    setEditing(null);
    setActionError(null);
    setModalOpen(true);
  };

  const openEdit = (course: AdminCourse) => {
    setEditing(course);
    setActionError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (createCourse.isPending || updateCourse.isPending || uploadProgress != null) return;
    setModalOpen(false);
    setEditing(null);
    setUploadProgress(null);
  };

  const onThumbnailUpload = async (file: File) => {
    setActionError(null);
    setUploadProgress(0);
    try {
      const result = await uploadService.upload(file, "courses", setUploadProgress);
      setForm((prev) => ({
        ...prev,
        thumbnail: result.url,
        thumbnailPublicId: result.publicId,
      }));
      setThumbnailMode("upload");
    } catch (err) {
      setActionError((err as ApiError)?.message || "Thumbnail upload failed");
    } finally {
      setUploadProgress(null);
    }
  };

  const onTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: autoSlug ? slugify(title) : prev.slug,
    }));
  };

  const onStatusChange = async (id: string, status: CourseStatus) => {
    setActionError(null);
    setPendingId(id);
    try {
      await updateStatus.mutateAsync({ id, status });
    } catch (err) {
      const apiError = err as ApiError;
      setActionError(apiError?.message || "Failed to update course status");
    } finally {
      setPendingId(null);
    }
  };

  const onDelete = async (id: string, title: string) => {
    const confirmed = window.confirm(`Delete course "${title}"? This cannot be undone.`);
    if (!confirmed) return;

    setActionError(null);
    setPendingId(id);
    try {
      await deleteCourse.mutateAsync(id);
    } catch (err) {
      const apiError = err as ApiError;
      setActionError(apiError?.message || "Failed to delete course");
    } finally {
      setPendingId(null);
    }
  };

  const onSubmit = async () => {
    const title = form.title.trim();
    const slug = form.slug.trim();
    const description = serializeRichText(form.description);
    const categoryId = form.categoryId;
    const teacherId = form.teacherId;

    if (!title || !slug || isRichTextEmpty(description) || !categoryId) {
      setActionError("Title, slug, description, and category are required");
      return;
    }
    if (!teacherId) {
      setActionError("Please select a teacher");
      return;
    }

    const isPaid = form.pricing === "paid";
    const salePrice = Number(form.salePrice) || 0;
    const regularPrice = Number(form.regularPrice) || 0;

    if (isPaid && salePrice <= 0) {
      setActionError("Paid course needs a sale price greater than 0");
      return;
    }
    if (isPaid && regularPrice > 0 && regularPrice < salePrice) {
      setActionError("Regular price should be greater than or equal to the sale price");
      return;
    }

    const payload = {
      title,
      slug,
      description,
      thumbnail: form.thumbnail.trim() || undefined,
      thumbnailPublicId: form.thumbnailPublicId.trim() || undefined,
      price: isPaid ? salePrice : 0,
      regularPrice: isPaid && regularPrice > 0 ? regularPrice : null,
      level: form.level,
      categoryId,
      teacherId,
    };

    setActionError(null);
    try {
      if (editing) {
        setPendingId(editing.id);
        await updateCourse.mutateAsync({ id: editing.id, payload });
      } else {
        await createCourse.mutateAsync(payload);
      }
      setModalOpen(false);
      setEditing(null);
    } catch (err) {
      const apiError = err as ApiError;
      setActionError(apiError?.message || "Failed to save course");
    } finally {
      setPendingId(null);
    }
  };

  if (isLoading && data.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Courses"
          description="Create, update, publish, and delete courses."
          className="mb-0"
        />
        <PageLoader label="Loading courses..." />
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="border-b border-border px-5 py-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <PageHeader
              title="Courses"
              description="Full access — create, update, status change, and delete."
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
              <Button type="button" size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4" aria-hidden />
                Add course
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, teacher, or category..."
              className="max-w-md"
            />
            <div className="flex flex-wrap gap-2">
              {["ALL", ...statuses].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                    statusFilter === status
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {actionError || error ? (
            <p className="mt-3 text-sm text-accent">
              {actionError || (error as unknown as ApiError)?.message || "Something went wrong"}
              {!actionError && error ? (
                <button type="button" className="ml-2 underline" onClick={() => void refetch()}>
                  Retry
                </button>
              ) : null}
            </p>
          ) : null}

          {categories.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No categories yet.{" "}
              <Link href={ROUTES.admin.categories} className="font-semibold text-primary underline">
                Create a category
              </Link>{" "}
              before adding courses.
            </p>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">Course</th>
                <th className="px-5 py-3 font-semibold">Teacher</th>
                <th className="px-5 py-3 font-semibold">Price</th>
                <th className="px-5 py-3 font-semibold">Enrolled</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Created</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!isLoading && visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                    No courses match your filters.
                  </td>
                </tr>
              ) : null}

              {visible.map((course) => {
                const current = String(course.status).toUpperCase() as CourseStatus;
                const rowBusy = busy && pendingId === course.id;
                const detailsHref = ROUTES.admin.courseCurriculum(course.id);

                return (
                  <tr
                    key={course.id}
                    role="link"
                    tabIndex={0}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/30"
                    onClick={() => router.push(detailsHref)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(detailsHref);
                      }
                    }}
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-foreground">{course.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {course.category?.name ?? "—"} · {String(course.level).toLowerCase()}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{course.teacher?.name ?? "—"}</td>
                    <td className="px-5 py-4 font-medium text-foreground">{formatMoney(course.price)}</td>
                    <td className="px-5 py-4 text-muted-foreground">{course._count?.enrollments ?? 0}</td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                          statusBadgeClass(String(course.status))
                        )}
                      >
                        {String(course.status).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{formatShortDate(course.createdAt)}</td>
                    <td
                      className="px-5 py-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <AdminActionsBar>
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10"
                          title="Manage curriculum"
                        >
                          <Link href={ROUTES.admin.courseCurriculum(course.id)} aria-label="Manage curriculum">
                            <ListTree className="h-4 w-4" aria-hidden />
                          </Link>
                        </Button>
                        <AdminIconAction
                          label="Edit course"
                          icon={Pencil}
                          tone="primary"
                          disabled={rowBusy}
                          onClick={() => openEdit(course)}
                        />
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10"
                          title="View course"
                        >
                          <Link href={ROUTES.courseDetail(course.slug)} target="_blank" aria-label="View course">
                            <Eye className="h-4 w-4" aria-hidden />
                          </Link>
                        </Button>

                        {current !== "PUBLISHED" ? (
                          <AdminIconAction
                            label="Publish"
                            icon={CheckCircle2}
                            tone="success"
                            disabled={rowBusy}
                            onClick={() => void onStatusChange(course.id, "PUBLISHED")}
                          />
                        ) : null}

                        {current !== "DRAFT" ? (
                          <AdminIconAction
                            label="Set draft"
                            icon={FilePenLine}
                            tone="warning"
                            disabled={rowBusy}
                            onClick={() => void onStatusChange(course.id, "DRAFT")}
                          />
                        ) : null}

                        {current !== "ARCHIVED" ? (
                          <AdminIconAction
                            label="Archive"
                            icon={Archive}
                            tone="default"
                            disabled={rowBusy}
                            onClick={() => void onStatusChange(course.id, "ARCHIVED")}
                          />
                        ) : null}

                        <AdminIconAction
                          label="Delete course"
                          icon={Trash2}
                          tone="danger"
                          disabled={rowBusy}
                          onClick={() => void onDelete(course.id, course.title)}
                        />
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
        description="Fill in course details. New courses start as Draft until published."
        onClose={closeModal}
        className="sm:max-w-2xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              disabled={createCourse.isPending || updateCourse.isPending || uploadProgress != null}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void onSubmit()}
              disabled={
                createCourse.isPending ||
                updateCourse.isPending ||
                uploadProgress != null ||
                categories.length === 0
              }
            >
              {createCourse.isPending || updateCourse.isPending
                ? "Saving..."
                : editing
                  ? "Update course"
                  : "Create course"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-sm font-semibold text-foreground">Title</span>
            <Input value={form.title} onChange={(e) => onTitleChange(e.target.value)} placeholder="Course title" />
          </label>

          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-sm font-semibold text-foreground">Slug</span>
            <Input
              value={form.slug}
              onChange={(e) => {
                setAutoSlug(false);
                setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }));
              }}
              placeholder="course-slug"
            />
          </label>

          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-sm font-semibold text-foreground">Description</span>
            <RichTextEditor
              value={form.description}
              onChange={(description) => setForm((prev) => ({ ...prev, description }))}
              placeholder="What students will learn..."
              minHeight="140px"
            />
          </label>

          <div className="space-y-2 sm:col-span-2">
            <span className="text-sm font-semibold text-foreground">Thumbnail</span>
            <div className="flex gap-1 rounded-xl border border-border bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => setThumbnailMode("upload")}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                  thumbnailMode === "upload"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Upload className="h-3.5 w-3.5" aria-hidden />
                Upload image
              </button>
              <button
                type="button"
                onClick={() => setThumbnailMode("url")}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                  thumbnailMode === "url"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Link2 className="h-3.5 w-3.5" aria-hidden />
                Image URL
              </button>
            </div>

            {thumbnailMode === "upload" ? (
              <div className="space-y-2">
                <label
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center transition-colors hover:border-primary/40 hover:bg-primary/5",
                    uploadProgress != null && "pointer-events-none opacity-70"
                  )}
                >
                  {uploadProgress != null ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-muted-foreground" aria-hidden />
                  )}
                  <span className="text-sm font-medium text-foreground">
                    {uploadProgress != null
                      ? `Uploading… ${uploadProgress}%`
                      : form.thumbnail
                        ? "Replace image"
                        : "Click to upload thumbnail"}
                  </span>
                  <span className="text-xs text-muted-foreground">PNG, JPG, WEBP</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadProgress != null}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void onThumbnailUpload(file);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            ) : (
              <Input
                value={form.thumbnail}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    thumbnail: e.target.value,
                    thumbnailPublicId: "",
                  }))
                }
                placeholder="https://images.unsplash.com/..."
              />
            )}

            {form.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.thumbnail}
                alt="Thumbnail preview"
                className="h-28 w-full rounded-xl border border-border object-cover"
              />
            ) : null}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <span className="text-sm font-semibold text-foreground">Price</span>
            <div className="flex flex-wrap gap-4 rounded-xl border border-border bg-muted/20 px-4 py-3">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={form.pricing === "free"}
                  onChange={() =>
                    setForm((prev) => ({
                      ...prev,
                      pricing: "free",
                      salePrice: "",
                      regularPrice: "",
                    }))
                  }
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                Free
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={form.pricing === "paid"}
                  onChange={() => setForm((prev) => ({ ...prev, pricing: "paid" }))}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                Paid
              </label>
            </div>

            {form.pricing === "paid" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Sale price (students pay this)
                  </span>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.salePrice}
                    onChange={(e) => setForm((prev) => ({ ...prev, salePrice: e.target.value }))}
                    placeholder="e.g. 499"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Regular price (optional, shown struck-through)
                  </span>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.regularPrice}
                    onChange={(e) => setForm((prev) => ({ ...prev, regularPrice: e.target.value }))}
                    placeholder="e.g. 999"
                  />
                </label>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Students can start this course without any payment.
              </p>
            )}
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-foreground">Level</span>
            <select
              value={form.level}
              onChange={(e) => setForm((prev) => ({ ...prev, level: e.target.value as CourseLevel }))}
              className={fieldClassName()}
            >
              {levels.map((level) => (
                <option key={level} value={level}>
                  {level.charAt(0) + level.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-foreground">Category</span>
            <select
              value={form.categoryId}
              onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
              className={fieldClassName()}
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-foreground">Teacher</span>
            <select
              value={form.teacherId}
              onChange={(e) => setForm((prev) => ({ ...prev, teacherId: e.target.value }))}
              className={fieldClassName()}
            >
              <option value="">Select teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </label>

          {teachers.length === 0 ? (
            <p className="sm:col-span-2 text-sm text-muted-foreground">
              No teachers found. Promote a user to Teacher role first.
            </p>
          ) : null}

          {actionError ? <p className="sm:col-span-2 text-sm text-accent">{actionError}</p> : null}
        </div>
      </AdminModal>
    </>
  );
}
