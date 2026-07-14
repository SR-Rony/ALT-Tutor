import { PageHeader } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentDashboardPage() {
  return (
    <>
      <PageHeader title="Student Dashboard" description="Learning overview, progress, and upcoming classes." />
      <div className="grid gap-4 md:grid-cols-3">
        {["Enrolled Courses", "Assignments", "Certificates"].map((item) => (
          <Card key={item}>
            <CardHeader>
              <CardTitle>{item}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Module placeholder — implement in features/ or components/student/.</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
