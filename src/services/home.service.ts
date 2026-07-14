import { env } from "@/config";
import type { HomeCategory, HomeCourse, HomeData } from "@/types/home.types";
import { sleep } from "@/utils";
import { apiClient } from "./api-client";

const mockHomeData: HomeData = {
  featuredCourses: [
    {
      id: "c1",
      title: "Complete Node.js Bootcamp",
      slug: "complete-nodejs-bootcamp",
      description: "Learn Node.js from scratch",
      thumbnail: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800",
      price: 0,
      level: "BEGINNER",
      teacher: { id: "t1", name: "John Teacher" },
      category: { id: "cat1", name: "Web Development", slug: "web-development" },
      _count: { enrollments: 2, reviews: 1 },
    },
  ],
  latestBlogs: [],
  stats: { totalCourses: 2, totalStudents: 2 },
  categories: [
    { id: "1", name: "Web Development", slug: "web-development" },
    { id: "2", name: "UI/UX Design", slug: "ui-ux-design" },
    { id: "3", name: "Business", slug: "business" },
  ],
};

export const homeService = {
  async getHomeData(): Promise<HomeData> {
    if (env.useMockApi) {
      await sleep(250);
      return mockHomeData;
    }

    const response = await apiClient.get<HomeData>("/home", { skipAuth: true });
    return {
      featuredCourses: response.data.featuredCourses ?? [],
      latestBlogs: response.data.latestBlogs ?? [],
      stats: {
        totalCourses: Number(response.data.stats?.totalCourses) || 0,
        totalStudents: Number(response.data.stats?.totalStudents) || 0,
      },
      categories: response.data.categories ?? [],
    };
  },
};

export const categoryService = {
  async getAll(): Promise<HomeCategory[]> {
    if (env.useMockApi) {
      await sleep(200);
      return mockHomeData.categories;
    }
    const response = await apiClient.get<HomeCategory[]>("/categories", { skipAuth: true });
    return response.data ?? [];
  },
};

export type { HomeCourse, HomeCategory, HomeData };
