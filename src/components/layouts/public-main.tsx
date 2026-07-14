"use client";

import { usePathname } from "next/navigation";
import { ROUTES } from "@/constants";
import { cn } from "@/utils";

export function PublicMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === ROUTES.home;

  return (
    <main className={cn("flex-1", !isHomePage && "pt-16 lg:pt-[4.25rem]")}>{children}</main>
  );
}
