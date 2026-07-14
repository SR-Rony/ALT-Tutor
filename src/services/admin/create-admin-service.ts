import { env } from "@/config";

export async function fetchAdminData<T>(resolver: () => T): Promise<T> {
  if (env.useMockApi) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return resolver();
  }

  return resolver();
}
