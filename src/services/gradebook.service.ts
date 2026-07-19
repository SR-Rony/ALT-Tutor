import { apiClient } from "./api-client";

export type GradebookAssignment = {
  id: string;
  title: string;
  type: string;
  totalMarks?: number | null;
  passingScore?: number | null;
};

export type GradebookCell = {
  assignmentId: string;
  scorePercent: number | null;
  status: string;
  source: "MCQ" | "WRITTEN" | "OVERRIDE";
  released: boolean;
  note?: string | null;
  attemptCount?: number;
  rawGrade?: number | null;
};

export type GradebookRow = {
  student: { id: string; name: string; phone: string };
  grades: GradebookCell[];
  average: number | null;
};

export type GradebookPayload = {
  scope: { courseId?: string; programId?: string };
  assignments: GradebookAssignment[];
  rows: GradebookRow[];
};

export const gradebookService = {
  get(filters: { courseId?: string; programId?: string }): Promise<GradebookPayload> {
    const params = new URLSearchParams();
    if (filters.courseId) params.set("courseId", filters.courseId);
    if (filters.programId) params.set("programId", filters.programId);
    return apiClient
      .get<GradebookPayload>(`/gradebook?${params.toString()}`)
      .then((r) => r.data);
  },

  override(payload: {
    assignmentId: string;
    studentId: string;
    scorePercent: number;
    note?: string;
  }) {
    return apiClient.post("/gradebook/override", payload).then((r) => r.data);
  },
};
