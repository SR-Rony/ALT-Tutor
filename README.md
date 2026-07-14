# LMS Project Folder — Professional Starter Template

A **reusable, enterprise-grade LMS frontend scaffold** derived from production patterns in Skillophy. Copy this folder to start any new Learning Management System project with the same architecture, conventions, and documentation.

> **Source:** Extracted and refined from [Skillophy](../README.md) — all architecture docs reviewed and upgraded for reuse.

---

## What is this?

| Item | Description |
|------|-------------|
| **Purpose** | Starter template for LMS SaaS frontends (Student · Teacher · Admin) |
| **Stack** | Next.js 15 · TypeScript · Tailwind v4 · shadcn/ui · Zustand · TanStack Query |
| **Data** | Mock-first service layer — swap to real API via env flag |
| **Docs** | Full `/docs` guide — architecture, LMS domain, security, testing, deployment |

---

## Quick start

```bash
# 1. Copy template to your new project
cp -r lms-project-folder ../my-new-lms
cd ../my-new-lms

# 2. Install & configure
npm install
cp .env.example .env.local

# 3. Add shadcn/ui primitives
npx shadcn@latest init
npx shadcn@latest add button input card avatar label separator scroll-area

# 4. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Documentation map

| # | Document | Read when |
|---|----------|-----------|
| 01 | [PROJECT_OVERVIEW](docs/01-PROJECT_OVERVIEW.md) | Understanding vision, roles, modules |
| 02 | [GETTING_STARTED](docs/02-GETTING_STARTED.md) | First-time setup |
| 03 | [FOLDER_STRUCTURE](docs/03-FOLDER_STRUCTURE.md) | Where to put new code |
| 04 | [ARCHITECTURE](docs/04-ARCHITECTURE.md) | System design & data flow |
| 05 | [COMPONENT_GUIDE](docs/05-COMPONENT_GUIDE.md) | UI layering & forms |
| 06 | [DASHBOARD_ARCHITECTURE](docs/06-DASHBOARD_ARCHITECTURE.md) | Shell, sidebar, role nav |
| 07 | [STATE_MANAGEMENT](docs/07-STATE_MANAGEMENT.md) | Zustand + TanStack Query |
| 08 | [API_INTEGRATION](docs/08-API_INTEGRATION.md) | Mock → real backend migration |
| 09 | [LMS_DOMAIN_GUIDE](docs/09-LMS_DOMAIN_GUIDE.md) | **LMS-specific best practices** |
| 10 | [ROLE_PERMISSIONS](docs/10-ROLE_PERMISSIONS.md) | RBAC matrix & middleware |
| 11 | [TESTING_STRATEGY](docs/11-TESTING_STRATEGY.md) | Unit, integration, E2E |
| 12 | [DEPLOYMENT](docs/12-DEPLOYMENT.md) | Vercel, Docker, CI/CD |
| 13 | [DEVELOPMENT_LOG](docs/13-DEVELOPMENT_LOG.md) | Changelog template |

**Quick reference:** [STRUCTURE.md](STRUCTURE.md)

---

## Project structure (summary)

```
lms-project-folder/
├── docs/                    # Full architecture documentation (13 guides)
├── templates/               # Copy-paste scaffolds (admin module, service, route)
├── scripts/                 # Feature scaffolding helpers
├── public/                  # Static assets
└── src/
    ├── app/                 # Routes only — thin pages
    │   ├── (public)/        # Marketing site
    │   ├── (auth)/          # Login, register
    │   └── (dashboard)/     # student · teacher · admin
    ├── features/            # Business logic modules
    ├── components/          # Shared & role-specific UI
    ├── services/            # API layer (mock-ready)
    ├── store/               # Zustand client state
    ├── hooks/               # Shared React hooks
    ├── config/              # Site, nav, env, query defaults
    ├── constants/           # ROUTES, queryKeys
    ├── types/               # TypeScript contracts
    ├── validations/         # Zod schemas
    ├── data/mock/           # Development data + resolvers
    ├── permissions/         # Role-based access
    └── middleware.ts        # Route protection
```

---

## Demo logins (mock auth)

| Email | Role | Redirect |
|-------|------|----------|
| `student@example.com` | Student | `/student` |
| `teacher@example.com` | Teacher | `/teacher` |
| `admin@example.com` | Admin | `/admin` |

Any password works when `NEXT_PUBLIC_USE_MOCK_API=true`.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run scaffold:admin` | Generate admin CRUD module scaffold |

---

## How to use for a new LMS

1. **Rename** project in `package.json` and `config/site.config.ts`
2. **Customize** branding in `public/` and `components/shared/logo.tsx`
3. **Extend** `constants/routes.ts` and `config/navigation.config.ts`
4. **Add features** using `templates/` and `docs/03-FOLDER_STRUCTURE.md`
5. **Connect API** following `docs/08-API_INTEGRATION.md`

---

## License

Use freely for your LMS projects. Adapt naming, branding, and modules as needed.
