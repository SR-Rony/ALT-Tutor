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
  subjectPracticeExam: (programSlug: string, templateSlug: string) =>
    `/subjects/${programSlug}/practice-exams/${templateSlug}`,
  subjectPracticeExamTake: (programSlug: string, templateSlug: string, opts?: { new?: boolean }) => {
    const base = `/subjects/${programSlug}/practice-exams/${templateSlug}/take`;
    if (opts?.new) return `${base}?new=1`;
    return base;
  },
  subjectPracticeExamResult: (
    programSlug: string,
    templateSlug: string,
    attemptId: string
  ) => `/subjects/${programSlug}/practice-exams/${templateSlug}/attempts/${attemptId}/result`,
  about: "/about",
  contact: "/contact",
  help: "/help",
  auth: {
    login: "/login",
    register: "/register",
    forgotPassword: "/forgot-password",
  },
  payments: {
    return: "/payments/return",
  },
  student: {
    root: "/student",
    courses: "/student/courses",
    courseLearn: (slug: string) => `/student/courses/${slug}`,
    assignments: "/student/assignments",
    assessments: "/student/assessments",
    mcqExam: (assignmentId: string) => `/student/mcq/${assignmentId}`,
    notifications: "/student/notifications",
    payments: "/student/payments",
    practicePass: "/student/payments#practice-pass",
    settings: "/student/settings",
  },
  teacher: {
    root: "/teacher",
    courses: "/teacher/courses",
    courseCurriculum: (id: string) => `/teacher/courses/${id}`,
    subjects: "/teacher/subjects",
    practiceExams: "/teacher/practice-exams",
    assessments: "/teacher/assessments",
    gradingQueue: "/teacher/grading",
    gradebook: "/teacher/gradebook",
    chat: "/teacher/chat",
    settings: "/teacher/settings",
  },
  admin: {
    root: "/admin",
    users: "/admin/users",
    userDetail: (id: string) => `/admin/users/${id}`,
    teachers: "/admin/teachers",
    courses: "/admin/courses",
    courseCurriculum: (id: string) => `/admin/courses/${id}`,
    enrollments: "/admin/enrollments",
    reviews: "/admin/reviews",
    categories: "/admin/categories",
    subjects: "/admin/subjects",
    questionbank: "/admin/questionbank",
    qbCategories: "/admin/questionbank/categories",
    qbSubjects: "/admin/questionbank/subjects",
    qbPrograms: "/admin/questionbank/programs",
    practiceExams: "/admin/practice-exams",
    keyConcepts: "/admin/key-concepts",
    accessProducts: "/admin/access-products",
    mcqExams: "/admin/mcq-exams",
    examsMcq: "/admin/exams/mcq",
    examsWritten: "/admin/exams/written",
    gradingQueue: "/admin/grading",
    gradebook: "/admin/gradebook",
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
