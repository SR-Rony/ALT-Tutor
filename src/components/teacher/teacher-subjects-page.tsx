"use client";

import { useState } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/slugify";
import {
  useCreateSubjectProgram,
  useCreateSubjectResource,
  useDeleteSubjectProgram,
  useDeleteSubjectResource,
  useTeacherSubjectsTree,
  useUpdateSubjectResource,
} from "@/hooks";
import type { ApiError, SubjectResourceType } from "@/types";

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

export function TeacherSubjectsPage() {
  const { data: tree = [], isLoading, error, refetch, isFetching } = useTeacherSubjectsTree();
  const createProgram = useCreateSubjectProgram();
  const deleteProgram = useDeleteSubjectProgram();
  const createResource = useCreateSubjectResource();
  const updateResource = useUpdateSubjectResource();
  const deleteResource = useDeleteSubjectResource();

  const [modal, setModal] = useState<
    | null
    | { kind: "program"; subjectId: string }
    | { kind: "resource"; programId: string; id?: string; title?: string; slug?: string }
  >(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [resourceType, setResourceType] = useState<SubjectResourceType>("QUESTIONBANK");
  const [actionError, setActionError] = useState<string | null>(null);

  const busy =
    createProgram.isPending ||
    deleteProgram.isPending ||
    createResource.isPending ||
    updateResource.isPending ||
    deleteResource.isPending;

  const onSave = async () => {
    if (!modal) return;
    setActionError(null);
    try {
      if (modal.kind === "program") {
        const payload = { name: name.trim(), slug: slug.trim() || slugify(name) };
        if (!payload.name || !payload.slug) throw { message: "Name and slug required" };
        await createProgram.mutateAsync({ subjectId: modal.subjectId, payload });
      } else {
        const payload = {
          title: name.trim(),
          slug: slug.trim() || slugify(name),
          resourceType,
        };
        if (!payload.title || !payload.slug) throw { message: "Title and slug required" };
        if (modal.id) await updateResource.mutateAsync({ id: modal.id, payload });
        else await createResource.mutateAsync({ programId: modal.programId, payload });
      }
      setModal(null);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to save");
    }
  };

  if (isLoading && tree.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Subjects" description="Programs & resource labels for subjects assigned to you — not the central Questionbank editor." className="mb-0" />
        <PageLoader label="Loading subjects..." />
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="border-b border-border px-5 py-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <PageHeader
              title="My Subjects"
              description="Edit programs and study-resource labels under subjects assigned to you. Central Questionbank content is managed by admin."
              className="mb-0"
            />
            <AdminIconAction
              label="Refresh"
              icon={RefreshCw}
              tone="primary"
              disabled={isFetching}
              onClick={() => void refetch()}
              className={isFetching ? "animate-spin" : undefined}
            />
          </div>
          {error ? (
            <p className="mt-2 text-sm text-accent">{(error as unknown as ApiError)?.message}</p>
          ) : null}
        </div>

        <div className="space-y-4 p-5">
          {tree.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No subjects assigned yet. Ask an admin to assign you.
            </p>
          ) : null}

          {tree.map((category) => (
            <div key={category.id} className="rounded-xl border border-border p-4">
              <h3 className="font-semibold text-foreground">{category.name}</h3>
              <div className="mt-3 space-y-3">
                {category.subjects.map((subject) => (
                  <div key={subject.id} className="rounded-lg bg-muted/30 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-foreground">{subject.name}</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setModal({ kind: "program", subjectId: subject.id });
                          setName("");
                          setSlug("");
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        Add program
                      </Button>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {subject.programs.map((program) => (
                        <div key={program.id} className="rounded-lg border border-border bg-card p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-sm font-bold">{program.name}</p>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                                onClick={() => {
                                  setModal({ kind: "resource", programId: program.id });
                                  setName("");
                                  setSlug("");
                                  setResourceType("QUESTIONBANK");
                                }}
                              >
                                + Resource
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-accent"
                                onClick={() => {
                                  if (window.confirm(`Delete "${program.name}"?`)) {
                                    void deleteProgram.mutateAsync(program.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          <ul className="space-y-1">
                            {program.resources.map((resource) => (
                              <li key={resource.id} className="flex justify-between text-sm text-muted-foreground">
                                <span>{resource.title}</span>
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
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AdminModal
        open={Boolean(modal)}
        title={modal?.kind === "program" ? "Add program" : "Add resource"}
        description="Visible in the public Subjects menu when active."
        onClose={() => !busy && setModal(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={busy} onClick={() => void onSave()}>
              {busy ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">{modal?.kind === "resource" ? "Title" : "Name"}</span>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSlug(slugify(e.target.value));
              }}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Slug</span>
            <Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />
          </label>
          {modal?.kind === "resource" ? (
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
          ) : null}
          {actionError ? <p className="text-sm text-accent">{actionError}</p> : null}
        </div>
      </AdminModal>
    </>
  );
}
