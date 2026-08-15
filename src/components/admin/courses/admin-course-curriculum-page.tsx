"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react";
import { CourseCurriculumManager } from "@/components/curriculum/course-curriculum-manager";
import { CourseQuestionbankStep } from "@/components/admin/courses/course-questionbank-step";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ROUTES } from "@/constants";
import {
  useAdminCategories,
  useAdminCourse,
  useAdminUsers,
  useCourseProgramLinks,
  useUpdateCourse,
  useUpdateCourseStatus,
} from "@/hooks";
import { isRichTextEmpty, serializeRichText } from "@/lib/rich-text";
import { uploadService } from "@/services/upload.service";
import type { CourseUpsertInput } from "@/services/admin/admin-courses.service";
import type { ApiError, CourseLevel, CourseStatus } from "@/types";
import { cn } from "@/utils";

type Props = { courseId: string };
type TabId = "overview" | "curriculum" | "programs" | "publish";

const STEPS: { id: TabId; label: string; hint: string }[] = [
  { id: "overview", label: "Overview", hint: "Basics & description" },
  { id: "curriculum", label: "Curriculum", hint: "Chapters & lessons" },
  { id: "programs", label: "Questionbank", hint: "Subjects & practice" },
  { id: "publish", label: "Preview & publish", hint: "Go live" },
];

const LEVELS: CourseLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

type FormState = {
  title: string;
  slug: string;
  description: string;
  summary: string;
  thumbnail: string;
  thumbnailPublicId: string;
  promoVideoUrl: string;
  promoVideoPublicId: string;
  price: string;
  level: CourseLevel;
  language: string;
  outcomesText: string;
  requirementsText: string;
  targetAudience: string;
  hasCertificate: boolean;
  lifetimeAccess: boolean;
  accessDurationDays: string;
  seoTitle: string;
  seoDescription: string;
  categoryId: string;
  teacherId: string;
};

function linesToList(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function listToLines(value?: string[] | null) {
  return (value ?? []).join("\n");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function AdminCourseCurriculumPage({ courseId }: Props) {
  const { data: course, isLoading, error, refetch } = useAdminCourse(courseId);
  const { data: categories = [] } = useAdminCategories();
  const { data: users = [] } = useAdminUsers("TEACHER");
  const updateCourse = useUpdateCourse();
  const updateStatus = useUpdateCourseStatus();

  const [tab, setTab] = useState<TabId>("overview");
  const [form, setForm] = useState<FormState | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"thumb" | "promo" | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    if (!course) return;
    setForm({
      title: course.title ?? "",
      slug: course.slug ?? "",
      description: course.description ?? "",
      summary: course.summary ?? "",
      thumbnail: course.thumbnail ?? "",
      thumbnailPublicId: course.thumbnailPublicId ?? "",
      promoVideoUrl: course.promoVideoUrl ?? "",
      promoVideoPublicId: course.promoVideoPublicId ?? "",
      price: String(course.price ?? 0),
      level: (String(course.level).toUpperCase() as CourseLevel) || "BEGINNER",
      language: course.language ?? "English",
      outcomesText: listToLines(course.outcomes),
      requirementsText: listToLines(course.requirements),
      targetAudience: course.targetAudience ?? "",
      hasCertificate: course.hasCertificate ?? true,
      lifetimeAccess: course.lifetimeAccess ?? true,
      accessDurationDays:
        course.accessDurationDays != null && course.accessDurationDays > 0
          ? String(course.accessDurationDays)
          : "90",
      seoTitle: course.seoTitle ?? "",
      seoDescription: course.seoDescription ?? "",
      categoryId: course.categoryId ?? "",
      teacherId: course.teacherId ?? "",
    });
  }, [course]);

  const readiness = course?.readiness;
  const teachers = useMemo(
    () => users.filter((u) => String(u.role).toUpperCase() === "TEACHER"),
    [users]
  );
  const stepIndex = STEPS.findIndex((step) => step.id === tab);
  const { data: programLinks = [] } = useCourseProgramLinks(courseId);

  const stepDone = useMemo(() => {
    const overviewOk = Boolean(
      form?.title.trim() &&
        !isRichTextEmpty(form.description) &&
        form.categoryId &&
        form.teacherId
    );
    const curriculumOk = Boolean(
      readiness?.checks?.find((c) => c.id === "publishedLesson")?.ok ||
        (course?._count?.chapters ?? 0) > 0
    );
    const programsOk = programLinks.length > 0;
    const publishOk = Boolean(readiness?.ready) || String(course?.status).toUpperCase() === "PUBLISHED";
    return {
      overview: overviewOk,
      curriculum: curriculumOk,
      programs: programsOk,
      publish: publishOk,
    } satisfies Record<TabId, boolean>;
  }, [form, readiness, course, programLinks.length]);

  const completedCount = STEPS.filter((step) => stepDone[step.id]).length;
  const progressPercent = Math.round((completedCount / STEPS.length) * 100);

  const goToStep = (id: TabId) => {
    setTab(id);
    setActionError(null);
  };

  const goNext = async () => {
    if (tab === "overview") {
      const payload = buildPayload();
      if (!payload?.title || isRichTextEmpty(payload.description) || !payload.categoryId) {
        setActionError("Complete title, description, and category before continuing.");
        return;
      }
      if (!payload.teacherId) {
        setActionError("Select an instructor before continuing.");
        return;
      }
      setActionError(null);
      setSavedMessage(null);
      try {
        await updateCourse.mutateAsync({ id: courseId, payload });
        setSavedMessage("Saved. Moving to the next step…");
        void refetch();
      } catch (err) {
        setActionError((err as ApiError)?.message || "Failed to save course");
        return;
      }
    }
    const next = STEPS[stepIndex + 1];
    if (next) goToStep(next.id);
  };

  const goBack = () => {
    const prev = STEPS[stepIndex - 1];
    if (prev) goToStep(prev.id);
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const buildPayload = (): Partial<CourseUpsertInput> | null => {
    if (!form) return null;
    return {
      title: form.title.trim(),
      slug: form.slug.trim() || slugify(form.title),
      description: serializeRichText(form.description),
      summary: form.summary.trim() || undefined,
      thumbnail: form.thumbnail.trim() || undefined,
      thumbnailPublicId: form.thumbnailPublicId.trim() || undefined,
      promoVideoUrl: form.promoVideoUrl.trim() || undefined,
      promoVideoPublicId: form.promoVideoPublicId.trim() || undefined,
      price: Number(form.price) || 0,
      level: form.level,
      language: form.language.trim() || "English",
      outcomes: linesToList(form.outcomesText),
      requirements: linesToList(form.requirementsText),
      targetAudience: form.targetAudience.trim() || undefined,
      hasCertificate: form.hasCertificate,
      lifetimeAccess: form.lifetimeAccess,
      accessDurationDays: form.lifetimeAccess
        ? null
        : Math.max(1, Number(form.accessDurationDays) || 90),
      seoTitle: form.seoTitle.trim() || undefined,
      seoDescription: form.seoDescription.trim() || undefined,
      categoryId: form.categoryId,
      teacherId: form.teacherId || undefined,
    };
  };

  const onSave = async () => {
    const payload = buildPayload();
    if (!payload?.title || isRichTextEmpty(payload.description) || !payload.categoryId) {
      setActionError("Title, description, and category are required.");
      return;
    }
    setActionError(null);
    setSavedMessage(null);
    try {
      await updateCourse.mutateAsync({ id: courseId, payload });
      setSavedMessage("Course saved successfully.");
      void refetch();
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to save course");
    }
  };

  const onStatus = async (status: CourseStatus) => {
    setActionError(null);
    setSavedMessage(null);
    try {
      await updateStatus.mutateAsync({ id: courseId, status });
      setSavedMessage(`Course marked as ${status.toLowerCase()}.`);
      void refetch();
    } catch (err) {
      const apiErr = err as ApiError & { readiness?: { checks?: { label: string; ok: boolean }[] } };
      const failed = apiErr?.readiness?.checks?.filter((c) => !c.ok).map((c) => c.label);
      setActionError(
        failed?.length
          ? `Cannot publish yet: ${failed.join("; ")}`
          : apiErr?.message || "Failed to update status"
      );
    }
  };

  const onUpload = async (kind: "thumb" | "promo", file: File) => {
    setUploading(kind);
    setUploadProgress(0);
    setActionError(null);
    try {
      const result = await uploadService.upload(file, "courses", setUploadProgress);
      if (kind === "thumb") {
        setField("thumbnail", result.url);
        setField("thumbnailPublicId", result.publicId);
      } else {
        setField("promoVideoUrl", result.url);
        setField("promoVideoPublicId", result.publicId);
      }
    } catch (err) {
      setActionError((err as ApiError)?.message || "Upload failed");
    } finally {
      setUploading(null);
      setUploadProgress(null);
    }
  };

  if (isLoading && !course) return <PageLoader label="Loading course..." />;

  if (!course || !form) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-accent">
          {(error as unknown as ApiError)?.message || "Course not found."}
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href={ROUTES.admin.courses}>Back to courses</Link>
        </Button>
      </div>
    );
  }

  const busy = updateCourse.isPending || updateStatus.isPending || Boolean(uploading);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
            <Link href={ROUTES.admin.courses}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Courses
            </Link>
          </Button>
          <PageHeader
            title={course.title}
            description={`Course workspace · ${course.category?.name ?? "Course"} · ${String(course.status).toLowerCase()}`}
            className="mb-0"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={ROUTES.courseDetail(course.slug)} target="_blank">
              <ExternalLink className="h-4 w-4" aria-hidden />
              Public page
            </Link>
          </Button>
          <Button type="button" size="sm" disabled={busy} onClick={() => void onSave()}>
            {updateCourse.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save changes
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Course setup
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">
              Step {Math.max(stepIndex, 0) + 1} of {STEPS.length}
              <span className="font-normal text-muted-foreground">
                {" "}
                · {STEPS[stepIndex]?.label}
              </span>
            </p>
          </div>
          <p className="text-sm font-semibold text-primary">{progressPercent}% complete</p>
        </div>

        <div className="mb-5 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => {
            const active = tab === step.id;
            const done = stepDone[step.id];
            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => goToStep(step.id)}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-xl border px-2.5 py-2.5 text-left transition sm:flex-col sm:items-center sm:px-2 sm:text-center",
                    active
                      ? "border-primary bg-primary-muted shadow-sm"
                      : done
                        ? "border-accent-green/30 bg-[#ecfdf3]/60 hover:border-accent-green/50"
                        : "border-border bg-background hover:bg-muted/60"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      active
                        ? "bg-primary text-primary-foreground"
                        : done
                          ? "bg-accent-green text-white"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {done && !active ? <Check className="h-3.5 w-3.5" aria-hidden /> : index + 1}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={cn(
                        "block text-xs font-semibold sm:text-[13px]",
                        active ? "text-primary" : "text-foreground"
                      )}
                    >
                      {step.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">{step.hint}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {actionError ? (
        <p className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-accent">
          {actionError}
        </p>
      ) : null}
      {savedMessage ? (
        <p className="rounded-xl border border-accent-green/20 bg-[#ecfdf3] px-4 py-3 text-sm text-accent-green">
          {savedMessage}
        </p>
      ) : null}

      <div className="space-y-4">
      {tab === "overview" ? (
        <div className="grid gap-4 rounded-2xl border border-border bg-card p-5 lg:grid-cols-2">
          <Field label="Title">
            <Input
              value={form.title}
              onChange={(e) => {
                setField("title", e.target.value);
                if (!form.slug || form.slug === slugify(course.title)) {
                  setField("slug", slugify(e.target.value));
                }
              }}
            />
          </Field>
          <Field label="Slug">
            <Input value={form.slug} onChange={(e) => setField("slug", e.target.value)} />
          </Field>
          <Field label="Short summary" className="lg:col-span-2">
            <Input
              value={form.summary}
              onChange={(e) => setField("summary", e.target.value)}
              placeholder="Shown on course cards and hero"
            />
          </Field>
          <Field label="Full description" className="lg:col-span-2">
            <RichTextEditor
              value={form.description}
              onChange={(description) => setField("description", description)}
              placeholder="Detailed course overview for students"
              minHeight="160px"
            />
          </Field>
          <Field label="Category">
            <select
              value={form.categoryId}
              onChange={(e) => setField("categoryId", e.target.value)}
              className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Instructor">
            <select
              value={form.teacherId}
              onChange={(e) => setField("teacherId", e.target.value)}
              className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
            >
              <option value="">Select teacher</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Level">
            <select
              value={form.level}
              onChange={(e) => setField("level", e.target.value as CourseLevel)}
              className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
            >
              {LEVELS.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </Field>
          <Field label="Language">
            <Input value={form.language} onChange={(e) => setField("language", e.target.value)} />
          </Field>
          <Field label="Price">
            <Input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setField("price", e.target.value)}
            />
          </Field>

          <div className="lg:col-span-2 rounded-xl border border-border bg-muted/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Student access duration
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              After a student buys/enrolls, how long they can access this course (and linked questionbank).
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="radio"
                  name="access-mode"
                  checked={form.lifetimeAccess}
                  onChange={() => setField("lifetimeAccess", true)}
                />
                Lifetime access
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="radio"
                  name="access-mode"
                  checked={!form.lifetimeAccess}
                  onChange={() => setField("lifetimeAccess", false)}
                />
                Limited days
              </label>
              {!form.lifetimeAccess ? (
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Access for</span>
                  <Input
                    type="number"
                    min={1}
                    className="h-9 w-24"
                    value={form.accessDurationDays}
                    onChange={(e) => setField("accessDurationDays", e.target.value)}
                  />
                  <span className="text-muted-foreground">days</span>
                </label>
              ) : null}
            </div>
          </div>

          <Field label="Thumbnail">
            <div className="space-y-2">
              <Input
                value={form.thumbnail}
                onChange={(e) => {
                  setField("thumbnail", e.target.value);
                  setField("thumbnailPublicId", "");
                }}
                placeholder="Image URL"
              />
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                <Upload className="h-4 w-4" />
                Upload image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void onUpload("thumb", file);
                    e.target.value = "";
                  }}
                />
              </label>
              {form.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.thumbnail} alt="Thumbnail" className="h-28 w-full rounded-xl object-cover" />
              ) : null}
            </div>
          </Field>
          <Field label="Promo video">
            <div className="space-y-2">
              <Input
                value={form.promoVideoUrl}
                onChange={(e) => {
                  setField("promoVideoUrl", e.target.value);
                  setField("promoVideoPublicId", "");
                }}
                placeholder="YouTube or video URL"
              />
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                <Upload className="h-4 w-4" />
                Upload video
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void onUpload("promo", file);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </Field>
          {uploadProgress != null ? (
            <p className="text-sm text-muted-foreground lg:col-span-2">
              Uploading… {uploadProgress}%
            </p>
          ) : null}

          <details className="lg:col-span-2 rounded-xl border border-dashed border-border bg-muted/30 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-foreground">
              Optional extras — outcomes, audience & SEO
              <span className="ml-2 font-normal text-muted-foreground">(skip if not needed)</span>
            </summary>
            <p className="mt-2 text-xs text-muted-foreground">
              These are separate from the course description. Use them only if you want “What you’ll learn”,
              requirements, or custom search titles on the public page.
            </p>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <Field label="Learning outcomes (one per line)" className="lg:col-span-2">
                <textarea
                  value={form.outcomesText}
                  onChange={(e) => setField("outcomesText", e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                  placeholder={"Build real apps\nMaster React fundamentals"}
                />
              </Field>
              <Field label="Requirements (one per line)" className="lg:col-span-2">
                <textarea
                  value={form.requirementsText}
                  onChange={(e) => setField("requirementsText", e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                />
              </Field>
              <Field label="Target audience" className="lg:col-span-2">
                <Input
                  value={form.targetAudience}
                  onChange={(e) => setField("targetAudience", e.target.value)}
                  placeholder="Beginners who want to learn web development"
                />
              </Field>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={form.hasCertificate}
                  onChange={(e) => setField("hasCertificate", e.target.checked)}
                />
                Certificate available on completion
              </label>
              <div className="lg:col-span-1" />
              <Field label="SEO title">
                <Input value={form.seoTitle} onChange={(e) => setField("seoTitle", e.target.value)} />
              </Field>
              <Field label="SEO description">
                <Input
                  value={form.seoDescription}
                  onChange={(e) => setField("seoDescription", e.target.value)}
                />
              </Field>
            </div>
          </details>
        </div>
      ) : null}

      {tab === "curriculum" ? (
        <CourseCurriculumManager courseId={courseId} courseTitle={course.title} />
      ) : null}

      {tab === "programs" ? <CourseQuestionbankStep courseId={courseId} /> : null}

      {tab === "publish" ? (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-bold text-foreground">Publish readiness</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Fix any failed checks before publishing this course.
            </p>
            <ul className="mt-5 space-y-3">
              {(readiness?.checks ?? []).map((check) => (
                <li
                  key={check.id}
                  className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm"
                >
                  {check.ok ? (
                    <CheckCircle2 className="h-4 w-4 text-accent-green" aria-hidden />
                  ) : (
                    <XCircle className="h-4 w-4 text-accent" aria-hidden />
                  )}
                  <span className={check.ok ? "text-foreground" : "text-accent"}>{check.label}</span>
                </li>
              ))}
              {!readiness?.checks?.length ? (
                <li className="text-sm text-muted-foreground">Save the course to refresh readiness.</li>
              ) : null}
            </ul>
          </div>
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current status</p>
              <p className="mt-1 text-xl font-bold capitalize text-foreground">
                {String(course.status).toLowerCase()}
              </p>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href={ROUTES.courseDetail(course.slug)} target="_blank">
                Open public preview
              </Link>
            </Button>
            <Button
              type="button"
              className="w-full"
              disabled={busy || readiness?.ready === false}
              onClick={() => void onStatus("PUBLISHED")}
            >
              Publish course
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={busy}
              onClick={() => void onStatus("DRAFT")}
            >
              Set as draft
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={stepIndex <= 0 || busy}
          onClick={goBack}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </Button>
        <p className="text-xs text-muted-foreground sm:text-sm">
          {tab === "programs"
            ? "Link subjects and manage Key Concepts, Practice Exams, and Past Papers here."
            : tab === "publish"
              ? "Finish when all readiness checks pass."
              : "Complete this step, then continue."}
        </p>
        {tab === "publish" ? (
          <Button type="button" size="sm" disabled={busy} onClick={() => void onSave()}>
            {updateCourse.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save changes
          </Button>
        ) : (
          <Button type="button" size="sm" disabled={busy} onClick={() => void goNext()}>
            {updateCourse.isPending && tab === "overview" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            {tab === "overview" ? "Save & continue" : "Continue"}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        )}
      </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
