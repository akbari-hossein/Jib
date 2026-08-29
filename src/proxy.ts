import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/config/app";

const protectedPrefixes = [
  "/home",
  "/transactions",
  "/budgets",
  "/goals",
  "/more",
  "/accounts",
  "/settings",
  "/rules",
  "/recurring",
  "/reports",
  "/export",
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

  if ((pathname === "/login" || pathname === "/signup") && hasSession) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/home/:path*",
    "/transactions/:path*",
    "/budgets/:path*",
    "/goals/:path*",
    "/more/:path*",
    "/accounts/:path*",
    "/settings/:path*",
    "/rules",
    "/rules/:path*",
    "/recurring",
    "/recurring/:path*",
    "/reports",
    "/reports/:path*",
    "/export",
    "/export/:path*",
    "/login",
    "/signup",
  ],
};
