import { PageHeader } from "@/components/shared";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <PageHeader title="Contact" description="Add your contact form component here." />
    </section>
  );
}
