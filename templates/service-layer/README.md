# Service Layer Template

## Root service (student/public)

```ts
// src/services/course.service.ts
import { env } from "@/config";
import { apiClient } from "./api-client";
import { mockCourses } from "@/data/mock/courses.mock";
import { sleep } from "@/utils";

export const courseService = {
  async getAll() {
    if (env.useMockApi) {
      await sleep(300);
      return mockCourses;
    }
    const response = await apiClient.get<Course[]>("/courses");
    return response.data;
  },
};
```

## Admin service

```ts
// src/services/admin/admin-support-management.service.ts
import { resolveAdminSupportManagement } from "@/data/mock/admin-data.resolvers";
import { fetchAdminData } from "./create-admin-service";

export const adminSupportManagementService = {
  async getSupportTickets() {
    return fetchAdminData(() => resolveAdminSupportManagement());
  },
};
```

## Rules

1. **Never** call `fetch` directly from components — always go through services.
2. Keep mock and real API behind `env.useMockApi`.
3. One types file per domain, paired with service + mock.
