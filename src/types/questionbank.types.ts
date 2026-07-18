export type QuestionbankBadge = "free" | "gold";

export interface QuestionbankSubtopic {
  id: string;
  title: string;
  description: string;
  badge?: QuestionbankBadge;
}

export interface QuestionbankTopic {
  id: string;
  number: number;
  title: string;
  subtopics: QuestionbankSubtopic[];
}

export interface QuestionbankResource {
  id: string;
  title: string;
  description: string;
  hrefKey: "questionbank" | "course" | "practice" | "concepts" | "papers" | "flashcards";
}

export interface QuestionbankFaq {
  id: string;
  question: string;
  answer: string;
}

export interface QuestionbankStudyQuestion {
  id: string;
  number: number;
  difficulty: "easy" | "medium" | "hard";
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuestionbankStudySet {
  bank: QuestionbankData;
  topic: QuestionbankTopic;
  subtopic: QuestionbankSubtopic;
  questions: QuestionbankStudyQuestion[];
}

export interface QuestionbankData {
  courseSlug: string;
  courseTitle: string;
  categoryName: string;
  levelLabel: string;
  description: string;
  topics: QuestionbankTopic[];
  resources: QuestionbankResource[];
  faqs: QuestionbankFaq[];
}
