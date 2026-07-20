import type { Metadata } from "next";
import { AboutPage, aboutPageContent } from "@/components/public/about";

export const metadata: Metadata = {
  title: aboutPageContent.meta.title,
  description: aboutPageContent.meta.description,
};

export default function AboutRoutePage() {
  return <AboutPage />;
}
