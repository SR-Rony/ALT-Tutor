# 08 — API Integration

## Current state (template)

- `NEXT_PUBLIC_USE_MOCK_API=true` by default
- Services return mock data with simulated latency
- `apiClient` ready in `services/api-client.ts`

---

## Service pattern

```ts
// services/course.service.ts
import { env } from "@/config";
import { apiClient } from "./api-client";
import { mockCourses } from "@/data/mock/courses.mock";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const courseService = {
  async getAll(): Promise<Course[]> {
    if (env.useMockApi) {
      await sleep(400);
      return mockCourses;
    }
    const { data } = await apiClient.get<Course[]>("/courses");
    return data;
  },
};
```

### Admin gate pattern

```ts
// services/admin/create-admin-service.ts
export async function fetchAdminData<T>(resolver: () => T): Promise<T> {
  if (env.useMockApi) await sleep(200);
  return resolver();
}
```

---

## Migration phases

### Phase 1 — Environment
- [ ] `NEXT_PUBLIC_API_BASE_URL`
- [ ] `NEXT_PUBLIC_USE_MOCK_API=false`

### Phase 2 — Auth
- [ ] `POST /auth/login`, `POST /auth/logout`, `GET /auth/session`
- [ ] HTTP-only cookies or Bearer in `apiClient`
- [ ] `middleware.ts` route protection

### Phase 3 — Core LMS
- [ ] Courses + enrollment
- [ ] Lessons + progress
- [ ] Assignments + submissions
- [ ] Quizzes + attempts

### Phase 4 — Commerce & comms
- [ ] Payments (Stripe)
- [ ] Notifications (polling / SSE)
- [ ] Chat (WebSocket)

### Phase 5 — Admin
- [ ] User management
- [ ] Analytics aggregates
- [ ] Support tickets

---

## apiClient enhancements

```ts
// Auth header
headers: { Authorization: `Bearer ${token}` }

// Unified ApiError
// Request ID logging
// multipart upload helper
```

---

## Type safety at boundary

Optional but recommended:

```ts
import { courseListSchema } from "@/validations/course.schema";
const data = courseListSchema.parse(response.data);
```

---

## BFF pattern (optional)

```
src/app/api/...   # Next.js route handlers
```

Use when hiding secrets or aggregating multiple backend calls.

---

## Mock file map

| Domain | Mock file |
|--------|-----------|
| Users | `data/mock/users.mock.ts` |
| Courses | `data/mock/courses.mock.ts` |
| Admin hub | `data/mock/admin-data.resolvers.ts` |
| Teacher hub | `data/mock/teacher-data.resolvers.ts` |

Remove mocks per service, not all at once.
