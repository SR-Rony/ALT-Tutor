import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config";
import { cn } from "@/utils";

interface LogoProps {
  className?: string;
  /** Show tagline always, or only from the `lg` breakpoint upward */
  showTagline?: boolean | "lg";
  compact?: boolean;
}

export function Logo({ className, showTagline = false, compact = false }: LogoProps) {
  const taglineClassName =
    showTagline === "lg"
      ? "hidden lg:block"
      : showTagline
        ? "block"
        : "hidden";

  return (
    <Link href="/" className={cn("group flex items-center gap-2.5 lg:gap-3", className)}>
      <Image
        src="/logo.jpeg"
        alt={siteConfig.name}
        width={160}
        height={48}
        priority
        className={cn(
          "h-9 w-auto shrink-0 rounded-lg object-contain transition-transform group-hover:scale-[1.02] lg:h-11",
          compact && "h-8 lg:h-9"
        )}
      />
      {showTagline ? (
        <span
          className={cn(
            "truncate text-[10px] font-medium text-muted-foreground sm:text-xs lg:text-[13px]",
            taglineClassName
          )}
        >
          {siteConfig.tagline}
        </span>
      ) : null}
    </Link>
  );
}
