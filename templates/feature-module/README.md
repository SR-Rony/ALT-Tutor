# Feature Module Template

```
features/courses/
├── index.ts                 # Public exports only
├── components/
│   ├── course-catalog.tsx
│   └── course-detail.tsx
├── hooks/
│   └── use-courses.ts       # Or re-export from src/hooks
└── utils/
    └── format-price.ts
```

## index.ts

```ts
export { CourseCatalog } from "./components/course-catalog";
export { useCourses } from "./hooks/use-courses";
```

## When to use

- Logic shared across public + student + teacher
- Core domain (courses, payments, chat)

## When NOT to use

- Admin-only CRUD table → `components/admin/{name}-management/`
- Single-page marketing → `components/public/`
