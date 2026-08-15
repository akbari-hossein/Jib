import type { JalaliDate } from "@/lib/dates/tehran";
import { jalaliFromUtc, monthsRemainingForGoal } from "@/lib/dates/tehran";
import type { GoalSnapshot } from "@/lib/finance/types";

function ceilDiv(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) {
    return 0n;
  }
  return (numerator + denominator - 1n) / denominator;
}

export function calculateRequiredSavings(input: {
  goals: GoalSnapshot[];
  today: Date;
  remainingDays: number;
  daysInCycle: number;
}): bigint {
  const remainingDays = BigInt(Math.max(1, input.remainingDays));
  const daysInCycle = BigInt(Math.max(1, input.daysInCycle));
  const todayJalali: JalaliDate = jalaliFromUtc(input.today);

  let required = 0n;

  for (const goal of input.goals) {
    if (goal.isArchived || goal.accountId !== null || goal.targetDate == null) {
      continue;
    }

    const remainingToTarget = goal.targetAmount - goal.currentAmount;
    if (remainingToTarget <= 0n) {
      continue;
    }

    const monthsLeft = BigInt(
      monthsRemainingForGoal(todayJalali, jalaliFromUtc(goal.targetDate)),
    );
    const monthlyNeed = ceilDiv(remainingToTarget, monthsLeft);
    required += (monthlyNeed * remainingDays) / daysInCycle;
  }

  return required;
}
