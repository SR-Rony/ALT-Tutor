# 01 — Project Overview

## Vision

This template is a **production-ready LMS frontend scaffold** for SaaS learning platforms. It separates concerns so teams can ship UI fast with mock data, then connect a backend without restructuring.

**Frontend-only** in v1: routing, state, service abstraction, role dashboards, and documentation. Backend, database, and payment processing are integration targets — not included.

---

## User roles

| Role | Route prefix | Primary capabilities |
|------|--------------|----------------------|
| **Public** | `/` | Marketing, catalog, blog, pricing, help |
| **Guest** | `/login` | Auth flows (register, OTP, reset password) |
| **Student** | `/student` | Courses, lessons, quizzes, assignments, certificates, chat, payments |
| **Teacher** | `/teacher` | Course creation, students, analytics, live classes, resources |
| **Admin** | `/admin` | Users, courses, transactions, reports, support, platform settings |

---

## Core LMS modules

### Learning
- Courses (recorded + live)
- Lessons & video player
- Quizzes & attempts
- Assignments & submissions
- Certificates & verification
- Class schedule & resources

### Commerce
- Cart & checkout
- Payments & transaction history
- Promos & discounts

### Communication
- Messages / chat
- Notifications
- Support tickets

### Platform
- User management (learners, teachers, employees)
- Role & permissions
- Activity log & analytics
- Blog & content pages
- Workshop / events

---

## Design principles

1. **Feature-based modules** — domain logic in `src/features/` and role components; routes stay thin.
2. **Service abstraction** — all data via `src/services/`; mock/real toggle via `NEXT_PUBLIC_USE_MOCK_API`.
3. **Dual state model** — Zustand for client UI; TanStack Query for server/async data.
4. **Role-based dashboards** — shared `DashboardShell`, role nav from `config/navigation.config.ts`.
5. **Type-safe contracts** — types, Zod validations, and services stay aligned per domain.
6. **Documentation-first** — every major folder has purpose; changes logged in `DEVELOPMENT_LOG`.

---

## Non-goals (template phase)

- Backend API / database
- Real payment processing (Stripe UI hooks only)
- WebSocket infrastructure (chat UI shells)
- Mobile native apps

---

## Environment

```bash
cp .env.example .env.local
```

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_APP_URL` | Canonical app URL |
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base |
| `NEXT_PUBLIC_USE_MOCK_API` | `true` = mocks, `false` = real API |

---

## Next documents

- Setup → [02-GETTING_STARTED.md](02-GETTING_STARTED.md)
- Folders → [03-FOLDER_STRUCTURE.md](03-FOLDER_STRUCTURE.md)
- LMS domain → [09-LMS_DOMAIN_GUIDE.md](09-LMS_DOMAIN_GUIDE.md)
