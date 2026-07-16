import type { SupportManagementData } from "@/types/admin-support-management.types";

export function getSupportManagement(): SupportManagementData {
  return {
    pageSize: 10,
    items: [{ id: "item-1", title: "Sample SupportManagement item" }],
  };
}
