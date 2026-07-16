"use client";

import { useMemo } from "react";
import { useSubjectsMenu } from "@/hooks/use-subjects";
import type { SubjectMenuCategory, SubjectMenuProgram, SubjectMenuSubject } from "@/types/subjects.types";

type ProgramContext = {
  program: SubjectMenuProgram | null;
  subject: SubjectMenuSubject | null;
  category: SubjectMenuCategory | null;
  programName: string;
  isLoading: boolean;
};

export function useProgramContext(programSlug: string): ProgramContext {
  const { data: menu = [], isLoading } = useSubjectsMenu();

  const match = useMemo(() => {
    for (const category of menu) {
      for (const subject of category.subjects) {
        for (const program of subject.programs) {
          if (program.slug === programSlug) {
            return { category, subject, program };
          }
        }
      }
    }
    return null;
  }, [menu, programSlug]);

  return {
    program: match?.program ?? null,
    subject: match?.subject ?? null,
    category: match?.category ?? null,
    programName: match?.program.name ?? programSlug,
    isLoading,
  };
}
