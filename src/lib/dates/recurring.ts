import type { RecurringFrequency } from "@prisma/client";
import {
  addJalaliDays,
  addJalaliMonths,
  clampJalaliDay,
  compareJalaliDate,
  type JalaliDate,
} from "@/lib/dates/tehran";

export function addRecurringOccurrence(
  date: JalaliDate,
  frequency: RecurringFrequency,
  interval = 1,
  dayOfMonth?: number | null,
): JalaliDate {
  const step = Math.max(1, interval);

  if (frequency === "WEEKLY") {
    return addJalaliDays(date, 7 * step);
  }

  const months = frequency === "YEARLY" ? 12 * step : step;
  const next = addJalaliMonths({ year: date.year, month: date.month, day: 1 }, months);
  return {
    year: next.year,
    month: next.month,
    day: clampJalaliDay(next.year, next.month, dayOfMonth ?? date.day),
  };
}

export function firstOccurrenceOnOrAfter(
  start: JalaliDate,
  today: JalaliDate,
  frequency: RecurringFrequency,
  interval = 1,
  dayOfMonth?: number | null,
): JalaliDate {
  let current =
    frequency === "MONTHLY" && dayOfMonth
      ? { year: start.year, month: start.month, day: clampJalaliDay(start.year, start.month, dayOfMonth) }
      : start;

  while (compareJalaliDate(current, today) < 0) {
    current = addRecurringOccurrence(current, frequency, interval, dayOfMonth);
  }

  return current;
}
