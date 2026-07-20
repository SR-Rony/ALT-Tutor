import { siteConfig } from "@/config";

export const contactPageContent = {
  meta: {
    title: "Contact Us",
    description:
      "Reach the Alt Tutor team for enrollment help, technical support, partnerships, and general inquiries.",
  },
  hero: {
    eyebrow: "Contact Us",
    titleLead: "We'd love to",
    titleHighlight: "hear from you",
    description:
      "Questions about courses, payments, or your account? Send us a message and our team will get back to you as soon as possible.",
  },
  info: {
    phone: siteConfig.phone,
    email: "support@alttutor.com",
    hours: "Saturday – Thursday, 9:00 AM – 10:00 PM",
    address: "Dhaka, Bangladesh",
    addressNote: "Online-first platform — visit by appointment only",
  },
  topics: [
    "Course enrollment",
    "Payment & billing",
    "Account & login",
    "Exam & results",
    "Technical issue",
    "Partnership inquiry",
    "Other",
  ],
  social: [
    { id: "facebook", label: "Facebook", href: "https://facebook.com", color: "#1877f2" },
    { id: "youtube", label: "YouTube", href: "https://youtube.com", color: "#ef3239" },
  ],
  form: {
    title: "Send us a message",
    subtitle: "Fill in the form below and we'll respond within one business day.",
    successTitle: "Message sent!",
    successBody: "Thank you for reaching out. Our support team has received your message and will reply soon.",
  },
  cards: [
    {
      id: "phone",
      title: "Call us",
      value: siteConfig.phone,
      hint: "Available 9 AM – 10 PM",
      href: `tel:${siteConfig.phone}`,
    },
    {
      id: "email",
      title: "Email",
      value: "support@alttutor.com",
      hint: "We reply within 24 hours",
      href: "mailto:support@alttutor.com",
    },
    {
      id: "help",
      title: "Help Center",
      value: "Browse FAQs",
      hint: "Instant answers to common questions",
      href: "/help",
    },
  ],
} as const;
