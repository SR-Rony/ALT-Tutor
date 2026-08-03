import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config";
import { cn } from "@/utils";

interface LogoProps {
  className?: string;
  /** Show tagline always, or only from the `lg` breakpoint upward */
  showTagline?: boolean | "lg";
  compact?: boolean;
  /** Icon-only mark (sidebar collapsed) */
  iconOnly?: boolean;
  href?: string;
}

export function Logo({
  className,
  showTagline = false,
  compact = false,
  iconOnly = false,
  href = "/",
}: LogoProps) {
  const taglineClassName =
    showTagline === "lg"
      ? "hidden lg:block"
      : showTagline
        ? "block"
        : "hidden";

  const image = iconOnly ? (
    <Image
      src={siteConfig.logoIcon}
      alt={siteConfig.name}
      width={40}
      height={40}
      priority
      className="h-9 w-9 object-contain"
    />
  ) : (
    <Image
      src={siteConfig.logo}
      alt={siteConfig.name}
      width={419}
      height={143}
      priority
      className={cn(
        "h-9 w-auto max-w-[9.5rem] object-contain object-left sm:h-10 sm:max-w-[11rem]",
        compact && "h-8 max-w-[9rem] sm:h-9"
      )}
    />
  );

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2.5 transition-opacity hover:opacity-90",
        className
      )}
      aria-label={`${siteConfig.name} home`}
    >
      {image}
      {showTagline && !iconOnly ? (
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
