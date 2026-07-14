import { NextResponse } from "next/server";

/**
 * Auth middleware placeholder.
 * When backend auth is ready: validate session and enforce role routes.
 */
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/student/:path*", "/teacher/:path*", "/admin/:path*"],
};
