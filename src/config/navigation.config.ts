import type { NavItem } from "@/types/navigation.types";
import { ROUTES } from "@/constants";

export const publicNav: NavItem[] = [
  {
    title: "School",
    href: ROUTES.courses,
    iconName: "book",
    children: [
      { title: "All Courses", href: ROUTES.courses },
      { title: "Live Classes", href: ROUTES.courses },
      { title: "Recorded Lessons", href: ROUTES.courses },
    ],
  },
  {
    title: "Academic",
    href: ROUTES.courses,
    iconName: "book",
    children: [
      { title: "Class 6–8", href: ROUTES.courses },
      { title: "Class 9–10", href: ROUTES.courses },
      { title: "Higher Secondary", href: ROUTES.courses },
    ],
  },
  { title: "Programs", href: ROUTES.courses, iconName: "book" },
  { title: "Admission", href: ROUTES.auth.register, iconName: "users" },
  {
    title: "More",
    iconName: "help",
    children: [
      { title: "Help Center", href: ROUTES.help },
      { title: "Contact", href: ROUTES.contact },
      { title: "Instructors", href: ROUTES.teacher.root },
    ],
  },
  { title: "About Us", href: ROUTES.about, iconName: "info" },
];

export const studentNav: NavItem[] = [
  { title: "Overview", href: ROUTES.student.root, iconName: "dashboard" },
  { title: "My Courses", href: ROUTES.student.courses, iconName: "book" },
  { title: "Messages", href: ROUTES.student.chat, iconName: "messages" },
  { title: "Settings", href: ROUTES.student.settings, iconName: "settings" },
];

export const teacherNav: NavItem[] = [
  { title: "Dashboard", href: ROUTES.teacher.root, iconName: "dashboard" },
  { title: "My Courses", href: ROUTES.teacher.courses, iconName: "book" },
  { title: "Messages", href: ROUTES.teacher.chat, iconName: "messages" },
];

export const teacherFooterNav: NavItem[] = [
  { title: "Settings", href: ROUTES.teacher.settings, iconName: "settings" },
];

export const adminNav: NavItem[] = [
  { title: "Dashboard", href: ROUTES.admin.root, iconName: "dashboard" },
  { title: "Users", href: ROUTES.admin.users, iconName: "userCog" },
  { title: "Courses", href: ROUTES.admin.courses, iconName: "book" },
  { title: "Support", href: ROUTES.admin.support, iconName: "support" },
  { title: "Example Module", href: ROUTES.admin.example, iconName: "grid" },
];

export const adminFooterNav: NavItem[] = [
  { title: "Settings", href: ROUTES.admin.settings, iconName: "settings" },
];
