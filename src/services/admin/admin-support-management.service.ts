import { env } from "@/config";
import type { SupportContactMessage } from "@/types/admin-support-management.types";
import { sleep } from "@/utils";
import { apiClient } from "../api-client";

const mockContacts: SupportContactMessage[] = [
  {
    id: "c1",
    name: "Demo Visitor",
    email: "visitor@example.com",
    phone: "01799999999",
    message: "Hello — I want to know more about IB Physics SL courses and pricing.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "c2",
    name: "Rafi Ahmed",
    email: "rafi@example.com",
    phone: "01811112222",
    message: "I enrolled but cannot access the questionbank. Please help.",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "c3",
    name: "Nadia Khan",
    email: "nadia@example.com",
    phone: null,
    message: "Do you offer mock exams for Math AA HL?",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const supportManagementService = {
  async getContacts(): Promise<SupportContactMessage[]> {
    if (env.useMockApi) {
      await sleep(220);
      return mockContacts;
    }

    const response = await apiClient.get<SupportContactMessage[]>("/contact");
    return response.data ?? [];
  },
};
