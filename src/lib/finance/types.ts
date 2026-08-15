export type AccountSnapshot = {
  balance: bigint;
  isActive: boolean;
  includeInAvailable: boolean;
};

export type GoalSnapshot = {
  currentAmount: bigint;
  targetAmount: bigint;
  targetDate: Date | null;
  accountId: string | null;
  isArchived: boolean;
};

export type PlannedExpenseSnapshot = {
  amount: bigint;
  nextOccurrence: Date;
  isActive: boolean;
};

export type BudgetStatus = "healthy" | "near" | "over";
