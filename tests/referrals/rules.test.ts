import { describe, expect, it } from "vitest";
import { capReferralReward, daysForReferralNumber } from "@/lib/referrals/rules";
import { getTehranJalaliDate } from "@/lib/dates/tehran";
import { calculateTrialEndsAt } from "@/lib/subscription/calculateTrialEndsAt";
import { addUtcDays } from "@/lib/subscription/addUtcDays";

describe("referral rewards", () => {
  it("gives new referred users a 14-day trial", () => {
    const createdAt = new Date("2026-10-01T12:00:00.000Z");
    const baseTrial = calculateTrialEndsAt(createdAt);
    expect(addUtcDays(baseTrial, 7).getTime() - createdAt.getTime()).toBe(14 * 24 * 60 * 60 * 1000);
  });
  it("repeats the 7/7/16 day reward cycle", () => {
    expect(Array.from({ length: 9 }, (_, index) => daysForReferralNumber(index + 1))).toEqual([
      7, 7, 16, 7, 7, 16, 7, 7, 16,
    ]);
  });

  it("caps rewards at 90 days and truncates the final grant", () => {
    expect(capReferralReward(16, 80)).toBe(10);
    expect(capReferralReward(7, 90)).toBe(0);
    expect(capReferralReward(7, 83)).toBe(7);
  });

  it("uses the Tehran solar year at the year boundary", () => {
    expect(getTehranJalaliDate(new Date("2026-03-20T20:29:59.000Z")).year).toBe(1404);
    expect(getTehranJalaliDate(new Date("2026-03-20T20:30:00.000Z")).year).toBe(1405);
  });
});
