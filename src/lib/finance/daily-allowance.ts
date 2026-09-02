import type { DailyAllowanceInput } from "@/lib/finance/types";

export function calculateDailyAllowance(input: DailyAllowanceInput): {
  startOfDayAvailable: bigint;
  dailyShare: bigint;
  remainingToday: bigint;
  displayRemainingToday: bigint;
} {
  const extra = input.simulatedDelta ?? 0n;
  const remainingDays = BigInt(Math.max(1, input.remainingDays));
  const availableMoney = input.availableMoney - extra;
  const spentToday = input.spentToday + extra;
  const startOfDayAvailable = availableMoney + spentToday;

  if (startOfDayAvailable <= 0n) {
    return {
      startOfDayAvailable,
      dailyShare: 0n,
      remainingToday: 0n - spentToday,
      displayRemainingToday: 0n,
    };
  }

  const dailyShare = startOfDayAvailable / remainingDays;
  const remainingToday = dailyShare - spentToday;

  return {
    startOfDayAvailable,
    dailyShare,
    remainingToday,
    displayRemainingToday: remainingToday > 0n ? remainingToday : 0n,
  };
}
