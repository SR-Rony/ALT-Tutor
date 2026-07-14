import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/constants/auth";

const ROLE_PREFIXES: Record<string, string> = {
  student: "/student",
  teacher: "/teacher",
  admin: "/admin",
};

/**
 * Soft gate using the session cookie set on login.
 * JWT validity is re-checked client-side via /users/me in RequireAuth.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get(SESSION_COOKIE)?.value;

  if (!role) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const allowedPrefix = ROLE_PREFIXES[role];
  if (allowedPrefix && !(pathname === allowedPrefix || pathname.startsWith(`${allowedPrefix}/`))) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = allowedPrefix;
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/student/:path*", "/teacher/:path*", "/admin/:path*"],
};
