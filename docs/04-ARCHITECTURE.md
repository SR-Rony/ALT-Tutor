# 04 — Architecture

## High-level diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│  app/ (routes)  →  components/  →  features/  →  hooks/         │
│                           ↓                                     │
│                      services/  ←── env.useMockApi              │
│                     ↙         ↘                                 │
│              data/mock/    api-client → Backend API             │
├─────────────────────────────────────────────────────────────────┤
│  State: Zustand (auth, UI)  +  TanStack Query (server data)      │
│  Config: routes, nav, env  |  Permissions: middleware + RBAC    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Request flow (page load)

1. **Next.js route** (`app/`) resolves URL
2. **Server Component** calls `service.getX()` (async)
3. **Service** checks `env.useMockApi`:
   - `true` → resolver → mock data (+ simulated delay)
   - `false` → `apiClient.get/post` → backend
4. **Page** passes data to client component
5. **Client component** manages local UI state (filters, drawers, forms)
6. **Mutations** (future) → service → invalidate Query cache

---

## Layer responsibilities

| Layer | Does | Does NOT |
|-------|------|----------|
| `app/` | metadata, data fetch, compose | business logic, heavy UI |
| `components/` | render UI, local UI state | direct fetch to API |
| `services/` | data access, error mapping | JSX |
| `store/` | auth snapshot, sidebar, header override | course lists, server cache |
| `hooks/` | wrap Query/mutations | replace services |

---

## Role layout shells

Each dashboard role has a layout shell wrapping `DashboardShell`:

```
app/(dashboard)/admin/layout.tsx
  └── AdminLayoutShell (client)
        └── DashboardShell
              ├── DashboardSidebar (adminNav)
              ├── DashboardHeader (title, badges)
              └── {children}
```

`AdminLayoutShell` handles:
- Dynamic page titles (e.g. `Ticket ID:#12345`)
- Header back button on profile routes
- Badge counts for messages/notifications

---

## Mock → API migration strategy

Migrate **per domain**, not all at once:

1. Implement backend endpoint
2. Update single service method
3. Set `useMockApi: false` only for that method (or globally when ready)
4. Add Zod response validation at service boundary
5. Remove mock file when fully migrated

See [08-API_INTEGRATION.md](08-API_INTEGRATION.md).

---

## Error handling

| Level | Pattern |
|-------|---------|
| Route | `notFound()` for missing entities |
| Page | `error.tsx` boundary per segment |
| Service | Throw typed `ApiError` from `api-client` |
| Form | Zod + RHF field errors |
| Global | `global-error.tsx` |

---

## Performance

- **Server Components** for initial data fetch (admin list pages)
- **Client Components** for interactivity (tables with selection, chat, drawers)
- **TanStack Query** for client refetch, pagination, optimistic updates
- **Image optimization** via `next/image`
- **Route-level loading.tsx** for skeleton states

---

## Scalability patterns

1. **Barrel exports** (`index.ts`) — stable public APIs per module
2. **Query key factory** — predictable cache invalidation
3. **Resolver hub** — single import point for mock data
4. **Route constants** — safe refactors when URLs change
5. **Colocated utils** — `admin-support-management.utils.ts` beside components

---

## Related docs

- [06-DASHBOARD_ARCHITECTURE.md](06-DASHBOARD_ARCHITECTURE.md)
- [07-STATE_MANAGEMENT.md](07-STATE_MANAGEMENT.md)
- [09-LMS_DOMAIN_GUIDE.md](09-LMS_DOMAIN_GUIDE.md)
