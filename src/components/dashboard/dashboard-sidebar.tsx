"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Grid3X3,
  Headphones,
  LayoutDashboard,
  MessageSquare,
  Settings,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { NavItem } from "@/types";
import { cn } from "@/utils";

const navIcons: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  userCog: UserCog,
  book: BookOpen,
  support: Headphones,
  grid: Grid3X3,
  settings: Settings,
  users: Users,
  messages: MessageSquare,
};

interface DashboardSidebarProps {
  items: NavItem[];
  footerItems?: NavItem[];
  roleLabel: string;
}

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active = item.href ? pathname === item.href || pathname.startsWith(`${item.href}/`) : false;
  const Icon = item.iconName ? navIcons[item.iconName] : null;

  if (!item.href) return null;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden /> : null}
      <span>{item.title}</span>
    </Link>
  );
}

export function DashboardSidebar({ items, footerItems = [], roleLabel }: DashboardSidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
      <div className="border-b border-border px-4 py-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{roleLabel}</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => (
          <NavLink key={item.title} item={item} />
        ))}
      </nav>
      {footerItems.length > 0 ? (
        <nav className="space-y-1 border-t border-border p-3">
          {footerItems.map((item) => (
            <NavLink key={item.title} item={item} />
          ))}
        </nav>
      ) : null}
    </aside>
  );
}
