"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  ChevronDown,
  HelpCircle,
  Info,
  Menu,
  Phone,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { publicNav, siteConfig } from "@/config";
import { ROUTES } from "@/constants";
import type { NavItem } from "@/types/navigation.types";
import { Logo } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";

const navIcons: Record<string, LucideIcon> = {
  book: BookOpen,
  info: Info,
  users: Users,
  help: HelpCircle,
};

function isNavActive(pathname: string, item: NavItem): boolean {
  if (item.href) {
    if (item.href === ROUTES.home) return pathname === ROUTES.home;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }
  return item.children?.some((child) => child.href && isNavActive(pathname, child)) ?? false;
}

function DesktopNavItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = isNavActive(pathname, item);
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
      <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
        <button
          type="button"
          className={cn(
            "inline-flex cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            active ? "text-foreground" : "text-foreground/75 hover:bg-primary-muted/60 hover:text-primary"
          )}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {item.title}
          <ChevronDown
            className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")}
            aria-hidden
          />
        </button>

        <AnimatePresence>
          {open ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full z-50 min-w-[11rem] pt-2"
            >
              <div className="overflow-hidden rounded-xl border border-border bg-card py-1.5 shadow-[0_16px_40px_-12px_rgba(24,119,242,0.18)]">
                {item.children?.map((child) =>
                  child.href ? (
                    <Link
                      key={child.title}
                      href={child.href}
                      className="block px-4 py-2.5 text-sm text-foreground/80 transition-colors hover:bg-primary-muted hover:text-primary"
                      onClick={() => setOpen(false)}
                    >
                      {child.title}
                    </Link>
                  ) : null
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }

  if (!item.href) return null;

  return (
    <Link
      href={item.href}
      className={cn(
        "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active ? "text-foreground" : "text-foreground/75 hover:text-foreground"
      )}
    >
      {item.title}
    </Link>
  );
}

function MobileNavItem({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const active = isNavActive(pathname, item);
  const Icon = item.iconName ? navIcons[item.iconName] : null;
  const hasChildren = Boolean(item.children?.length);

  if (hasChildren) {
    return (
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <button
          type="button"
          className={cn(
            "flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-base font-medium transition-colors",
            active ? "text-primary" : "text-foreground"
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
            {item.children?.map((child) =>
              child.href ? (
                <Link
                  key={child.title}
                  href={child.href}
                  onClick={onNavigate}
                  className="block rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-card hover:text-primary"
                >
                  {child.title}
                </Link>
              ) : null
            )}
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
        "flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium transition-colors",
        active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
      )}
    >
      {Icon ? <Icon className="h-5 w-5 shrink-0" aria-hidden /> : null}
      {item.title}
    </Link>
  );
}

export function PublicHeader() {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobileMenu = () => setMobileOpen(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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

        <nav aria-label="Main navigation" className="hidden flex-1 items-center justify-center gap-0.5 xl:gap-1 lg:flex">
          {publicNav.map((item) => (
            <DesktopNavItem key={item.title} item={item} pathname={pathname} />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3 lg:ml-0 lg:shrink-0">
          <a
            href={`tel:${siteConfig.phone}`}
            className="hidden items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-foreground transition-colors hover:text-primary md:inline-flex"
          >
            <Phone className="h-4 w-4 text-primary" aria-hidden />
            {siteConfig.phone}
          </a>

          <Button asChild variant="secondary" size="pill" className="hidden sm:inline-flex lg:px-5">
            <Link href={ROUTES.auth.login}>
              <span>Log In / Sign Up</span>
            </Link>
          </Button>

          <Button asChild variant="secondary" size="sm" className="rounded-full px-3 sm:hidden">
            <Link href={ROUTES.auth.login}>
              <span>Log In</span>
            </Link>
          </Button>

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
                {publicNav.map((item) => (
                  <MobileNavItem key={item.title} item={item} pathname={pathname} onNavigate={closeMobileMenu} />
                ))}
              </nav>

              <div className="sticky bottom-0 space-y-3 border-t border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <a
                  href={`tel:${siteConfig.phone}`}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/50 py-3 text-sm font-semibold text-foreground"
                >
                  <Phone className="h-4 w-4 text-primary" aria-hidden />
                  Call {siteConfig.phone}
                </a>
                <Button asChild variant="default" size="pill" className="w-full">
                  <Link href={ROUTES.auth.register} onClick={closeMobileMenu}>
                    Log In / Sign Up
                  </Link>
                </Button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
