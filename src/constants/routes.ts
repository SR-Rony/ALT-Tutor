export const ROUTES = {
  home: "/",
  courses: "/courses",
  courseDetail: (slug: string) => `/courses/${slug}`,
  about: "/about",
  contact: "/contact",
  help: "/help",
  auth: {
    login: "/login",
    register: "/register",
    forgotPassword: "/forgot-password",
  },
  student: {
    root: "/student",
    courses: "/student/courses",
    assignments: "/student/assignments",
    notifications: "/student/notifications",
    payments: "/student/payments",
    settings: "/student/settings",
  },
  teacher: {
    root: "/teacher",
    courses: "/teacher/courses",
    chat: "/teacher/chat",
    settings: "/teacher/settings",
  },
  admin: {
    root: "/admin",
    users: "/admin/users",
    courses: "/admin/courses",
    categories: "/admin/categories",
    support: "/admin/support",
    supportDetail: (ticketId: string) => `/admin/support/${ticketId}`,
    example: "/admin/example",
    settings: "/admin/settings",
  },
} as const;

export const roleHomeRoutes = {
  student: ROUTES.student.root,
  teacher: ROUTES.teacher.root,
  admin: ROUTES.admin.root,
} as const;
