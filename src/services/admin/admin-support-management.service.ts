import { resolveSupportManagement } from "@/data/mock/admin-data.resolvers";
import type { SupportManagementData } from "@/types/admin-support-management";
import { fetchAdminData } from "./create-admin-service";

export const supportManagementService = {
  async getItems(): Promise<SupportManagementData> {
    return fetchAdminData(() => resolveSupportManagement());
  },
};
