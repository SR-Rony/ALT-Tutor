import { env } from "@/config";
import type { HomeCategory } from "@/types/home.types";
import { sleep } from "@/utils";
import { apiClient } from "../api-client";

export type AdminCategory = HomeCategory & {
  subjectCount?: number;
  courseCount?: number;
};

export type CategoryInput = {
  name: string;
  slug: string;
};

type ApiCategoryRow = AdminCategory & {
  _count?: { subjects?: number; courses?: number };
};

function normalizeCategory(row: ApiCategoryRow): AdminCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    subjectCount: row._count?.subjects ?? row.subjectCount ?? 0,
    courseCount: row._count?.courses ?? row.courseCount ?? 0,
  };
}

const mockCategories: AdminCategory[] = [
  {
    id: "cat-1",
    name: "Web Development",
    slug: "web-development",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subjectCount: 0,
    courseCount: 2,
  },
];

export const adminCategoriesService = {
  async getAll(): Promise<AdminCategory[]> {
    if (env.useMockApi) {
      await sleep(200);
      return [...mockCategories];
    }
    const response = await apiClient.get<ApiCategoryRow[]>("/categories");
    return (response.data ?? []).map(normalizeCategory);
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
        subjectCount: 0,
        courseCount: 0,
      };
      mockCategories.unshift(created);
      return created;
    }
    const response = await apiClient.post<ApiCategoryRow>("/categories", payload);
    return normalizeCategory(response.data!);
  },

  async update(id: string, payload: Partial<CategoryInput>): Promise<AdminCategory> {
    if (env.useMockApi) {
      await sleep(200);
      const item = mockCategories.find((c) => c.id === id);
      if (!item) throw { message: "Category not found", status: 404 };
      Object.assign(item, payload, { updatedAt: new Date().toISOString() });
      return { ...item };
    }
    const response = await apiClient.patch<ApiCategoryRow>(`/categories/${id}`, payload);
    return normalizeCategory(response.data!);
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
