"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Home } from "lucide-react";
import { ROUTES } from "@/constants";
import { cn } from "@/utils";

export type BreadcrumbItem = {
  label: string;
  href?: string;
  /** Dropdown alternatives at this level */
  menu?: { label: string; href: string }[];
};

type Props = {
  items: BreadcrumbItem[];
  className?: string;
};

export function SubjectBreadcrumbNav({ items, className }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openIndex === null) return;
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenIndex(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openIndex]);

  return (
    <nav
      ref={containerRef}
      aria-label="Breadcrumb"
      className={cn(
        "inline-flex flex-wrap items-center gap-1 rounded-full border border-border/80 bg-card/90 px-2 py-1.5 shadow-sm backdrop-blur-sm",
        className
      )}
    >
      <Link
        href={ROUTES.home}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-primary-muted hover:text-primary"
        aria-label="Home"
      >
        <Home className="h-4 w-4" />
      </Link>

      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="relative flex items-center">
          <span className="mx-0.5 text-border" aria-hidden>
            ›
          </span>
          {item.menu && item.menu.length > 0 ? (
            <>
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition",
                  openIndex === index
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-primary-muted hover:text-primary"
                )}
                aria-expanded={openIndex === index}
              >
                <span className="max-w-[10rem] truncate sm:max-w-none">{item.label}</span>
                <ChevronDown
                  className={cn("h-3.5 w-3.5 shrink-0 transition", openIndex === index && "rotate-180")}
                />
              </button>
              {openIndex === index ? (
                <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[12rem] rounded-xl border border-border bg-card py-1 shadow-[0_16px_40px_-12px_rgba(24,119,242,0.35)]">
                  {item.menu.map((opt) => (
                    <Link
                      key={opt.href}
                      href={opt.href}
                      className="block px-3 py-2 text-sm text-foreground hover:bg-primary-muted hover:text-primary"
                      onClick={() => setOpenIndex(null)}
                    >
                      {opt.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </>
          ) : item.href ? (
            <Link
              href={item.href}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-primary-muted hover:text-primary"
            >
              {item.label}
            </Link>
          ) : (
            <span className="rounded-full bg-primary-muted px-3 py-1.5 text-sm font-semibold text-primary">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
