"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
} from "lucide-react";
import { siteConfig } from "@/config";
import { ROUTES } from "@/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { contactService } from "@/services/contact.service";
import { cn } from "@/utils";
import { contactPageContent } from "./data/contact.data";
import { PublicPageHero } from "./public-page-hero";

type FormState = {
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
};

const initialForm: FormState = {
  name: "",
  email: "",
  phone: "",
  topic: contactPageContent.topics[0] ?? "",
  message: "",
};

export function ContactPage() {
  const prefersReducedMotion = useReducedMotion();
  const content = contactPageContent;
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fadeIn = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.5 },
      };

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const name = form.name.trim();
    const message = form.message.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();

    if (!name) {
      setError("Please enter your name.");
      return;
    }
    if (!message) {
      setError("Please enter your message.");
      return;
    }
    if (!email && !phone) {
      setError("Please provide an email or phone number so we can reply.");
      return;
    }

    setSubmitting(true);
    try {
      const topicLine = form.topic ? `[${form.topic}] ` : "";
      await contactService.submit({
        name,
        email: email || undefined,
        phone: phone || undefined,
        message: `${topicLine}${message}`,
      });
      setSuccess(true);
      setForm(initialForm);
    } catch {
      setError("Unable to send your message right now. Please try again or call our helpline.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PublicPageHero
        breadcrumb="Contact"
        eyebrow={content.hero.eyebrow}
        titleLead={content.hero.titleLead}
        titleHighlight={content.hero.titleHighlight}
        description={content.hero.description}
      />

      {/* Contact cards strip */}
      <section className="bg-[#f7f9fc] py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {content.cards.map((card, index) => (
              <motion.a
                key={card.id}
                href={card.href}
                {...fadeIn}
                transition={{ duration: 0.45, delay: index * 0.06 }}
                className="group rounded-2xl border border-[#e8edf5] bg-white p-6 shadow-[0_8px_30px_-16px_rgba(26,43,94,0.12)] transition hover:-translate-y-0.5 hover:border-[#dce4f0] hover:shadow-[0_16px_40px_-20px_rgba(26,43,94,0.18)]"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-[#58688b]">{card.title}</p>
                <p className="mt-2 text-lg font-bold text-[#1a2b5e] transition group-hover:text-[#1877f2]">{card.value}</p>
                <p className="mt-1 text-sm text-[#8b95a8]">{card.hint}</p>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Form + info */}
      <section className="bg-white py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12 xl:gap-16">
            {/* Form */}
            <motion.div {...fadeIn}>
              <h2 className="text-2xl font-extrabold text-[#1a2b5e] sm:text-3xl">{content.form.title}</h2>
              <p className="mt-3 text-sm text-[#58688b] sm:text-base">{content.form.subtitle}</p>

              {success ? (
                <div className="mt-8 rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] p-8 text-center">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-[#22c55e]" aria-hidden />
                  <h3 className="mt-4 text-xl font-bold text-[#1a2b5e]">{content.form.successTitle}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#58688b] sm:text-base">{content.form.successBody}</p>
                  <Button variant="secondary" size="pill" className="mt-6" onClick={() => setSuccess(false)}>
                    Send another message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="contact-name" className="mb-1.5 block text-sm font-semibold text-[#1a2b5e]">
                        Full name <span className="text-[#ef3239]">*</span>
                      </label>
                      <Input
                        id="contact-name"
                        value={form.name}
                        onChange={(event) => updateField("name", event.target.value)}
                        placeholder="Your name"
                        autoComplete="name"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-phone" className="mb-1.5 block text-sm font-semibold text-[#1a2b5e]">
                        Phone number
                      </label>
                      <Input
                        id="contact-phone"
                        type="tel"
                        value={form.phone}
                        onChange={(event) => updateField("phone", event.target.value)}
                        placeholder="01XXXXXXXXX"
                        autoComplete="tel"
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="contact-email" className="mb-1.5 block text-sm font-semibold text-[#1a2b5e]">
                        Email address
                      </label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={form.email}
                        onChange={(event) => updateField("email", event.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-topic" className="mb-1.5 block text-sm font-semibold text-[#1a2b5e]">
                        Topic
                      </label>
                      <select
                        id="contact-topic"
                        value={form.topic}
                        onChange={(event) => updateField("topic", event.target.value)}
                        className="flex h-10 w-full rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                      >
                        {content.topics.map((topic) => (
                          <option key={topic} value={topic}>
                            {topic}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="mb-1.5 block text-sm font-semibold text-[#1a2b5e]">
                      Message <span className="text-[#ef3239]">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      value={form.message}
                      onChange={(event) => updateField("message", event.target.value)}
                      placeholder="Tell us how we can help..."
                      rows={6}
                      required
                      className="flex w-full resize-y rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
                    />
                  </div>

                  {error ? (
                    <p className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
                      {error}
                    </p>
                  ) : null}

                  <Button type="submit" variant="default" size="pillLg" disabled={submitting} className="min-w-[10rem]">
                    {submitting ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Sending...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <Send className="h-4 w-4" aria-hidden />
                        Send Message
                      </span>
                    )}
                  </Button>
                </form>
              )}
            </motion.div>

            {/* Info panel */}
            <motion.aside {...fadeIn} transition={{ duration: 0.5, delay: 0.08 }}>
              <div className="rounded-2xl border border-[#e8edf5] bg-gradient-to-br from-[#f8faff] to-white p-7 shadow-[0_12px_40px_-20px_rgba(26,43,94,0.15)] sm:p-8">
                <h3 className="text-xl font-extrabold text-[#1a2b5e]">Get in touch</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#58688b]">
                  Our support team typically responds within 24 hours on business days. For urgent account or payment
                  issues, calling is the fastest option.
                </p>

                <ul className="mt-8 space-y-5">
                  <li className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1877f2]/10 text-[#1877f2]">
                      <Phone className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#1a2b5e]">Helpline</p>
                      <a href={`tel:${content.info.phone}`} className="mt-0.5 text-sm text-[#1877f2] hover:underline">
                        {content.info.phone}
                      </a>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ef3239]/10 text-[#ef3239]">
                      <Mail className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#1a2b5e]">Email</p>
                      <a href={`mailto:${content.info.email}`} className="mt-0.5 text-sm text-[#1877f2] hover:underline">
                        {content.info.email}
                      </a>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#22c55e]/10 text-[#22c55e]">
                      <Clock className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#1a2b5e]">Support hours</p>
                      <p className="mt-0.5 text-sm text-[#58688b]">{content.info.hours}</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f97316]/10 text-[#f97316]">
                      <MapPin className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#1a2b5e]">Location</p>
                      <p className="mt-0.5 text-sm text-[#58688b]">{content.info.address}</p>
                      <p className="text-xs text-[#8b95a8]">{content.info.addressNote}</p>
                    </div>
                  </li>
                </ul>

                <div className="mt-8 border-t border-[#eef2f8] pt-6">
                  <p className="text-sm font-semibold text-[#1a2b5e]">Follow {siteConfig.name}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {content.social.map((item) => (
                      <a
                        key={item.id}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "rounded-full border border-[#e8edf5] bg-white px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-md"
                        )}
                        style={{ color: item.color }}
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                </div>

                <div className="mt-8 rounded-xl bg-[#0b1f4d] p-5 text-white">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-[#5ba3ff]" aria-hidden />
                    <div>
                      <p className="text-sm font-semibold">Looking for quick answers?</p>
                      <p className="mt-1 text-sm text-white/75">Browse our Help Center for instant FAQ answers.</p>
                      <Link
                        href={ROUTES.help}
                        className="mt-3 inline-flex text-sm font-semibold text-[#5ba3ff] hover:underline"
                      >
                        Visit Help Center →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        </div>
      </section>
    </>
  );
}
