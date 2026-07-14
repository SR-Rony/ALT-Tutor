# 10 — Role Permissions

## RBAC overview

| Role | Access |
|------|--------|
| `student` | Own courses, assignments, payments, profile |
| `teacher` | Own courses, enrolled students, analytics |
| `admin` | Full platform management |

---

## Permission file

`src/permissions/role.permissions.ts`:

```ts
import { Role } from "@/enums/role.enum";
import { ROUTES } from "@/constants";

export const roleHomeRoutes: Record<Role, string> = {
  [Role.Student]: ROUTES.student.root,
  [Role.Teacher]: ROUTES.teacher.root,
  [Role.Admin]: ROUTES.admin.root,
};

export const roleAllowedPrefixes: Record<Role, string[]> = {
  [Role.Student]: ["/student"],
  [Role.Teacher]: ["/teacher"],
  [Role.Admin]: ["/admin"],
};
```

---

## Middleware (`src/middleware.ts`)

```ts
// Matcher: dashboard routes
// Check auth cookie / session
// Redirect unauthenticated → /login
// Redirect wrong role → role home
```

**Template status:** placeholder — implement when backend auth is ready.

---

## Client-side guards

Use for UX only (not security):

```tsx
if (user?.role !== Role.Admin) {
  return <Redirect to={roleHomeRoutes[user.role]} />;
}
```

Server/middleware must enforce real authorization.

---

## Admin feature permissions (advanced)

For granular admin roles (e.g. Support Agent vs Super Admin):

```ts
// permissions/admin.permissions.ts
export const adminPermissions = {
  "support:read": ["admin", "support-agent"],
  "support:resolve": ["admin", "support-agent"],
  "users:delete": ["admin"],
};
```

Check in components and API — not just UI hiding.

---

## Route matrix (starter)

| Route | Student | Teacher | Admin |
|-------|---------|---------|-------|
| `/student/*` | ✅ | ❌ | ❌ |
| `/teacher/*` | ❌ | ✅ | ❌ |
| `/admin/*` | ❌ | ❌ | ✅ |
| `/courses` (public) | ✅ | ✅ | ✅ |
| `/login` | ✅ | ✅ | ✅ |

---

## Related

- [07-STATE_MANAGEMENT.md](07-STATE_MANAGEMENT.md) — auth store
- [08-API_INTEGRATION.md](08-API_INTEGRATION.md) — session API
