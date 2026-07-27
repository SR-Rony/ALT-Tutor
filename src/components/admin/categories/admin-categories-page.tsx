"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { AdminActionsBar, AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";
import {
  useAdminCategories,
  useAdminSubjectsTree,
  useCreateCategory,
  useCreateSubjectCategory,
  useDeleteCategory,
  useDeleteSubjectCategory,
  useUpdateCategory,
  useUpdateSubjectCategory,
} from "@/hooks";
import { formatShortDate } from "@/lib/format";
import { slugify } from "@/lib/slugify";
import type { ApiError, SubjectMenuCategory } from "@/types";
import type { AdminCategory } from "@/services/admin/admin-categories.service";
import { cn } from "@/utils";

type CategoryKind = "question" | "course";
type ListTab = CategoryKind;

type EditTarget =
  | { kind: "question"; category: SubjectMenuCategory }
  | { kind: "course"; category: AdminCategory };

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}

export function AdminCategoriesPage() {
  const {
    data: courseCategories = [],
    isLoading: courseLoading,
    error: courseError,
    refetch: refetchCourses,
    isFetching: courseFetching,
  } = useAdminCategories();
  const {
    data: qbTree = [],
    isLoading: qbLoading,
    error: qbError,
    refetch: refetchQb,
    isFetching: qbFetching,
  } = useAdminSubjectsTree();

  const createCourseCategory = useCreateCategory();
  const updateCourseCategory = useUpdateCategory();
  const deleteCourseCategory = useDeleteCategory();
  const createQbCategory = useCreateSubjectCategory();
  const updateQbCategory = useUpdateSubjectCategory();
  const deleteQbCategory = useDeleteSubjectCategory();

  const [listTab, setListTab] = useState<ListTab>("question");
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formKind, setFormKind] = useState<CategoryKind>("question");
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [autoSlug, setAutoSlug] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const busy =
    createCourseCategory.isPending ||
    updateCourseCategory.isPending ||
    deleteCourseCategory.isPending ||
    createQbCategory.isPending ||
    updateQbCategory.isPending ||
    deleteQbCategory.isPending;

  const isFetching = courseFetching || qbFetching;
  const isLoading = courseLoading || qbLoading;

  const filteredQuestionCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return qbTree;
    return qbTree.filter(
      (item) => item.name.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q)
    );
  }, [qbTree, search]);

  const filteredCourseCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return courseCategories;
    return courseCategories.filter(
      (item) => item.name.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q)
    );
  }, [courseCategories, search]);

  const totalQbSubjects = useMemo(
    () => qbTree.reduce((sum, category) => sum + category.subjects.length, 0),
    [qbTree]
  );

  useEffect(() => {
    if (!modalOpen) return;
    if (editing) {
      setFormKind(editing.kind);
      setName(editing.category.name);
      setSlug(editing.category.slug);
      setAutoSlug(false);
      return;
    }
    setFormKind(listTab);
    setName("");
    setSlug("");
    setAutoSlug(true);
  }, [modalOpen, editing, listTab]);

  const openCreate = () => {
    setEditing(null);
    setFormKind(listTab);
    setActionError(null);
    setModalOpen(true);
  };

  const openEditQuestion = (category: SubjectMenuCategory) => {
    setEditing({ kind: "question", category });
    setActionError(null);
    setModalOpen(true);
  };

  const openEditCourse = (category: AdminCategory) => {
    setEditing({ kind: "course", category });
    setActionError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (busy) return;
    setModalOpen(false);
    setEditing(null);
  };

  const onNameChange = (value: string) => {
    setName(value);
    if (autoSlug) setSlug(slugify(value));
  };

  const refreshAll = () => {
    void refetchCourses();
    void refetchQb();
  };

  const onSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedSlug = slug.trim() || slugify(trimmedName);
    if (!trimmedName || !trimmedSlug) {
      setActionError("Name and slug are required");
      return;
    }

    setActionError(null);
    const kind = editing?.kind ?? formKind;

    try {
      if (kind === "question") {
        if (editing?.kind === "question") {
          setPendingId(editing.category.id);
          await updateQbCategory.mutateAsync({
            id: editing.category.id,
            payload: { name: trimmedName, slug: trimmedSlug },
          });
        } else {
          await createQbCategory.mutateAsync({
            name: trimmedName,
            slug: trimmedSlug,
            order: qbTree.length,
            isActive: true,
          });
        }
      } else if (editing?.kind === "course") {
        setPendingId(editing.category.id);
        await updateCourseCategory.mutateAsync({
          id: editing.category.id,
          payload: { name: trimmedName, slug: trimmedSlug },
        });
      } else {
        await createCourseCategory.mutateAsync({ name: trimmedName, slug: trimmedSlug });
      }
      setModalOpen(false);
      setEditing(null);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to save category");
    } finally {
      setPendingId(null);
    }
  };

  const onDeleteQuestion = async (category: SubjectMenuCategory) => {
    if (
      !window.confirm(`Delete questionbank category "${category.name}"? All subjects inside will be removed.`)
    ) {
      return;
    }
    setActionError(null);
    setPendingId(category.id);
    try {
      await deleteQbCategory.mutateAsync(category.id);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to delete category");
    } finally {
      setPendingId(null);
    }
  };

  const onDeleteCourse = async (category: AdminCategory) => {
    if (!window.confirm(`Delete course category "${category.name}"? Courses using it may be affected.`)) {
      return;
    }
    setActionError(null);
    setPendingId(category.id);
    try {
      await deleteCourseCategory.mutateAsync(category.id);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to delete category");
    } finally {
      setPendingId(null);
    }
  };

  if (isLoading && qbTree.length === 0 && courseCategories.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Categories"
          description="Manage questionbank and course categories."
          className="mb-0"
        />
        <PageLoader label="Loading categories..." />
      </div>
    );
  }

  const listError = listTab === "question" ? qbError : courseError;

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="border-b border-border px-5 py-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <PageHeader
              title="Categories"
              description="Two types — Questionbank categories (SSC, HSC…) and course categories for the public course catalog."
              className="mb-0"
            />
            <div className="flex items-center gap-2">
              <AdminIconAction
                label="Refresh"
                icon={RefreshCw}
                tone="primary"
                disabled={isFetching}
                onClick={refreshAll}
                className={isFetching ? "animate-spin" : undefined}
              />
              <Button type="button" size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4" aria-hidden />
                Add category
              </Button>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <TabButton
              active={listTab === "question"}
              label="Question"
              onClick={() => setListTab("question")}
            />
            <TabButton active={listTab === "course"} label="Course" onClick={() => setListTab("course")} />
          </div>

          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="max-w-md"
          />

          <p className="mt-3 text-sm text-muted-foreground">
            {listTab === "question" ? (
              <>
                {qbTree.length} questionbank categories · {totalQbSubjects} subjects ·{" "}
                <Link href={ROUTES.admin.qbSubjects} className="font-medium text-primary hover:underline">
                  Manage subjects
                </Link>
              </>
            ) : (
              <>{courseCategories.length} course categories for organizing public courses.</>
            )}
          </p>

          {actionError || listError ? (
            <p className="mt-3 text-sm text-accent">
              {actionError || (listError as unknown as ApiError)?.message || "Something went wrong"}
            </p>
          ) : null}
        </div>

        {listTab === "question" ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Slug</th>
                  <th className="px-5 py-3 font-semibold">Subjects</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuestionCategories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">
                      No questionbank categories yet. Add SSC, HSC, or Cambridge groups.
                    </td>
                  </tr>
                ) : null}
                {filteredQuestionCategories.map((category) => {
                  const rowBusy = busy && pendingId === category.id;
                  return (
                    <tr key={category.id} className="border-b border-border/70 last:border-0 hover:bg-muted/30">
                      <td className="px-5 py-4 font-semibold text-foreground">{category.name}</td>
                      <td className="px-5 py-4 text-muted-foreground">{category.slug}</td>
                      <td className="px-5 py-4 text-muted-foreground">{category.subjects.length}</td>
                      <td className="px-5 py-4 text-right">
                        <AdminActionsBar>
                          <AdminIconAction
                            label="Edit category"
                            icon={Pencil}
                            tone="primary"
                            disabled={rowBusy}
                            onClick={() => openEditQuestion(category)}
                          />
                          <AdminIconAction
                            label="Delete category"
                            icon={Trash2}
                            tone="danger"
                            disabled={rowBusy}
                            onClick={() => void onDeleteQuestion(category)}
                          />
                        </AdminActionsBar>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
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
                {filteredCourseCategories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">
                      No course categories yet. Create one to organize courses.
                    </td>
                  </tr>
                ) : null}
                {filteredCourseCategories.map((category) => {
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
                            onClick={() => openEditCourse(category)}
                          />
                          <AdminIconAction
                            label="Delete category"
                            icon={Trash2}
                            tone="danger"
                            disabled={rowBusy}
                            onClick={() => void onDeleteCourse(category)}
                          />
                        </AdminActionsBar>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminModal
        open={modalOpen}
        title={editing ? "Edit category" : "Add category"}
        description={
          editing
            ? editing.kind === "question"
              ? "Questionbank category — shown in the Subjects mega menu and question filters."
              : "Course category — used to group courses on the public site."
            : "Choose whether this category is for the questionbank or for courses."
        }
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
          {!editing ? (
            <div className="flex flex-wrap gap-2">
              <TabButton
                active={formKind === "question"}
                label="Question"
                onClick={() => setFormKind("question")}
              />
              <TabButton active={formKind === "course"} label="Course" onClick={() => setFormKind("course")} />
            </div>
          ) : (
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {editing.kind === "question" ? "Questionbank category" : "Course category"}
            </p>
          )}

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-foreground">Name</span>
            <Input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder={formKind === "question" ? "e.g. SSC" : "e.g. Web Development"}
              autoFocus
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-foreground">Slug</span>
            <Input
              value={slug}
              onChange={(e) => {
                setAutoSlug(false);
                setSlug(slugify(e.target.value));
              }}
              placeholder={formKind === "question" ? "ssc" : "web-development"}
            />
          </label>
          {actionError ? <p className="text-sm text-accent">{actionError}</p> : null}
        </div>
      </AdminModal>
    </>
  );
}
