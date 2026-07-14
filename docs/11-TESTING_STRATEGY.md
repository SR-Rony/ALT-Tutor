# 11 — Testing Strategy

## Pyramid

```
        ┌─────────┐
        │   E2E   │  Playwright — critical flows
        ├─────────┤
        │ Integr. │  RTL + MSW — pages & hooks
        ├─────────┤
        │  Unit   │  Vitest — utils, validators, services
        └─────────┘
```

---

## Recommended stack

| Tool | Purpose |
|------|---------|
| **Vitest** | Unit tests |
| **Testing Library** | Component tests |
| **MSW** | Mock API in integration tests |
| **Playwright** | E2E (login, enroll, submit assignment) |

---

## What to test

### High priority
- Auth redirect by role
- Form validations (Zod schemas)
- `filter*`, `sort*`, `paginate*` utils in admin modules
- Service mock/real switch behavior
- Critical LMS flows: course enroll, quiz submit, assignment upload

### Medium priority
- Dashboard shell navigation
- Table row navigation to detail
- Drawer form validation

### Lower priority
- Static marketing pages (snapshot optional)

---

## Unit test example

```ts
// admin-support-management.utils.test.ts
import { filterAdminSupportTickets } from "./admin-support-management.utils";

describe("filterAdminSupportTickets", () => {
  it("filters by priority", () => {
    // ...
  });
});
```

---

## E2E flows (LMS)

1. Student login → browse courses → open lesson
2. Teacher login → view course → check student list
3. Admin login → support list → open ticket → send message → resolve
4. Checkout flow (when payments implemented)

---

## CI integration

```yaml
# .github/workflows/ci.yml
- run: npm run typecheck
- run: npm run lint
- run: npm run test
- run: npm run build
```

See [12-DEPLOYMENT.md](12-DEPLOYMENT.md).

---

## Mock data in tests

Import from `data/mock/` for consistent fixtures. Do not duplicate seed data in test files.
