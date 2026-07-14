import type {
  AdminCourse,
  AdminDashboardStats,
  AdminPayment,
  AdminUser,
} from "@/types/admin-dashboard.types";

export function buildUserRoleChart(users: AdminUser[]) {
  const counts = { Student: 0, Teacher: 0, Admin: 0 };
  for (const user of users) {
    const role = user.role.toUpperCase();
    if (role === "STUDENT") counts.Student += 1;
    else if (role === "TEACHER") counts.Teacher += 1;
    else if (role === "ADMIN") counts.Admin += 1;
  }
  return [
    { name: "Students", value: counts.Student, fill: "#1877f2" },
    { name: "Teachers", value: counts.Teacher, fill: "#389452" },
    { name: "Admins", value: counts.Admin, fill: "#ef3239" },
  ].filter((item) => item.value > 0);
}

/** Single multi-column chart: each metric = one colored column. */
export function buildPlatformMetricsChart(
  stats: AdminDashboardStats | undefined,
  courses: AdminCourse[],
  payments: AdminPayment[]
) {
  const published = courses.filter((c) => String(c.status).toUpperCase() === "PUBLISHED").length;
  const draft = courses.filter((c) => String(c.status).toUpperCase() === "DRAFT").length;
  const archived = courses.filter((c) => String(c.status).toUpperCase() === "ARCHIVED").length;
  const successPayments = payments.filter((p) => String(p.status).toUpperCase() === "SUCCESS").length;

  return [
    { name: "Users", value: stats?.totalUsers ?? 0, fill: "#1877f2" },
    { name: "Students", value: stats?.totalStudents ?? 0, fill: "#3b8dee" },
    { name: "Teachers", value: stats?.totalTeachers ?? 0, fill: "#389452" },
    { name: "Courses", value: stats?.totalCourses ?? 0, fill: "#ef3239" },
    { name: "Enrolled", value: stats?.totalEnrollments ?? 0, fill: "#ff6b35" },
    { name: "Published", value: published, fill: "#0d9488" },
    { name: "Draft", value: draft, fill: "#64748b" },
    { name: "Archived", value: archived, fill: "#94a3b8" },
    { name: "Payments", value: successPayments, fill: "#5e37ea" },
    {
      name: "Revenue",
      value: Number(Number(stats?.totalRevenue ?? 0).toFixed(2)),
      fill: "#0ea5e9",
    },
  ];
}
