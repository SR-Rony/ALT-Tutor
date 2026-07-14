# LMS Project — Repository Structure (Quick Reference)

Full guide: [`docs/03-FOLDER_STRUCTURE.md`](docs/03-FOLDER_STRUCTURE.md)

```
lms-project-folder/
├── docs/                              # 13 architecture & LMS guides
├── templates/                         # Copy-paste scaffolds
│   ├── admin-module/                  # CRUD list + detail pattern
│   ├── service-layer/                 # Service + mock + types
│   ├── route-page/                    # Thin Next.js page
│   ├── public-page/                   # Marketing page pattern
│   └── feature-module/                # Feature barrel + hooks
├── scripts/
│   └── scaffold-admin-module.mjs      # Admin module generator
├── .github/
│   └── PULL_REQUEST_TEMPLATE.md
├── public/
├── src/
│   ├── app/
│   │   ├── (public)/                  # /, /courses, /blog, …
│   │   ├── (auth)/                    # /login, /register
│   │   ├── (dashboard)/
│   │   │   ├── student/               # /student/*
│   │   │   ├── teacher/               # /teacher/*
│   │   │   └── admin/                 # /admin/*
│   │   ├── layout.tsx
│   │   ├── loading.tsx | error.tsx | not-found.tsx
│   │   └── globals.css
│   ├── features/                      # Business modules
│   │   ├── courses/ | lessons/ | quizzes/
│   │   ├── assignments/ | certificates/
│   │   ├── payments/ | chat/ | notifications/
│   │   └── live-class/ | support/ | analytics/
│   ├── components/
│   │   ├── ui/                        # shadcn primitives
│   │   ├── shared/                    # Logo, PageHeader, EmptyState
│   │   ├── layouts/                   # Public header/footer
│   │   ├── dashboard/                 # Shell, sidebar, header
│   │   ├── forms/                     # RHF + Zod forms
│   │   ├── feedback/                  # Loading, errors
│   │   ├── charts/ | tables/ | modals/  # Reserved extensions
│   │   └── student/ | teacher/ | admin/  # Role composites
│   ├── services/
│   │   ├── api-client.ts
│   │   ├── auth.service.ts
│   │   ├── admin/                     # create-admin-service + domain services
│   │   └── teacher/                   # create-teacher-service + domain services
│   ├── store/                         # auth.store · ui.store
│   ├── hooks/
│   ├── providers/
│   ├── config/                        # env · site · nav · query
│   ├── constants/                     # ROUTES · queryKeys
│   ├── enums/
│   ├── validations/
│   ├── types/
│   ├── data/mock/                     # Mocks + resolvers
│   ├── permissions/
│   ├── utils/
│   ├── animations/
│   ├── middleware.ts
│   └── docs/                          # In-repo doc index
├── .env.example
├── components.json
├── package.json
└── tsconfig.json
```

## Conventions

| Layer | Pattern | Example |
|-------|---------|---------|
| Admin service | `admin-{domain}-management.service.ts` | `adminSupportManagementService` |
| Admin types | `admin-{domain}-management.types.ts` | `AdminSupportTicket` |
| Admin mock | `admin-{domain}-management.mock.ts` | `getAdminSupportManagement()` |
| Admin UI folder | `{domain}-management/` | `support-management-page.tsx` |
| Student service | `student-{domain}.service.ts` | `studentMessagesService` |
| Teacher service | `teacher/teacher-{domain}.service.ts` | `teacherCoursesService` |
| Routes | `constants/routes.ts` | `ROUTES.admin.supportDetail(id)` |

## Run

```bash
npm install
cp .env.example .env.local
npm run dev
```
