import { env } from "@/config";
import type { HomeCategory } from "@/types/home.types";
import { sleep } from "@/utils";
import { apiClient } from "../api-client";

export type AdminCategory = HomeCategory;

export type CategoryInput = {
  name: string;
  slug: string;
};

const mockCategories: AdminCategory[] = [
  {
    id: "cat-1",
    name: "Web Development",
    slug: "web-development",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const adminCategoriesService = {
  async getAll(): Promise<AdminCategory[]> {
    if (env.useMockApi) {
      await sleep(200);
      return [...mockCategories];
    }
    const response = await apiClient.get<AdminCategory[]>("/categories");
    return response.data ?? [];
  },

  async create(payload: CategoryInput): Promise<AdminCategory> {
    if (env.useMockApi) {
      await sleep(200);
      const created: AdminCategory = {
        id: `cat-${Date.now()}`,
        name: payload.name,
        slug: payload.slug,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockCategories.unshift(created);
      return created;
    }
    const response = await apiClient.post<AdminCategory>("/categories", payload);
    return response.data;
  },

  async update(id: string, payload: Partial<CategoryInput>): Promise<AdminCategory> {
    if (env.useMockApi) {
      await sleep(200);
      const item = mockCategories.find((c) => c.id === id);
      if (!item) throw { message: "Category not found", status: 404 };
      Object.assign(item, payload, { updatedAt: new Date().toISOString() });
      return { ...item };
    }
    const response = await apiClient.patch<AdminCategory>(`/categories/${id}`, payload);
    return response.data;
  },

  async remove(id: string): Promise<{ message: string }> {
    if (env.useMockApi) {
      await sleep(200);
      const index = mockCategories.findIndex((c) => c.id === id);
      if (index < 0) throw { message: "Category not found", status: 404 };
      mockCategories.splice(index, 1);
      return { message: "Category deleted successfully" };
    }
    const response = await apiClient.delete<{ message: string }>(`/categories/${id}`);
    return response.data ?? { message: "Category deleted successfully" };
  },
};
