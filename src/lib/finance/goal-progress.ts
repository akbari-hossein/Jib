import type { JalaliDate } from "@/lib/dates/tehran";
import { jalaliFromUtc, monthsRemainingForGoal } from "@/lib/dates/tehran";

function ceilDiv(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) {
    return 0n;
  }
  return (numerator + denominator - 1n) / denominator;
}

export function calculateGoalProgress(input: {
  currentAmount: bigint;
  targetAmount: bigint;
  targetDate: Date | null;
  today: Date;
}): {
  pct: number;
  remaining: bigint;
  monthsLeft: number | null;
  monthlyNeed: bigint | null;
} {
  const remaining =
    input.targetAmount > input.currentAmount
      ? input.targetAmount - input.currentAmount
      : 0n;

  const pct =
    input.targetAmount <= 0n
      ? 0
      : Math.min(100, Number((input.currentAmount * 100n) / input.targetAmount));

  if (input.targetDate == null) {
    return { pct, remaining, monthsLeft: null, monthlyNeed: null };
  }

  const todayJalali: JalaliDate = jalaliFromUtc(input.today);
  const targetJalali = jalaliFromUtc(input.targetDate);
  const monthsLeft = monthsRemainingForGoal(todayJalali, targetJalali);
  const monthlyNeed = remaining === 0n ? 0n : ceilDiv(remaining, BigInt(monthsLeft));

  return { pct, remaining, monthsLeft, monthlyNeed };
}
