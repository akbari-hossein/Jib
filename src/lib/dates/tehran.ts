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

export function jalaliWeekStart(date: JalaliDate): JalaliDate {
  const gregorian = toGregorian(date.year, date.month, date.day);
  const weekday = new Date(Date.UTC(gregorian.gy, gregorian.gm - 1, gregorian.gd)).getUTCDay();
  const daysSinceSaturday = (weekday + 1) % 7;
  return addJalaliDays(date, -daysSinceSaturday);
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
  nextRecurringIncome: JalaliDate | null = null,
): IncomeCycle {
  if (incomeDayOfMonth != null) {
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

  if (nextRecurringIncome && compareJalaliDate(nextRecurringIncome, today) >= 0) {
    const previousIncomeDate = addJalaliMonths(nextRecurringIncome, -1);
    return {
      previousIncomeDate,
      nextIncomeDate: nextRecurringIncome,
      remainingDays: Math.max(1, diffDaysInclusive(today, nextRecurringIncome)),
      daysInCycle: Math.max(1, diffDaysInclusive(previousIncomeDate, nextRecurringIncome) - 1),
    };
  }

  const nextIncomeDate = endOfJalaliMonth(today);
  const previousIncomeDate = addJalaliDays(
    { year: today.year, month: today.month, day: 1 },
    -1,
  );
  return {
    previousIncomeDate,
    nextIncomeDate,
    remainingDays: Math.max(1, diffDaysInclusive(today, nextIncomeDate)),
    daysInCycle: jalaliMonthLength(today.year, today.month),
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

const TEHRAN_OFFSET_MS = 3.5 * 60 * 60 * 1000;

export function tehranMidnightUtc(date: JalaliDate): Date {
  const gregorian = toGregorian(date.year, date.month, date.day);
  return new Date(Date.UTC(gregorian.gy, gregorian.gm - 1, gregorian.gd) - TEHRAN_OFFSET_MS);
}

export function jalaliFromInstant(date: Date): JalaliDate {
  return getTehranJalaliDate(date);
}

export function formatJalaliDay(date: JalaliDate, today: JalaliDate): string {
  if (isSameJalaliDay(date, today)) {
    return "امروز";
  }
  if (isSameJalaliDay(date, addJalaliDays(today, -1))) {
    return "دیروز";
  }

  const months = [
    "فروردین",
    "اردیبهشت",
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند",
  ] as const;
  const month = months[date.month - 1] ?? "";
  const day = String(date.day).replace(/[0-9]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]!);
  if (date.year !== today.year) {
    const year = String(date.year).replace(/[0-9]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]!);
    return `${day} ${month} ${year}`;
  }
  return `${day} ${month}`;
}

export function formatJalaliRange(from: JalaliDate, to: JalaliDate): string {
  const months = [
    "فروردین",
    "اردیبهشت",
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند",
  ] as const;
  const digit = (value: number) =>
    String(value).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]!);
  const fromMonth = months[from.month - 1] ?? "";
  const toMonth = months[to.month - 1] ?? "";

  if (from.year === to.year && from.month === to.month) {
    return `${digit(from.day)} تا ${digit(to.day)} ${fromMonth}`;
  }
  if (from.year === to.year) {
    return `${digit(from.day)} ${fromMonth} تا ${digit(to.day)} ${toMonth}`;
  }
  return `${digit(from.day)} ${fromMonth} ${digit(from.year)} تا ${digit(to.day)} ${toMonth} ${digit(to.year)}`;
}

export function isSameJalaliDay(left: JalaliDate, right: JalaliDate): boolean {
  return compareJalaliDate(left, right) === 0;
}

export function jalaliFromUtc(date: Date): JalaliDate {
  const jalaliDate = toJalaali(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  );
  return { year: jalaliDate.jy, month: jalaliDate.jm, day: jalaliDate.jd };
}
