import type { QuestionbankData } from "@/types/questionbank.types";

const defaultResources = (courseTitle: string): QuestionbankData["resources"] => [
  {
    id: "qb",
    title: "Questionbank",
    description: `All the questions you need for ${courseTitle}. Sorted by topic and difficulty, with explanations.`,
    hrefKey: "questionbank",
  },
  {
    id: "practice",
    title: "Practice Exams",
    description: "Timed practice papers to simulate real exam conditions and track your progress.",
    hrefKey: "practice",
  },
  {
    id: "concepts",
    title: "Key Concepts",
    description: "Concise summaries of the most important ideas before you dive into questions.",
    hrefKey: "concepts",
  },
  {
    id: "papers",
    title: "Past Papers",
    description: "Work through past paper-style sets with mark schemes and video walkthroughs.",
    hrefKey: "papers",
  },
  {
    id: "flashcards",
    title: "Flashcards",
    description: "Quick recall cards for formulas, definitions, and must-know facts.",
    hrefKey: "flashcards",
  },
];

const bySlug: Record<string, QuestionbankData> = {
  "web-development-basics": {
    courseSlug: "web-development-basics",
    courseTitle: "Web Development Basics",
    categoryName: "Web Development",
    levelLabel: "Beginner",
    description:
      "Practice HTML, CSS, and JavaScript with topic-sorted questions, difficulty levels, and clear explanations for every answer.",
    topics: [
      {
        id: "t1",
        number: 1,
        title: "HTML Foundations",
        subtopics: [
          {
            id: "t1-all",
            title: "Topic 1 All",
            description: "All questions covering HTML structure, semantics, and forms.",
            badge: "free",
          },
          {
            id: "t1-semantic",
            title: "Semantic HTML",
            description: "Landmarks, headings, lists, figures, and accessible structure.",
            badge: "free",
          },
          {
            id: "t1-forms",
            title: "Forms & Inputs",
            description: "Labels, validation attributes, input types, and form layout.",
            badge: "free",
          },
          {
            id: "t1-media",
            title: "Images & Media",
            description: "Responsive images, alt text, video embeds, and best practices.",
            badge: "gold",
          },
        ],
      },
      {
        id: "t2",
        number: 2,
        title: "CSS & Layout",
        subtopics: [
          {
            id: "t2-all",
            title: "Topic 2 All",
            description: "All questions on selectors, box model, flexbox, and grid.",
            badge: "free",
          },
          {
            id: "t2-box",
            title: "Box Model & Selectors",
            description: "Margin, padding, specificity, cascade, and inheritance.",
            badge: "free",
          },
          {
            id: "t2-flex",
            title: "Flexbox",
            description: "Axes, alignment, wrapping, and common layout patterns.",
            badge: "gold",
          },
          {
            id: "t2-grid",
            title: "CSS Grid",
            description: "Tracks, areas, responsive grids, and nested layouts.",
            badge: "gold",
          },
        ],
      },
      {
        id: "t3",
        number: 3,
        title: "JavaScript Basics",
        subtopics: [
          {
            id: "t3-all",
            title: "Topic 3 All",
            description: "All questions on variables, functions, DOM, and events.",
            badge: "free",
          },
          {
            id: "t3-vars",
            title: "Variables & Types",
            description: "let/const, primitives, coercion, and truthy/falsy values.",
            badge: "free",
          },
          {
            id: "t3-dom",
            title: "DOM & Events",
            description: "Selecting nodes, listeners, event bubbling, and updates.",
            badge: "gold",
          },
          {
            id: "t3-async",
            title: "Async JavaScript",
            description: "Callbacks, promises, async/await, and fetch basics.",
            badge: "gold",
          },
        ],
      },
    ],
    resources: defaultResources("Web Development Basics"),
    faqs: [
      {
        id: "f1",
        question: "What is the Web Development Basics Questionbank?",
        answer:
          "A topic-sorted question set for HTML, CSS, and JavaScript with difficulty levels and explanations.",
      },
      {
        id: "f2",
        question: "Where should I start?",
        answer: "Start with Topic 1 All, then move into the specific subtopics you find hardest.",
      },
      {
        id: "f3",
        question: "How should I use the Questionbank?",
        answer: "Study a concept, attempt a short set, review explanations, then retry incorrect items later.",
      },
    ],
  },
  "ux-design-foundations": {
    courseSlug: "ux-design-foundations",
    courseTitle: "Foundations of User Experience (UX) Design",
    categoryName: "UI/UX Design",
    levelLabel: "Beginner",
    description:
      "Drill UX research, IA, wireframing, and usability with questions arranged by topic and difficulty.",
    topics: [
      {
        id: "t1",
        number: 1,
        title: "UX Research",
        subtopics: [
          {
            id: "t1-all",
            title: "Topic 1 All",
            description: "All questions on interviews, surveys, personas, and research plans.",
            badge: "free",
          },
          {
            id: "t1-methods",
            title: "Research Methods",
            description: "When to use interviews, surveys, diary studies, and card sorts.",
            badge: "free",
          },
          {
            id: "t1-personas",
            title: "Personas & Journey Maps",
            description: "Building useful personas and end-to-end journey documentation.",
            badge: "gold",
          },
        ],
      },
      {
        id: "t2",
        number: 2,
        title: "Information Architecture",
        subtopics: [
          {
            id: "t2-all",
            title: "Topic 2 All",
            description: "All questions on structure, navigation, and content hierarchy.",
            badge: "free",
          },
          {
            id: "t2-nav",
            title: "Navigation Patterns",
            description: "Global nav, breadcrumbs, tabs, and mobile navigation choices.",
            badge: "gold",
          },
          {
            id: "t2-wire",
            title: "Wireframes",
            description: "Low-fi vs hi-fi wireframes, annotations, and flow mapping.",
            badge: "gold",
          },
        ],
      },
      {
        id: "t3",
        number: 3,
        title: "Usability & Testing",
        subtopics: [
          {
            id: "t3-all",
            title: "Topic 3 All",
            description: "All questions covering heuristics, usability tests, and iteration.",
            badge: "free",
          },
          {
            id: "t3-heuristics",
            title: "Usability Heuristics",
            description: "Nielsen heuristics, severity ratings, and practical critiques.",
            badge: "free",
          },
          {
            id: "t3-tests",
            title: "Usability Testing",
            description: "Moderated vs unmoderated tests, tasks, and insight synthesis.",
            badge: "gold",
          },
        ],
      },
    ],
    resources: defaultResources("UX Design Foundations"),
    faqs: [
      {
        id: "f1",
        question: "What is the UX Questionbank?",
        answer: "A practice bank covering research, IA, wireframing, and usability testing topics.",
      },
      {
        id: "f2",
        question: "Where should I start in the UX Questionbank?",
        answer: "Begin with UX Research Topic 1 All, then focus on subtopics tied to your weak areas.",
      },
    ],
  },
};

function fallbackForSlug(slug: string, title = "Course"): QuestionbankData {
  return {
    courseSlug: slug,
    courseTitle: title,
    categoryName: "Courses",
    levelLabel: "All levels",
    description:
      "Topic-sorted practice questions with explanations. Pick a topic below to open a study set.",
    topics: [
      {
        id: "t1",
        number: 1,
        title: "Core Concepts",
        subtopics: [
          {
            id: "t1-all",
            title: "Topic 1 All",
            description: "A mixed set of foundational questions for this course.",
            badge: "free",
          },
          {
            id: "t1-a",
            title: "Foundations",
            description: "Essential ideas every learner should lock in early.",
            badge: "free",
          },
          {
            id: "t1-b",
            title: "Applied Practice",
            description: "Scenario-based questions to deepen understanding.",
            badge: "gold",
          },
        ],
      },
      {
        id: "t2",
        number: 2,
        title: "Skills Lab",
        subtopics: [
          {
            id: "t2-all",
            title: "Topic 2 All",
            description: "All skills-focused practice items in one place.",
            badge: "free",
          },
          {
            id: "t2-a",
            title: "Guided Drills",
            description: "Short focused drills with step-by-step explanations.",
            badge: "gold",
          },
          {
            id: "t2-b",
            title: "Challenge Set",
            description: "Harder items for exam readiness and confidence.",
            badge: "gold",
          },
        ],
      },
    ],
    resources: defaultResources(title),
    faqs: [
      {
        id: "f1",
        question: `What is the ${title} Questionbank?`,
        answer: "A structured bank of practice questions sorted by topic and difficulty.",
      },
      {
        id: "f2",
        question: "How should I use it?",
        answer: "Open a topic, attempt a set, review explanations, then retry missed questions.",
      },
    ],
  };
}

export function getQuestionbankBySlug(slug: string, courseTitle?: string): QuestionbankData {
  if (bySlug[slug]) return bySlug[slug];

  const pretty =
    courseTitle ||
    slug
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  return fallbackForSlug(slug, pretty);
}
