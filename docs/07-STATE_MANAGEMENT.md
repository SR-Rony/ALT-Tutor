# 07 — State Management

## Recommended split

| Concern | Tool | Use for |
|---------|------|---------|
| Server/async data | **TanStack Query** | Courses, progress, notifications, lists |
| Client UI state | **Zustand** | Sidebar, auth snapshot, header override |
| Form state | **React Hook Form** | Login, create forms, drawers |
| URL state | **searchParams** | Filters, pagination, tabs (shareable URLs) |

### Rules

- **Do NOT** put server lists in Zustand
- **Do NOT** use Query for `sidebarCollapsed`
- **Do** use URL params for admin table filters when shareable

---

## Zustand stores

### `useAuthStore` (`store/auth.store.ts`)

```ts
{
  user: User | null;
  isAuthenticated: boolean;
  setUser(user): void;
  logout(): void;
}
```

- Persisted to `localStorage` (`lms-auth`)
- Hydrate from `/auth/session` when backend connects

### `useUIStore` (`store/ui.store.ts`)

```ts
{
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  headerTitleOverride: string | null;
}
```

- Ephemeral (except optional sidebar persist)

---

## TanStack Query

### Config — `config/query.config.ts`

```ts
export const queryConfig = {
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
};
```

### Query keys — `constants/query-keys.ts`

```ts
export const queryKeys = {
  courses: {
    all: ["courses"] as const,
    detail: (id: string) => ["courses", id] as const,
  },
};
```

### Hook pattern

```ts
export function useCourses() {
  return useQuery({
    queryKey: queryKeys.courses.all,
    queryFn: () => courseService.getAll(),
  });
}
```

Feature hooks can live in `features/{name}/hooks/` when not shared.

---

## Auth flow (mock)

1. `LoginForm` submits
2. `authService.login()` → mock user by email
3. `useAuthStore.setUser(user)`
4. `router.push(roleHomeRoutes[user.role])`

---

## Backend auth migration

1. Add `authService.getSession()` query
2. `AuthHydrator` client component on app mount
3. Login/logout mutations with cache invalidation
4. Middleware checks session cookie / JWT

---

## Devtools

React Query Devtools in development via `QueryProvider`.
