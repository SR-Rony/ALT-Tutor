import type { Metadata } from "next";
import { HelpPage, helpPageContent } from "@/components/public/support";

export const metadata: Metadata = {
  title: helpPageContent.meta.title,
  description: helpPageContent.meta.description,
};

export default function HelpRoutePage() {
  return <HelpPage />;
}
