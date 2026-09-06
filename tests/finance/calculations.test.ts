import { describe, expect, it } from "vitest";
import { gregorianUtcFromJalali } from "@/lib/dates/tehran";
import {
  assembleDashboard,
  calculateAvailableMoney,
  calculateBudgetUsage,
  calculateDailyAllowance,
  calculateGoalProgress,
  calculateMonthlyChange,
  calculateRequiredSavings,
  calculateSavingsRate,
  sumLiquidBalance,
  sumPlannedExpenses,
  sumReservedForGoals,
} from "@/lib/finance";

describe("available money", () => {
  it("excludes savings accounts from liquid balance", () => {
    const liquid = sumLiquidBalance([
      { balance: 8_000_000n, isActive: true, includeInAvailable: true },
      { balance: 4_000_000n, isActive: true, includeInAvailable: false },
    ]);
    expect(liquid).toBe(8_000_000n);
  });

  it("does not double-count goals linked to an account", () => {
    const reserved = sumReservedForGoals([
      {
        currentAmount: 1_200_000n,
        targetAmount: 10_000_000n,
        targetDate: null,
        accountId: null,
        isArchived: false,
      },
      {
        currentAmount: 3_000_000n,
        targetAmount: 10_000_000n,
        targetDate: null,
        accountId: "sav_1",
        isArchived: false,
      },
    ]);
    expect(reserved).toBe(1_200_000n);
  });

  it("subtracts planned, reserved, and required savings", () => {
    expect(
      calculateAvailableMoney({
        liquidBalance: 12_000_000n,
        reservedForGoals: 1_200_000n,
        plannedExpenses: 1_500_000n,
        requiredSavings: 880_000n,
      }),
    ).toBe(8_420_000n);
  });
});

describe("planned expenses", () => {
  it("keeps only items due before the next income", () => {
    const today = gregorianUtcFromJalali({ year: 1404, month: 5, day: 1 });
    const nextIncome = gregorianUtcFromJalali({ year: 1404, month: 5, day: 15 });
    const sum = sumPlannedExpenses(
      [
        {
          amount: 1_000_000n,
          isActive: true,
          nextOccurrence: gregorianUtcFromJalali({ year: 1404, month: 5, day: 10 }),
        },
        {
          amount: 9_000_000n,
          isActive: true,
          nextOccurrence: gregorianUtcFromJalali({ year: 1404, month: 6, day: 1 }),
        },
      ],
      today,
      nextIncome,
    );
    expect(sum).toBe(1_000_000n);
  });
});

describe("daily allowance", () => {
  it("reconstructs start-of-day and subtracts today's spend", () => {
    const result = calculateDailyAllowance({
      availableMoney: 8_200_000n,
      spentToday: 200_000n,
      remainingDays: 13,
    });
    expect(result.startOfDayAvailable).toBe(8_400_000n);
    expect(result.dailyShare).toBe(646_153n);
    expect(result.displayRemainingToday).toBe(446_153n);
  });

  it("does not show a negative headline", () => {
    const result = calculateDailyAllowance({
      availableMoney: 0n,
      spentToday: 100_000n,
      remainingDays: 10,
    });
    expect(result.displayRemainingToday).toBe(0n);
  });
});

describe("required savings", () => {
  it("prorates unlinked dated goals across the income cycle", () => {
    const today = gregorianUtcFromJalali({ year: 1404, month: 1, day: 1 });
    const target = gregorianUtcFromJalali({ year: 1404, month: 10, day: 1 });
    const required = calculateRequiredSavings({
      goals: [
        {
          currentAmount: 0n,
          targetAmount: 9_000_000n,
          targetDate: target,
          accountId: null,
          isArchived: false,
        },
      ],
      today,
      remainingDays: 15,
      daysInCycle: 30,
    });
    expect(required).toBe(500_000n);
  });
});

describe("budget usage", () => {
  it("classifies healthy, near, and over without using floats", () => {
    expect(calculateBudgetUsage(2_800_000n, 4_000_000n)).toEqual({
      pct: 70,
      status: "healthy",
    });
    expect(calculateBudgetUsage(3_400_000n, 4_000_000n).status).toBe("near");
    expect(calculateBudgetUsage(4_100_000n, 4_000_000n).status).toBe("over");
  });
});

describe("savings rate", () => {
  it("returns null without income", () => {
    expect(calculateSavingsRate(0n, 1_000n)).toBeNull();
  });

  it("uses integer percent", () => {
    expect(calculateSavingsRate(30_000_000n, 21_000_000n)).toBe(30);
  });
});

describe("monthly change", () => {
  it("marks the first month as new", () => {
    expect(calculateMonthlyChange(1_000_000n, 0n)).toEqual({
      pct: null,
      direction: "new",
    });
  });

  it("uses integer percent without floats", () => {
    expect(calculateMonthlyChange(1_000_000n, 800_000n)).toEqual({
      pct: 25,
      direction: "up",
    });
    expect(calculateMonthlyChange(600_000n, 800_000n)).toEqual({
      pct: 25,
      direction: "down",
    });
    expect(calculateMonthlyChange(800_000n, 800_000n)).toEqual({
      pct: 0,
      direction: "flat",
    });
  });
});

describe("assembleDashboard", () => {
  it("composes available money, allowance, and monthly change", () => {
    const snapshot = assembleDashboard({
      accounts: [{ balance: 12_000_000n, isActive: true, includeInAvailable: true }],
      goals: [],
      plannedExpenses: [],
      spentToday: 200_000n,
      monthlySpent: 1_000_000n,
      previousMonthSpent: 800_000n,
      today: { year: 1404, month: 5, day: 20 },
      incomeDayOfMonth: null,
    });

    expect(snapshot.availableMoney).toBe(12_000_000n);
    expect(snapshot.cycle.remainingDays).toBe(12);
    expect(snapshot.allowance.dailyShare).toBe(1_016_666n);
    expect(snapshot.allowance.displayRemainingToday).toBe(816_666n);
    expect(snapshot.monthlyChange).toEqual({ pct: 25, direction: "up" });
  });
});

describe("goal progress", () => {
  it("computes monthly need from remaining months", () => {
    const progress = calculateGoalProgress({
      currentAmount: 60_000_000n,
      targetAmount: 150_000_000n,
      targetDate: gregorianUtcFromJalali({ year: 1404, month: 10, day: 1 }),
      today: gregorianUtcFromJalali({ year: 1404, month: 1, day: 1 }),
    });
    expect(progress.pct).toBe(40);
    expect(progress.monthsLeft).toBe(9);
    expect(progress.monthlyNeed).toBe(10_000_000n);
  });
});
