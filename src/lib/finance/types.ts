import type { AssetType, ReferenceRateSnapshot } from "@/lib/finance/purchasing-power";

export type AssetHolding = {
  assetType: AssetType;
  quantityScaled: bigint;
  value: bigint | null;
  rate: ReferenceRateSnapshot | null;
};

export type AccountSnapshot = {
  balance: bigint;
  isActive: boolean;
  includeInAvailable: boolean;
  holding?: AssetHolding;
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
