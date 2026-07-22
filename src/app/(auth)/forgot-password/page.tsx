import { AuthPageShell } from "@/components/auth";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";
import { ROUTES } from "@/constants";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell
      title="Forgot password"
      subtitle="Verify your phone with OTP, then set a new password for your account."
      footerPrompt="Remember your password?"
      footerLinkText="Back to login"
      footerHref={ROUTES.auth.login}
    >
      <ForgotPasswordForm />
    </AuthPageShell>
  );
}
