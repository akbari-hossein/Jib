import { describe, expect, it } from "vitest";
import { gregorianUtcFromJalali } from "@/lib/dates/tehran";
import {
  calculateAvailableMoney,
  calculateDailyAllowance,
  calculateGoalProgress,
  simulateGoalCompletion,
  simulateHypotheticalExpense,
} from "@/lib/finance";

const today = gregorianUtcFromJalali({ year: 1404, month: 1, day: 1 });

function goal(overrides?: { currentAmount?: bigint; targetAmount?: bigint; simulatedDelta?: bigint }) {
  return {
    currentAmount: overrides?.currentAmount ?? 60_000_000n,
    targetAmount: overrides?.targetAmount ?? 150_000_000n,
    today,
    simulatedDelta: overrides?.simulatedDelta,
  };
}

describe("simulateGoalCompletion", () => {
  it("projects months from remaining / monthly savings with ceiling", () => {
    const result = simulateGoalCompletion(goal(), 10_000_000n);
    expect(result.alreadyComplete).toBe(false);
    expect(result.reachable).toBe(true);
    expect(result.remaining).toBe(90_000_000n);
    expect(result.monthsToComplete).toBe(9);
    expect(result.projectedJalali).toEqual({ year: 1404, month: 10, day: 1 });
    expect(result.projectedCompletionDate).toEqual(
      gregorianUtcFromJalali({ year: 1404, month: 10, day: 1 }),
    );
  });

  it("uses the same remaining as calculateGoalProgress", () => {
    const input = goal();
    const progress = calculateGoalProgress({ ...input, targetDate: null });
    const result = simulateGoalCompletion(input, 1_000_000n);
    expect(result.remaining).toBe(progress.remaining);
  });

  it("ceils a partial last month", () => {
    const result = simulateGoalCompletion(goal(), 8_000_000n);
    expect(result.monthsToComplete).toBe(12);
    expect(result.projectedJalali).toEqual({ year: 1405, month: 1, day: 1 });
  });

  it("returns today when the goal is already complete", () => {
    const result = simulateGoalCompletion(goal({ currentAmount: 150_000_000n }), 5_000_000n);
    expect(result.alreadyComplete).toBe(true);
    expect(result.monthsToComplete).toBe(0);
    expect(result.remaining).toBe(0n);
    expect(result.projectedJalali).toEqual({ year: 1404, month: 1, day: 1 });
  });

  it("treats current above target as complete", () => {
    const result = simulateGoalCompletion(goal({ currentAmount: 200_000_000n }), 1_000_000n);
    expect(result.alreadyComplete).toBe(true);
    expect(result.monthsToComplete).toBe(0);
  });

  it("is unreachable when monthly savings is zero", () => {
    const result = simulateGoalCompletion(goal(), 0n);
    expect(result.reachable).toBe(false);
    expect(result.monthsToComplete).toBeNull();
    expect(result.projectedCompletionDate).toBeNull();
    expect(result.remaining).toBe(90_000_000n);
  });

  it("is unreachable when monthly savings is negative", () => {
    const result = simulateGoalCompletion(goal(), -2_000_000n);
    expect(result.reachable).toBe(false);
    expect(result.monthsToComplete).toBeNull();
    expect(result.projectedJalali).toBeNull();
  });

  it("applies simulatedDelta as extra current savings", () => {
    const result = simulateGoalCompletion(goal({ simulatedDelta: 10_000_000n }), 10_000_000n);
    expect(result.remaining).toBe(80_000_000n);
    expect(result.monthsToComplete).toBe(8);
  });

  it("does not mutate the goal input", () => {
    const input = Object.freeze(goal());
    simulateGoalCompletion(input, 10_000_000n);
    expect(input.currentAmount).toBe(60_000_000n);
  });
});

describe("simulateHypotheticalExpense", () => {
  const base = {
    currentAvailableMoney: 8_200_000n,
    currentDailyAllowance: 446_153n,
    spentToday: 200_000n,
    daysRemaining: 13,
  };

  it("subtracts the amount from available money and today's remaining", () => {
    const result = simulateHypotheticalExpense({
      ...base,
      hypotheticalAmount: 100_000n,
    });
    expect(result.newAvailableMoney).toBe(8_100_000n);
    expect(result.newDailyAllowance).toBe(346_153n);
    expect(result.previousAvailableMoney).toBe(8_200_000n);
    expect(result.previousDailyAllowance).toBe(446_153n);
    expect(result.wouldExceedBudget).toBeNull();
  });

  it("reuses calculateAvailableMoney and calculateDailyAllowance", () => {
    const hypotheticalAmount = 250_000n;
    const result = simulateHypotheticalExpense({ ...base, hypotheticalAmount });
    expect(result.newAvailableMoney).toBe(
      calculateAvailableMoney({
        liquidBalance: base.currentAvailableMoney,
        reservedForGoals: 0n,
        plannedExpenses: 0n,
        requiredSavings: 0n,
        simulatedDelta: hypotheticalAmount,
      }),
    );
    expect(result.newDailyAllowance).toBe(
      calculateDailyAllowance({
        availableMoney: base.currentAvailableMoney,
        spentToday: base.spentToday,
        remainingDays: base.daysRemaining,
        simulatedDelta: hypotheticalAmount,
      }).displayRemainingToday,
    );
  });

  it("clamps a zero-or-negative amount to no change", () => {
    for (const hypotheticalAmount of [0n, -50_000n]) {
      const result = simulateHypotheticalExpense({ ...base, hypotheticalAmount });
      expect(result.newAvailableMoney).toBe(base.currentAvailableMoney);
      expect(result.newDailyAllowance).toBe(
        calculateDailyAllowance({
          availableMoney: base.currentAvailableMoney,
          spentToday: base.spentToday,
          remainingDays: base.daysRemaining,
        }).displayRemainingToday,
      );
      expect(result.hypotheticalAmount).toBe(0n);
      expect(result.wouldExceedBudget).toBeNull();
    }
  });

  it("treats days remaining of 0 the same as calculateDailyAllowance (min 1)", () => {
    const result = simulateHypotheticalExpense({
      ...base,
      daysRemaining: 0,
      hypotheticalAmount: 100_000n,
    });
    const allowance = calculateDailyAllowance({
      availableMoney: base.currentAvailableMoney,
      spentToday: base.spentToday,
      remainingDays: 0,
      simulatedDelta: 100_000n,
    });
    expect(result.remainingDays).toBe(1);
    expect(result.newDailyAllowance).toBe(allowance.displayRemainingToday);
  });

  it("does not show a negative headline remaining when the spend exceeds today", () => {
    const result = simulateHypotheticalExpense({
      ...base,
      hypotheticalAmount: 2_500_000n,
    });
    expect(result.newAvailableMoney).toBe(5_700_000n);
    expect(result.newDailyAllowance).toBe(0n);
  });

  it("flags a category budget overrun without judging", () => {
    const result = simulateHypotheticalExpense({
      ...base,
      hypotheticalAmount: 500_000n,
      categoryId: "shopping",
      budgets: [{ categoryId: "shopping", spent: 3_800_000n, limit: 4_000_000n }],
    });
    expect(result.wouldExceedBudget).toEqual({
      categoryId: "shopping",
      amountOver: 300_000n,
    });
  });

  it("does not flag a budget that stays at or under the limit", () => {
    const result = simulateHypotheticalExpense({
      ...base,
      hypotheticalAmount: 200_000n,
      categoryId: "shopping",
      budgets: [{ categoryId: "shopping", spent: 3_800_000n, limit: 4_000_000n }],
    });
    expect(result.wouldExceedBudget).toBeNull();
  });

  it("ignores a category with no matching budget", () => {
    const result = simulateHypotheticalExpense({
      ...base,
      hypotheticalAmount: 9_000_000n,
      categoryId: "food",
      budgets: [{ categoryId: "shopping", spent: 0n, limit: 1_000_000n }],
    });
    expect(result.wouldExceedBudget).toBeNull();
  });

  it("does not mutate the input snapshot", () => {
    const input = Object.freeze({
      ...base,
      hypotheticalAmount: 100_000n,
      budgets: Object.freeze([{ categoryId: "food", spent: 1n, limit: 2n }]),
    });
    simulateHypotheticalExpense(input);
    expect(input.currentAvailableMoney).toBe(8_200_000n);
    expect(input.budgets[0]?.spent).toBe(1n);
  });
});

describe("simulatedDelta on domain functions", () => {
  it("subtracts a hypothetical expense from available money", () => {
    expect(
      calculateAvailableMoney({
        liquidBalance: 12_000_000n,
        reservedForGoals: 1_200_000n,
        plannedExpenses: 1_500_000n,
        requiredSavings: 880_000n,
        simulatedDelta: 420_000n,
      }),
    ).toBe(8_000_000n);
  });

  it("applies extra spend today without changing the start-of-day pool", () => {
    const baseline = calculateDailyAllowance({
      availableMoney: 8_200_000n,
      spentToday: 200_000n,
      remainingDays: 13,
    });
    const simulated = calculateDailyAllowance({
      availableMoney: 8_200_000n,
      spentToday: 200_000n,
      remainingDays: 13,
      simulatedDelta: 100_000n,
    });
    expect(simulated.startOfDayAvailable).toBe(baseline.startOfDayAvailable);
    expect(simulated.dailyShare).toBe(baseline.dailyShare);
    expect(simulated.displayRemainingToday).toBe(baseline.displayRemainingToday - 100_000n);
  });

  it("reduces goal remaining by a lump-sum simulatedDelta", () => {
    const progress = calculateGoalProgress({
      currentAmount: 60_000_000n,
      targetAmount: 150_000_000n,
      targetDate: null,
      today,
      simulatedDelta: 5_000_000n,
    });
    expect(progress.remaining).toBe(85_000_000n);
    expect(progress.pct).toBe(43);
  });
});
