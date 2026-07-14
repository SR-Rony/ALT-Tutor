# Admin Module Template

Copy this pattern for every admin CRUD feature (Support, Reports, Activity Log, etc.).

## Files to create (triad + UI)

| # | Path | Purpose |
|---|------|---------|
| 1 | `src/types/admin-{name}-management.types.ts` | TypeScript contracts |
| 2 | `src/data/mock/admin-{name}-management.mock.ts` | Mock data + getters |
| 3 | `src/data/mock/admin-data.resolvers.ts` | Add `resolveAdmin{Name}()` |
| 4 | `src/services/admin/admin-{name}-management.service.ts` | Service via `fetchAdminData` |
| 5 | `src/services/admin/index.ts` | Export service |
| 6 | `src/components/admin/{name}-management/` | UI module |
| 7 | `src/app/(dashboard)/admin/{name}/page.tsx` | Thin route |
| 8 | `src/constants/routes.ts` | Route constant |
| 9 | `src/config/navigation.config.ts` | Sidebar link |

## UI module structure

```
{name}-management/
├── index.ts
├── admin-{name}-management-page.tsx       # Client: state, handlers
├── admin-{name}-management-table.tsx     # Table rows
├── admin-{name}-management-toolbar.tsx     # Search, filters, actions
├── admin-{name}-management-status-badge.tsx
├── admin-{name}-management.utils.ts      # filter, sort, paginate
├── admin-{name}-detail-page.tsx           # Optional detail view
└── admin-add-{name}-drawer.tsx            # Optional create/edit drawer
```

## Working example in this template

See `src/components/admin/_example-management/` and route `/admin/example`.

## Auto-scaffold

```bash
npm run scaffold:admin -- support-management
```

Then wire resolver, exports, routes, and nav manually.
