import { addUtcDays } from "@/lib/subscription/addUtcDays";
import { PERIOD_DAYS } from "@/lib/subscription/constants";

export function calculateNextPeriodEnd(now: Date, currentPeriodEnd: Date | null): Date {
  const anchor =
    currentPeriodEnd && currentPeriodEnd.getTime() > now.getTime() ? currentPeriodEnd : now;
  return addUtcDays(anchor, PERIOD_DAYS);
}
