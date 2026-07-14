import { PublicFooter } from "@/components/layouts/public-footer";
import { PublicHeader } from "@/components/layouts/public-header";
import { PublicMain } from "@/components/layouts/public-main";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <PublicHeader />
      <PublicMain>{children}</PublicMain>
      <PublicFooter />
    </div>
  );
}
