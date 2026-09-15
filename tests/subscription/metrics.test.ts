import { describe, expect, it } from "vitest";
import {
  assembleAdminMetrics,
  bucketRevenueByJalaliMonth,
  computeMrr,
  currentJalaliMonthRange,
  jalaliMonthKey,
  lastSixJalaliMonthKeys,
  snapshotApprovalAmount,
  sumApprovedRevenue,
} from "@/lib/subscription/metrics";
import { tehranMidnightUtc } from "@/lib/dates/tehran";

describe("approval amount snapshot", () => {
  it("stores the subscription price at approval, not a later live price", () => {
    const historicalPrice = 49_000;
    const livePrice = 59_000;
    expect(snapshotApprovalAmount(historicalPrice)).toBe(49_000);
    expect(snapshotApprovalAmount(historicalPrice)).not.toBe(livePrice);
  });
});

describe("admin metrics aggregation", () => {
  it("sums amountToman snapshots even when historical prices differ", () => {
    const receipts = [
      { amountToman: 49_000 },
      { amountToman: 59_000 },
      { amountToman: 59_000 },
    ];
    expect(sumApprovedRevenue(receipts)).toBe(167_000);
  });

  it("computes MRR from the live price and active count, not snapshots", () => {
    expect(computeMrr(3, 59_000)).toBe(177_000);
    expect(computeMrr(3, 59_000)).not.toBe(sumApprovedRevenue([{ amountToman: 49_000 }]));
  });

  it("buckets revenue onto Jalali month boundaries including year wrap", () => {
    const now = new Date("2026-03-25T12:00:00.000Z");
    const keys = lastSixJalaliMonthKeys(now);
    expect(keys).toEqual(["1404-08", "1404-09", "1404-10", "1404-11", "1404-12", "1405-01"]);

    const esfand = tehranMidnightUtc({ year: 1404, month: 12, day: 15 });
    const farvardin = tehranMidnightUtc({ year: 1405, month: 1, day: 2 });
    const outside = tehranMidnightUtc({ year: 1404, month: 7, day: 1 });

    const buckets = bucketRevenueByJalaliMonth(
      [
        { amountToman: 49_000, reviewedAt: esfand },
        { amountToman: 59_000, reviewedAt: farvardin },
        { amountToman: 59_000, reviewedAt: outside },
      ],
      keys,
    );

    expect(buckets.find((row) => row.jalaliMonth === "1404-12")?.totalToman).toBe(49_000);
    expect(buckets.find((row) => row.jalaliMonth === "1405-01")?.totalToman).toBe(59_000);
    expect(buckets.find((row) => row.jalaliMonth === "1404-08")?.totalToman).toBe(0);
    expect(sumApprovedRevenue(buckets.map((row) => ({ amountToman: row.totalToman })))).toBe(108_000);
  });

  it("keeps current-month revenue inside Tehran Jalali month bounds", () => {
    const now = tehranMidnightUtc({ year: 1404, month: 6, day: 20 });
    now.setUTCHours(now.getUTCHours() + 8);
    const range = currentJalaliMonthRange(now);
    const firstOfMonth = tehranMidnightUtc({ year: 1404, month: 6, day: 1 });
    const nextMonth = tehranMidnightUtc({ year: 1404, month: 7, day: 1 });
    expect(range.start.getTime()).toBe(firstOfMonth.getTime());
    expect(range.end.getTime()).toBe(nextMonth.getTime());
    expect(jalaliMonthKey(range.start)).toBe("1404-06");
  });

  it("assembles the metrics payload without recomputing totals from the live price", () => {
    const metrics = assembleAdminMetrics({
      activeSubscribers: 2,
      trialingUsers: 4,
      pendingReview: 1,
      expiredOrRejected: 3,
      currentPriceToman: 59_000,
      totalRevenueToman: 49_000 + 59_000,
      revenueThisMonthToman: 59_000,
      newSubscribersThisMonth: 1,
      revenueByMonth: [{ jalaliMonth: "1404-06", totalToman: 59_000 }],
    });

    expect(metrics.mrr).toBe(118_000);
    expect(metrics.totalRevenueToman).toBe(108_000);
    expect(metrics.totalRevenueToman).not.toBe(metrics.activeSubscribers * 59_000);
  });
});
