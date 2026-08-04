import { redirect } from "next/navigation";
import { ROUTES } from "@/constants";

export default function StudentAssignmentsRoute() {
  redirect(ROUTES.student.courses);
}
