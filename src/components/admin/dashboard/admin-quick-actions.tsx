"use client";

import Link from "next/link";
import { BookOpen, Headphones, UserCog, type LucideIcon } from "lucide-react";
import { ROUTES } from "@/constants";
import { cn } from "@/utils";

const actions: {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  tone: string;
}[] = [
  {
    title: "Manage users",
    description: "Students, teachers, and access",
    href: ROUTES.admin.users,
    icon: UserCog,
    tone: "bg-primary/10 text-primary",
  },
  {
    title: "Manage courses",
    description: "Publish, draft, and enrollments",
    href: ROUTES.admin.courses,
    icon: BookOpen,
    tone: "bg-accent/10 text-accent",
  },
  {
    title: "Support inbox",
    description: "Contact messages and tickets",
    href: ROUTES.admin.support,
    icon: Headphones,
    tone: "bg-[#ecfdf3] text-accent-green",
  },
];

export function AdminQuickActions() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.href}
            href={action.href}
            className={cn(
              "group rounded-2xl border border-border bg-card p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)]",
              "transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_12px_28px_rgba(24,119,242,0.12)]"
            )}
          >
            <div className={cn("mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl", action.tone)}>
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <p className="font-semibold text-foreground group-hover:text-primary">{action.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
          </Link>
        );
      })}
    </div>
  );
}
