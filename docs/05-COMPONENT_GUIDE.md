# 05 — Component Guide

## UI layering

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Primitives | `components/ui/` | shadcn — Button, Input, Card |
| Shared | `components/shared/` | Logo, PageHeader, EmptyState |
| Layouts | `components/layouts/` | PublicHeader, PublicFooter |
| Dashboard | `components/dashboard/` | Shell, Sidebar, StatCard |
| Forms | `components/forms/` | FormField + auth forms |
| Public | `components/public/` | Marketing composites |
| Role | `components/student|teacher|admin/` | Role-specific pages |

**Promotion rule:** Start in `features/` or role folder. Move to `components/shared/` when used in 2+ roles.

---

## shadcn/ui

```bash
npx shadcn@latest add dialog dropdown-menu
```

- Never add business logic to `ui/` components
- Extend via `className` and `cn()` wrapper components

---

## Form system

1. Schema in `src/validations/{domain}.schema.ts`
2. `useForm` + `zodResolver`
3. `FormField` for label + error display

```tsx
<FormField label="Email" error={errors.email?.message}>
  <Input {...register("email")} />
</FormField>
```

---

## Admin list page pattern

```
┌─────────────────────────────────────────────┐
│ Toolbar: Search | Filters | Sort | Actions  │
├─────────────────────────────────────────────┤
│ Table (rows clickable → detail route)       │
├─────────────────────────────────────────────┤
│ Pagination                                  │
└─────────────────────────────────────────────┘
```

**Card style:**
```css
rounded-2xl border border-[#ebe8e6] bg-white shadow-[0_8px_30px_rgba(35,25,22,0.04)]
```

---

## Drawer pattern (admin forms)

- Use shared drawer shell (slide-over from right)
- Form content in separate `*-form-content.tsx`
- Utils in `*-form.utils.ts` (defaults, validation, ID generation)
- Submit adds to local state (mock) or calls mutation (API)

---

## Chat / messaging UI

Reuse thread components:
- Left = other party (user/ticket creator)
- Right = current actor (admin/support/teacher)
- `ownSender` prop controls alignment
- Composer: attachment + input + send button

---

## Responsive design

- Mobile-first: `sm:`, `md:`, `lg:` breakpoints
- Dashboard sidebar: drawer on mobile, collapsible on desktop
- Tables: `overflow-x-auto` + `min-w-[...]` on table

---

## Theming

- CSS variables in `globals.css`
- `ThemeProvider` (next-themes) in providers
- Semantic tokens: `bg-background`, `text-muted-foreground`, `bg-primary`

---

## Animation

- Framer Motion variants in `src/animations/`
- Use `MotionWrapper` for page transitions
- Prefer shared variants over inline objects

---

## Accessibility

- Radix primitives (via shadcn) for focus traps
- `aria-label` on icon-only buttons
- Form labels via `FormField` + `Label`
- Keyboard navigation for drawers and modals

---

## Empty & loading states

| State | Component |
|-------|-----------|
| Page loading | `feedback/page-loading.tsx` |
| Module stub | `shared/module-placeholder.tsx` |
| No data | `shared/empty-state.tsx` |
| Table skeleton | `ui/skeleton.tsx` rows |
