import Link from "next/link";
import { ROUTES } from "@/constants";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <Link href={ROUTES.home} className="text-sm font-medium text-primary">
        Back to home
      </Link>
    </div>
  );
}
