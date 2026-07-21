"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, RefreshCw, Trash2, Users } from "lucide-react";
import { AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";
import { slugify } from "@/lib/slugify";
import {
  useAdminSubjectsTree,
  useAdminUsers,
  useAssignSubjectTeachers,
  useCreateSubject,
  useDeleteSubject,
  useUpdateSubject,
} from "@/hooks";
import type { ApiError, SubjectMenuSubject } from "@/types";
import { cn } from "@/utils";

type FormMode =
  | { kind: "subject"; categoryId: string; id?: string }
  | { kind: "teachers"; subjectId: string; subjectName: string };

export function AdminQbSubjectsPage() {
  const { data: tree = [], isLoading, error, refetch, isFetching } = useAdminSubjectsTree();
  const { data: teachers = [] } = useAdminUsers("TEACHER");
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();
  const assignTeachers = useAssignSubjectTeachers();

  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [form, setForm] = useState<FormMode | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [teacherIds, setTeacherIds] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);

  const busy =
    createSubject.isPending ||
    updateSubject.isPending ||
    deleteSubject.isPending ||
    assignTeachers.isPending;

  const rows = useMemo(() => {
    return tree.flatMap((category) =>
      category.subjects.map((subject) => ({ category, subject }))
    );
  }, [tree]);

  const visible = useMemo(() => {
    if (categoryFilter === "ALL") return rows;
    return rows.filter((row) => row.category.id === categoryFilter);
  }, [rows, categoryFilter]);

  const openCreate = () => {
    const categoryId = categoryFilter !== "ALL" ? categoryFilter : tree[0]?.id;
    if (!categoryId) {
      setActionError("Create a category first.");
      return;
    }
    setForm({ kind: "subject", categoryId });
    setName("");
    setSlug("");
    setActionError(null);
  };

  const openEdit = (categoryId: string, subject: SubjectMenuSubject) => {
    setForm({ kind: "subject", categoryId, id: subject.id });
    setName(subject.name);
    setSlug(subject.slug);
    setActionError(null);
  };

  const onSubmit = async () => {
    if (!form) return;
    setActionError(null);
    try {
      if (form.kind === "subject") {
        const payload = {
          categoryId: form.categoryId,
          name: name.trim(),
          slug: slug.trim() || slugify(name),
        };
        if (!payload.name || !payload.slug) throw { message: "Name and slug required" };
        if (form.id) await updateSubject.mutateAsync({ id: form.id, payload });
        else await createSubject.mutateAsync(payload);
      }
      if (form.kind === "teachers") {
        await assignTeachers.mutateAsync({ subjectId: form.subjectId, teacherIds });
      }
      setForm(null);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to save");
    }
  };

  if (isLoading && tree.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Subjects"
          description="Manage subjects under each category and assign teachers."
          className="mb-0"
        />
        <PageLoader label="Loading subjects..." />
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="border-b border-border px-5 py-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <PageHeader
              title="Subjects"
              description="Subjects live under a category. Assign teachers and add programs next."
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
              <Button type="button" size="sm" onClick={openCreate} disabled={tree.length === 0}>
                <Plus className="h-4 w-4" aria-hidden />
                Add subject
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCategoryFilter("ALL")}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                categoryFilter === "ALL"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              All
            </button>
            {tree.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setCategoryFilter(category.id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  categoryFilter === category.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {category.name}
              </button>
            ))}
            <Link
              href={ROUTES.admin.qbCategories}
              className="ml-auto text-xs font-semibold text-primary hover:underline"
            >
              Manage categories
            </Link>
          </div>

          {actionError && !form ? <p className="mt-3 text-sm text-accent">{actionError}</p> : null}
          {error ? (
            <p className="mt-2 text-sm text-accent">
              {(error as unknown as ApiError)?.message || "Something went wrong"}
            </p>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">Subject</th>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold">Programs</th>
                <th className="px-5 py-3 font-semibold">Teachers</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                    {tree.length === 0
                      ? "Create a category first, then add subjects."
                      : "No subjects in this filter."}
                  </td>
                </tr>
              ) : null}
              {visible.map(({ category, subject }) => (
                <tr key={subject.id} className="border-b border-border/70 last:border-0">
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-foreground">{subject.name}</p>
                    <p className="text-xs text-muted-foreground">{subject.slug}</p>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{category.name}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{subject.programs.length}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {subject.teachers?.length
                      ? subject.teachers.map((t) => t.teacher.name).join(", ")
                      : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-1">
                      <AdminIconAction
                        label="Teachers"
                        icon={Users}
                        tone="primary"
                        onClick={() => {
                          setForm({
                            kind: "teachers",
                            subjectId: subject.id,
                            subjectName: subject.name,
                          });
                          setTeacherIds(subject.teachers?.map((t) => t.teacher.id) ?? []);
                          setActionError(null);
                        }}
                      />
                      <AdminIconAction
                        label="Edit"
                        icon={Pencil}
                        onClick={() => openEdit(category.id, subject)}
                      />
                      <AdminIconAction
                        label="Delete"
                        icon={Trash2}
                        tone="danger"
                        onClick={() => {
                          if (window.confirm(`Delete subject "${subject.name}"?`)) {
                            void deleteSubject.mutateAsync(subject.id);
                          }
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AdminModal
        open={Boolean(form)}
        title={
          form?.kind === "teachers"
            ? `Teachers — ${form.subjectName}`
            : form?.id
              ? "Edit subject"
              : "Add subject"
        }
        description={
          form?.kind === "teachers"
            ? "Teachers assigned here can manage related program content."
            : "Subjects appear under the selected category."
        }
        onClose={() => {
          if (!busy) setForm(null);
        }}
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={busy} onClick={() => void onSubmit()}>
              {busy ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      >
        {form?.kind === "teachers" ? (
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {teachers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No teachers found.</p>
            ) : null}
            {teachers.map((teacher) => {
              const checked = teacherIds.includes(teacher.id);
              return (
                <label key={teacher.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      setTeacherIds((ids) =>
                        e.target.checked ? [...ids, teacher.id] : ids.filter((id) => id !== teacher.id)
                      );
                    }}
                  />
                  {teacher.name}
                </label>
              );
            })}
            {actionError ? <p className="text-sm text-accent">{actionError}</p> : null}
          </div>
        ) : (
          <div className="space-y-3">
            {form?.kind === "subject" && !form.id ? (
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">Category</span>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ kind: "subject", categoryId: e.target.value })}
                  className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
                >
                  {tree.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Name</span>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!form || !("id" in form) || !form.id) setSlug(slugify(e.target.value));
                }}
                placeholder="e.g. Mathematics"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Slug</span>
              <Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />
            </label>
            {actionError ? <p className="text-sm text-accent">{actionError}</p> : null}
          </div>
        )}
      </AdminModal>
    </>
  );
}
