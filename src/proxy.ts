import type { UserRole } from "@prisma/client";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { canAccessPath } from "@/lib/constants/permissions";

const publicPaths = ["/login", "/api/auth/login", "/api/auth/logout", "/api/orders/track", "/api/track"];

function readPayload(token?: string) {
  if (!token) return null;
  const [, body] = token.split(".");
  if (!body) return null;
  try {
    return JSON.parse(atob(body.replaceAll("-", "+").replaceAll("_", "/"))) as { role: UserRole; exp: number };
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (publicPaths.some((path) => pathname.startsWith(path)) || pathname === "/") {
    return NextResponse.next();
  }

  const payload = readPayload(request.cookies.get("sankofa_session")?.value);
  const authenticated = payload && payload.exp > Math.floor(Date.now() / 1000);
  const isApi = pathname.startsWith("/api");

  if (!authenticated) {
    if (isApi) return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 });
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!isApi && !canAccessPath(payload.role, pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets|.*\\..*).*)"],
};
