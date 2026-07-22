import { AuthPageShell } from "@/components/auth";
import { RegisterForm } from "@/components/forms/register-form";
import { ROUTES } from "@/constants";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <AuthPageShell
      title="Create your account"
      subtitle="Join Alt Tutor with phone OTP verification — start learning with expert teachers."
      footerPrompt="Already have an account?"
      footerLinkText="Login"
      footerHref={ROUTES.auth.login}
    >
      <RegisterForm />
    </AuthPageShell>
  );
}
