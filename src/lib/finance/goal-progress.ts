import type { JalaliDate } from "@/lib/dates/tehran";
import { jalaliFromUtc, monthsRemainingForGoal } from "@/lib/dates/tehran";
import { ceilDiv } from "@/lib/finance/math";
import type { GoalProgressInput } from "@/lib/finance/types";

export function calculateGoalProgress(input: GoalProgressInput): {
  pct: number;
  remaining: bigint;
  monthsLeft: number | null;
  monthlyNeed: bigint | null;
} {
  const currentAmount = input.currentAmount + (input.simulatedDelta ?? 0n);
  const remaining =
    input.targetAmount > currentAmount ? input.targetAmount - currentAmount : 0n;

  const pct =
    input.targetAmount <= 0n
      ? 0
      : Math.min(100, Number((currentAmount * 100n) / input.targetAmount));

  if (input.targetDate == null) {
    return { pct, remaining, monthsLeft: null, monthlyNeed: null };
  }

  const todayJalali: JalaliDate = jalaliFromUtc(input.today);
  const targetJalali = jalaliFromUtc(input.targetDate);
  const monthsLeft = monthsRemainingForGoal(todayJalali, targetJalali);
  const monthlyNeed = remaining === 0n ? 0n : ceilDiv(remaining, BigInt(monthsLeft));

  return { pct, remaining, monthsLeft, monthlyNeed };
}
