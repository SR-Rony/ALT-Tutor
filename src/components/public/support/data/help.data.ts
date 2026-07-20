import { helpSection } from "@/components/public/home/data/home.data";

export const helpPageContent = {
  meta: {
    title: "Help Center",
    description:
      "Get answers about Alt Tutor courses, enrollment, payments, exams, and account support — fast and easy.",
  },
  hero: {
    eyebrow: "Help Center",
    titleLead: "How can we",
    titleHighlight: "help you today?",
    description:
      "Browse common questions, explore quick guides, or reach our support team — we're here every step of your learning journey.",
  },
  quickLinks: [
    {
      id: "courses",
      title: "Courses & Enrollment",
      description: "Browse courses, free previews, and how to enroll.",
      href: "/courses",
      color: "#1877f2",
    },
    {
      id: "account",
      title: "Account & Login",
      description: "Sign up, reset access, and manage your profile.",
      href: "/help#faq-account",
      color: "#ef3239",
    },
    {
      id: "payments",
      title: "Payments & Billing",
      description: "Checkout, receipts, refunds, and payment issues.",
      href: "/help#faq-payments",
      color: "#22c55e",
    },
    {
      id: "exams",
      title: "Exams & Practice",
      description: "MCQ exams, questionbanks, and result access.",
      href: "/help#faq-exams",
      color: "#f97316",
    },
  ],
  faqCategories: [
    {
      id: "getting-started",
      title: "Getting Started",
      items: [
        {
          id: "gs-1",
          question: "What is Alt Tutor?",
          answer:
            "Alt Tutor is a digital learning platform for SSC, HSC, and admission preparation in Bangladesh. You get expert-led courses, animated video lessons, questionbanks, and practice exams — all in one place.",
        },
        {
          id: "gs-2",
          question: "How do I create an account?",
          answer:
            "Click Sign Up from the top navigation, enter your name and phone number, verify with OTP, and you're ready. You can browse free previews immediately and enroll in paid courses when you're ready.",
        },
        {
          id: "gs-3",
          question: "Can I try before I buy?",
          answer:
            "Yes. Many courses include free preview lessons on the course detail page. Watch sample videos and review the curriculum before enrolling — no payment required for previews.",
        },
      ],
    },
    {
      id: "account",
      title: "Account & Login",
      items: [
        {
          id: "ac-1",
          question: "I forgot my login details. What should I do?",
          answer:
            "Use the login page and sign in with your registered phone number. If you're locked out, call our helpline at 16780 (9 AM – 10 PM) or submit the contact form with your registered phone — we'll verify and restore access.",
        },
        {
          id: "ac-2",
          question: "Can I use Alt Tutor on my phone?",
          answer:
            "Absolutely. Alt Tutor works on any modern smartphone, tablet, or computer through your browser. Log in once and continue learning from any device.",
        },
        {
          id: "ac-3",
          question: "How do I update my profile?",
          answer:
            "Go to Dashboard → Profile to update your name and contact details. Keep your phone number current so you don't miss important course and exam notifications.",
        },
      ],
    },
    {
      id: "payments",
      title: "Payments & Billing",
      items: [
        {
          id: "py-1",
          question: "What payment methods are accepted?",
          answer:
            "We support secure online payment through our checkout gateway — including mobile banking and card options where available. You'll see all supported methods on the payment page before confirming.",
        },
        {
          id: "py-2",
          question: "When do I get access after payment?",
          answer:
            "Access is granted instantly once payment is confirmed. You'll be redirected to your course dashboard and can start learning immediately — no manual approval needed.",
        },
        {
          id: "py-3",
          question: "What is your refund policy?",
          answer:
            "If you experience a technical issue that prevents access, contact us within 7 days of purchase with your payment receipt. Our team reviews each case individually and processes eligible refunds according to platform policy.",
        },
      ],
    },
    {
      id: "exams",
      title: "Exams & Practice",
      items: [
        {
          id: "ex-1",
          question: "How do MCQ exams work?",
          answer:
            "When an exam is scheduled and published, enrolled students see it in their dashboard. Start the attempt, answer questions within the time limit, and submit — your result is saved automatically. You can review answers when your teacher releases them.",
        },
        {
          id: "ex-2",
          question: "What is the Questionbank?",
          answer:
            "The Questionbank is a topic-wise practice library with thousands of questions, mark schemes, and solutions. Enrolled students can filter by topic, difficulty, and subject to build targeted revision sessions.",
        },
        {
          id: "ex-3",
          question: "Why can't I see my exam result?",
          answer:
            "Results may be held until your teacher or admin releases them. Check the assessment status in your dashboard. If the release date has passed and you still can't view results, contact support with your course and exam name.",
        },
      ],
    },
    {
      id: "technical",
      title: "Technical Support",
      items: [
        {
          id: "tc-1",
          question: "Videos won't play. How do I fix this?",
          answer:
            "Refresh the page, check your internet connection, and try a different browser (Chrome recommended). Make sure you're logged in — protected lessons require an active session. If the issue persists, note the lesson name and contact us.",
        },
        {
          id: "tc-2",
          question: "PDF lessons download instead of opening.",
          answer:
            "Use the in-platform PDF viewer by clicking the lesson from your course page. Avoid opening PDF links in a new tab outside the player. Clear your browser cache if previews still behave unexpectedly.",
        },
        {
          id: "tc-3",
          question: "The site looks broken on my device.",
          answer:
            "Update your browser to the latest version and disable aggressive ad-blockers on alttutor.com. If layout issues continue, send us a screenshot via the contact form with your device and browser name.",
        },
      ],
    },
  ],
  support: helpSection,
  cta: {
    title: "Still need help?",
    description: "Our support team is available 9 AM – 10 PM, seven days a week. Call us or send a message — we typically respond within 24 hours.",
    callLabel: "Call Helpline",
    contactLabel: "Send a Message",
  },
} as const;
