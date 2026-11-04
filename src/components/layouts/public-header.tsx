"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, Phone, X } from "lucide-react";
import { siteConfig } from "@/config";
import { ROUTES } from "@/constants";
import { Logo } from "@/components/shared";
import { PublicAuthActions } from "@/components/layouts/public-auth-actions";
import { cn } from "@/utils";

const NAV_LINKS = [
  { title: "Home", href: ROUTES.home },
  { title: "Question Bank", href: `${ROUTES.home}#question-bank` },
  { title: "Past Papers", href: `${ROUTES.home}#past-papers` },
  { title: "Practice Exams", href: `${ROUTES.home}#practice-exams` },
  { title: "Key Concepts", href: `${ROUTES.home}#key-concepts` },
  { title: "Courses", href: ROUTES.courses },
] as const;

function isLinkActive(pathname: string, href: string): boolean {
  if (href === ROUTES.home) {
    return pathname === ROUTES.home;
  }
  if (href.startsWith("/#")) {
    return false;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function PublicHeaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? "";
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
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-[4.5rem]">
        {/* Left: Brand Logo (clean white/transparent background) */}
        <div className="flex h-full shrink-0 items-center">
          <Logo className="shrink-0 bg-transparent" />
        </div>

        {/* Center: Primary Navigation Links */}
        <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex xl:gap-2">
          {NAV_LINKS.map((item) => {
            const active = isLinkActive(pathname, item.href);
            return (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "relative px-3 py-2 text-sm font-medium transition-colors duration-200",
                  active
                    ? "font-semibold text-[#1D4ED8]"
                    : "text-slate-600 hover:text-[#1D4ED8]"
                )}
              >
                <span>{item.title}</span>
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-3 -bottom-1 h-0.5 rounded-full bg-[#1D4ED8]"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right side: Phone number, Log in, Get Started */}
        <div className="flex shrink-0 items-center gap-3 sm:gap-5">
          <a
            href={`tel:${siteConfig.phone}`}
            className="hidden items-center gap-2 text-sm font-semibold text-slate-700 transition-colors hover:text-[#1D4ED8] md:inline-flex"
            aria-label={`Call support at ${siteConfig.phone}`}
          >
            <Phone className="h-4 w-4 text-[#1D4ED8]" aria-hidden />
            <span>{siteConfig.phone}</span>
          </a>

          <PublicAuthActions />

          {/* Mobile hamburger toggle */}
          <button
            type="button"
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Close menu overlay"
              className="fixed inset-0 top-16 z-40 bg-slate-900/20 lg:hidden"
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={closeMobileMenu}
            />

            <motion.div
              id="mobile-navigation"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              className="fixed inset-x-0 top-16 z-50 flex max-h-[calc(100dvh-4rem)] flex-col border-b border-slate-200 bg-white shadow-xl lg:hidden"
              initial={prefersReducedMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <nav aria-label="Mobile navigation" className="mx-auto w-full max-w-7xl space-y-1 p-4">
                {NAV_LINKS.map((item) => {
                  const active = isLinkActive(pathname, item.href);
                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      onClick={closeMobileMenu}
                      className={cn(
                        "flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-colors duration-200",
                        active
                          ? "bg-blue-50 text-[#1D4ED8]"
                          : "text-slate-700 hover:bg-slate-50 hover:text-[#1D4ED8]"
                      )}
                    >
                      {item.title}
                    </Link>
                  );
                })}
              </nav>

              <div className="space-y-3 border-t border-slate-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <a
                  href={`tel:${siteConfig.phone}`}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:text-[#1D4ED8]"
                >
                  <Phone className="h-4 w-4 text-[#1D4ED8]" aria-hidden />
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
        <header className="sticky top-0 z-50 h-16 border-b border-slate-200 bg-white lg:h-[4.5rem]" />
      }
    >
      <PublicHeaderInner />
    </Suspense>
  );
}
