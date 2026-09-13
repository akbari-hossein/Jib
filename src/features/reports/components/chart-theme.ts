import { formatCompactToman, formatToman, toPersianDigits } from "@/lib/currency/format";

export const CHART_COLOR = {
  income: "var(--income)",
  expense: "var(--expense)",
  savings: "var(--savings)",
  muted: "color-mix(in oklab, var(--foreground) 22%, transparent)",
  tick: "color-mix(in oklab, var(--foreground) 45%, transparent)",
} as const;

export const CHART_AXIS_TICK = {
  fill: CHART_COLOR.tick,
  fontSize: 11,
  fontFamily: "var(--font-vazirmatn), Tahoma, sans-serif",
} as const;

export function formatChartToman(value: number): string {
  if (!Number.isFinite(value)) {
    return "";
  }
  return formatCompactToman(BigInt(Math.round(value))).replace(" تومان", "");
}

export function formatChartTomanFull(value: number): string {
  if (!Number.isFinite(value)) {
    return "";
  }
  return formatToman(BigInt(Math.round(value)));
}

export function formatChartPercent(value: number): string {
  return `${toPersianDigits(Math.round(value))}٪`;
}
