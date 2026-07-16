import { cn } from "@/utils";

type Props = {
  count?: number;
  columns?: "2" | "3" | "4";
  className?: string;
};

export function ResourceGridSkeleton({ count = 4, columns = "4", className }: Props) {
  const gridClass =
    columns === "2"
      ? "sm:grid-cols-2"
      : columns === "3"
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : "sm:grid-cols-2 xl:grid-cols-4";

  return (
    <div
      className={cn("grid gap-4", gridClass, className)}
      role="status"
      aria-live="polite"
      aria-label="Loading content"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="mb-4 h-32 rounded-xl bg-primary-muted/70" />
          <div className="mb-2 h-4 w-3/4 rounded bg-muted" />
          <div className="h-3 w-1/2 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
