"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  HelpCircle,
  Home,
  Info,
  LogIn,
  Mail,
  Menu,
  UserPlus,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { publicNav } from "@/config";
import { ROUTES } from "@/constants";
import type { NavItem } from "@/types/navigation.types";
import { Logo } from "@/components/shared";
import { cn } from "@/utils";

const navIcons: Record<string, LucideIcon> = {
  home: Home,
  book: BookOpen,
  info: Info,
  users: Users,
  mail: Mail,
  help: HelpCircle,
};

function isNavActive(pathname: string, href: string) {
  if (href === ROUTES.home) return pathname === ROUTES.home;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  item,
  pathname,
  onNavigate,
  variant = "desktop",
  transparent = false,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
  transparent?: boolean;
}) {
  if (!item.href) return null;

  const active = isNavActive(pathname, item.href);
  const Icon = item.iconName ? navIcons[item.iconName] : null;

  if (variant === "mobile") {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium transition-colors",
          active
            ? "bg-primary/10 text-primary"
            : "text-foreground hover:bg-muted"
        )}
      >
        {Icon ? <Icon className="h-5 w-5 shrink-0" aria-hidden /> : null}
        {item.title}
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "relative rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        transparent ? "hover:bg-foreground/5" : "hover:bg-muted"
      )}
    >
      {item.title}
      <span
        className={cn(
          "absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-primary transition-transform duration-200",
          active ? "scale-x-100" : "scale-x-0"
        )}
        aria-hidden
      />
    </Link>
  );
}

function DesktopAuthButtons({ transparent }: { transparent: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <Link
        href={ROUTES.auth.login}
        className={cn(
          "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all",
          transparent
            ? "text-foreground hover:bg-foreground/5"
            : "border border-border bg-card text-foreground hover:bg-muted"
        )}
      >
        <LogIn className="h-4 w-4" aria-hidden />
        Sign in
      </Link>
      <Link
        href={ROUTES.auth.register}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-primary-foreground shadow-brand transition-all duration-300 hover:from-primary-hover hover:to-accent hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-10px_rgba(24,119,242,0.45)]"
      >
        Get started
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}

function MobileDrawerAuthButtons({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="space-y-3">
      <p className="text-center text-xs font-medium text-muted-foreground">Start your learning journey today</p>
      <div className="grid grid-cols-2 gap-2.5">
        <Link
          href={ROUTES.auth.login}
          onClick={onNavigate}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted active:scale-[0.98]"
        >
          <LogIn className="h-4 w-4 shrink-0" aria-hidden />
          Sign in
        </Link>
        <Link
          href={ROUTES.auth.register}
          onClick={onNavigate}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-3 text-sm font-semibold text-primary-foreground shadow-brand transition-all duration-300 hover:from-primary-hover hover:to-accent active:scale-[0.98]"
        >
          <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
          Get started
        </Link>
      </div>
    </div>
  );
}

export function PublicHeader() {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isHomePage = pathname === ROUTES.home;
  const isTransparent = isHomePage && !scrolled && !mobileOpen;
  const showSolidHeader = !isTransparent;

  const closeMobileMenu = () => setMobileOpen(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setScrolled(window.scrollY > 20);
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
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        showSolidHeader
          ? "border-b border-border bg-card/95 shadow-[0_8px_30px_-12px_rgba(24,119,242,0.08)] backdrop-blur-md"
          : "border-b border-transparent bg-transparent shadow-none"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-6 lg:h-[4.25rem]">
        <Logo className="shrink-0" showTagline="lg" />

        {/* Desktop: centered nav links */}
        <nav
          aria-label="Main navigation"
          className="hidden flex-1 items-center justify-center gap-1 xl:gap-2 lg:flex"
        >
          {publicNav.map((item) => (
            <NavLink key={item.title} item={item} pathname={pathname} transparent={isTransparent} />
          ))}
        </nav>

        {/* Desktop (lg+): Sign in + Get started */}
        <div className="hidden shrink-0 lg:block">
          <DesktopAuthButtons transparent={isTransparent} />
        </div>

        {/* Mobile: logo + menu toggle only */}
        <button
          type="button"
          className={cn(
            "ml-auto inline-flex h-10 w-10 items-center justify-center rounded-xl text-foreground transition-colors lg:hidden",
            isTransparent ? "hover:bg-foreground/5" : "border border-border bg-card hover:bg-muted"
          )}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
        </button>
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
                className="mx-auto w-full max-w-7xl flex-1 space-y-1 overflow-y-auto p-4"
              >
                {publicNav.map((item) => (
                  <NavLink
                    key={item.title}
                    item={item}
                    pathname={pathname}
                    variant="mobile"
                    onNavigate={closeMobileMenu}
                  />
                ))}
              </nav>

              <div className="sticky bottom-0 border-t border-border bg-gradient-to-t from-card via-card to-card/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-12px_32px_-20px_rgba(15,23,42,0.12)]">
                <MobileDrawerAuthButtons onNavigate={closeMobileMenu} />
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
