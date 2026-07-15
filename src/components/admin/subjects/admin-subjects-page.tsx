"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Plus, RefreshCw, Trash2 } from "lucide-react";
import { AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/slugify";
import {
  useAdminSubjectsTree,
  useAdminUsers,
  useAssignSubjectTeachers,
  useCreateSubject,
  useCreateSubjectCategory,
  useCreateSubjectProgram,
  useCreateSubjectResource,
  useDeleteSubject,
  useDeleteSubjectCategory,
  useDeleteSubjectProgram,
  useDeleteSubjectResource,
  useUpdateSubject,
  useUpdateSubjectCategory,
  useUpdateSubjectProgram,
  useUpdateSubjectResource,
} from "@/hooks";
import type { ApiError, SubjectMenuCategory, SubjectResourceType } from "@/types";
import { cn } from "@/utils";

const RESOURCE_TYPES: SubjectResourceType[] = [
  "QUESTIONBANK",
  "KEY_CONCEPTS",
  "PRACTICE_EXAMS",
  "PAST_PAPERS",
  "BOOTCAMPS",
  "FLASHCARDS",
  "PAPER_3",
  "OTHER",
];

type FormMode =
  | { kind: "category"; id?: string }
  | { kind: "subject"; categoryId: string; id?: string }
  | { kind: "program"; subjectId: string; id?: string; name?: string; slug?: string }
  | {
      kind: "resource";
      programId: string;
      id?: string;
      title?: string;
      slug?: string;
      resourceType?: SubjectResourceType;
      href?: string;
    }
  | { kind: "teachers"; subjectId: string; selected: string[] };

function fieldClass() {
  return "flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15";
}

export function AdminSubjectsPage() {
  const { data: tree = [], isLoading, error, refetch, isFetching } = useAdminSubjectsTree();
  const { data: teachers = [] } = useAdminUsers("TEACHER");

  const createCategory = useCreateSubjectCategory();
  const updateCategory = useUpdateSubjectCategory();
  const deleteCategory = useDeleteSubjectCategory();
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();
  const assignTeachers = useAssignSubjectTeachers();
  const createProgram = useCreateSubjectProgram();
  const updateProgram = useUpdateSubjectProgram();
  const deleteProgram = useDeleteSubjectProgram();
  const createResource = useCreateSubjectResource();
  const updateResource = useUpdateSubjectResource();
  const deleteResource = useDeleteSubjectResource();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState<FormMode | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [resourceType, setResourceType] = useState<SubjectResourceType>("QUESTIONBANK");
  const [href, setHref] = useState("");
  const [teacherIds, setTeacherIds] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);

  const busy =
    createCategory.isPending ||
    updateCategory.isPending ||
    deleteCategory.isPending ||
    createSubject.isPending ||
    updateSubject.isPending ||
    deleteSubject.isPending ||
    assignTeachers.isPending ||
    createProgram.isPending ||
    updateProgram.isPending ||
    deleteProgram.isPending ||
    createResource.isPending ||
    updateResource.isPending ||
    deleteResource.isPending;

  const openCreateCategory = () => {
    setForm({ kind: "category" });
    setName("");
    setSlug("");
    setActionError(null);
  };

  const openEditCategory = (category: SubjectMenuCategory) => {
    setForm({ kind: "category", id: category.id });
    setName(category.name);
    setSlug(category.slug);
    setActionError(null);
  };

  const closeForm = () => {
    if (busy) return;
    setForm(null);
  };

  const onSubmit = async () => {
    if (!form) return;
    setActionError(null);
    try {
      if (form.kind === "category") {
        const payload = { name: name.trim(), slug: slug.trim() || slugify(name) };
        if (!payload.name || !payload.slug) throw { message: "Name and slug required" };
        if (form.id) await updateCategory.mutateAsync({ id: form.id, payload });
        else await createCategory.mutateAsync(payload);
      }
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
      if (form.kind === "program") {
        const payload = { name: name.trim(), slug: slug.trim() || slugify(name) };
        if (!payload.name || !payload.slug) throw { message: "Name and slug required" };
        if (form.id) await updateProgram.mutateAsync({ id: form.id, payload });
        else await createProgram.mutateAsync({ subjectId: form.subjectId, payload });
      }
      if (form.kind === "resource") {
        const payload = {
          title: name.trim(),
          slug: slug.trim() || slugify(name),
          resourceType,
          href: href.trim() || undefined,
        };
        if (!payload.title || !payload.slug) throw { message: "Title and slug required" };
        if (form.id) await updateResource.mutateAsync({ id: form.id, payload });
        else await createResource.mutateAsync({ programId: form.programId, payload });
      }
      if (form.kind === "teachers") {
        await assignTeachers.mutateAsync({ subjectId: form.subjectId, teacherIds });
      }
      setForm(null);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to save");
    }
  };

  const modalTitle = useMemo(() => {
    if (!form) return "";
    if (form.kind === "category") return form.id ? "Edit category" : "Add category";
    if (form.kind === "subject") return form.id ? "Edit subject" : "Add subject";
    if (form.kind === "program") return form.id ? "Edit program" : "Add program (SL/HL)";
    if (form.kind === "resource") return form.id ? "Edit resource" : "Add resource";
    return "Assign teachers";
  }, [form]);

  if (isLoading && tree.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Subjects" description="Manage mega-menu categories, subjects, and topics." className="mb-0" />
        <PageLoader label="Loading subjects..." />
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="border-b border-border px-5 py-6">
          <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
            <PageHeader
              title="Subjects"
              description="Full access — categories → subjects → SL/HL programs → resources (Questionbank, etc.)."
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
              <Button type="button" size="sm" onClick={openCreateCategory}>
                <Plus className="h-4 w-4" aria-hidden />
                Add category
              </Button>
            </div>
          </div>
          {actionError || error ? (
            <p className="text-sm text-accent">
              {actionError || (error as unknown as ApiError)?.message || "Something went wrong"}
            </p>
          ) : null}
        </div>

        <div className="divide-y divide-border">
          {tree.length === 0 ? (
            <p className="px-5 py-10 text-center text-muted-foreground">No subject categories yet.</p>
          ) : null}

          {tree.map((category) => {
            const open = expanded[category.id] ?? true;
            return (
              <div key={category.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-left font-semibold text-foreground"
                    onClick={() => setExpanded((s) => ({ ...s, [category.id]: !open }))}
                  >
                    <ChevronDown className={cn("h-4 w-4 transition", !open && "-rotate-90")} />
                    {category.name}
                    <span className="text-xs font-medium text-muted-foreground">
                      ({category.subjects.length} subjects)
                    </span>
                  </button>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setForm({ kind: "subject", categoryId: category.id });
                        setName("");
                        setSlug("");
                      }}
                    >
                      Add subject
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => openEditCategory(category)}>
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-accent"
                      onClick={() => {
                        if (window.confirm(`Delete category "${category.name}"?`)) {
                          void deleteCategory.mutateAsync(category.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {open ? (
                  <div className="mt-3 space-y-3 border-l-2 border-primary/20 pl-4">
                    {category.subjects.map((subject) => (
                      <div key={subject.id} className="rounded-xl border border-border bg-muted/20 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-foreground">{subject.name}</p>
                          <div className="flex flex-wrap gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setForm({ kind: "program", subjectId: subject.id });
                                setName("");
                                setSlug("");
                              }}
                            >
                              Add program
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setForm({
                                  kind: "teachers",
                                  subjectId: subject.id,
                                  selected: subject.teachers?.map((t) => t.teacher.id) ?? [],
                                });
                                setTeacherIds(subject.teachers?.map((t) => t.teacher.id) ?? []);
                              }}
                            >
                              Teachers
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setForm({ kind: "subject", categoryId: category.id, id: subject.id });
                                setName(subject.name);
                                setSlug(subject.slug);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="text-accent"
                              onClick={() => {
                                if (window.confirm(`Delete subject "${subject.name}"?`)) {
                                  void deleteSubject.mutateAsync(subject.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {subject.teachers?.length ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Teachers: {subject.teachers.map((t) => t.teacher.name).join(", ")}
                          </p>
                        ) : null}

                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          {subject.programs.map((program) => (
                            <div key={program.id} className="rounded-lg border border-border bg-card p-3">
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <p className="text-sm font-bold text-foreground">{program.name}</p>
                                <div className="flex gap-1">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => {
                                      setForm({ kind: "resource", programId: program.id });
                                      setName("");
                                      setSlug("");
                                      setResourceType("QUESTIONBANK");
                                      setHref("");
                                    }}
                                  >
                                    + Resource
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-xs text-accent"
                                    onClick={() => {
                                      if (window.confirm(`Delete program "${program.name}"?`)) {
                                        void deleteProgram.mutateAsync(program.id);
                                      }
                                    }}
                                  >
                                    Del
                                  </Button>
                                </div>
                              </div>
                              <ul className="space-y-1">
                                {program.resources.map((resource) => (
                                  <li
                                    key={resource.id}
                                    className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                                  >
                                    <span className="text-muted-foreground">{resource.title}</span>
                                    <div className="flex gap-1">
                                      <button
                                        type="button"
                                        className="text-xs text-primary"
                                        onClick={() => {
                                          setForm({
                                            kind: "resource",
                                            programId: program.id,
                                            id: resource.id,
                                          });
                                          setName(resource.title);
                                          setSlug(resource.slug);
                                          setResourceType(
                                            (resource.resourceType as SubjectResourceType) || "OTHER"
                                          );
                                          setHref(resource.href ?? "");
                                        }}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        className="text-xs text-accent"
                                        onClick={() => {
                                          if (window.confirm(`Delete "${resource.title}"?`)) {
                                            void deleteResource.mutateAsync(resource.id);
                                          }
                                        }}
                                      >
                                        Del
                                      </button>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <AdminModal
        open={Boolean(form)}
        title={modalTitle}
        description="Changes appear in the public Subjects mega menu when active."
        onClose={closeForm}
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeForm} disabled={busy}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void onSubmit()} disabled={busy}>
              {busy ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      >
        {form?.kind === "teachers" ? (
          <div className="space-y-2">
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
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">
                {form?.kind === "resource" ? "Title" : "Name"}
              </span>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!form || ("id" in form && form.id)) return;
                  setSlug(slugify(e.target.value));
                }}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Slug</span>
              <Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />
            </label>
            {form?.kind === "resource" ? (
              <>
                <label className="block space-y-1.5">
                  <span className="text-sm font-semibold">Type</span>
                  <select
                    value={resourceType}
                    onChange={(e) => setResourceType(e.target.value as SubjectResourceType)}
                    className={fieldClass()}
                  >
                    {RESOURCE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-semibold">Href (optional)</span>
                  <Input value={href} onChange={(e) => setHref(e.target.value)} placeholder="/subjects/..." />
                </label>
              </>
            ) : null}
            {actionError ? <p className="text-sm text-accent">{actionError}</p> : null}
          </div>
        )}
      </AdminModal>
    </>
  );
}
