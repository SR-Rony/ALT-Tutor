# 03 — Folder Structure

## Philosophy

```
app/        → Routes only (compose, don't implement)
features/   → Reusable business logic & cross-role features
components/ → UI (shared + role-specific composites)
services/   → Data access (single source for API/mock)
types/      → Contracts (1:1 with service domains)
data/mock/  → Development data + resolvers
```

**Golden rule:** If a page file exceeds ~30 lines of logic, move logic to a component, hook, or service.

---

## `src/app/` — Routes

Route groups `(name)` do **not** affect URLs.

| Group | Layout | Examples |
|-------|--------|----------|
| `(public)` | Header + footer | `/`, `/courses`, `/blog` |
| `(auth)` | Centered card | `/login`, `/register` |
| `(dashboard)/student` | `DashboardShell` | `/student/courses` |
| `(dashboard)/teacher` | `DashboardShell` | `/teacher/courses` |
| `(dashboard)/admin` | `DashboardShell` | `/admin/users` |

### Thin page pattern

```tsx
// app/(dashboard)/admin/support/page.tsx
import { AdminSupportManagementPage } from "@/components/admin/support-management";
import { adminSupportManagementService } from "@/services/admin";

export const metadata = { title: "Support" };

export default async function Page() {
  const data = await adminSupportManagementService.getSupportTickets();
  return <AdminSupportManagementPage data={data} />;
}
```

---

## `src/features/` — Feature modules

Use when logic is **shared across roles** or represents a core domain.

```
features/courses/
├── index.ts              # Public exports
├── components/           # CourseCatalog, CourseDetail
├── hooks/                # useCourses, useCourseDetail
└── utils/                # Pure helpers
```

**When to use `features/` vs `components/{role}/`:**
- Shared catalog → `features/courses/`
- Admin-only CRUD table → `components/admin/course-management/`

---

## `src/components/` — UI layers

| Folder | Purpose |
|--------|---------|
| `ui/` | shadcn primitives — no business logic |
| `shared/` | Logo, PageHeader, EmptyState, Container |
| `layouts/` | PublicHeader, PublicFooter |
| `dashboard/` | DashboardShell, Sidebar, Header, StatCard |
| `forms/` | FormField, LoginForm, PasswordInput |
| `feedback/` | LoadingSpinner, PageLoading |
| `public/` | Marketing page composites + colocated `data/` |
| `student/` | Student-only pages & sections |
| `teacher/` | Teacher-only pages & sections |
| `admin/` | Admin management modules |

### Admin `*-management` module structure

```
components/admin/support-management/
├── index.ts
├── admin-support-management-page.tsx      # Client page (state, handlers)
├── admin-support-management-table.tsx     # Table
├── admin-support-management-toolbar.tsx   # Filters, search, actions
├── admin-support-management-status-badge.tsx
├── admin-support-management.utils.ts      # filter, sort, paginate
├── admin-support-ticket-detail-page.tsx   # Detail view (optional)
└── admin-add-support-ticket-drawer.tsx    # Drawer/modal (optional)
```

---

## `src/services/` — Data layer

### Root services
`auth.service.ts`, `course.service.ts` — shared or student-facing.

### Admin pattern (triad)

| File | Role |
|------|------|
| `services/admin/admin-{x}-management.service.ts` | API calls via `fetchAdminData` |
| `types/admin-{x}-management.types.ts` | TypeScript interfaces |
| `data/mock/admin-{x}-management.mock.ts` | Mock data + getters |
| `data/mock/admin-data.resolvers.ts` | `resolveAdmin{X}()` hub |

### Teacher pattern
Same as admin with `fetchTeacherData` and `teacher-data.resolvers.ts`.

### Student pattern
`student-{domain}.service.ts` + `student-{domain}.mock.ts` + optional `student-{domain}.resolver.ts`.

---

## `src/types/`

Flat folder, domain-prefixed:

- `course.types.ts` — shared
- `admin-support-management.types.ts` — admin domain
- `student-messages.types.ts` — student domain

Export shared types from `types/index.ts`.

---

## `src/data/mock/`

| Pattern | Example |
|---------|---------|
| Seed data | `users.mock.ts`, `courses.mock.ts` |
| Domain getter | `getAdminSupportManagement()` |
| Aggregate resolver | `resolveAdminSupportManagement()` in `admin-data.resolvers.ts` |
| Detail getter | `getAdminSupportTicketDetail(id)` |

**Public marketing data** lives in `components/public/{page}/data/` — not in `data/mock/`.

---

## `src/config/`

| File | Contents |
|------|----------|
| `env.config.ts` | Typed `NEXT_PUBLIC_*` vars |
| `site.config.ts` | Name, meta, social links |
| `navigation.config.ts` | studentNav, teacherNav, adminNav |
| `query.config.ts` | TanStack Query defaults |
| `dashboard.config.ts` | Sidebar breakpoints |

---

## `src/constants/`

- `routes.ts` — **never hardcode paths** in components
- `query-keys.ts` — TanStack Query key factory

---

## Adding a new feature (checklist)

- [ ] Types: `src/types/admin-{name}-management.types.ts`
- [ ] Mock: `src/data/mock/admin-{name}-management.mock.ts`
- [ ] Resolver entry in `admin-data.resolvers.ts`
- [ ] Service: `src/services/admin/admin-{name}-management.service.ts`
- [ ] Export in `services/admin/index.ts`
- [ ] Components: `src/components/admin/{name}-management/`
- [ ] Route: `src/app/(dashboard)/admin/{name}/page.tsx`
- [ ] Nav: `config/navigation.config.ts`
- [ ] Routes: `constants/routes.ts`
- [ ] Page title: role layout shell (if dynamic header needed)

---

## Naming conventions

| Kind | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `course-card.tsx` |
| Components | PascalCase | `CourseCard` |
| Hooks | `use` prefix | `useCourses` |
| Services | camelCase object | `courseService` |
| Types | PascalCase interfaces | `AdminSupportTicket` |
| Enums | PascalCase + `.enum.ts` | `Role` in `role.enum.ts` |

---

## Import alias

`@/*` → `src/*` (see `tsconfig.json`).
