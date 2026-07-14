# 09 — LMS Domain Guide

Professional patterns for Learning Management System frontends. Use this when modeling features beyond generic CRUD.

---

## Domain model (conceptual)

```
Organization
└── Users (Student | Teacher | Admin)
    └── Enrollments
        └── Course
            ├── Modules / Topics
            ├── Lessons (video | text | live)
            ├── Quizzes → Attempts
            ├── Assignments → Submissions
            └── Resources
```

---

## Course types

| Type | Student UX | Teacher UX | Admin UX |
|------|------------|------------|----------|
| **Recorded** | Self-paced player | Upload lessons, curriculum builder | Approve, publish, categories |
| **Live** | Join scheduled class | Schedule, routine slots | Monitor, reports |
| **Workshop** | Event registration | Create workshop | Manage listings |

**Route pattern:** `/student/courses/[slug]/lesson` vs `/live` vs `/quiz`

Use **nested layouts** per course section (lesson, quiz, assignment share course context).

---

## Progress tracking

Track at multiple levels:

| Level | Data | UI |
|-------|------|-----|
| Lesson | `watchedSeconds`, `completed` | Progress bar on lesson list |
| Course | `% complete` | Dashboard course card |
| Assignment | `submitted`, `graded` | Status badge |
| Quiz | `score`, `passed` | Result page |

Store progress IDs in URL search params for deep links: `?lesson=lesson-basics-ux`

---

## Quiz flow (recommended states)

```
intro → play → time-over | answers → result
```

Each state = separate route or layout segment for clean back/forward and shareable URLs.

Files per segment:
- `quiz/page.tsx` — intro
- `quiz/play/page.tsx` — active attempt
- `quiz/result/page.tsx` — score

---

## Assignment flow

1. Student views brief + attachments
2. Submit (file upload + rich text)
3. Feedback page after grading

**Teacher side:** submission list, rubric, grade + comment.

---

## Certificate verification

Public route: `/verify-certificate`

- Input: certificate ID or code
- Output: student name, course, issue date, validity

Keeps trust without exposing internal IDs.

---

## Live class

| Concern | Frontend responsibility |
|---------|-------------------------|
| Schedule | Calendar / class routine grid |
| Join | Link to video provider (Zoom, Jitsi, custom) |
| Attendance | UI shell — backend tracks |
| Recordings | Post-class resource list |

---

## Payments & commerce

```
Catalog → Cart → Checkout → Payment → Transaction history
```

- Cart state: client + sync to server when logged in
- Checkout: billing form + payment method UI
- Admin: transaction table with filters, export

---

## Support tickets

| Status | Color semantics |
|--------|-----------------|
| Open | Blue |
| In Progress | Orange |
| Resolved | Green |

**List → Detail → Chat thread → Resolve**

Admin replies appear on **right**; ticket creator on **left**.

---

## Messaging

Course-scoped or platform-wide:

```
Course list (left) → Thread (right) → Composer
```

Reuse chat bubble components with `ownSender` for alignment.

---

## Notifications

Types: `course`, `assignment`, `payment`, `system`

| UI | Pattern |
|----|---------|
| Bell badge | Unread count from Query |
| List page | Group by Today / Yesterday |
| Mark read | Optimistic mutation |

---

## Analytics (LMS KPIs)

### Student
- Courses enrolled, completion %, upcoming deadlines

### Teacher
- Active students, completion rates, revenue

### Admin
- MAU, enrollments, revenue, support volume, course performance

Use `StatCard` + charts folder (Recharts) when implementing.

---

## Content pages (marketing)

Static content in `components/public/{page}/data/*.data.ts`:

- SEO-friendly server components
- No mock API delay
- Easy copy updates without touching logic

---

## Search & discovery

- Course catalog: category filters, search, sort
- Admin tables: toolbar filters + pagination
- Future: command palette for global search

---

## Internationalization (future)

Prepare by:
- Centralizing strings in `config/copy/` or i18n files
- Avoid hardcoded labels in utils
- Use `formatDate` helpers in `utils/`

---

## Related

- [10-ROLE_PERMISSIONS.md](10-ROLE_PERMISSIONS.md)
- [03-FOLDER_STRUCTURE.md](03-FOLDER_STRUCTURE.md)
