import {
  APP_DESCRIPTION,
  APP_NAME,
  APP_NAME_EN,
  APP_TAGLINE,
} from "@/lib/config/app";

const FALLBACK_SITE_URL = "http://localhost:3000";

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) {
    return FALLBACK_SITE_URL;
  }
  return raw.replace(/\/+$/, "");
}

export function absoluteUrl(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") {
    return getSiteUrl();
  }
  return `${getSiteUrl()}${normalized}`;
}

export const SITE = {
  name: APP_NAME,
  nameEn: APP_NAME_EN,
  brand: `${APP_NAME_EN} — ${APP_NAME}`,
  tagline: APP_TAGLINE,
  description: APP_DESCRIPTION,
  locale: "fa_IR",
  language: "fa",
} as const;

export const PUBLIC_PATHS = [
  "/",
  "/features",
  "/about",
  "/faq",
  "/privacy",
  "/terms",
  "/budgeting",
  "/saving",
  "/expense-tracking",
] as const;

export const PRIVATE_PATH_PREFIXES = [
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
  "/rates",
  "/notifications",
  "/export",
  "/admin",
  "/login",
  "/signup",
  "/offline",
  "/api",
] as const;
