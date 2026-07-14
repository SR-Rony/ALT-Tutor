import { AuthPageShell } from "@/components/auth";
import { LoginForm } from "@/components/forms/login-form";
import { ROUTES } from "@/constants";

export const metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <AuthPageShell
      title="Welcome back"
      subtitle="Sign in with your phone to open your Alt Tutor LMS dashboard."
      footerPrompt="Don't have an account?"
      footerLinkText="Register"
      footerHref={ROUTES.auth.register}
    >
      <LoginForm />
    </AuthPageShell>
  );
}
