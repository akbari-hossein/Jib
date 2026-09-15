import { describe, expect, it } from "vitest";
import { calculateNextPeriodEnd } from "@/lib/subscription/calculateNextPeriodEnd";
import { DAY_MS, PERIOD_DAYS } from "@/lib/subscription/constants";

describe("calculateNextPeriodEnd", () => {
  it("extends 30 days from now when there is no current period", () => {
    const now = new Date("2026-09-15T12:00:00.000Z");
    const next = calculateNextPeriodEnd(now, null);
    expect(next.getTime() - now.getTime()).toBe(PERIOD_DAYS * DAY_MS);
    expect(next.toISOString()).toBe("2026-10-15T12:00:00.000Z");
  });

  it("extends from now when approval happens at the exact expiry instant", () => {
    const now = new Date("2026-10-15T12:00:00.000Z");
    const next = calculateNextPeriodEnd(now, now);
    expect(next.toISOString()).toBe("2026-11-14T12:00:00.000Z");
  });

  it("extends from now after the paid period has already ended", () => {
    const now = new Date("2026-10-20T12:00:00.000Z");
    const expired = new Date("2026-10-15T12:00:00.000Z");
    expect(calculateNextPeriodEnd(now, expired).toISOString()).toBe("2026-11-19T12:00:00.000Z");
  });

  it("extends from currentPeriodEnd for early renewal instead of stacking from now", () => {
    const now = new Date("2026-10-01T12:00:00.000Z");
    const currentPeriodEnd = new Date("2026-10-15T12:00:00.000Z");
    const next = calculateNextPeriodEnd(now, currentPeriodEnd);
    expect(next.toISOString()).toBe("2026-11-14T12:00:00.000Z");
    expect(next.getTime() - now.getTime()).toBeGreaterThan(PERIOD_DAYS * DAY_MS);
  });
});
