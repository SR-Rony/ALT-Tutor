"use client";

import { publicNav } from "@/config";
import type { NavItem } from "@/types/navigation.types";

/**
 * Public navbar items.
 * Subjects mega menu loads its own categories/courses — not injected here.
 */
export function usePublicNav(): NavItem[] {
  return publicNav;
}
