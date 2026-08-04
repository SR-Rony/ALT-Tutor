import { redirect } from "next/navigation";
import { ROUTES } from "@/constants";

export default function StudentAssessmentsRoute() {
  redirect(ROUTES.student.courses);
}
