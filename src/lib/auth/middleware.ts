import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { canAccessPath } from "@/lib/constants/permissions";
import { verifySession } from "./jwt";
import { sessionCookieName } from "./session";

const publicPaths = ["/login", "/api/auth/login", "/api/auth/logout", "/api/orders/track"];

export function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (publicPaths.some((path) => pathname.startsWith(path)) || pathname === "/") {
    return NextResponse.next();
  }

  const session = verifySession(request.cookies.get(sessionCookieName)?.value);
  const isApi = pathname.startsWith("/api");

  if (!session) {
    if (isApi) {
      return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!isApi && !canAccessPath(session.role, pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}
