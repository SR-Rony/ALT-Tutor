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
      src="/logo.png"
      alt={siteConfig.name}
      width={500}
      height={150}
      priority
      className={cn(
        "w-full h-auto max-w-[200px] shrink-0 object-contain transition-transform ml-[-20px]",
        compact && "max-w-[180px]"
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
