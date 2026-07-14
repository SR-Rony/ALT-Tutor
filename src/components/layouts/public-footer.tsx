"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { publicFooterCompanyLinks, publicFooterProgramLinks, siteConfig } from "@/config";
import { roleHomeRoutes, ROUTES } from "@/constants";
import { useAuthSessionReady } from "@/providers/auth-session-provider";
import { useAppSelector } from "@/store";

const programLinks = publicFooterProgramLinks;
const companyLinks = publicFooterCompanyLinks;

const socialLinks: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Facebook", href: "https://facebook.com", icon: Facebook },
  { label: "Instagram", href: "https://instagram.com", icon: Instagram },
  { label: "Twitter", href: "https://twitter.com", icon: Twitter },
  { label: "YouTube", href: "https://youtube.com", icon: Youtube },
  { label: "LinkedIn", href: "https://linkedin.com", icon: Linkedin },
];

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="group relative inline-flex text-sm text-[#58688b] transition-colors duration-300 hover:text-[#ef3239]"
      >
        <span className="relative">
          {label}
          <span
            aria-hidden
            className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-gradient-to-r from-[#3b8dee] via-[#ff6b35] to-[#ef3239] transition-transform duration-300 ease-out group-hover:scale-x-100"
          />
        </span>
      </Link>
    </li>
  );
}

function AccountLinks() {
  const ready = useAuthSessionReady();
  const user = useAppSelector((s) => s.auth.user);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  if (!ready) {
    return (
      <ul className="mt-4 space-y-3">
        <li className="h-4 w-24 animate-pulse rounded bg-muted" />
        <li className="h-4 w-20 animate-pulse rounded bg-muted" />
      </ul>
    );
  }

  if (isAuthenticated && user) {
    return (
      <ul className="mt-4 space-y-3">
        <FooterLink href={roleHomeRoutes[user.role]} label="My Dashboard" />
        <FooterLink
          href={
            user.role === "admin"
              ? ROUTES.admin.settings
              : user.role === "teacher"
                ? ROUTES.teacher.settings
                : ROUTES.student.settings
          }
          label="Settings"
        />
        <FooterLink href={ROUTES.courses} label="Browse Courses" />
      </ul>
    );
  }

  return (
    <ul className="mt-4 space-y-3">
      <FooterLink href={ROUTES.auth.login} label="Log In" />
      <FooterLink href={ROUTES.auth.register} label="Sign Up" />
      <FooterLink href={ROUTES.student.root} label="Student Portal" />
      <FooterLink href={ROUTES.teacher.root} label="Teacher Portal" />
    </ul>
  );
}

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative w-full overflow-x-clip border-t border-[#e8edf5] bg-[linear-gradient(180deg,#ffffff_0%,#f7f9fc_48%,#eef4fb_100%)] text-[#1a2b5e]">
      <div
        aria-hidden
        className="h-1 w-full bg-gradient-to-r from-[#3b8dee] via-[#ff6b35] to-[#ef3239]"
      />

      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-10 h-48 w-48 rounded-full bg-[#1877f2]/8 blur-3xl" />
        <div className="absolute -right-12 bottom-10 h-52 w-52 rounded-full bg-[#ef3239]/7 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pt-14 sm:px-6 sm:pt-16 lg:pt-18">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.35fr_repeat(3,minmax(0,1fr))] lg:gap-8 xl:gap-12">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href={ROUTES.home} className="inline-flex transition-opacity duration-300 hover:opacity-90">
              <Image
                src="/logo.jpeg"
                alt={siteConfig.name}
                width={160}
                height={48}
                className="h-10 w-auto rounded-lg object-contain sm:h-11"
              />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#58688b]">
              {siteConfig.description}
            </p>

            <div className="mt-6 space-y-3">
              <a
                href={`tel:${siteConfig.phone}`}
                className="group flex items-center gap-2.5 text-sm text-[#58688b] transition-colors duration-300 hover:text-[#1a2b5e]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff1ee] text-[#ef3239] transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-[#3b8dee] group-hover:via-[#ff6b35] group-hover:to-[#ef3239] group-hover:text-white">
                  <Phone className="h-4 w-4" aria-hidden />
                </span>
                {siteConfig.phone}
              </a>
              <a
                href="mailto:support@alttutor.com"
                className="group flex items-center gap-2.5 text-sm text-[#58688b] transition-colors duration-300 hover:text-[#1a2b5e]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8f2fe] text-[#1877f2] transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-[#3b8dee] group-hover:via-[#ff6b35] group-hover:to-[#ef3239] group-hover:text-white">
                  <Mail className="h-4 w-4" aria-hidden />
                </span>
                support@alttutor.com
              </a>
              <p className="flex items-start gap-2.5 text-sm text-[#58688b]">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ecfdf5] text-[#22c55e]">
                  <MapPin className="h-4 w-4" aria-hidden />
                </span>
                Dhaka, Bangladesh
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#1a2b5e]">Programs</h3>
            <ul className="mt-4 space-y-3">
              {programLinks.map((link) => (
                <FooterLink key={link.label} href={link.href} label={link.label} />
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#1a2b5e]">Company</h3>
            <ul className="mt-4 space-y-3">
              {companyLinks.map((link) => (
                <FooterLink key={link.label} href={link.href} label={link.label} />
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#1a2b5e]">Account</h3>
            <AccountLinks />
          </div>
        </div>

        <div className="mt-12 border-t border-[#e2e8f4] py-6 sm:mt-14 sm:py-7">
          <div className="flex flex-col items-center justify-between gap-5 sm:flex-row">
            <div className="space-y-1 text-center sm:text-left">
              <p className="text-xs text-[#64748b] sm:text-sm">
                © {year} {siteConfig.name}. All rights reserved.
              </p>
              <p className="text-xs text-[#94a3b8] sm:text-[0.8125rem]">
                Designed & developed by{" "}
                <a
                  href="https://codezyne.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#1a2b5e] transition-colors duration-300 hover:text-[#ef3239]"
                >
                  {siteConfig.company}
                </a>
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="group inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e2e8f4] bg-white text-[#64748b] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-transparent hover:bg-gradient-to-br hover:from-[#3b8dee] hover:via-[#ff6b35] hover:to-[#ef3239] hover:text-white hover:shadow-[0_10px_24px_-10px_rgba(239,50,57,0.45)]"
                >
                  <Icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" aria-hidden />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
