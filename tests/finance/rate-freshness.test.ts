import { describe, expect, it } from "vitest";
import { describeRateAge, calculateRateMove, readStaleAfterMs, readAlertAfterMs } from "@/lib/finance/rate-freshness";

describe("describeRateAge", () => {
  const now = new Date("2026-09-04T12:00:00.000Z");
  const sixHours = 6 * 3_600_000;

  it("is not stale inside the threshold", () => {
    const age = describeRateAge(new Date("2026-09-04T10:00:00.000Z"), now, sixHours);
    expect(age.stale).toBe(false);
    expect(age.label).toContain("ساعت پیش");
  });

  it("marks a rate stale after the configured window", () => {
    const age = describeRateAge(new Date("2026-09-04T04:00:00.000Z"), now, sixHours);
    expect(age.stale).toBe(true);
    expect(age.label).toMatch(/آخرین به‌روزرسانی/);
  });
});

describe("rate freshness env", () => {
  it("defaults stale to 6 hours and alert to 24 hours", () => {
    expect(readStaleAfterMs({})).toBe(6 * 3_600_000);
    expect(readAlertAfterMs({})).toBe(24 * 3_600_000);
  });
});

describe("calculateRateMove", () => {
  it("returns flat when the rate did not change", () => {
    expect(calculateRateMove(80_000_000n, 80_000_000n)).toEqual({ direction: "flat", pct: 0 });
  });

  it("returns null without a previous rate so the UI stays quiet", () => {
    expect(calculateRateMove(80_000_000n, null)).toBeNull();
  });
});
