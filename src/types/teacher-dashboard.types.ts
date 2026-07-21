export type TeacherCourseOwnership = "owned" | "delegated";

export type TeacherDashboardCourse = {
  id: string;
  title: string;
  slug: string;
  status: string;
  ownership: TeacherCourseOwnership;
  updatedAt?: string;
  category?: { id: string; name: string } | null;
  teacher?: { id: string; name: string } | null;
  _count: {
    enrollments: number;
    reviews: number;
    assignments?: number;
    chapters?: number;
  };
};

export type TeacherPendingSubmission = {
  id: string;
  submittedAt: string;
  student?: { id: string; name: string; avatar?: string | null } | null;
  assignment?: {
    id: string;
    title: string;
    type?: string;
    course?: { id: string; title: string } | null;
  } | null;
};

export type TeacherDashboardStats = {
  totalCourses: number;
  publishedCourses: number;
  totalStudents: number;
  totalEnrollments: number;
  pendingGrading: number;
  totalAssessments: number;
  courses: TeacherDashboardCourse[];
  pendingSubmissions: TeacherPendingSubmission[];
};
