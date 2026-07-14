import { PageHeader } from "@/components/shared";

export const metadata = { title: "Help Center" };

export default function HelpPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <PageHeader
        title="Help Center"
        description="Find answers about courses, accounts, certificates, and platform support."
      />
    </section>
  );
}
