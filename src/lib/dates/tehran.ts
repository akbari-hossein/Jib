import { isLeapJalaaliYear, jalaaliMonthLength, toGregorian, toJalaali } from "jalaali-js";

export const TEHRAN_TIME_ZONE = "Asia/Tehran";

export type JalaliDate = {
  year: number;
  month: number;
  day: number;
};

export type DayPeriod = "morning" | "noon" | "evening" | "night";

function tehranParts(now: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TEHRAN_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
  };
}

export function getTehranGregorianDate(now = new Date()) {
  const { year, month, day, hour } = tehranParts(now);
  return { year, month, day, hour };
}

export function getTehranJalaliDate(now = new Date()): JalaliDate {
  const { year, month, day } = getTehranGregorianDate(now);
  const jalaliDate = toJalaali(year, month, day);
  return { year: jalaliDate.jy, month: jalaliDate.jm, day: jalaliDate.jd };
}

export function jalaliMonthLength(year: number, month: number): number {
  return jalaaliMonthLength(year, month);
}

export function isLeapJalaliYear(year: number): boolean {
  return isLeapJalaaliYear(year);
}

export function addJalaliMonths(date: JalaliDate, months: number): JalaliDate {
  const zeroBased = date.month - 1 + months;
  const year = date.year + Math.floor(zeroBased / 12);
  const month = ((zeroBased % 12) + 12) % 12 + 1;
  const maxDay = jalaliMonthLength(year, month);
  return { year, month, day: Math.min(date.day, maxDay) };
}

export function addJalaliDays(date: JalaliDate, days: number): JalaliDate {
  const gregorian = toGregorian(date.year, date.month, date.day);
  const utc = new Date(Date.UTC(gregorian.gy, gregorian.gm - 1, gregorian.gd + days));
  const jalaliDate = toJalaali(
    utc.getUTCFullYear(),
    utc.getUTCMonth() + 1,
    utc.getUTCDate(),
  );
  return { year: jalaliDate.jy, month: jalaliDate.jm, day: jalaliDate.jd };
}

export function compareJalaliDate(a: JalaliDate, b: JalaliDate): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

export function jalaliToEpochDay(date: JalaliDate): number {
  const gregorian = toGregorian(date.year, date.month, date.day);
  return Math.floor(Date.UTC(gregorian.gy, gregorian.gm - 1, gregorian.gd) / 86_400_000);
}

export function diffDaysInclusive(from: JalaliDate, to: JalaliDate): number {
  return jalaliToEpochDay(to) - jalaliToEpochDay(from) + 1;
}

export function clampJalaliDay(year: number, month: number, day: number): number {
  return Math.min(Math.max(day, 1), jalaliMonthLength(year, month));
}

export function getDayPeriod(now = new Date()): DayPeriod {
  const { hour } = getTehranGregorianDate(now);
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "noon";
  if (hour >= 17 && hour < 20) return "evening";
  return "night";
}

export function greetingForPeriod(period: DayPeriod): string {
  switch (period) {
    case "morning":
      return "صبح بخیر";
    case "noon":
      return "ظهر بخیر";
    case "evening":
      return "عصر بخیر";
    case "night":
      return "شب بخیر";
  }
}

export type IncomeCycle = {
  previousIncomeDate: JalaliDate;
  nextIncomeDate: JalaliDate;
  remainingDays: number;
  daysInCycle: number;
};

function endOfJalaliMonth(date: JalaliDate): JalaliDate {
  return { year: date.year, month: date.month, day: jalaliMonthLength(date.year, date.month) };
}

function dateOnOrAfter(from: JalaliDate, dayOfMonth: number): JalaliDate {
  const dayThisMonth = clampJalaliDay(from.year, from.month, dayOfMonth);
  if (from.day < dayThisMonth) {
    return { year: from.year, month: from.month, day: dayThisMonth };
  }
  const nextMonth = addJalaliMonths({ year: from.year, month: from.month, day: 1 }, 1);
  return {
    year: nextMonth.year,
    month: nextMonth.month,
    day: clampJalaliDay(nextMonth.year, nextMonth.month, dayOfMonth),
  };
}

function dateBefore(from: JalaliDate, dayOfMonth: number): JalaliDate {
  const previousMonth = addJalaliMonths({ year: from.year, month: from.month, day: 1 }, -1);
  return {
    year: previousMonth.year,
    month: previousMonth.month,
    day: clampJalaliDay(previousMonth.year, previousMonth.month, dayOfMonth),
  };
}

export function getIncomeCycle(
  today: JalaliDate,
  incomeDayOfMonth: number | null,
): IncomeCycle {
  if (incomeDayOfMonth == null) {
    const nextIncomeDate = endOfJalaliMonth(today);
    const previousIncomeDate = addJalaliDays(
      { year: today.year, month: today.month, day: 1 },
      -1,
    );
    const daysInCycle = jalaliMonthLength(today.year, today.month);
    return {
      previousIncomeDate,
      nextIncomeDate,
      remainingDays: Math.max(1, diffDaysInclusive(today, nextIncomeDate)),
      daysInCycle,
    };
  }

  const nextIncomeDate = dateOnOrAfter(today, incomeDayOfMonth);
  const previousIncomeDate = dateBefore(nextIncomeDate, incomeDayOfMonth);
  const daysInCycle = Math.max(1, diffDaysInclusive(previousIncomeDate, nextIncomeDate) - 1);

  return {
    previousIncomeDate,
    nextIncomeDate,
    remainingDays: Math.max(1, diffDaysInclusive(today, nextIncomeDate)),
    daysInCycle,
  };
}

export function monthsRemainingForGoal(from: JalaliDate, target: JalaliDate): number {
  if (compareJalaliDate(target, from) <= 0) {
    return 1;
  }

  let months = (target.year - from.year) * 12 + (target.month - from.month);
  if (target.day < from.day) {
    months -= 1;
  }

  return Math.max(1, months);
}

export function gregorianUtcFromJalali(date: JalaliDate): Date {
  const gregorian = toGregorian(date.year, date.month, date.day);
  return new Date(Date.UTC(gregorian.gy, gregorian.gm - 1, gregorian.gd, 12));
}

export function jalaliFromUtc(date: Date): JalaliDate {
  const jalaliDate = toJalaali(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  );
  return { year: jalaliDate.jy, month: jalaliDate.jm, day: jalaliDate.jd };
}
