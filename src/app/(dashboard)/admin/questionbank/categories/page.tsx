import { redirect } from "next/navigation";
import { ROUTES } from "@/constants";

export default function AdminQbCategoriesRoute() {
  redirect(ROUTES.admin.categories);
}
