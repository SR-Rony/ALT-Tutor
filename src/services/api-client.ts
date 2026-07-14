import { env } from "@/config";
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from "@/lib/auth-tokens";
import type { ApiError, ApiResponse, AuthTokensResponse } from "@/types";
import { normalizeApiMessage } from "./auth.mapper";

type RequestOptions = RequestInit & {
  /** Skip Authorization header (login/register/refresh) */
  skipAuth?: boolean;
  /** Internal: avoid infinite refresh loops */
  _retry?: boolean;
};

class ApiClient {
  private refreshPromise: Promise<string | null> | null = null;

  constructor(private readonly baseUrl: string) {}

  private buildHeaders(options: RequestOptions): Headers {
    const headers = new Headers(options.headers);

    if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    if (!options.skipAuth) {
      const token = getAccessToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  }

  private async parseError(response: Response): Promise<ApiError> {
    let message = response.statusText || "Request failed";

    try {
      const body = (await response.json()) as { message?: unknown };
      message = normalizeApiMessage(body.message) || message;
    } catch {
      // ignore non-JSON error bodies
    }

    return { message, status: response.status };
  }

  private async refreshAccessToken(): Promise<string | null> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    if (!this.refreshPromise) {
      this.refreshPromise = (async () => {
        try {
          const response = await fetch(`${this.baseUrl}/auth/refresh-token`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${refreshToken}`,
            },
          });

          if (!response.ok) {
            clearAuthTokens();
            return null;
          }

          const json = (await response.json()) as ApiResponse<AuthTokensResponse>;
          const tokens = json.data;
          if (!tokens?.accessToken || !tokens?.refreshToken) {
            clearAuthTokens();
            return null;
          }

          setAuthTokens(tokens);
          return tokens.accessToken;
        } catch {
          clearAuthTokens();
          return null;
        } finally {
          this.refreshPromise = null;
        }
      })();
    }

    return this.refreshPromise;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: this.buildHeaders(options),
    });

    if (response.status === 401 && !options.skipAuth && !options._retry) {
      const nextAccess = await this.refreshAccessToken();
      if (nextAccess) {
        return this.request<T>(endpoint, { ...options, _retry: true });
      }
    }

    if (!response.ok) {
      throw await this.parseError(response);
    }

    if (response.status === 204) {
      return { data: undefined as T };
    }

    return response.json() as Promise<ApiResponse<T>>;
  }

  get<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  post<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient(env.apiBaseUrl);
