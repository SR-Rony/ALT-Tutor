# Public Page Template

Marketing pages live in `components/public/{page}/` with optional colocated data.

```
components/public/about/
├── about-page-content.tsx
├── about-page-hero.tsx
└── data/
    └── about.data.ts
```

Route stays thin:

```tsx
// app/(public)/about/page.tsx
import { AboutPageContent } from "@/components/public/about/about-page-content";

export const metadata = { title: "About" };

export default function AboutPage() {
  return <AboutPageContent />;
}
```

Static marketing copy → `components/public/{page}/data/`  
API-driven content → `services/` + TanStack Query
