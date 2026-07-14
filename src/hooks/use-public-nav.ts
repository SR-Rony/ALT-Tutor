"use client";

import { useMemo } from "react";
import { publicNav } from "@/config";
import { ROUTES } from "@/constants";
import { useCategories } from "@/hooks";
import type { NavItem } from "@/types/navigation.types";

/**
 * Public navbar items with live category links under Courses.
 * Falls back to static publicNav while categories load.
 */
export function usePublicNav(): NavItem[] {
  const { data: categories = [] } = useCategories();

  return useMemo(() => {
    const categoryChildren: NavItem[] = categories.map((category) => ({
      title: category.name,
      href: `${ROUTES.courses}?categoryId=${encodeURIComponent(category.id)}`,
    }));

    return publicNav.map((item) => {
      if (item.href !== ROUTES.courses && item.title !== "Courses") return item;

      return {
        ...item,
        children: [
          { title: "All Courses", href: ROUTES.courses },
          ...categoryChildren,
          { title: "Beginner", href: `${ROUTES.courses}?level=BEGINNER` },
          { title: "Intermediate", href: `${ROUTES.courses}?level=INTERMEDIATE` },
          { title: "Advanced", href: `${ROUTES.courses}?level=ADVANCED` },
        ],
      };
    });
  }, [categories]);
}
