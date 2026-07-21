import { AdminMcqExamsPage } from "@/components/admin/mcq";

export const metadata = { title: "Written Exams" };

export default function AdminExamsWrittenRoute() {
  return <AdminMcqExamsPage examKind="WRITTEN" />;
}
