import type { NavItem } from "@/types/navigation.types";
import { ROUTES } from "@/constants";

export const publicNav: NavItem[] = [
  { title: "Home", href: ROUTES.home, iconName: "home" },
  { title: "Courses", href: ROUTES.courses, iconName: "book" },
  { title: "About", href: ROUTES.about, iconName: "info" },
  { title: "Instructors", href: ROUTES.teacher.root, iconName: "users" },
  { title: "Contact", href: ROUTES.contact, iconName: "mail" },
  { title: "Help", href: ROUTES.help, iconName: "help" },
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
