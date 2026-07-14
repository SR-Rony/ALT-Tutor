import { resolveAdminExampleManagement } from "@/data/mock/admin-data.resolvers";
import type { AdminExampleManagementData } from "@/types/admin-example-management.types";
import { fetchAdminData } from "./create-admin-service";

export const adminExampleManagementService = {
  async getItems(): Promise<AdminExampleManagementData> {
    return fetchAdminData(() => resolveAdminExampleManagement());
  },
};
