import type {
  AccountSnapshot,
  AvailableMoneyInput,
  GoalSnapshot,
  PlannedExpenseSnapshot,
} from "@/lib/finance/types";

export function sumLiquidBalance(accounts: AccountSnapshot[]): bigint {
  return accounts
    .filter((account) => account.isActive && account.includeInAvailable)
    .reduce((sum, account) => sum + account.balance, 0n);
}

export function sumReservedForGoals(goals: GoalSnapshot[]): bigint {
  return goals
    .filter((goal) => !goal.isArchived && goal.accountId === null)
    .reduce((sum, goal) => sum + goal.currentAmount, 0n);
}

export function sumPlannedExpenses(
  expenses: PlannedExpenseSnapshot[],
  today: Date,
  nextIncomeDate: Date,
): bigint {
  return expenses
    .filter((expense) => {
      if (!expense.isActive) return false;
      return expense.nextOccurrence >= today && expense.nextOccurrence <= nextIncomeDate;
    })
    .reduce((sum, expense) => sum + expense.amount, 0n);
}

export function calculateAvailableMoney(input: AvailableMoneyInput): bigint {
  const simulatedDelta = input.simulatedDelta ?? 0n;
  return (
    input.liquidBalance -
    input.reservedForGoals -
    input.plannedExpenses -
    input.requiredSavings -
    simulatedDelta
  );
}
