import { PageHeader } from "@/components/shared";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <PageHeader title="About" description="Replace this page with your institution story and mission." />
    </section>
  );
}
