import type { Metadata } from "next";
import { ContactPage, contactPageContent } from "@/components/public/support";

export const metadata: Metadata = {
  title: contactPageContent.meta.title,
  description: contactPageContent.meta.description,
};

export default function ContactRoutePage() {
  return <ContactPage />;
}
