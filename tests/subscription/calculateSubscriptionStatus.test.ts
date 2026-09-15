import { describe, expect, it } from "vitest";
import { calculateSubscriptionStatus } from "@/lib/subscription/calculateSubscriptionStatus";

const trialEndsAt = new Date("2026-09-15T00:00:00.000Z");
const periodEnd = new Date("2026-10-15T12:00:00.000Z");

describe("calculateSubscriptionStatus", () => {
  it("is ACTIVE while now is before currentPeriodEnd even if trial ended", () => {
    expect(
      calculateSubscriptionStatus({
        now: new Date("2026-10-15T11:59:59.999Z"),
        trialEndsAt: new Date("2026-01-01T00:00:00.000Z"),
        currentPeriodEnd: periodEnd,
        latestReceiptStatus: "APPROVED",
      }),
    ).toBe("ACTIVE");
  });

  it("leaves ACTIVE at the exact currentPeriodEnd instant", () => {
    expect(
      calculateSubscriptionStatus({
        now: periodEnd,
        trialEndsAt,
        currentPeriodEnd: periodEnd,
        latestReceiptStatus: "APPROVED",
      }),
    ).toBe("EXPIRED");
  });

  it("is PENDING_REVIEW when a receipt is waiting, including after trial end", () => {
    expect(
      calculateSubscriptionStatus({
        now: new Date("2026-09-20T00:00:00.000Z"),
        trialEndsAt,
        currentPeriodEnd: null,
        latestReceiptStatus: "PENDING",
      }),
    ).toBe("PENDING_REVIEW");
  });

  it("treats a pending receipt as PENDING_REVIEW even after many rejections", () => {
    expect(
      calculateSubscriptionStatus({
        now: new Date("2026-09-20T00:00:00.000Z"),
        trialEndsAt,
        currentPeriodEnd: null,
        latestReceiptStatus: "PENDING",
      }),
    ).toBe("PENDING_REVIEW");
  });

  it("is TRIALING before trialEndsAt when there is no paid period", () => {
    expect(
      calculateSubscriptionStatus({
        now: new Date("2026-09-14T23:59:59.999Z"),
        trialEndsAt,
        currentPeriodEnd: null,
        latestReceiptStatus: null,
      }),
    ).toBe("TRIALING");
  });

  it("is not TRIALING at the exact trialEndsAt instant", () => {
    expect(
      calculateSubscriptionStatus({
        now: trialEndsAt,
        trialEndsAt,
        currentPeriodEnd: null,
        latestReceiptStatus: null,
      }),
    ).toBe("EXPIRED");
  });

  it("is REJECTED after trial if the latest receipt was rejected", () => {
    expect(
      calculateSubscriptionStatus({
        now: new Date("2026-09-16T00:00:00.000Z"),
        trialEndsAt,
        currentPeriodEnd: null,
        latestReceiptStatus: "REJECTED",
      }),
    ).toBe("REJECTED");
  });

  it("stays TRIALING if a receipt is rejected while the trial is still open", () => {
    expect(
      calculateSubscriptionStatus({
        now: new Date("2026-09-10T00:00:00.000Z"),
        trialEndsAt,
        currentPeriodEnd: null,
        latestReceiptStatus: "REJECTED",
      }),
    ).toBe("TRIALING");
  });

  it("is EXPIRED when trial and paid period are over with no pending or rejected latest receipt", () => {
    expect(
      calculateSubscriptionStatus({
        now: new Date("2026-09-16T00:00:00.000Z"),
        trialEndsAt,
        currentPeriodEnd: new Date("2026-09-01T00:00:00.000Z"),
        latestReceiptStatus: "APPROVED",
      }),
    ).toBe("EXPIRED");
  });
});
