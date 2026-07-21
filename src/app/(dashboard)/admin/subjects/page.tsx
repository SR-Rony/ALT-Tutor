import { redirect } from "next/navigation";
import { ROUTES } from "@/constants";

export const metadata = { title: "Admin Subjects" };

/** Legacy route — taxonomy now lives under Questionbank. */
export default function AdminSubjectsRoute() {
  redirect(ROUTES.admin.qbSubjects);
}
