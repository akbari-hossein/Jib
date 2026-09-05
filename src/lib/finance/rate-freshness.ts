import { parsePositiveInteger } from "@/lib/finance/rateProviders/config";
import { toPersianDigits } from "@/lib/currency/format";

const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;

export function readStaleAfterMs(env: NodeJS.Dict<string> = process.env): number {
  const hours = parsePositiveInteger(env.RATE_STALE_AFTER_HOURS) ?? 6;
  return hours * HOUR_MS;
}

export function readAlertAfterMs(env: NodeJS.Dict<string> = process.env): number {
  const hours = parsePositiveInteger(env.RATE_ALERT_AFTER_HOURS) ?? 24;
  return hours * HOUR_MS;
}

export type RateAge = {
  stale: boolean;
  hours: number;
  label: string;
};

export function describeRateAge(
  effectiveAt: Date,
  now: Date,
  staleAfterMs: number,
): RateAge {
  const elapsed = Math.max(0, now.getTime() - effectiveAt.getTime());
  const hours = elapsed / HOUR_MS;
  const stale = elapsed > staleAfterMs;
  return {
    stale,
    hours,
    label: `آخرین به‌روزرسانی: ${formatElapsed(elapsed)}`,
  };
}

function formatElapsed(elapsedMs: number): string {
  if (elapsedMs < MINUTE_MS) {
    return "همین الان";
  }
  if (elapsedMs < HOUR_MS) {
    const minutes = Math.max(1, Math.round(elapsedMs / MINUTE_MS));
    return `${toPersianDigits(minutes)} دقیقه پیش`;
  }
  if (elapsedMs < 24 * HOUR_MS) {
    const hours = Math.max(1, Math.round(elapsedMs / HOUR_MS));
    return `${toPersianDigits(hours)} ساعت پیش`;
  }
  const days = Math.max(1, Math.round(elapsedMs / (24 * HOUR_MS)));
  return `${toPersianDigits(days)} روز پیش`;
}

export function calculateRateMove(
  current: bigint,
  previous: bigint | null,
): { direction: "up" | "down" | "flat"; pct: number } | null {
  if (previous == null || previous <= 0n || current <= 0n) {
    return null;
  }
  if (current === previous) {
    return { direction: "flat", pct: 0 };
  }
  const diff = current > previous ? current - previous : previous - current;
  const pct = Number((diff * 100n) / previous);
  return {
    direction: current > previous ? "up" : "down",
    pct,
  };
}
