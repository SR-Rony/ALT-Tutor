export type PastPaperItem = {
  id: string;
  label: string;
  kind: "MCQ" | "SQ";
};

export type PastPaperSession = {
  year: number;
  session: string;
  papers: PastPaperItem[];
};

/** Demo past-paper catalogue — replace with API when backend is ready */
export function getPastPapersDemo(_programSlug: string): PastPaperSession[] {
  return [
    {
      year: 2025,
      session: "May TZ1",
      papers: [
        { id: "2025-may-p11", label: "Paper 11 (MCQ)", kind: "MCQ" },
        { id: "2025-may-p12", label: "Paper 12 (MCQ)", kind: "MCQ" },
        { id: "2025-may-p21", label: "Paper 21 (SQ)", kind: "SQ" },
        { id: "2025-may-p22", label: "Paper 22 (SQ)", kind: "SQ" },
      ],
    },
    {
      year: 2024,
      session: "November TZ2",
      papers: [
        { id: "2024-nov-p11", label: "Paper 11 (MCQ)", kind: "MCQ" },
        { id: "2024-nov-p12", label: "Paper 12 (MCQ)", kind: "MCQ" },
        { id: "2024-nov-p21", label: "Paper 21 (SQ)", kind: "SQ" },
      ],
    },
  ];
}
