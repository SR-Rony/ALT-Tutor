import { AdminMcqExamsPage } from "@/components/admin/mcq";

export const metadata = { title: "MCQ Exams" };

export default function AdminExamsMcqRoute() {
  return <AdminMcqExamsPage examKind="MCQ" />;
}
