import { DAY_MS } from "@/lib/subscription/constants";

export function addUtcDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}
