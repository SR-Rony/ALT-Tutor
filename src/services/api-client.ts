import { env } from "@/config";
import type { ApiError, ApiResponse } from "@/types";

class ApiClient {
  constructor(private readonly baseUrl: string) {}

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = {
        message: response.statusText || "Request failed",
        status: response.status,
      };
      throw error;
    }

    return response.json() as Promise<ApiResponse<T>>;
  }

  get<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  post<T>(endpoint: string, body?: unknown, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

export const apiClient = new ApiClient(env.apiBaseUrl);
