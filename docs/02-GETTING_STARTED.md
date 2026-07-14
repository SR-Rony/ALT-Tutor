# 02 — Getting Started

## Prerequisites

- **Node.js** 20+
- **npm** 10+ (or pnpm/yarn)
- **Git**

---

## Step 1 — Copy template

```bash
cp -r lms-project-folder ../my-lms-app
cd ../my-lms-app
```

Or use this folder directly and rename in `package.json`.

---

## Step 2 — Install dependencies

```bash
npm install
```

---

## Step 3 — Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
NEXT_PUBLIC_USE_MOCK_API=true
```

---

## Step 4 — shadcn/ui setup

```bash
npx shadcn@latest init
npx shadcn@latest add button input card avatar label separator scroll-area dialog dropdown-menu tabs tooltip skeleton
```

Primitives land in `src/components/ui/`.

---

## Step 5 — Run development server

```bash
npm run dev
```

| URL | Page |
|-----|------|
| http://localhost:3000 | Public home |
| http://localhost:3000/login | Auth |
| http://localhost:3000/student | Student dashboard |
| http://localhost:3000/teacher | Teacher dashboard |
| http://localhost:3000/admin | Admin dashboard |

---

## Step 6 — Verify quality gates

```bash
npm run typecheck
npm run lint
npm run build
```

---

## Customize branding

| File | What to change |
|------|----------------|
| `src/config/site.config.ts` | App name, description, URLs |
| `src/components/shared/logo.tsx` | Logo component |
| `src/app/globals.css` | CSS variables / primary color |
| `public/` | Favicon, OG images |

---

## Add your first admin module

```bash
npm run scaffold:admin -- support-management
```

This creates scaffold files under `templates/admin-module/` instructions — copy to `src/components/admin/`, `src/types/`, `src/services/`, `src/data/mock/`.

See [03-FOLDER_STRUCTURE.md](03-FOLDER_STRUCTURE.md) for the full checklist.

---

## Demo authentication

Mock auth accepts any password. Use role emails from `src/data/mock/users.mock.ts`:

- `student@example.com` → `/student`
- `teacher@example.com` → `/teacher`
- `admin@example.com` → `/admin`

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `@/` imports fail | Ensure `tsconfig.json` paths match |
| Tailwind classes missing | Check `postcss.config.mjs` and `globals.css` |
| shadcn components missing | Run `npx shadcn@latest add <component>` |
| Build OOM | Increase Node memory: `NODE_OPTIONS=--max-old-space-size=4096` |
