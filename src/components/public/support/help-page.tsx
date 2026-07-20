"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  ChevronDown,
  CreditCard,
  GraduationCap,
  MessageCircle,
  Phone,
  Search,
  UserCircle,
} from "lucide-react";
import { siteConfig } from "@/config";
import { ROUTES } from "@/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils";
import { helpPageContent } from "./data/help.data";
import { PublicPageHero } from "./public-page-hero";

const quickLinkIcons = {
  courses: GraduationCap,
  account: UserCircle,
  payments: CreditCard,
  exams: BookOpen,
} as const;

function FaqItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e8edf5] bg-white">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-start justify-between gap-4 px-5 py-4 text-left transition hover:bg-[#f8faff] sm:px-6 sm:py-5"
      >
        <span className="text-sm font-semibold text-[#1a2b5e] sm:text-base">{question}</span>
        <ChevronDown
          className={cn("mt-0.5 h-5 w-5 shrink-0 text-[#58688b] transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="border-t border-[#eef2f8] px-5 pb-4 pt-3 sm:px-6 sm:pb-5">
          <p className="text-sm leading-relaxed text-[#58688b] sm:text-[0.95rem]">{answer}</p>
        </div>
      ) : null}
    </div>
  );
}

export function HelpPage() {
  const prefersReducedMotion = useReducedMotion();
  const content = helpPageContent;
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(content.faqCategories[0]?.items[0]?.id ?? null);

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return content.faqCategories;

    return content.faqCategories
      .map((category) => ({
        ...category,
        items: category.items.filter(
          (item) => item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)
        ),
      }))
      .filter((category) => category.items.length > 0);
  }, [content.faqCategories, query]);

  const fadeIn = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.5 },
      };

  return (
    <>
      <PublicPageHero
        breadcrumb="Help"
        eyebrow={content.hero.eyebrow}
        titleLead={content.hero.titleLead}
        titleHighlight={content.hero.titleHighlight}
        description={content.hero.description}
      >
        <div className="relative mx-auto max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#58688b]" aria-hidden />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search help articles..."
            className="h-12 rounded-full border-white/20 bg-white/95 pl-11 pr-4 text-[#1a2b5e] shadow-lg placeholder:text-[#8b95a8] focus:border-[#1877f2] focus:ring-[#1877f2]/20"
          />
        </div>
      </PublicPageHero>

      {/* Quick links */}
      <section className="bg-[#f7f9fc] py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div {...fadeIn} className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-[#1a2b5e] sm:text-3xl">Quick help topics</h2>
            <p className="mt-3 text-sm text-[#58688b] sm:text-base">Jump straight to the area you need help with.</p>
          </motion.div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {content.quickLinks.map((link, index) => {
              const Icon = quickLinkIcons[link.id as keyof typeof quickLinkIcons] ?? BookOpen;
              return (
                <motion.div key={link.id} {...fadeIn} transition={{ duration: 0.45, delay: index * 0.05 }}>
                  <Link
                    href={link.href}
                    className="group flex h-full flex-col rounded-2xl border border-[#e8edf5] bg-white p-6 shadow-[0_8px_30px_-16px_rgba(26,43,94,0.12)] transition hover:-translate-y-0.5 hover:border-[#dce4f0] hover:shadow-[0_16px_40px_-20px_rgba(26,43,94,0.18)]"
                  >
                    <span
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#f8faff]"
                      style={{ color: link.color }}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <h3 className="mt-4 text-base font-bold text-[#1a2b5e] sm:text-lg">{link.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-[#58688b]">{link.description}</p>
                    <span className="mt-4 text-sm font-semibold text-[#1877f2] transition group-hover:text-[#ef3239]">
                      Learn more →
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div {...fadeIn} className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-[#1a2b5e] sm:text-3xl lg:text-4xl">
              Frequently asked questions
            </h2>
            <p className="mt-4 text-sm text-[#58688b] sm:text-base">
              {query.trim()
                ? `Showing results for “${query.trim()}”`
                : "Everything you need to know about using Alt Tutor."}
            </p>
          </motion.div>

          <div className="mx-auto mt-10 max-w-3xl space-y-10">
            {filteredCategories.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#dce4f0] bg-[#f8faff] px-6 py-12 text-center">
                <p className="text-sm font-medium text-[#58688b]">No articles match your search.</p>
                <Button variant="secondary" size="sm" className="mt-4" onClick={() => setQuery("")}>
                  Clear search
                </Button>
              </div>
            ) : (
              filteredCategories.map((category) => (
                <motion.div key={category.id} {...fadeIn} id={`faq-${category.id}`} className="scroll-mt-28">
                  <h3 className="mb-4 text-lg font-bold text-[#1a2b5e] sm:text-xl">{category.title}</h3>
                  <div className="space-y-3">
                    {category.items.map((item) => (
                      <FaqItem
                        key={item.id}
                        question={item.question}
                        answer={item.answer}
                        open={openId === item.id}
                        onToggle={() => setOpenId((current) => (current === item.id ? null : item.id))}
                      />
                    ))}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Support CTA */}
      <section className="relative overflow-x-clip bg-[#0c4558] py-14 sm:py-16 lg:py-20">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#2dd4bf]/15 blur-3xl" />
          <div className="absolute -right-16 bottom-6 h-72 w-72 rounded-full bg-[#f59e0b]/12 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
            <motion.div {...fadeIn}>
              <h2 className="text-2xl font-extrabold text-white sm:text-3xl">{content.cta.title}</h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">{content.cta.description}</p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="default" size="pillLg">
                  <a href={`tel:${siteConfig.phone}`}>
                    <span className="inline-flex items-center gap-2">
                      <Phone className="h-4 w-4" aria-hidden />
                      {content.cta.callLabel} — {siteConfig.phone}
                    </span>
                  </a>
                </Button>
                <Button
                  asChild
                  variant="secondary"
                  size="pillLg"
                  className="border-white/25 bg-white/10 text-white hover:border-white/40 hover:bg-white/15"
                >
                  <Link href={ROUTES.contact}>
                    <span className="inline-flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" aria-hidden />
                      {content.cta.contactLabel}
                    </span>
                  </Link>
                </Button>
              </div>

              <p className="mt-4 text-xs text-white/60">{content.support.call.hours} · {content.support.call.note}</p>
            </motion.div>

            <motion.div {...fadeIn} transition={{ duration: 0.5, delay: 0.08 }} className="relative mx-auto w-full max-w-sm lg:mx-0 lg:ml-auto">
              <div className="overflow-hidden rounded-2xl bg-[#fdf4e3] shadow-[0_20px_50px_-24px_rgba(0,0,0,0.45)]">
                <div className="relative h-56 sm:h-64">
                  <Image
                    src={content.support.call.image}
                    alt={content.support.call.imageAlt}
                    fill
                    sizes="(max-width: 1024px) 80vw, 400px"
                    className="object-contain object-bottom"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
