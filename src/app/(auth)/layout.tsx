import { GuestOnlyGuard } from "@/components/auth/guest-only-guard";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <GuestOnlyGuard>{children}</GuestOnlyGuard>;
}
