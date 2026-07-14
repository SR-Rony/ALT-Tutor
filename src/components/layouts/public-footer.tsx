import { siteConfig } from "@/config";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-section-muted py-8">
      <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground md:px-6">
        © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
      </div>
    </footer>
  );
}
