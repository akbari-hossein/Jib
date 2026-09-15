import { describe, expect, it } from "vitest";
import { addUtcDays } from "@/lib/subscription/addUtcDays";
import { calculateTrialEndsAt } from "@/lib/subscription/calculateTrialEndsAt";
import { DAY_MS, TRIAL_DAYS } from "@/lib/subscription/constants";

describe("calculateTrialEndsAt", () => {
  it("adds exactly 14 days to createdAt", () => {
    const createdAt = new Date("2026-09-01T08:30:00.000Z");
    const ends = calculateTrialEndsAt(createdAt);
    expect(ends.toISOString()).toBe("2026-09-15T08:30:00.000Z");
    expect(ends.getTime() - createdAt.getTime()).toBe(TRIAL_DAYS * DAY_MS);
  });

  it("keeps the same clock time across the 14-day window", () => {
    const createdAt = new Date("2026-01-31T23:59:59.999Z");
    expect(addUtcDays(createdAt, 14).toISOString()).toBe(calculateTrialEndsAt(createdAt).toISOString());
  });
});
