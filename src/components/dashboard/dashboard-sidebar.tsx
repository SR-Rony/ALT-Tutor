"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/types";
import { cn } from "@/utils";

interface DashboardSidebarProps {
  items: NavItem[];
  footerItems?: NavItem[];
  roleLabel: string;
}

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active = item.href ? pathname === item.href || pathname.startsWith(`${item.href}/`) : false;

  if (!item.href) return null;

  return (
    <Link
      href={item.href}
      className={cn(
        "block rounded-xl px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {item.title}
    </Link>
  );
}

export function DashboardSidebar({ items, footerItems = [], roleLabel }: DashboardSidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:block">
      <div className="border-b border-border px-4 py-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{roleLabel}</p>
      </div>
      <nav className="space-y-1 p-3">
        {items.map((item) => (
          <NavLink key={item.title} item={item} />
        ))}
      </nav>
      {footerItems.length > 0 ? (
        <nav className="mt-auto space-y-1 border-t border-border p-3">
          {footerItems.map((item) => (
            <NavLink key={item.title} item={item} />
          ))}
        </nav>
      ) : null}
    </aside>
  );
}
