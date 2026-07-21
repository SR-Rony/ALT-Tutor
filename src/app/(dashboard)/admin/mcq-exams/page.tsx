import { redirect } from "next/navigation";
import { ROUTES } from "@/constants";

export const metadata = { title: "MCQ Exams" };

/** Legacy route — now under Exams → MCQ. */
export default function AdminMcqExamsLegacyRoute() {
  redirect(ROUTES.admin.examsMcq);
}
