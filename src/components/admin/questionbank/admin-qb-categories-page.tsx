"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";
import { slugify } from "@/lib/slugify";
import {
  useAdminSubjectsTree,
  useCreateSubjectCategory,
  useDeleteSubjectCategory,
  useUpdateSubjectCategory,
} from "@/hooks";
import type { ApiError, SubjectMenuCategory } from "@/types";

export function AdminQbCategoriesPage() {
  const { data: tree = [], isLoading, error, refetch, isFetching } = useAdminSubjectsTree();
  const createCategory = useCreateSubjectCategory();
  const updateCategory = useUpdateSubjectCategory();
  const deleteCategory = useDeleteSubjectCategory();

  const [form, setForm] = useState<{ id?: string } | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const busy = createCategory.isPending || updateCategory.isPending || deleteCategory.isPending;

  const openCreate = () => {
    setForm({});
    setName("");
    setSlug("");
    setActionError(null);
  };

  const openEdit = (category: SubjectMenuCategory) => {
    setForm({ id: category.id });
    setName(category.name);
    setSlug(category.slug);
    setActionError(null);
  };

  const onSubmit = async () => {
    setActionError(null);
    try {
      const payload = { name: name.trim(), slug: slug.trim() || slugify(name) };
      if (!payload.name || !payload.slug) throw { message: "Name and slug required" };
      if (form?.id) await updateCategory.mutateAsync({ id: form.id, payload });
      else await createCategory.mutateAsync({ ...payload, order: tree.length });
      setForm(null);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to save");
    }
  };

  const totalSubjects = useMemo(
    () => tree.reduce((sum, category) => sum + category.subjects.length, 0),
    [tree]
  );

  if (isLoading && tree.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Categories"
          description="Manage SSC / HSC style categories for the questionbank tree."
          className="mb-0"
        />
        <PageLoader label="Loading categories..." />
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="border-b border-border px-5 py-6">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <PageHeader
              title="Categories"
              description="Top-level groups (e.g. SSC, HSC). Subjects and programs sit under these."
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
                Add category
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {tree.length} categories · {totalSubjects} subjects ·{" "}
            <Link href={ROUTES.admin.qbSubjects} className="font-medium text-primary hover:underline">
              Manage subjects
            </Link>
          </p>
          {error ? (
            <p className="mt-2 text-sm text-accent">
              {(error as unknown as ApiError)?.message || "Something went wrong"}
            </p>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold">Slug</th>
                <th className="px-5 py-3 font-semibold">Subjects</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tree.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">
                    No categories yet. Add SSC or HSC to get started.
                  </td>
                </tr>
              ) : null}
              {tree.map((category) => (
                <tr key={category.id} className="border-b border-border/70 last:border-0">
                  <td className="px-5 py-3.5 font-semibold text-foreground">{category.name}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{category.slug}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{category.subjects.length}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-1">
                      <AdminIconAction
                        label="Edit"
                        icon={Pencil}
                        tone="primary"
                        onClick={() => openEdit(category)}
                      />
                      <AdminIconAction
                        label="Delete"
                        icon={Trash2}
                        tone="danger"
                        disabled={deleteCategory.isPending}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete category "${category.name}"? All subjects inside will be removed.`
                            )
                          ) {
                            void deleteCategory.mutateAsync(category.id);
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
        title={form?.id ? "Edit category" : "Add category"}
        description="Shown in the public Subjects menu and questionbank filters."
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
        <div className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Name</span>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!form?.id) setSlug(slugify(e.target.value));
              }}
              placeholder="e.g. SSC"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Slug</span>
            <Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />
          </label>
          {actionError ? <p className="text-sm text-accent">{actionError}</p> : null}
        </div>
      </AdminModal>
    </>
  );
}
