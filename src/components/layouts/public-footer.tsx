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
import { siteConfig } from "@/config";
import { ROUTES } from "@/constants";

const footerColumns = [
  {
    title: "Programs",
    links: [
      { label: "All Courses", href: ROUTES.courses },
      { label: "Live Classes", href: ROUTES.courses },
      { label: "Academic Prep", href: ROUTES.courses },
      { label: "Admission", href: ROUTES.auth.register },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: ROUTES.about },
      { label: "Instructors", href: ROUTES.teacher.root },
      { label: "Contact", href: ROUTES.contact },
      { label: "Help Center", href: ROUTES.help },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Log In", href: ROUTES.auth.login },
      { label: "Sign Up", href: ROUTES.auth.register },
      { label: "Student Portal", href: ROUTES.student.root },
      { label: "Teacher Portal", href: ROUTES.teacher.root },
    ],
  },
] as const;

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
        className="group relative inline-flex text-sm text-[#b8c7e0] transition-colors duration-300 hover:text-white"
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

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative w-full overflow-x-clip bg-[#0b1f4d] text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-0 h-56 w-56 rounded-full bg-[#1877f2]/20 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-[#ef3239]/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pt-14 sm:px-6 sm:pt-16 lg:pt-20">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.35fr_repeat(3,minmax(0,1fr))] lg:gap-8 xl:gap-12">
          {/* Brand */}
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
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#b8c7e0]">
              {siteConfig.description}
            </p>

            <div className="mt-6 space-y-3">
              <a
                href={`tel:${siteConfig.phone}`}
                className="group flex items-center gap-2.5 text-sm text-[#b8c7e0] transition-colors duration-300 hover:text-white"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[#ff6b35] transition-colors duration-300 group-hover:bg-gradient-to-br group-hover:from-[#3b8dee] group-hover:via-[#ff6b35] group-hover:to-[#ef3239] group-hover:text-white">
                  <Phone className="h-4 w-4" aria-hidden />
                </span>
                {siteConfig.phone}
              </a>
              <a
                href="mailto:support@alttutor.com"
                className="group flex items-center gap-2.5 text-sm text-[#b8c7e0] transition-colors duration-300 hover:text-white"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[#3b8dee] transition-colors duration-300 group-hover:bg-gradient-to-br group-hover:from-[#3b8dee] group-hover:via-[#ff6b35] group-hover:to-[#ef3239] group-hover:text-white">
                  <Mail className="h-4 w-4" aria-hidden />
                </span>
                support@alttutor.com
              </a>
              <p className="group flex items-start gap-2.5 text-sm text-[#b8c7e0]">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#22c55e]">
                  <MapPin className="h-4 w-4" aria-hidden />
                </span>
                Dhaka, Bangladesh
              </p>
            </div>
          </div>

          {/* Link columns */}
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">{column.title}</h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <FooterLink key={link.label} href={link.href} label={link.label} />
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social + bottom bar */}
        <div className="mt-12 border-t border-white/10 py-6 sm:mt-14 sm:py-7">
          <div className="flex flex-col items-center justify-between gap-5 sm:flex-row">
            <p className="text-center text-xs text-[#8fa0c0] sm:text-left sm:text-sm">
              © {year} {siteConfig.name}. All rights reserved.
            </p>

            <div className="flex items-center gap-2.5">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="group inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[#b8c7e0] transition-all duration-300 hover:-translate-y-0.5 hover:border-transparent hover:bg-gradient-to-br hover:from-[#3b8dee] hover:via-[#ff6b35] hover:to-[#ef3239] hover:text-white hover:shadow-[0_10px_24px_-10px_rgba(239,50,57,0.55)]"
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
