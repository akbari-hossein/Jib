import {
  addJalaliMonths,
  gregorianUtcFromJalali,
  jalaliFromUtc,
  type JalaliDate,
} from "@/lib/dates/tehran";
import { calculateAvailableMoney } from "@/lib/finance/available-money";
import { calculateDailyAllowance } from "@/lib/finance/daily-allowance";
import { calculateGoalProgress } from "@/lib/finance/goal-progress";
import { ceilDiv } from "@/lib/finance/math";
import type { BudgetSnapshot, GoalProgressInput } from "@/lib/finance/types";

export type GoalWhatIfInput = Pick<
  GoalProgressInput,
  "currentAmount" | "targetAmount" | "today" | "simulatedDelta"
> & {
  targetDate?: Date | null;
};

export type GoalCompletionSimulation = {
  monthsToComplete: number | null;
  projectedCompletionDate: Date | null;
  projectedJalali: JalaliDate | null;
  remaining: bigint;
  hypotheticalMonthlySavings: bigint;
  reachable: boolean;
  alreadyComplete: boolean;
};

export type HypotheticalExpenseInput = {
  currentAvailableMoney: bigint;
  currentDailyAllowance: bigint;
  spentToday: bigint;
  daysRemaining: number;
  hypotheticalAmount: bigint;
  categoryId?: string | null;
  budgets?: readonly BudgetSnapshot[];
};

export type HypotheticalExpenseResult = {
  newAvailableMoney: bigint;
  newDailyAllowance: bigint;
  previousAvailableMoney: bigint;
  previousDailyAllowance: bigint;
  wouldExceedBudget: { categoryId: string; amountOver: bigint } | null;
  remainingDays: number;
  hypotheticalAmount: bigint;
  spentToday: bigint;
  startOfDayAvailable: bigint;
  dailyShare: bigint;
};

export function simulateGoalCompletion(
  goal: GoalWhatIfInput,
  hypotheticalMonthlySavings: bigint,
): GoalCompletionSimulation {
  const progress = calculateGoalProgress({
    currentAmount: goal.currentAmount,
    targetAmount: goal.targetAmount,
    targetDate: goal.targetDate ?? null,
    today: goal.today,
    simulatedDelta: goal.simulatedDelta,
  });
  const remaining = progress.remaining;
  const todayJalali = jalaliFromUtc(goal.today);

  if (remaining <= 0n) {
    return {
      monthsToComplete: 0,
      projectedCompletionDate: gregorianUtcFromJalali(todayJalali),
      projectedJalali: todayJalali,
      remaining: 0n,
      hypotheticalMonthlySavings,
      reachable: true,
      alreadyComplete: true,
    };
  }

  if (hypotheticalMonthlySavings <= 0n) {
    return {
      monthsToComplete: null,
      projectedCompletionDate: null,
      projectedJalali: null,
      remaining,
      hypotheticalMonthlySavings,
      reachable: false,
      alreadyComplete: false,
    };
  }

  const monthsToComplete = Number(ceilDiv(remaining, hypotheticalMonthlySavings));
  const projectedJalali = addJalaliMonths(todayJalali, monthsToComplete);

  return {
    monthsToComplete,
    projectedCompletionDate: gregorianUtcFromJalali(projectedJalali),
    projectedJalali,
    remaining,
    hypotheticalMonthlySavings,
    reachable: true,
    alreadyComplete: false,
  };
}

export function simulateHypotheticalExpense(
  input: HypotheticalExpenseInput,
): HypotheticalExpenseResult {
  const hypotheticalAmount = input.hypotheticalAmount > 0n ? input.hypotheticalAmount : 0n;
  const remainingDays = input.daysRemaining;
  const newAvailableMoney = calculateAvailableMoney({
    liquidBalance: input.currentAvailableMoney,
    reservedForGoals: 0n,
    plannedExpenses: 0n,
    requiredSavings: 0n,
    simulatedDelta: hypotheticalAmount,
  });
  const allowance = calculateDailyAllowance({
    availableMoney: input.currentAvailableMoney,
    spentToday: input.spentToday,
    remainingDays,
    simulatedDelta: hypotheticalAmount,
  });

  return {
    newAvailableMoney,
    newDailyAllowance: allowance.displayRemainingToday,
    previousAvailableMoney: input.currentAvailableMoney,
    previousDailyAllowance: input.currentDailyAllowance,
    wouldExceedBudget: budgetOverrun(input.budgets, input.categoryId, hypotheticalAmount),
    remainingDays: Math.max(1, remainingDays),
    hypotheticalAmount,
    spentToday: input.spentToday + hypotheticalAmount,
    startOfDayAvailable: allowance.startOfDayAvailable,
    dailyShare: allowance.dailyShare,
  };
}

function budgetOverrun(
  budgets: readonly BudgetSnapshot[] | undefined,
  categoryId: string | null | undefined,
  hypotheticalAmount: bigint,
): { categoryId: string; amountOver: bigint } | null {
  if (!categoryId || hypotheticalAmount <= 0n || !budgets?.length) {
    return null;
  }

  const budget = budgets.find((item) => item.categoryId === categoryId);
  if (!budget || budget.limit <= 0n) {
    return null;
  }

  const projected = budget.spent + hypotheticalAmount;
  if (projected <= budget.limit) {
    return null;
  }

  return {
    categoryId: budget.categoryId,
    amountOver: projected - budget.limit,
  };
}
