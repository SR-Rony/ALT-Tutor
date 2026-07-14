import { env } from "@/config";
import { mockAdminPayments } from "@/data/mock/admin-dashboard.mock";
import type { AdminPayment } from "@/types/admin-dashboard.types";
import { sleep } from "@/utils";
import { apiClient } from "../api-client";

export const adminPaymentsService = {
  async getAll(): Promise<AdminPayment[]> {
    if (env.useMockApi) {
      await sleep(250);
      return mockAdminPayments;
    }

    const response = await apiClient.get<AdminPayment[]>("/payments");
    return response.data;
  },
};
