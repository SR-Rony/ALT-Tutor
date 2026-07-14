import { env } from "@/config";
import type {
  StudentAssignment,
  StudentDashboardStats,
  StudentEnrollment,
  StudentNotification,
  StudentPayment,
  StudentProfile,
  StudentSubmission,
} from "@/types/student-dashboard.types";
import { sleep } from "@/utils";
import { apiClient } from "./api-client";

const mockStudentStats: StudentDashboardStats = {
  totalEnrolled: 2,
  activeCourses: 2,
  completedCourses: 0,
  averageProgress: 25,
  unreadNotifications: 1,
  totalAssignments: 2,
  totalSubmissions: 0,
  totalSpent: 49.99,
  enrollments: [
    {
      id: "e1",
      progress: 25,
      status: "ACTIVE",
      courseId: "c1",
      course: {
        id: "c1",
        title: "Complete Node.js Bootcamp",
        slug: "complete-nodejs-bootcamp",
        thumbnail: null,
        teacher: { id: "t1", name: "John Teacher" },
        category: { id: "cat1", name: "Web Development", slug: "web-development" },
        _count: { chapters: 2, assignments: 2 },
      },
    },
  ],
  recentNotifications: [
    {
      id: "n1",
      message: "Welcome! You are enrolled in Complete Node.js Bootcamp.",
      isRead: false,
      createdAt: new Date().toISOString(),
    },
  ],
  recentSubmissions: [],
};

export const studentService = {
  async getDashboard(): Promise<StudentDashboardStats> {
    if (env.useMockApi) {
      await sleep(250);
      return mockStudentStats;
    }
    const response = await apiClient.get<StudentDashboardStats>("/dashboard/student");
    return {
      ...response.data,
      averageProgress: Number(response.data.averageProgress) || 0,
      totalSpent: Number(response.data.totalSpent) || 0,
    };
  },

  async getMyCourses(): Promise<StudentEnrollment[]> {
    if (env.useMockApi) {
      await sleep(250);
      return mockStudentStats.enrollments;
    }
    const response = await apiClient.get<StudentEnrollment[]>("/enrollments/my-courses");
    return response.data;
  },

  async cancelEnrollment(courseId: string): Promise<StudentEnrollment> {
    if (env.useMockApi) {
      await sleep(200);
      const item = mockStudentStats.enrollments.find((e) => e.courseId === courseId);
      if (!item) throw { message: "Enrollment not found", status: 404 };
      item.status = "CANCELLED";
      return { ...item };
    }
    const response = await apiClient.patch<StudentEnrollment>(
      `/enrollments/course/${courseId}/cancel`
    );
    return response.data;
  },

  async getCourseAssignments(courseId: string): Promise<StudentAssignment[]> {
    if (env.useMockApi) {
      await sleep(200);
      return [];
    }
    const response = await apiClient.get<StudentAssignment[]>(`/assignments?courseId=${courseId}`);
    return response.data;
  },

  async getMySubmissions(): Promise<StudentSubmission[]> {
    if (env.useMockApi) {
      await sleep(200);
      return [];
    }
    const response = await apiClient.get<StudentSubmission[]>("/submissions/mine");
    return response.data;
  },

  async getNotifications(): Promise<StudentNotification[]> {
    if (env.useMockApi) {
      await sleep(200);
      return mockStudentStats.recentNotifications;
    }
    const response = await apiClient.get<StudentNotification[]>("/notifications");
    return response.data;
  },

  async markNotificationRead(id: string): Promise<StudentNotification> {
    if (env.useMockApi) {
      await sleep(150);
      const item = mockStudentStats.recentNotifications.find((n) => n.id === id);
      if (!item) throw { message: "Not found", status: 404 };
      item.isRead = true;
      return { ...item };
    }
    const response = await apiClient.patch<StudentNotification>(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllNotificationsRead(): Promise<void> {
    if (env.useMockApi) {
      await sleep(150);
      mockStudentStats.recentNotifications.forEach((n) => {
        n.isRead = true;
      });
      return;
    }
    await apiClient.patch("/notifications/read-all");
  },

  async getMyPayments(): Promise<StudentPayment[]> {
    if (env.useMockApi) {
      await sleep(200);
      return [];
    }
    const response = await apiClient.get<StudentPayment[]>("/payments/mine");
    return response.data;
  },

  async getProfile(): Promise<StudentProfile> {
    if (env.useMockApi) {
      await sleep(200);
      return {
        id: "u-student",
        name: "Jane Student",
        email: "student@lms.com",
        phone: "01700000003",
        role: "STUDENT",
      };
    }
    const response = await apiClient.get<StudentProfile>("/users/me");
    return response.data;
  },

  async updateProfile(payload: {
    name?: string;
    email?: string;
    phone?: string;
    avatar?: string;
  }): Promise<StudentProfile> {
    if (env.useMockApi) {
      await sleep(200);
      return {
        id: "u-student",
        name: payload.name ?? "Jane Student",
        email: payload.email ?? "student@lms.com",
        phone: payload.phone ?? "01700000003",
        role: "STUDENT",
        avatar: payload.avatar,
      };
    }
    const response = await apiClient.patch<StudentProfile>("/users/me", payload);
    return response.data;
  },
};
