import type { NavItem } from "@/types/navigation.types";
import { ROUTES } from "@/constants";

/** Static public navbar — Subjects mega menu loads IB subjects from /subjects/menu */
export const publicNav: NavItem[] = [
  { title: "Home", href: ROUTES.home, iconName: "home" },
  {
    title: "Subjects",
    href: ROUTES.courses,
    iconName: "book",
  },
  { title: "About", href: ROUTES.about, iconName: "info" },
  { title: "Help", href: ROUTES.help, iconName: "help" },
  { title: "Contact", href: ROUTES.contact, iconName: "phone" },
];

export const publicFooterProgramLinks = [
  { label: "All Courses", href: ROUTES.courses },
  { label: "About Us", href: ROUTES.about },
  { label: "Help Center", href: ROUTES.help },
  { label: "Contact", href: ROUTES.contact },
] as const;

export const publicFooterCompanyLinks = [
  { label: "About Us", href: ROUTES.about },
  { label: "Help Center", href: ROUTES.help },
  { label: "Contact", href: ROUTES.contact },
  { label: "Get Started", href: ROUTES.auth.register },
] as const;

export const studentNav: NavItem[] = [
  { title: "Overview", href: ROUTES.student.root, iconName: "dashboard" },
  { title: "My Courses", href: ROUTES.student.courses, iconName: "book" },
  { title: "Exam Center", href: ROUTES.student.assessments, iconName: "clipboard" },
  { title: "Assignments", href: ROUTES.student.assignments, iconName: "clipboard" },
  { title: "Notifications", href: ROUTES.student.notifications, iconName: "bell" },
  { title: "Payments", href: ROUTES.student.payments, iconName: "wallet" },
];

export const studentFooterNav: NavItem[] = [
  { title: "Settings", href: ROUTES.student.settings, iconName: "settings" },
];

export const teacherNav: NavItem[] = [
  { title: "Dashboard", href: ROUTES.teacher.root, iconName: "dashboard" },
  { title: "My Courses", href: ROUTES.teacher.courses, iconName: "book" },
  { title: "Assessments", href: ROUTES.teacher.assessments, iconName: "clipboard" },
  { title: "Grading", href: ROUTES.teacher.gradingQueue, iconName: "clipboard" },
  { title: "Gradebook", href: ROUTES.teacher.gradebook, iconName: "clipboard" },
  { title: "My Subjects", href: ROUTES.teacher.subjects, iconName: "book" },
];

export const teacherFooterNav: NavItem[] = [
  { title: "Settings", href: ROUTES.teacher.settings, iconName: "settings" },
];

export const adminNav: NavItem[] = [
  { title: "Dashboard", href: ROUTES.admin.root, iconName: "dashboard" },
  { title: "Users", href: ROUTES.admin.users, iconName: "userCog" },
  { title: "Teachers", href: ROUTES.admin.teachers, iconName: "userCog" },
  { title: "Courses", href: ROUTES.admin.courses, iconName: "book" },
  { title: "Subjects", href: ROUTES.admin.subjects, iconName: "book" },
  { title: "Questionbank", href: ROUTES.admin.questionbank, iconName: "clipboard" },
  { title: "MCQ Exams", href: ROUTES.admin.mcqExams, iconName: "clipboard" },
  { title: "Access Products", href: ROUTES.admin.accessProducts, iconName: "wallet" },
  { title: "Gradebook", href: ROUTES.admin.gradebook, iconName: "clipboard" },
  { title: "Grading", href: ROUTES.admin.gradingQueue, iconName: "clipboard" },
  { title: "Categories", href: ROUTES.admin.categories, iconName: "tags" },
  { title: "Support", href: ROUTES.admin.support, iconName: "support" },
];

export const adminFooterNav: NavItem[] = [
  { title: "Settings", href: ROUTES.admin.settings, iconName: "settings" },
];
