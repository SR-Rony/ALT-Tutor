# Feature folders

Reserved for cross-role business modules. Export public API from `index.ts`.

| Folder | Domain |
|--------|--------|
| `auth/` | Login, session, guards |
| `courses/` | Catalog, enrollment |
| `lessons/` | Video player, progress |
| `quizzes/` | Attempts, scoring |
| `assignments/` | Submit, feedback |
| `certificates/` | Issue, verify |
| `payments/` | Checkout, history |
| `chat/` | Messaging |
| `notifications/` | Alerts |
| `live-class/` | Schedule, join |
| `support/` | Tickets |
| `analytics/` | Dashboards |
| `users/` | Profiles |
| `settings/` | Account preferences |

**Rule:** Role-specific UI → `components/{role}/`. Shared logic → `features/`.
