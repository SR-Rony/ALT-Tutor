import { SESSION_COOKIE } from "@/constants/auth";

const ACCESS_KEY = "lms_access_token";
const REFRESH_KEY = "lms_refresh_token";

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

function canUseStorage() {
  return typeof window !== "undefined";
}

export function getAccessToken(): string | null {
  if (!canUseStorage()) return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (!canUseStorage()) return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setAuthTokens(tokens: AuthTokens, role?: string) {
  if (!canUseStorage()) return;
  localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);

  if (role) {
    document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(role)}; path=/; SameSite=Lax`;
  }
}

export function clearAuthTokens() {
  if (!canUseStorage()) return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  document.cookie = `${SESSION_COOKIE}=; path=/; Max-Age=0; SameSite=Lax`;
}
