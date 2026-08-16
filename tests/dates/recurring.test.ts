import { describe, expect, it } from "vitest";
import { parseJalaliForm } from "@/lib/dates/jalali-form";
import { addRecurringOccurrence, firstOccurrenceOnOrAfter } from "@/lib/dates/recurring";

describe("firstOccurrenceOnOrAfter", () => {
  it("keeps a future start date", () => {
    expect(
      firstOccurrenceOnOrAfter(
        { year: 1404, month: 6, day: 1 },
        { year: 1404, month: 5, day: 20 },
        "MONTHLY",
        1,
        1,
      ),
    ).toEqual({ year: 1404, month: 6, day: 1 });
  });

  it("advances a past monthly date to the next month", () => {
    expect(
      firstOccurrenceOnOrAfter(
        { year: 1404, month: 5, day: 1 },
        { year: 1404, month: 5, day: 20 },
        "MONTHLY",
        1,
        1,
      ),
    ).toEqual({ year: 1404, month: 6, day: 1 });
  });

  it("clamps day 31 in short months", () => {
    expect(addRecurringOccurrence({ year: 1403, month: 6, day: 31 }, "MONTHLY", 1, 31)).toEqual({
      year: 1403,
      month: 7,
      day: 30,
    });
  });

  it("adds a week", () => {
    expect(addRecurringOccurrence({ year: 1404, month: 5, day: 10 }, "WEEKLY")).toEqual({
      year: 1404,
      month: 5,
      day: 17,
    });
  });
});

describe("parseJalaliForm", () => {
  it("returns null when all parts are empty", () => {
    const data = new FormData();
    expect(parseJalaliForm(data, "target")).toEqual({ ok: true, value: null });
  });

  it("clamps overflow days", () => {
    const data = new FormData();
    data.set("targetYear", "۱۴۰۲");
    data.set("targetMonth", "12");
    data.set("targetDay", "31");
    expect(parseJalaliForm(data, "target")).toEqual({
      ok: true,
      value: { year: 1402, month: 12, day: 29 },
    });
  });

  it("rejects a partial date", () => {
    const data = new FormData();
    data.set("targetYear", "1404");
    expect(parseJalaliForm(data, "target")).toEqual({ ok: false });
  });
});
