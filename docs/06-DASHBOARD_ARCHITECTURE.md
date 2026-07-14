# 06 — Dashboard Architecture

## Shell layout

```
┌──────────────────────────────────────────────────────────────┐
│ DashboardHeader  (title · messages · notifications · avatar) │
├────────────┬─────────────────────────────────────────────────┤
│  Sidebar   │  Main content                                   │
│  (nav)     │    ┌─────────────────────────────────────────┐  │
│            │    │  Page card / feature content            │  │
│            │    └─────────────────────────────────────────┘  │
└────────────┴─────────────────────────────────────────────────┘
```

## Core components

| Component | File | Role |
|-----------|------|------|
| `DashboardShell` | `components/dashboard/dashboard-shell.tsx` | Layout wrapper |
| `DashboardSidebar` | `components/dashboard/dashboard-sidebar.tsx` | Nav + collapse |
| `DashboardHeader` | `components/dashboard/dashboard-header.tsx` | Title, badges, avatar |
| `StatCard` | `components/dashboard/stat-card.tsx` | KPI tiles |

## Role layout shells

| Role | Shell | Nav config |
|------|-------|------------|
| Student | `student/layout.tsx` | `studentNav` |
| Teacher | `teacher-layout-shell.tsx` | `teacherNav` |
| Admin | `admin-layout-shell.tsx` | `adminNav` |

## Navigation config

`config/navigation.config.ts`:

```ts
export const adminNav: NavItem[] = [
  { title: "Dashboard", href: ROUTES.admin.root, iconName: "layout-dashboard" },
  { title: "Support", href: ROUTES.admin.support, iconName: "headphones" },
];
```

Each item: `title`, `href`, optional `iconName`, `badge`.

## Dynamic header titles

Use `useUIStore.setHeaderTitleOverride()` for detail pages:

```tsx
// e.g. Ticket ID:#12345 on support detail
useEffect(() => {
  setHeaderTitleOverride(`Ticket ID:${ticket.ticketNumber}`);
  return () => setHeaderTitleOverride(null);
}, [ticket.ticketNumber]);
```

## UI state (Zustand)

`useUIStore`:
- `sidebarCollapsed` — desktop
- `mobileSidebarOpen` — drawer
- `headerTitleOverride` — detail page titles

## Route map (starter)

### Student
`/student` · `/student/courses` · `/student/live` · `/student/assignments` · `/student/certificates` · `/student/chat` · `/student/payments` · `/student/settings`

### Teacher
`/teacher` · `/teacher/courses` · `/teacher/students` · `/teacher/analytics` · `/teacher/chat` · `/teacher/settings`

### Admin
`/admin` · `/admin/users` · `/admin/courses` · `/admin/transactions` · `/admin/support` · `/admin/report` · `/admin/settings`

Add `loading.tsx` per route as features mature.

## Future enhancements

1. Breadcrumbs from route + `PageHeader`
2. Command palette (cmdk) for global search
3. Notification dropdown wired to `notificationService`
4. Real-time badge counts via Query polling
