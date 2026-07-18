export const ROUTES = {
  home: "/",
  courses: "/courses",
  courseDetail: (slug: string) => `/courses/${slug}`,
  questionbank: (slug: string) => `/courses/${slug}/questionbank`,
  questionbankStudy: (slug: string, subtopicId: string) =>
    `/courses/${slug}/questionbank/${subtopicId}`,
  subjectResource: (programSlug: string, resourceSlug: string) =>
    `/subjects/${programSlug}/${resourceSlug}`,
  subjectQuestionbank: (programSlug: string) => `/subjects/${programSlug}/questionbank`,
  subjectQuestionbankStudy: (programSlug: string, subtopicSlug: string) =>
    `/subjects/${programSlug}/questionbank/${subtopicSlug}`,
  subjectQuestionbankStudyExam: (
    programSlug: string,
    subtopicSlug: string,
    opts?: { paper?: "PAPER_1" | "PAPER_2" }
  ) => {
    const params = new URLSearchParams({ mode: "exam" });
    if (opts?.paper) params.set("paper", opts.paper);
    return `/subjects/${programSlug}/questionbank/${subtopicSlug}?${params.toString()}`;
  },
  subjectPracticeMockExams: (programSlug: string) =>
    `/subjects/${programSlug}/practice-exams/mock-exams`,
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
    mcqExam: (assignmentId: string) => `/student/mcq/${assignmentId}`,
    notifications: "/student/notifications",
    payments: "/student/payments",
    settings: "/student/settings",
  },
  teacher: {
    root: "/teacher",
    courses: "/teacher/courses",
    courseCurriculum: (id: string) => `/teacher/courses/${id}`,
    subjects: "/teacher/subjects",
    chat: "/teacher/chat",
    settings: "/teacher/settings",
  },
  admin: {
    root: "/admin",
    users: "/admin/users",
    userDetail: (id: string) => `/admin/users/${id}`,
    courses: "/admin/courses",
    courseCurriculum: (id: string) => `/admin/courses/${id}`,
    categories: "/admin/categories",
    subjects: "/admin/subjects",
    questionbank: "/admin/questionbank",
    mcqExams: "/admin/mcq-exams",
    support: "/admin/support",
    supportDetail: (ticketId: string) => `/admin/support/${ticketId}`,
    settings: "/admin/settings",
  },
} as const;

export const roleHomeRoutes = {
  student: ROUTES.student.root,
  teacher: ROUTES.teacher.root,
  admin: ROUTES.admin.root,
} as const;
