import type { AdminExampleManagementData } from "@/types/admin-example-management.types";

const adminExampleManagementData: AdminExampleManagementData = {
  pageSize: 10,
  items: Array.from({ length: 24 }, (_, index) => ({
    id: `example-item-${index + 1}`,
    title: `Example record ${index + 1}`,
    status: index % 3 === 0 ? "inactive" : "active",
    createdDate: `2024-0${(index % 9) + 1}-15`,
  })),
};

export function getAdminExampleManagement(): AdminExampleManagementData {
  return adminExampleManagementData;
}
