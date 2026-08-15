"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, ClipboardList, FileText, Layers3 } from "lucide-react";
import { AdminKeyConceptsPage } from "@/components/admin/key-concepts/admin-key-concepts-page";
import { AdminPastPapersPage } from "@/components/admin/past-papers/admin-past-papers-page";
import { AdminPracticeExamsPage } from "@/components/admin/practice-exams/admin-practice-exams-page";
import { PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import {
  useAdminSubjectsTree,
  useCourseProgramLinks,
  useSetCourseProgramLinks,
} from "@/hooks";
import type { ApiError } from "@/types";
import { cn } from "@/utils";

type Props = { courseId: string };
type InnerTab = "subjects" | "key-concepts" | "practice-exams" | "past-papers";

const INNER_TABS: { id: InnerTab; label: string; icon: typeof Layers3 }[] = [
  { id: "subjects", label: "Subjects", icon: Layers3 },
  { id: "key-concepts", label: "Key Concepts", icon: BookOpen },
  { id: "practice-exams", label: "Practice Exams", icon: ClipboardList },
  { id: "past-papers", label: "Past Papers", icon: FileText },
];

export function CourseQuestionbankStep({ courseId }: Props) {
  const [innerTab, setInnerTab] = useState<InnerTab>("subjects");
  const { data: links = [], isLoading: linksLoading } = useCourseProgramLinks(courseId);

  const linkedPrograms = useMemo(
    () =>
      links.map((link) => ({
        id: link.program.id,
        name: link.program.name,
        slug: link.program.slug,
        subjectName: link.program.subject?.name ?? link.program.name,
      })),
    [links]
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <h2 className="text-lg font-bold text-foreground">Course questionbank</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Link subjects first, then create Key Concepts, Practice Exams, and Past Papers for this
          course. A question used once here will not appear again when building another exam or paper
          for the same course.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {INNER_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = innerTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setInnerTab(tab.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition",
                  active
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {tab.label}
                {tab.id !== "subjects" && linkedPrograms.length === 0 ? (
                  <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                    Needs subject
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {innerTab === "subjects" ? <CourseSubjectsPanel courseId={courseId} /> : null}

      {innerTab === "key-concepts" ? (
        linksLoading ? (
          <PageLoader label="Loading linked subjects..." />
        ) : (
          <AdminKeyConceptsPage
            courseId={courseId}
            linkedPrograms={linkedPrograms}
            embedded
          />
        )
      ) : null}

      {innerTab === "practice-exams" ? (
        linksLoading ? (
          <PageLoader label="Loading linked subjects..." />
        ) : (
          <AdminPracticeExamsPage
            courseId={courseId}
            linkedPrograms={linkedPrograms}
            embedded
          />
        )
      ) : null}

      {innerTab === "past-papers" ? (
        linksLoading ? (
          <PageLoader label="Loading linked subjects..." />
        ) : (
          <AdminPastPapersPage
            courseId={courseId}
            linkedPrograms={linkedPrograms}
            embedded
          />
        )
      ) : null}
    </div>
  );
}

function CourseSubjectsPanel({ courseId }: { courseId: string }) {
  const { data: tree = [], isLoading: treeLoading } = useAdminSubjectsTree();
  const { data: links, isLoading: linksLoading } = useCourseProgramLinks(courseId);
  const setPrograms = useSetCourseProgramLinks(courseId);
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!links) return;
    const ids = links.map((l) => l.program.id);
    setSelected((prev) =>
      prev.length === ids.length && prev.every((id, index) => id === ids[index]) ? prev : ids
    );
  }, [links]);

  const allPrograms = useMemo(
    () =>
      tree.flatMap((cat) =>
        cat.subjects.flatMap((subject) =>
          subject.programs.map((program) => ({
            id: program.id,
            label: subject.name,
            programName: program.name,
            topicCount: program._count?.qbTopics ?? 0,
          }))
        )
      ),
    [tree]
  );

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
    setMessage(null);
  };

  const onSave = async () => {
    setMessage(null);
    setError(null);
    try {
      await setPrograms.mutateAsync(selected);
      setMessage(
        "Subjects saved. You can now create Key Concepts, Practice Exams, and Past Papers in the tabs above."
      );
    } catch (err) {
      setError((err as ApiError).message || "Failed to save subject links");
    }
  };

  if (treeLoading || linksLoading) {
    return <PageLoader label="Loading subject programs..." />;
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="text-base font-bold text-foreground">Linked subject programs</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Subjects unlock the Questionbank pool for this course. Add topics under{" "}
        <span className="font-medium text-foreground">Admin → Questionbank</span> if a subject has
        none yet.
      </p>
      {allPrograms.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          No subject programs found. Create programs under Admin → Subjects first.
        </p>
      ) : (
        <div className="mt-5 max-h-[28rem] space-y-2 overflow-y-auto rounded-xl border border-border p-3">
          {allPrograms.map((program) => {
            const hasTopics = program.topicCount > 0;
            return (
              <label
                key={program.id}
                className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-muted/50"
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-border text-primary accent-primary"
                  checked={selected.includes(program.id)}
                  onChange={() => toggle(program.id)}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">{program.label}</span>
                  <span
                    className={cn(
                      "mt-0.5 block text-xs",
                      hasTopics ? "text-muted-foreground" : "text-amber-600"
                    )}
                  >
                    {hasTopics
                      ? `${program.topicCount} questionbank topic${program.topicCount === 1 ? "" : "s"}`
                      : "No questionbank topics yet — students will see an empty state"}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      )}
      {selected.some((id) => (allPrograms.find((p) => p.id === id)?.topicCount ?? 0) === 0) ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          One or more selected programs have no topics. Add topics in{" "}
          <Link
            href={ROUTES.admin.questionbank}
            className="font-semibold underline-offset-2 hover:underline"
          >
            Questionbank
          </Link>{" "}
          before students can practice.
        </p>
      ) : null}
      {message ? <p className="mt-3 text-sm text-accent-green">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-accent">{error}</p> : null}
      <Button
        type="button"
        className="mt-4"
        disabled={setPrograms.isPending}
        onClick={() => void onSave()}
      >
        {setPrograms.isPending ? "Saving…" : "Save subject links"}
      </Button>
    </div>
  );
}
