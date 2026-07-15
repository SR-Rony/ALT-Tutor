"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  ChevronDown,
  HelpCircle,
  Home,
  Info,
  Menu,
  Phone,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { siteConfig } from "@/config";
import { ROUTES } from "@/constants";
import { usePublicNav } from "@/hooks/use-public-nav";
import type { NavItem } from "@/types/navigation.types";
import { Logo } from "@/components/shared";
import { PublicAuthActions } from "@/components/layouts/public-auth-actions";
import { SubjectsMegaMenu, SubjectsMobileMenu } from "@/components/layouts/subjects-mega-menu";
import { cn } from "@/utils";

const navIcons: Record<string, LucideIcon> = {
  home: Home,
  book: BookOpen,
  info: Info,
  users: Users,
  help: HelpCircle,
  phone: Phone,
};

function isNavActive(pathname: string, item: NavItem, search = ""): boolean {
  if (item.href) {
    const [hrefPath, hrefQuery = ""] = item.href.split("?");
    if (hrefPath === ROUTES.home) return pathname === ROUTES.home;

    const pathMatches = pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
    if (!pathMatches) return false;

    if (!hrefQuery) {
      if (item.children?.length) return pathMatches;
      const current = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
      return pathMatches && ![...current.keys()].length;
    }

    const expected = new URLSearchParams(hrefQuery);
    const current = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    for (const [key, value] of expected.entries()) {
      if (current.get(key) !== value) return false;
    }
    return true;
  }

  return item.children?.some((child) => child.href && isNavActive(pathname, child, search)) ?? false;
}

function NavLabel({
  children,
  active = false,
  open = false,
}: {
  children: ReactNode;
  active?: boolean;
  open?: boolean;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center gap-1 text-sm font-medium transition-colors duration-300",
        active || open ? "text-[#ef3239]" : "text-[#1a2b5e]/75 group-hover:text-[#ef3239]"
      )}
    >
      {children}
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 -bottom-1 h-0.5 origin-left rounded-full bg-gradient-to-r from-[#3b8dee] via-[#ff6b35] to-[#ef3239] transition-transform duration-300 ease-out",
          active || open ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
        )}
      />
    </span>
  );
}

function DesktopNavItem({
  item,
  pathname,
  search,
}: {
  item: NavItem;
  pathname: string;
  search: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = isNavActive(pathname, item, search);
  const hasChildren = Boolean(item.children?.length);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  if (hasChildren) {
    return (
      <div
        ref={ref}
        className="group relative"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <button
          type="button"
          className="inline-flex cursor-pointer items-center gap-1 px-3 py-2"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <NavLabel active={active} open={open}>
            {item.title}
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")}
              aria-hidden
            />
          </NavLabel>
        </button>

        <AnimatePresence>
          {open ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full z-50 min-w-[13.5rem] pt-2"
            >
              <div className="max-h-[70vh] overflow-y-auto rounded-xl border border-[#e8edf5] bg-white py-2 shadow-[0_16px_40px_-12px_rgba(24,119,242,0.18)]">
                {item.children?.map((child) => {
                  if (!child.href) return null;
                  const childActive = isNavActive(pathname, child, search);
                  return (
                    <Link
                      key={`${child.title}-${child.href}`}
                      href={child.href}
                      className={cn(
                        "group/item relative mx-1.5 flex items-center rounded-lg px-3 py-2.5 text-sm transition-colors duration-300",
                        childActive
                          ? "bg-[#fff1ee] font-semibold text-[#ef3239]"
                          : "text-[#58688b] hover:bg-[#fff1ee] hover:text-[#ef3239]"
                      )}
                      onClick={() => setOpen(false)}
                    >
                      <span className="relative">
                        {child.title}
                        <span
                          aria-hidden
                          className={cn(
                            "absolute inset-x-0 -bottom-0.5 h-px origin-left bg-gradient-to-r from-[#3b8dee] via-[#ff6b35] to-[#ef3239] transition-transform duration-300 ease-out",
                            childActive ? "scale-x-100" : "scale-x-0 group-hover/item:scale-x-100"
                          )}
                        />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }

  if (!item.href) return null;

  return (
    <Link href={item.href} className="group inline-flex px-3 py-2">
      <NavLabel active={active}>{item.title}</NavLabel>
    </Link>
  );
}

function MobileNavItem({
  item,
  pathname,
  search,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  search: string;
  onNavigate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const active = isNavActive(pathname, item, search);
  const Icon = item.iconName ? navIcons[item.iconName] : null;
  const hasChildren = Boolean(item.children?.length);

  if (hasChildren) {
    return (
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <button
          type="button"
          className={cn(
            "flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-left text-base font-medium transition-colors duration-300",
            active ? "text-[#ef3239]" : "text-foreground hover:text-[#ef3239]"
          )}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          <span className="flex items-center gap-3">
            {Icon ? <Icon className="h-5 w-5 shrink-0" aria-hidden /> : null}
            {item.title}
          </span>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 transition-transform duration-200", expanded && "rotate-180")}
            aria-hidden
          />
        </button>
        {expanded ? (
          <div className="border-t border-border/70 bg-muted/30 px-2 py-2">
            {item.children?.map((child) => {
              if (!child.href) return null;
              const childActive = isNavActive(pathname, child, search);
              return (
                <Link
                  key={`${child.title}-${child.href}`}
                  href={child.href}
                  onClick={onNavigate}
                  className={cn(
                    "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-300",
                    childActive
                      ? "bg-[#fff1ee] text-[#ef3239]"
                      : "text-muted-foreground hover:bg-[#fff1ee] hover:text-[#ef3239]"
                  )}
                >
                  {child.title}
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  }

  if (!item.href) return null;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium transition-colors duration-300",
        active ? "bg-[#fff1ee] text-[#ef3239]" : "text-foreground hover:bg-[#fff1ee] hover:text-[#ef3239]"
      )}
    >
      {Icon ? (
        <Icon
          className={cn("h-5 w-5 shrink-0", active ? "text-[#ef3239]" : "text-muted-foreground")}
          aria-hidden
        />
      ) : null}
      {item.title}
    </Link>
  );
}

function PublicHeaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const navItems = usePublicNav();
  const prefersReducedMotion = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobileMenu = () => setMobileOpen(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, search]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-card shadow-[0_4px_24px_-8px_rgba(24,119,242,0.08)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:px-6 lg:h-[4.5rem] lg:gap-6">
        <Logo className="shrink-0" />

        <nav aria-label="Main navigation" className="hidden flex-1 items-center justify-center gap-0.5 lg:flex xl:gap-1">
          {navItems.map((item) =>
            item.title === "Subjects" ? (
              <SubjectsMegaMenu key={item.title} pathname={pathname} search={search} />
            ) : (
              <DesktopNavItem key={item.title} item={item} pathname={pathname} search={search} />
            )
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3 lg:ml-0 lg:shrink-0">
          <a
            href={`tel:${siteConfig.phone}`}
            className="hidden items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-foreground transition-colors hover:text-primary md:inline-flex"
          >
            <Phone className="h-4 w-4 text-primary" aria-hidden />
            {siteConfig.phone}
          </a>

          <PublicAuthActions />

          <button
            type="button"
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-border bg-card text-foreground transition-all hover:border-primary/30 hover:bg-primary-muted hover:text-primary lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Close menu overlay"
              className="fixed inset-0 top-16 z-40 bg-foreground/20 lg:hidden"
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeMobileMenu}
            />

            <motion.div
              id="mobile-navigation"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              className="fixed inset-x-0 top-16 z-50 flex max-h-[calc(100dvh-4rem)] flex-col border-b border-border bg-card shadow-xl lg:hidden"
              initial={prefersReducedMotion ? false : { opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <nav
                aria-label="Mobile navigation"
                className="mx-auto w-full max-w-7xl flex-1 space-y-2 overflow-y-auto p-4"
              >
                {navItems.map((item) =>
                  item.title === "Subjects" ? (
                    <SubjectsMobileMenu
                      key={item.title}
                      pathname={pathname}
                      search={search}
                      onNavigate={closeMobileMenu}
                    />
                  ) : (
                    <MobileNavItem
                      key={item.title}
                      item={item}
                      pathname={pathname}
                      search={search}
                      onNavigate={closeMobileMenu}
                    />
                  )
                )}
              </nav>

              <div className="sticky bottom-0 space-y-3 border-t border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <a
                  href={`tel:${siteConfig.phone}`}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/50 py-3 text-sm font-semibold text-foreground"
                >
                  <Phone className="h-4 w-4 text-primary" aria-hidden />
                  Call {siteConfig.phone}
                </a>
                <PublicAuthActions mobile onNavigate={closeMobileMenu} />
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

export function PublicHeader() {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 z-50 h-16 border-b border-border/60 bg-card lg:h-[4.5rem]" />
      }
    >
      <PublicHeaderInner />
    </Suspense>
  );
}
