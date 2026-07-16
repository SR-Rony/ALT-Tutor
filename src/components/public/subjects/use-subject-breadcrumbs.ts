"use client";

import { useMemo } from "react";
import { ROUTES } from "@/constants";
import { useSubjectsMenu } from "@/hooks/use-subjects";
import type { BreadcrumbItem } from "./subject-breadcrumb-nav";

type BuildArgs = {
  programSlug: string;
  resourceSlug?: string;
  resourceLabel?: string;
  resourceHref?: string;
  topicLabel?: string;
};

/** Builds PDF-style breadcrumb trail with subject/program dropdowns */
export function useSubjectBreadcrumbs({
  programSlug,
  resourceSlug = "questionbank",
  resourceLabel = "Questionbank",
  resourceHref,
  topicLabel,
}: BuildArgs): BreadcrumbItem[] {
  const { data: menu = [] } = useSubjectsMenu();

  return useMemo(() => {
    let match: {
      categoryName: string;
      subjectName: string;
      subjectSlug: string;
      programName: string;
      programs: { name: string; slug: string }[];
      subjects: { name: string; slug: string; programs: { name: string; slug: string }[] }[];
    } | null = null;

    for (const category of menu) {
      for (const subject of category.subjects) {
        for (const program of subject.programs) {
          if (program.slug === programSlug) {
            match = {
              categoryName: category.name,
              subjectName: subject.name,
              subjectSlug: subject.slug,
              programName: program.name,
              programs: subject.programs.map((p) => ({ name: p.name, slug: p.slug })),
              subjects: category.subjects.map((s) => ({
                name: s.name,
                slug: s.slug,
                programs: s.programs.map((p) => ({ name: p.name, slug: p.slug })),
              })),
            };
            break;
          }
        }
        if (match) break;
      }
      if (match) break;
    }

    if (!match) {
      const crumbs: BreadcrumbItem[] = [{ label: resourceLabel, href: resourceHref }];
      if (topicLabel) crumbs.push({ label: topicLabel });
      return crumbs;
    }

    const subjectMenu = match.subjects.map((s) => ({
      label: s.name,
      href: ROUTES.subjectResource(s.programs[0]?.slug ?? programSlug, resourceSlug),
    }));

    const programMenu = match.programs.map((p) => ({
      label: p.name,
      href: ROUTES.subjectResource(p.slug, resourceSlug),
    }));

    const crumbs: BreadcrumbItem[] = [
      {
        label: match.subjectName,
        menu: subjectMenu,
      },
      {
        label: match.programName,
        menu: programMenu,
      },
      {
        label: resourceLabel,
        href: resourceHref ?? ROUTES.subjectResource(programSlug, resourceSlug),
      },
    ];

    if (topicLabel) {
      crumbs.push({ label: topicLabel });
    }

    return crumbs;
  }, [menu, programSlug, resourceSlug, resourceLabel, resourceHref, topicLabel]);
}
