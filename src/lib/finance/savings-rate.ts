export function calculateSavingsRate(
  income: bigint,
  expenses: bigint,
): number | null {
  if (income <= 0n) {
    return null;
  }

  return Number(((income - expenses) * 100n) / income);
}
