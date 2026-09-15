import { describe, expect, it } from "vitest";
import { calculateTrialDaysRemaining } from "@/lib/subscription/calculateTrialDaysRemaining";
import { shouldShowTrialReminder } from "@/lib/subscription/shouldShowTrialReminder";
import { DAY_MS } from "@/lib/subscription/constants";

describe("calculateTrialDaysRemaining", () => {
  const trialEndsAt = new Date("2026-09-15T00:00:00.000Z");

  it("returns 0 at the exact trialEndsAt instant", () => {
    expect(calculateTrialDaysRemaining(trialEndsAt, trialEndsAt)).toBe(0);
  });

  it("ceils a remaining fraction of a day to 1", () => {
    expect(calculateTrialDaysRemaining(new Date(trialEndsAt.getTime() - 1), trialEndsAt)).toBe(1);
  });

  it("returns 3 when three full days remain", () => {
    expect(calculateTrialDaysRemaining(new Date(trialEndsAt.getTime() - 3 * DAY_MS), trialEndsAt)).toBe(3);
  });

  it("never goes negative after expiry", () => {
    expect(calculateTrialDaysRemaining(new Date(trialEndsAt.getTime() + DAY_MS), trialEndsAt)).toBe(0);
  });
});

describe("shouldShowTrialReminder", () => {
  it("is true only on day 3 and day 1", () => {
    expect(shouldShowTrialReminder(3)).toBe(true);
    expect(shouldShowTrialReminder(1)).toBe(true);
    expect(shouldShowTrialReminder(2)).toBe(false);
    expect(shouldShowTrialReminder(14)).toBe(false);
    expect(shouldShowTrialReminder(0)).toBe(false);
    expect(shouldShowTrialReminder(4)).toBe(false);
  });
});
