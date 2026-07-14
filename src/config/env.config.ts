export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api",
  useMockApi: process.env.NEXT_PUBLIC_USE_MOCK_API !== "false",
} as const;
