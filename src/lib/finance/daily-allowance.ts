export function calculateDailyAllowance(input: {
  availableMoney: bigint;
  spentToday: bigint;
  remainingDays: number;
}): {
  startOfDayAvailable: bigint;
  dailyShare: bigint;
  remainingToday: bigint;
  displayRemainingToday: bigint;
} {
  const remainingDays = BigInt(Math.max(1, input.remainingDays));
  const startOfDayAvailable = input.availableMoney + input.spentToday;

  if (startOfDayAvailable <= 0n) {
    return {
      startOfDayAvailable,
      dailyShare: 0n,
      remainingToday: 0n - input.spentToday,
      displayRemainingToday: 0n,
    };
  }

  const dailyShare = startOfDayAvailable / remainingDays;
  const remainingToday = dailyShare - input.spentToday;

  return {
    startOfDayAvailable,
    dailyShare,
    remainingToday,
    displayRemainingToday: remainingToday > 0n ? remainingToday : 0n,
  };
}
