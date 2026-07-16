import type { SupportContactMessage } from "@/types/admin-support-management.types";

export function getSupportManagement() {
  return {
    pageSize: 20,
    items: [] as SupportContactMessage[],
  };
}
