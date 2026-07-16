import type { ReactNode } from "react";
import { cn } from "@/utils";

type Props = {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: ReactNode;
  breadcrumbs?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
};

/** PDF-style light blue hero block — uses Alt Tutor brand tokens */
export function ResourceHero({
  title,
  subtitle,
  description,
  icon,
  breadcrumbs,
  footer,
  children,
  className,
}: Props) {
  return (
    <header
      className={cn(
        "border-b border-primary/10 bg-gradient-to-br from-primary-muted via-primary-muted/90 to-background",
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        {breadcrumbs ? <div className="mb-5">{breadcrumbs}</div> : null}

        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            {subtitle ? (
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">{subtitle}</p>
            ) : null}
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl lg:text-[2rem] lg:leading-tight">
              {title}
            </h1>
            {description ? (
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
                {description}
              </p>
            ) : null}
            {children ? <div className="mt-5 flex flex-wrap gap-3">{children}</div> : null}
          </div>
          {icon ? (
            <div className="flex shrink-0 flex-col gap-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/15 bg-card shadow-[0_8px_24px_-12px_rgba(24,119,242,0.35)]">
                {icon}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {footer ? (
        <div className="border-t border-primary/10 bg-primary-muted/50">{footer}</div>
      ) : null}
    </header>
  );
}
