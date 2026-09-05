export function calculateSavingsRate(
  income: bigint,
  expenses: bigint,
  extraSavings: bigint = 0n,
): number | null {
  if (income <= 0n) {
    return null;
  }

  return Number(((income - expenses + extraSavings) * 100n) / income);
}
