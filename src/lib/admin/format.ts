import { groupThousands, toPersianDigits } from "@/lib/currency/format";
import {
  formatJalaliDay,
  getTehranJalaliDate,
  jalaliFromInstant,
  type JalaliDate,
} from "@/lib/dates/tehran";
import { JALALI_MONTHS } from "@/lib/labels";

export function formatCount(value: number): string {
  return toPersianDigits(groupThousands(value));
}

export function formatPercent(value: number): string {
  return `${toPersianDigits(Math.abs(Math.round(value * 10) / 10))}٪`;
}

export type CountTrend = {
  pct: number | null;
  direction: "up" | "down" | "flat" | "new";
};

export function countTrend(current: number, previous: number): CountTrend {
  if (previous <= 0) {
    return { pct: null, direction: current > 0 ? "new" : "flat" };
  }
  if (current === previous) {
    return { pct: 0, direction: "flat" };
  }
  const pct = ((current - previous) / previous) * 100;
  return {
    pct: Math.round(Math.abs(pct) * 10) / 10,
    direction: current > previous ? "up" : "down",
  };
}

export function trendCopy(trend: CountTrend, period: "day" | "week" | "month"): string {
  const previous =
    period === "day" ? "دیروز" : period === "week" ? "هفته قبل" : "ماه قبل";
  if (trend.direction === "new") {
    return period === "day" ? "اولین روز" : period === "week" ? "اولین هفته" : "اولین ماه";
  }
  if (trend.direction === "flat" || trend.pct == null) {
    return `مثل ${previous}`;
  }
  if (trend.direction === "up") {
    return `${formatPercent(trend.pct)} بیشتر از ${previous}`;
  }
  return `${formatPercent(trend.pct)} کمتر از ${previous}`;
}

export function formatJalaliAbsolute(date: Date, today = getTehranJalaliDate()): string {
  const jalali = jalaliFromInstant(date);
  return formatJalaliAbsoluteParts(jalali, today);
}

export function formatJalaliAbsoluteParts(date: JalaliDate, today: JalaliDate): string {
  const month = JALALI_MONTHS[date.month - 1] ?? "";
  const day = toPersianDigits(date.day);
  const year = toPersianDigits(date.year);
  if (date.year === today.year) {
    return `${day} ${month}`;
  }
  return `${day} ${month} ${year}`;
}

export function formatJalaliDateTime(date: Date, today = getTehranJalaliDate()): string {
  const day = formatJalaliDay(jalaliFromInstant(date), today);
  const time = new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
  return `${day}، ${time}`;
}

export function formatRelativeOrDate(date: Date | null, today = getTehranJalaliDate()): string {
  if (!date) {
    return "—";
  }
  return formatJalaliDay(jalaliFromInstant(date), today);
}
