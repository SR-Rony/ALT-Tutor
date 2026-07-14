# Route Page Template

Keep `app/` pages thin — fetch data, pass to component.

```tsx
// src/app/(dashboard)/admin/support/page.tsx
import { Suspense } from "react";
import { AdminSupportManagementPage } from "@/components/admin/support-management";
import { adminSupportManagementService } from "@/services/admin";

export const metadata = { title: "Support" };

export default async function AdminSupportRoute() {
  const data = await adminSupportManagementService.getSupportTickets();

  return (
    <Suspense fallback={<div className="min-h-[320px] rounded-2xl bg-white" />}>
      <AdminSupportManagementPage data={data} />
    </Suspense>
  );
}
```

## Dynamic route

```tsx
// src/app/(dashboard)/admin/support/[ticketId]/page.tsx
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ ticketId: string }>;
}

export default async function Page({ params }: Props) {
  const { ticketId } = await params;
  const ticket = await adminSupportManagementService.getTicketDetail(ticketId);
  if (!ticket) notFound();
  return <AdminSupportTicketDetailPage ticket={ticket} />;
}
```
