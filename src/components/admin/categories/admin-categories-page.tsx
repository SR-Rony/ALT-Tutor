"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { AdminActionsBar, AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useAdminCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "@/hooks";
import { formatShortDate } from "@/lib/format";
import { slugify } from "@/lib/slugify";
import type { ApiError } from "@/types";
import type { AdminCategory } from "@/services/admin/admin-categories.service";

type CategoryFormState = {
  name: string;
  slug: string;
};

const emptyForm: CategoryFormState = { name: "", slug: "" };

export function AdminCategoriesPage() {
  const { data = [], isLoading, error, refetch, isFetching } = useAdminCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [form, setForm] = useState<CategoryFormState>(emptyForm);
  const [autoSlug, setAutoSlug] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (item) => item.name.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q)
    );
  }, [data, search]);

  const busy = createCategory.isPending || updateCategory.isPending || deleteCategory.isPending;

  useEffect(() => {
    if (!modalOpen) return;
    if (editing) {
      setForm({ name: editing.name, slug: editing.slug });
      setAutoSlug(false);
    } else {
      setForm(emptyForm);
      setAutoSlug(true);
    }
  }, [modalOpen, editing]);

  const openCreate = () => {
    setEditing(null);
    setActionError(null);
    setModalOpen(true);
  };

  const openEdit = (category: AdminCategory) => {
    setEditing(category);
    setActionError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (busy) return;
    setModalOpen(false);
    setEditing(null);
  };

  const onNameChange = (name: string) => {
    setForm((prev) => ({
      name,
      slug: autoSlug ? slugify(name) : prev.slug,
    }));
  };

  const onSubmit = async () => {
    const name = form.name.trim();
    const slug = form.slug.trim();
    if (!name || !slug) {
      setActionError("Name and slug are required");
      return;
    }

    setActionError(null);
    try {
      if (editing) {
        setPendingId(editing.id);
        await updateCategory.mutateAsync({ id: editing.id, payload: { name, slug } });
      } else {
        await createCategory.mutateAsync({ name, slug });
      }
      setModalOpen(false);
      setEditing(null);
    } catch (err) {
      const apiError = err as ApiError;
      setActionError(apiError?.message || "Failed to save category");
    } finally {
      setPendingId(null);
    }
  };

  const onDelete = async (category: AdminCategory) => {
    const confirmed = window.confirm(
      `Delete category "${category.name}"? Courses using it may be affected.`
    );
    if (!confirmed) return;

    setActionError(null);
    setPendingId(category.id);
    try {
      await deleteCategory.mutateAsync(category.id);
    } catch (err) {
      const apiError = err as ApiError;
      setActionError(apiError?.message || "Failed to delete category");
    } finally {
      setPendingId(null);
    }
  };

  if (isLoading && data.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Categories" description="Create, update, and delete course categories." className="mb-0" />
        <PageLoader label="Loading categories..." />
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="border-b border-border px-5 py-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <PageHeader
              title="Categories"
              description="Full access — create, update, and delete categories."
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

          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="max-w-md"
          />

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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Slug</th>
                <th className="px-5 py-3 font-semibold">Updated</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">
                    No categories found. Create one to organize courses.
                  </td>
                </tr>
              ) : null}

              {visible.map((category) => {
                const rowBusy = busy && pendingId === category.id;
                return (
                  <tr key={category.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-4 font-semibold text-foreground">{category.name}</td>
                    <td className="px-5 py-4 text-muted-foreground">{category.slug}</td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {category.updatedAt ? formatShortDate(category.updatedAt) : "—"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <AdminActionsBar>
                        <AdminIconAction
                          label="Edit category"
                          icon={Pencil}
                          tone="primary"
                          disabled={rowBusy}
                          onClick={() => openEdit(category)}
                        />
                        <AdminIconAction
                          label="Delete category"
                          icon={Trash2}
                          tone="danger"
                          disabled={rowBusy}
                          onClick={() => void onDelete(category)}
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
        title={editing ? "Update category" : "Create category"}
        description="Categories help students browse courses on the public site."
        onClose={closeModal}
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeModal} disabled={busy}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void onSubmit()} disabled={busy}>
              {busy ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-foreground">Name</span>
            <Input
              value={form.name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g. Web Development"
              autoFocus
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-foreground">Slug</span>
            <Input
              value={form.slug}
              onChange={(e) => {
                setAutoSlug(false);
                setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }));
              }}
              placeholder="web-development"
            />
          </label>
          {actionError ? <p className="text-sm text-accent">{actionError}</p> : null}
        </div>
      </AdminModal>
    </>
  );
}
