import { describe, expect, it } from "vitest";
import { getHolidayForJalaliDate, IRANIAN_HOLIDAYS } from "@/lib/dates/iranian-holidays";
import { jalaliWeekdayIndex } from "@/lib/dates/tehran";

describe("getHolidayForJalaliDate", () => {
  it("returns the official holiday for a zero-padded Jalali date", () => {
    expect(getHolidayForJalaliDate("1404-12-29")).toEqual({
      jalaliDate: "1404-12-29",
      title: "روز ملی شدن صنعت نفت ایران",
    });
  });

  it("returns null for ordinary days, including Thursdays and Fridays not in the dataset", () => {
    expect(getHolidayForJalaliDate("1404-06-18")).toBeNull();
    expect(jalaliWeekdayIndex({ year: 1404, month: 6, day: 20 })).toBe(5);
    expect(getHolidayForJalaliDate("1404-06-20")).toBeNull();
    expect(jalaliWeekdayIndex({ year: 1404, month: 6, day: 21 })).toBe(6);
    expect(getHolidayForJalaliDate("1404-06-21")).toBeNull();
  });

  it("is keyed for O(1) lookup and stays inside the vendored 1403–1410 window", () => {
    const keys = IRANIAN_HOLIDAYS.map((holiday) => holiday.jalaliDate);
    expect(new Set(keys).size).toBe(keys.length);
    expect(getHolidayForJalaliDate("1402-01-01")).toBeNull();
    expect(getHolidayForJalaliDate("1411-01-01")).toBeNull();
    expect(IRANIAN_HOLIDAYS.every((holiday) => /^140[3-9]-|1410-/.test(holiday.jalaliDate))).toBe(
      true,
    );
  });
});
