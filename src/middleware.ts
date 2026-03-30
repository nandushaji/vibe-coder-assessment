import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin/session-token";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (token && (await verifyAdminSessionToken(token))) {
      return NextResponse.redirect(new URL("/admin/refunds", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/admin") {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (token && (await verifyAdminSessionToken(token))) {
      return NextResponse.redirect(new URL("/admin/refunds", request.url));
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (pathname.startsWith("/admin/")) {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token || !(await verifyAdminSessionToken(token))) {
      const res = NextResponse.redirect(new URL("/admin/login", request.url));
      res.cookies.set(ADMIN_SESSION_COOKIE, "", {
        path: "/admin",
        maxAge: 0,
      });
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
