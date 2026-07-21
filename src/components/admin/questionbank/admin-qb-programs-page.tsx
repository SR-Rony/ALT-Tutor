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
  useCreateSubjectProgram,
  useCreateSubjectResource,
  useDeleteSubjectProgram,
  useDeleteSubjectResource,
  useUpdateSubjectProgram,
  useUpdateSubjectResource,
} from "@/hooks";
import type { ApiError, SubjectMenuProgram, SubjectResourceType } from "@/types";
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
  | { kind: "program"; subjectId: string; id?: string }
  | {
      kind: "resource";
      programId: string;
      id?: string;
    };

export function AdminQbProgramsPage() {
  const { data: tree = [], isLoading, error, refetch, isFetching } = useAdminSubjectsTree();
  const createProgram = useCreateSubjectProgram();
  const updateProgram = useUpdateSubjectProgram();
  const deleteProgram = useDeleteSubjectProgram();
  const createResource = useCreateSubjectResource();
  const updateResource = useUpdateSubjectResource();
  const deleteResource = useDeleteSubjectResource();

  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [form, setForm] = useState<FormMode | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [resourceType, setResourceType] = useState<SubjectResourceType>("QUESTIONBANK");
  const [href, setHref] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const busy =
    createProgram.isPending ||
    updateProgram.isPending ||
    deleteProgram.isPending ||
    createResource.isPending ||
    updateResource.isPending ||
    deleteResource.isPending;

  const subjects = useMemo(
    () => tree.flatMap((category) => category.subjects.map((subject) => ({ category, subject }))),
    [tree]
  );

  const rows = useMemo(() => {
    return subjects.flatMap(({ category, subject }) =>
      subject.programs.map((program) => ({ category, subject, program }))
    );
  }, [subjects]);

  const visible = useMemo(() => {
    if (subjectFilter === "ALL") return rows;
    return rows.filter((row) => row.subject.id === subjectFilter);
  }, [rows, subjectFilter]);

  const openCreateProgram = () => {
    const subjectId = subjectFilter !== "ALL" ? subjectFilter : subjects[0]?.subject.id;
    if (!subjectId) {
      setActionError("Create a subject first.");
      return;
    }
    setForm({ kind: "program", subjectId });
    setName("");
    setSlug("");
    setActionError(null);
  };

  const openEditProgram = (subjectId: string, program: SubjectMenuProgram) => {
    setForm({ kind: "program", subjectId, id: program.id });
    setName(program.name);
    setSlug(program.slug);
    setActionError(null);
  };

  const onSubmit = async () => {
    if (!form) return;
    setActionError(null);
    try {
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
      setForm(null);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to save");
    }
  };

  if (isLoading && tree.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Programs"
          description="Manage programs and their public resources."
          className="mb-0"
        />
        <PageLoader label="Loading programs..." />
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="border-b border-border px-5 py-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <PageHeader
              title="Programs"
              description="Programs hold the questionbank content. Add resources for the public subjects menu."
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
                onClick={openCreateProgram}
                disabled={subjects.length === 0}
              >
                <Plus className="h-4 w-4" aria-hidden />
                Add program
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSubjectFilter("ALL")}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                subjectFilter === "ALL"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              All subjects
            </button>
            {subjects.map(({ subject }) => (
              <button
                key={subject.id}
                type="button"
                onClick={() => setSubjectFilter(subject.id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  subjectFilter === subject.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {subject.name}
              </button>
            ))}
            <Link
              href={ROUTES.admin.qbSubjects}
              className="ml-auto text-xs font-semibold text-primary hover:underline"
            >
              Manage subjects
            </Link>
          </div>

          {actionError && !form ? <p className="mt-3 text-sm text-accent">{actionError}</p> : null}
          {error ? (
            <p className="mt-2 text-sm text-accent">
              {(error as unknown as ApiError)?.message || "Something went wrong"}
            </p>
          ) : null}
        </div>

        <div className="divide-y divide-border">
          {visible.length === 0 ? (
            <p className="px-5 py-10 text-center text-muted-foreground">
              {subjects.length === 0
                ? "Create a subject first, then add programs."
                : "No programs in this filter."}
            </p>
          ) : null}

          {visible.map(({ category, subject, program }) => (
            <div key={program.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{program.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {category.name} · {subject.name} · {program.slug}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    asChild
                  >
                    <Link href={`${ROUTES.admin.questionbank}?programId=${program.id}`}>
                      Open questions
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setForm({ kind: "resource", programId: program.id });
                      setName("");
                      setSlug("");
                      setResourceType("QUESTIONBANK");
                      setHref("");
                      setActionError(null);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                    Resource
                  </Button>
                  <AdminIconAction
                    label="Edit program"
                    icon={Pencil}
                    onClick={() => openEditProgram(subject.id, program)}
                  />
                  <AdminIconAction
                    label="Delete program"
                    icon={Trash2}
                    tone="danger"
                    onClick={() => {
                      if (window.confirm(`Delete program "${program.name}"?`)) {
                        void deleteProgram.mutateAsync(program.id);
                      }
                    }}
                  />
                </div>
              </div>

              {program.resources.length > 0 ? (
                <ul className="mt-3 space-y-1 rounded-xl border border-border bg-muted/20 p-3">
                  {program.resources.map((resource) => (
                    <li
                      key={resource.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-card"
                    >
                      <div>
                        <span className="font-medium text-foreground">{resource.title}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {resource.resourceType}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="text-xs font-semibold text-primary"
                          onClick={() => {
                            setForm({ kind: "resource", programId: program.id, id: resource.id });
                            setName(resource.title);
                            setSlug(resource.slug);
                            setResourceType(
                              (resource.resourceType as SubjectResourceType) || "OTHER"
                            );
                            setHref(resource.href ?? "");
                            setActionError(null);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-xs font-semibold text-accent"
                          onClick={() => {
                            if (window.confirm(`Delete resource "${resource.title}"?`)) {
                              void deleteResource.mutateAsync(resource.id);
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">No public resources yet.</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <AdminModal
        open={Boolean(form)}
        title={
          form?.kind === "resource"
            ? form.id
              ? "Edit resource"
              : "Add resource"
            : form?.id
              ? "Edit program"
              : "Add program"
        }
        description="Programs power the questionbank. Resources appear in the public subjects menu."
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
          {form?.kind === "program" && !form.id ? (
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Subject</span>
              <select
                value={form.subjectId}
                onChange={(e) => setForm({ kind: "program", subjectId: e.target.value })}
                className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
              >
                {subjects.map(({ category, subject }) => (
                  <option key={subject.id} value={subject.id}>
                    {category.name} — {subject.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">
              {form?.kind === "resource" ? "Title" : "Name"}
            </span>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!form || !("id" in form) || !form.id) setSlug(slugify(e.target.value));
              }}
              placeholder={form?.kind === "resource" ? "e.g. Questionbank" : "e.g. SSC Mathematics"}
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
                  className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
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
                <Input
                  value={href}
                  onChange={(e) => setHref(e.target.value)}
                  placeholder="/subjects/..."
                />
              </label>
            </>
          ) : null}
          {actionError ? <p className="text-sm text-accent">{actionError}</p> : null}
        </div>
      </AdminModal>
    </>
  );
}
