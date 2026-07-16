"use client";

import { publicNav } from "@/config";
import type { NavItem } from "@/types/navigation.types";

/**
 * Public navbar items.
 * Subjects mega menu loads IB subjects/resources via useSubjectsMenu().
 */
export function usePublicNav(): NavItem[] {
  return publicNav;
}
