import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config";
import { cn } from "@/utils";

interface AuthPageShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerPrompt: string;
  footerLinkText: string;
  footerHref: string;
  className?: string;
}

export function AuthPageShell({
  title,
  subtitle,
  children,
  footerPrompt,
  footerLinkText,
  footerHref,
  className,
}: AuthPageShellProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-x-clip bg-[#f7f9fc] px-4 py-10 sm:px-6">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#eef4fb_0%,#f7f9fc_45%,#ffffff_100%)]" />
        <div className="absolute -left-20 top-16 h-64 w-64 rounded-full bg-[#1877f2]/10 blur-3xl" />
        <div className="absolute -right-16 bottom-20 h-72 w-72 rounded-full bg-[#ef3239]/10 blur-3xl" />
        <div className="absolute left-[12%] top-[18%] h-12 w-12 rounded-full border-2 border-[#1877f2]/15 bg-white/50" />
        <div className="absolute bottom-[22%] right-[10%] h-16 w-16 rotate-12 rounded-2xl bg-[#fde68a]/40" />
      </div>

      <div className={cn("relative z-10 w-full max-w-[26rem]", className)}>
        <div className="overflow-hidden rounded-[1.75rem] border border-[#e8edf5] bg-white shadow-[0_24px_64px_-24px_rgba(26,43,94,0.18)]">
          <div className="border-b border-[#eef2f7] bg-[linear-gradient(180deg,#fafcff_0%,#ffffff_100%)] px-6 pb-6 pt-8 text-center sm:px-8 sm:pt-10">
            <Link href="/" className="mx-auto inline-flex transition-opacity hover:opacity-90">
              <Image
                src="/logo.jpeg"
                alt={siteConfig.name}
                width={160}
                height={48}
                priority
                className="mx-auto h-10 w-auto object-contain sm:h-11"
              />
            </Link>
            <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-[#1a2b5e] sm:text-[1.65rem]">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
              {subtitle}
            </p>
          </div>

          <div className="px-6 py-7 sm:px-8 sm:py-8">{children}</div>

          <div className="border-t border-[#eef2f7] bg-[#fafcff]/80 px-6 py-5 text-center sm:px-8">
            <p className="text-sm text-muted-foreground">
              {footerPrompt}{" "}
              <Link
                href={footerHref}
                className="font-semibold text-[#1877f2] transition-colors hover:text-[#1466db] hover:underline"
              >
                {footerLinkText}
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
      </div>
    </div>
  );
}
