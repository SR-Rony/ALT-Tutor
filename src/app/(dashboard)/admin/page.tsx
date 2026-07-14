import { PageHeader } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <>
      <PageHeader title="Admin Dashboard" description="Platform overview and management shortcuts." />
      <div className="grid gap-4 md:grid-cols-3">
        {["Users", "Revenue", "Support Tickets"].map((item) => (
          <Card key={item}>
            <CardHeader>
              <CardTitle>{item}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Connect analytics service when backend is ready.</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
