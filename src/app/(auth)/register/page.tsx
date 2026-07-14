import Link from "next/link";
import { ROUTES } from "@/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-shell p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Registration will connect to your auth backend. For now, sign in with the demo flow or browse
            courses as a guest.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href={ROUTES.auth.login}>Sign in</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href={ROUTES.courses}>Browse courses</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
