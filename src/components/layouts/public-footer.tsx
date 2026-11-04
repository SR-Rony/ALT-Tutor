import Link from "next/link";
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  Youtube,
} from "lucide-react";
import { Logo } from "@/components/shared";
import { ROUTES } from "@/constants";

const SOCIAL_LINKS = [
  {
    label: "Facebook",
    href: "https://facebook.com",
    icon: Facebook,
  },
  {
    label: "YouTube",
    href: "https://youtube.com",
    icon: Youtube,
  },
  {
    label: "Instagram",
    href: "https://instagram.com",
    icon: Instagram,
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com",
    icon: Linkedin,
  },
] as const;

const QUICK_LINKS = [
  { label: "Home", href: ROUTES.home },
  { label: "Question Bank", href: `${ROUTES.home}#question-bank` },
  { label: "Past Papers", href: `${ROUTES.home}#past-papers` },
  { label: "Practice Exams", href: `${ROUTES.home}#practice-exams` },
  { label: "Key Concepts", href: `${ROUTES.home}#key-concepts` },
] as const;

const SUPPORT_LINKS = [
  { label: "Contact Us", href: ROUTES.contact },
  { label: "Help Center", href: ROUTES.help },
  { label: "System Requirements", href: `${ROUTES.help}#requirements` },
] as const;

export function PublicFooter() {
  return (
    <footer className="w-full border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 sm:pt-20">
        {/* 4-Column Grid on desktop, 2-column on tablet, stacked on mobile */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8 pb-12 sm:pb-16">
          
          {/* Column 1: Brand */}
          <div className="space-y-4">
            <Logo href={ROUTES.home} />
            <p className="text-sm leading-relaxed text-slate-500 max-w-xs">
              Bangladesh&apos;s Trusted Digital School
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-2 pt-2">
              {SOCIAL_LINKS.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={item.label}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-[#1D4ED8] hover:bg-blue-50 hover:text-[#1D4ED8]"
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 transition-colors hover:text-[#1D4ED8]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Support */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Support
            </h3>
            <ul className="mt-4 space-y-2.5">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 transition-colors hover:text-[#1D4ED8]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact Info */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Contact Info
            </h3>
            <ul className="mt-4 space-y-3.5 text-sm text-slate-600">
              {/* Phone */}
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1D4ED8]">
                  <Phone className="h-3.5 w-3.5" aria-hidden />
                </span>
                <div>
                  <a
                    href="tel:16780"
                    className="font-semibold text-slate-900 transition-colors hover:text-[#1D4ED8]"
                  >
                    16780
                  </a>
                  <p className="text-xs text-slate-500">9:00 AM - 10:00 PM</p>
                </div>
              </li>

              {/* Email */}
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1D4ED8]">
                  <Mail className="h-3.5 w-3.5" aria-hidden />
                </span>
                <div>
                  <a
                    href="mailto:support@alttutor.org"
                    className="font-medium text-slate-700 transition-colors hover:text-[#1D4ED8]"
                  >
                    support@alttutor.org
                  </a>
                </div>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 py-6 sm:flex-row text-sm text-slate-500">
          <p>© 2025 Alt Tutor. All rights reserved.</p>

          <div className="flex items-center gap-4 text-xs sm:text-sm">
            <Link
              href={ROUTES.help}
              className="transition-colors hover:text-[#1D4ED8]"
            >
              Privacy Policy
            </Link>
            <span className="text-slate-300">|</span>
            <Link
              href={ROUTES.help}
              className="transition-colors hover:text-[#1D4ED8]"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
