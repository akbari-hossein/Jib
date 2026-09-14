import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/config/app";

const protectedPrefixes = [
  "/home",
  "/transactions",
  "/dang",
  "/budgets",
  "/goals",
  "/more",
  "/accounts",
  "/categories",
  "/settings",
  "/rules",
  "/recurring",
  "/reports",
  "/export",
  "/notifications",
  "/tools",
  "/admin",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/home/:path*",
    "/transactions/:path*",
    "/dang",
    "/dang/:path*",
    "/budgets/:path*",
    "/goals/:path*",
    "/more/:path*",
    "/accounts/:path*",
    "/categories",
    "/categories/:path*",
    "/settings/:path*",
    "/rules",
    "/rules/:path*",
    "/recurring",
    "/recurring/:path*",
    "/reports",
    "/reports/:path*",
    "/notifications",
    "/notifications/:path*",
    "/tools",
    "/tools/:path*",
    "/export",
    "/export/:path*",
    "/admin",
    "/admin/:path*",
    "/login",
    "/signup",
  ],
};
