import { describe, expect, it } from "vitest";
import {
  clampJalaliDay,
  diffDaysInclusive,
  formatTehranTime,
  getIncomeCycle,
  isLeapJalaliYear,
  formatJalaliRange,
  jalaliMonthLength,
  jalaliWeekStart,
  monthsRemainingForGoal,
  tehranMidnightUtc,
} from "@/lib/dates/tehran";

describe("jalali helpers", () => {
  it("knows leap Esfand", () => {
    expect(isLeapJalaliYear(1403)).toBe(true);
    expect(jalaliMonthLength(1403, 12)).toBe(30);
    expect(jalaliMonthLength(1402, 12)).toBe(29);
  });

  it("clamps payday 31 to month length", () => {
    expect(clampJalaliDay(1403, 12, 31)).toBe(30);
    expect(clampJalaliDay(1402, 12, 31)).toBe(29);
  });
});

describe("getIncomeCycle", () => {
  it("uses month end when payday is missing", () => {
    const cycle = getIncomeCycle({ year: 1404, month: 5, day: 20 }, null);
    expect(cycle.nextIncomeDate).toEqual({ year: 1404, month: 5, day: 31 });
    expect(cycle.remainingDays).toBe(12);
  });

  it("moves to next month when payday is today or earlier", () => {
    const cycle = getIncomeCycle({ year: 1404, month: 5, day: 15 }, 15);
    expect(cycle.nextIncomeDate.month).toBe(6);
    expect(cycle.nextIncomeDate.day).toBe(15);
  });

  it("keeps remaining days at least 1", () => {
    const lastDay = getIncomeCycle({ year: 1404, month: 5, day: 31 }, null);
    expect(lastDay.remainingDays).toBe(1);
  });

  it("uses next recurring income when payday is missing", () => {
    const cycle = getIncomeCycle(
      { year: 1404, month: 5, day: 20 },
      null,
      { year: 1404, month: 6, day: 5 },
    );
    expect(cycle.nextIncomeDate).toEqual({ year: 1404, month: 6, day: 5 });
    expect(cycle.remainingDays).toBe(17);
  });

  it("prefers payday over recurring income", () => {
    const cycle = getIncomeCycle(
      { year: 1404, month: 5, day: 10 },
      15,
      { year: 1404, month: 6, day: 5 },
    );
    expect(cycle.nextIncomeDate).toEqual({ year: 1404, month: 5, day: 15 });
  });
});

describe("monthsRemainingForGoal", () => {
  it("counts calendar months until the target", () => {
    expect(
      monthsRemainingForGoal(
        { year: 1404, month: 1, day: 1 },
        { year: 1404, month: 10, day: 1 },
      ),
    ).toBe(9);
  });
});

describe("formatTehranTime", () => {
  it("formats Tehran clock time with Persian digits", () => {
    const eight = new Date(tehranMidnightUtc({ year: 1403, month: 1, day: 1 }).getTime() + 8 * 60 * 60 * 1000);
    expect(formatTehranTime(eight)).toBe("۰۸:۰۰");
  });
});

describe("tehranMidnightUtc", () => {
  it("is 3.5 hours before UTC midnight of the Gregorian day", () => {
    // 1 Farvardin 1403 = 20 March 2024
    expect(tehranMidnightUtc({ year: 1403, month: 1, day: 1 }).toISOString()).toBe(
      "2024-03-19T20:30:00.000Z",
    );
  });

  it("keeps consecutive Jalali days 24 hours apart", () => {
    const first = tehranMidnightUtc({ year: 1404, month: 5, day: 1 });
    const next = tehranMidnightUtc({ year: 1404, month: 5, day: 2 });
    expect(next.getTime() - first.getTime()).toBe(86_400_000);
  });
});

describe("jalaliWeekStart", () => {
  it("starts the Iranian week on Saturday", () => {
    // 1 Farvardin 1403 = Wednesday 20 March 2024
    expect(jalaliWeekStart({ year: 1403, month: 1, day: 1 })).toEqual({
      year: 1402,
      month: 12,
      day: 26,
    });
  });

  it("keeps Saturday as the start of its own week", () => {
    const saturday = { year: 1402, month: 12, day: 26 };
    expect(jalaliWeekStart(saturday)).toEqual(saturday);
  });
});

describe("formatJalaliRange", () => {
  it("collapses a same-month range", () => {
    expect(
      formatJalaliRange({ year: 1404, month: 5, day: 10 }, { year: 1404, month: 5, day: 16 }),
    ).toBe("۱۰ تا ۱۶ مرداد");
  });
});

describe("diffDaysInclusive", () => {
  it("includes both ends", () => {
    expect(
      diffDaysInclusive(
        { year: 1404, month: 1, day: 1 },
        { year: 1404, month: 1, day: 1 },
      ),
    ).toBe(1);
  });
});
