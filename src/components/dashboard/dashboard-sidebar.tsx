"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Grid3X3,
  Headphones,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Tags,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { siteConfig } from "@/config";
import { ROUTES } from "@/constants";
import { authService } from "@/services/auth.service";
import {
  logout,
  setMobileSidebarOpen,
  toggleSidebar,
  useAppDispatch,
  useAppSelector,
} from "@/store";
import type { NavItem } from "@/types";
import { cn } from "@/utils";

const navIcons: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  userCog: UserCog,
  book: BookOpen,
  tags: Tags,
  support: Headphones,
  grid: Grid3X3,
  settings: Settings,
  users: Users,
  messages: MessageSquare,
  clipboard: ClipboardList,
  bell: Bell,
  wallet: Wallet,
};

interface DashboardSidebarProps {
  items: NavItem[];
  footerItems?: NavItem[];
  roleLabel: string;
}

function isNavActive(pathname: string, href?: string) {
  if (!href) return false;
  if (pathname === href) return true;
  // `/admin/questionbank` must not stay active on `/admin/questionbank/categories` etc.
  if (href === ROUTES.admin.questionbank) return false;
  return pathname.startsWith(`${href}/`);
}

function isGroupActive(pathname: string, item: NavItem) {
  if (item.href && isNavActive(pathname, item.href)) return true;
  return Boolean(item.children?.some((child) => isNavActive(pathname, child.href)));
}

function NavItemLink({
  item,
  collapsed,
  onNavigate,
  nested = false,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
  nested?: boolean;
}) {
  const pathname = usePathname();
  if (!item.href) return null;

  const active = isNavActive(pathname, item.href);
  const Icon = item.iconName ? navIcons[item.iconName] : LayoutDashboard;

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        collapsed && "justify-center px-2",
        nested && !collapsed && "py-2 pl-10 pr-3 text-[13px]",
        active
          ? "bg-[#e8f2fe] text-[#1466db] shadow-[inset_0_0_0_1px_rgba(24,119,242,0.12)]"
          : "text-[#58688b] hover:bg-[#f0f5fc] hover:text-[#1a1a2e]"
      )}
    >
      {!nested || collapsed ? (
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            active ? "text-[#1877f2]" : "text-[#7a8aab] group-hover:text-[#1877f2]"
          )}
          aria-hidden
        />
      ) : (
        <span
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            active ? "bg-[#1877f2]" : "bg-[#c5d0e3]"
          )}
          aria-hidden
        />
      )}
      {!collapsed ? <span className="truncate">{item.title}</span> : null}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.title}</TooltipContent>
    </Tooltip>
  );
}

function NavGroup({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const children = item.children ?? [];
  const groupActive = isGroupActive(pathname, item);
  const [open, setOpen] = useState(groupActive);
  const Icon = item.iconName ? navIcons[item.iconName] : LayoutDashboard;

  useEffect(() => {
    if (groupActive) setOpen(true);
  }, [groupActive]);

  if (collapsed) {
    const href = item.href ?? children[0]?.href;
    if (!href) return null;
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Link
            href={href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center justify-center rounded-xl px-2 py-2.5 transition-all duration-200",
              groupActive
                ? "bg-[#e8f2fe] text-[#1466db] shadow-[inset_0_0_0_1px_rgba(24,119,242,0.12)]"
                : "text-[#58688b] hover:bg-[#f0f5fc] hover:text-[#1a1a2e]"
            )}
            aria-label={item.title}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0",
                groupActive ? "text-[#1877f2]" : "text-[#7a8aab]"
              )}
              aria-hidden
            />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[200px]">
          <p className="font-semibold">{item.title}</p>
          <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
            {children.map((child) => (
              <li key={child.title}>{child.title}</li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
          groupActive
            ? "bg-[#e8f2fe] text-[#1466db]"
            : "text-[#58688b] hover:bg-[#f0f5fc] hover:text-[#1a1a2e]"
        )}
        aria-expanded={open}
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            groupActive ? "text-[#1877f2]" : "text-[#7a8aab] group-hover:text-[#1877f2]"
          )}
          aria-hidden
        />
        <span className="min-w-0 flex-1 truncate text-left">{item.title}</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 shrink-0 transition-transform", open ? "rotate-0" : "-rotate-90")}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="space-y-0.5 pb-1">
          {children.map((child) => (
            <NavItemLink
              key={child.title}
              item={child}
              collapsed={false}
              onNavigate={onNavigate}
              nested
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function NavEntry({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  if (item.children && item.children.length > 0) {
    return <NavGroup item={item} collapsed={collapsed} onNavigate={onNavigate} />;
  }
  return <NavItemLink item={item} collapsed={collapsed} onNavigate={onNavigate} />;
}

function LogoutButton({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();

  async function handleLogout() {
    onNavigate?.();
    try {
      await authService.logout();
    } finally {
      dispatch(logout());
      router.replace(ROUTES.auth.login);
    }
  }

  const button = (
    <button
      type="button"
      onClick={() => void handleLogout()}
      className={cn(
        "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        collapsed && "justify-center px-2",
        "text-[#58688b] hover:bg-[#fef2f2] hover:text-[#ef3239]"
      )}
    >
      <LogOut className="h-4 w-4 shrink-0 text-[#7a8aab] transition-colors group-hover:text-[#ef3239]" />
      {!collapsed ? <span>Logout</span> : null}
    </button>
  );

  if (!collapsed) return button;

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right">Logout</TooltipContent>
    </Tooltip>
  );
}

function SidebarNav({
  items,
  footerItems,
  collapsed,
  onNavigate,
}: {
  items: NavItem[];
  footerItems: NavItem[];
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <TooltipProvider delayDuration={0}>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {items.map((item) => (
          <NavEntry key={item.title} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="mt-auto border-t border-[#e8edf5] px-3 py-3">
        {footerItems.map((item) => (
          <NavEntry key={item.title} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
        <LogoutButton collapsed={collapsed} onNavigate={onNavigate} />
      </div>
    </TooltipProvider>
  );
}

function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="shrink-0 border-b border-[#e8edf5]">
      <Link
        href={ROUTES.home}
        className={cn(
          "flex items-center gap-3 px-4 py-4 transition-colors hover:bg-[#f5f8fd]",
          collapsed && "justify-center px-2"
        )}
        aria-label={`${siteConfig.name} home`}
      >
        <Image
          src="/logo.jpeg"
          alt={siteConfig.name}
          width={40}
          height={40}
          priority
          className="h-10 w-10 shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-[#dce4f0]"
        />
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight text-[#1a1a2e]">{siteConfig.name}</p>
            <p className="truncate text-[11px] text-[#58688b]">Learning platform</p>
          </div>
        ) : null}
      </Link>
    </div>
  );
}

function DesktopSidebar({
  items,
  footerItems,
  roleLabel,
  collapsed,
  onToggle,
}: DashboardSidebarProps & { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside
      className={cn(
        "sticky top-0 z-30 hidden h-[100vh] shrink-0 flex-col border-r border-[#e8edf5] bg-white text-[#1a1a2e] transition-[width] duration-200 ease-linear lg:flex",
        collapsed ? "w-[var(--sidebar-width-icon)]" : "w-[var(--sidebar-width)]"
      )}
    >
      <SidebarBrand collapsed={collapsed} />

      <div className={cn("shrink-0 px-4 py-2.5", collapsed && "px-2 text-center")}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a98b3]">
          {collapsed ? roleLabel.charAt(0) : roleLabel}
        </p>
      </div>

      <Separator className="bg-[#eef2f8]" />

      <SidebarNav items={items} footerItems={footerItems ?? []} collapsed={collapsed} />

      <button
        type="button"
        onClick={onToggle}
        className="absolute -right-3 top-[4.75rem] z-40 flex h-6 w-6 items-center justify-center rounded-full border border-[#dce4f0] bg-white text-[#58688b] shadow-sm transition hover:border-[#1877f2]/30 hover:bg-[#e8f2fe] hover:text-[#1877f2]"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>
    </aside>
  );
}

function MobileSidebar({ items, footerItems, roleLabel }: DashboardSidebarProps) {
  const open = useAppSelector((s) => s.ui.mobileSidebarOpen);
  const dispatch = useAppDispatch();
  const setOpen = (value: boolean) => dispatch(setMobileSidebarOpen(value));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="flex h-[100vh] w-72 flex-col p-0 lg:hidden">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <SidebarBrand collapsed={false} />
        <div className="px-4 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a98b3]">
            {roleLabel}
          </p>
        </div>
        <Separator className="bg-[#eef2f8]" />
        <SidebarNav
          items={items}
          footerItems={footerItems ?? []}
          collapsed={false}
          onNavigate={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

export function DashboardSidebar(props: DashboardSidebarProps) {
  const collapsed = useAppSelector((s) => s.ui.sidebarCollapsed);
  const dispatch = useAppDispatch();

  return (
    <>
      <DesktopSidebar
        {...props}
        collapsed={collapsed}
        onToggle={() => dispatch(toggleSidebar())}
      />
      <MobileSidebar {...props} />
    </>
  );
}
