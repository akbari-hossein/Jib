export type AccountSnapshot = {
  balance: bigint;
  isActive: boolean;
  includeInAvailable: boolean;
};

export type AvailableMoneyInput = {
  liquidBalance: bigint;
  reservedForGoals: bigint;
  plannedExpenses: bigint;
  requiredSavings: bigint;
  simulatedDelta?: bigint;
};

export type DailyAllowanceInput = {
  availableMoney: bigint;
  spentToday: bigint;
  remainingDays: number;
  simulatedDelta?: bigint;
};

export type GoalProgressInput = {
  currentAmount: bigint;
  targetAmount: bigint;
  targetDate: Date | null;
  today: Date;
  simulatedDelta?: bigint;
};

export type BudgetSnapshot = {
  categoryId: string;
  spent: bigint;
  limit: bigint;
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
